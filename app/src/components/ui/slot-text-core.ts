/**
 * slot-text – dependency-free "text roll" animation.
 *
 * Each character sits in its own clipped cell and changes by sliding. The new
 * glyph enters from one side while the old glyph slides out the other, with
 * the incoming glyph chasing the outgoing one by a stagger step. Pure
 * transform/transition, GPU-composited, with a springy overshoot easing, so
 * every letter lands with a little bounce.
 *
 *   buildSlotText(el, "Copy");
 *   animateSlotText(el, "Copied", { direction: "up" });
 */

export interface SlotOptions {
  /** "down" rolls glyphs downward (enter from top); "up" rolls upward. */
  direction?: "up" | "down";
  /** Per-character stagger in ms (default 45). */
  stagger?: number;
  /** Slide duration per character in ms (default 300). */
  duration?: number;
  /** How long the incoming glyph trails the outgoing one, in ms (default 50). */
  exitOffset?: number;
  /** Easing — defaults to a springy, overshooting "back" curve. */
  easing?: string;
  /**
   * Per-letter personality: 0 = every glyph lands identically, 1 = lots of
   * individual variation in speed and a little tilt-wobble as each settles.
   * Default 0.6.
   */
  bounce?: number;
  /**
   * Chromatic flash: each incoming glyph rolls in tinted, then fades to its
   * resting color once it lands. Pass a single CSS color for a flat tint, or a
   * function `(index, total) => color` to give every glyph its own hue.
   * Omit for no flash.
   */
  color?: string | ((index: number, total: number) => string);
  /** How long the chromatic tint takes to fade back to rest, in ms (default 280). */
  colorFade?: number;
  /**
   * Keep characters that are identical at the same index static. Ideal for
   * short aligned labels (Copy → Copied). Turn off when the shared parts of the
   * two strings are misaligned so the whole line rolls uniformly.
   */
  skipUnchanged?: boolean;
  /**
   * true (default): a new call interrupts any roll in flight, snapping it to
   * its target before starting fresh. false: the current roll finishes and the
   * latest call made mid-roll plays after it lands.
   */
  interrupt?: boolean;
}

export interface ChromaticOptions {
  from?: number;
  spread?: number;
  saturation?: number;
  lightness?: number;
}

const DEFAULTS = {
  direction: "down" as const,
  stagger: 45,
  duration: 300,
  exitOffset: 50,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: 0.6,
  colorFade: 280,
  skipUnchanged: true,
  interrupt: true,
};

const NBSP = "\u00A0";
const glyph = (char: string) => (char === " " ? NBSP : char);

/**
 * Build a `color` function that sweeps the hue across the line, giving every
 * glyph its own color so the roll lands as a chromatic spectrum.
 *
 *   animateSlotText(el, txt, { color: chromatic() });             // full rainbow
 *   animateSlotText(el, txt, { color: chromatic({ from: 18 }) }); // start gold
 */
export function chromatic({
  from = 0,
  spread = 320,
  saturation = 92,
  lightness = 60,
}: ChromaticOptions = {}) {
  return (index: number, total: number) => {
    const t = total <= 1 ? 0 : index / (total - 1);
    return `hsl(${(from + t * spread) % 360} ${saturation}% ${lightness}%)`;
  };
}

/** Per-container record of the in-flight animation, so we can interrupt it. */
interface SlotState {
  timers: number[];
  target: string;
  pending?: {text: string; options: SlotOptions};
}
const states = new WeakMap<HTMLElement, SlotState>();

/** Cancel any running animation on a container and snap it to its target text. */
function settle(container: HTMLElement) {
  const state = states.get(container);
  if (!state) return;
  state.timers.forEach((t) => window.clearTimeout(t));
  states.delete(container);
  buildSlotText(container, state.target);
}

function makeFace(char: string) {
  const face = document.createElement("span");
  face.className = "char-face";
  face.textContent = glyph(char);
  return face;
}

function buildSlot(char: string) {
  const slot = document.createElement("span");
  slot.className = "char-slot";
  slot.dataset.char = char;

  const sizer = document.createElement("span");
  sizer.className = "char-sizer";
  sizer.textContent = glyph(char);

  slot.append(sizer, makeFace(char));
  return slot;
}

export function buildSlotText(container: HTMLElement, text: string) {
  container.classList.add("slot-text");
  container.replaceChildren(...Array.from(text, buildSlot));
}

export function animateSlotText(container: HTMLElement, toText: string, options: SlotOptions = {}) {
  const {
    direction,
    stagger,
    duration,
    exitOffset,
    easing,
    bounce,
    color,
    colorFade,
    skipUnchanged,
    interrupt,
  } = {
    ...DEFAULTS,
    ...options,
  };

  const running = states.get(container);
  if (running && !interrupt) {
    if (toText !== running.target) {
      running.pending = {text: toText, options};
    }
    return;
  }

  settle(container);

  if (!container.querySelector(".char-slot")) {
    buildSlotText(container, toText);
    return;
  }

  const slots = Array.from(container.querySelectorAll<HTMLElement>(".char-slot"));
  const fromText = slots.map((s) => s.dataset.char ?? "").join("");
  if (!interrupt && fromText === toText) return;
  const maxLen = Math.max(fromText.length, toText.length);

  const sample = slots.find((s) => (s.dataset.char ?? "") !== "") ?? slots[0];
  const cs = getComputedStyle(container);
  const H =
    Math.ceil(
      sample?.getBoundingClientRect().height ||
        sample?.offsetHeight ||
        container.getBoundingClientRect().height ||
        parseFloat(cs.lineHeight) ||
        0,
    ) ||
    Math.ceil(parseFloat(cs.fontSize) * 1.3) ||
    18;

  const restColor = color ? cs.color : "";

  for (let i = slots.length; i < maxLen; i++) {
    const slot = buildSlot("");
    container.appendChild(slot);
    slots.push(slot);
  }

  const timers: number[] = [];
  const state: SlotState = {timers, target: toText};
  states.set(container, state);

  const outY = direction === "down" ? H : -H;
  const inStart = direction === "down" ? -H : H;

  const wobble = (i: number, salt: number) => {
    const n = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  };

  let maxEnd = 0;

  for (let i = 0; i < maxLen; i++) {
    const fromChar = fromText[i] || "";
    const toChar = toText[i] || "";
    if (fromChar === toChar && (skipUnchanged || fromChar === "")) continue;

    const slot = slots[i];
    const sizer = slot.querySelector<HTMLElement>(".char-sizer")!;
    const oldFace = slot.querySelector<HTMLElement>(".char-face");

    const oldW = slot.getBoundingClientRect().width;
    sizer.textContent = glyph(toChar);
    const newW = sizer.getBoundingClientRect().width;
    const widthChanges = Math.abs(newW - oldW) > 0.5;
    if (widthChanges) slot.style.width = `${oldW}px`;

    if (fromChar === "" || toChar === "") slot.classList.add("is-resizing");

    const tint = typeof color === "function" ? color(i, maxLen) : color;

    const isTail = toChar === "";
    const d = Math.round(duration * (isTail ? 0.75 : 1) * (1 + bounce * 0.45 * wobble(i, 1)));
    const staggerIndex = isTail ? toText.length * 0.5 + (i - toText.length) * 0.25 : i;
    const base = Math.round(staggerIndex * stagger * (1 + bounce * 0.25 * wobble(i, 2)));
    const tilt = (bounce * 5 * wobble(i, 3)).toFixed(2);

    const rollTrans = `transform ${d}ms ${easing}`;
    const trans = color ? `${rollTrans}, color ${colorFade}ms linear ${d}ms` : rollTrans;

    const newFace = makeFace(toChar);
    newFace.style.transformOrigin = "50% 50%";
    newFace.style.transform = `translateY(${inStart}px) rotate(${tilt}deg)`;
    if (tint) newFace.style.color = tint;
    slot.appendChild(newFace);

    void slot.offsetWidth;

    if (widthChanges) {
      let wDelay = base;
      let wDur = d;
      if (isTail) {
        wDelay = base + Math.round(d * 0.55);
        wDur = Math.max(140, Math.round(d * 0.6));
      } else if (fromChar === "") {
        wDur = Math.max(140, Math.round(d * 0.45));
      }
      timers.push(
        window.setTimeout(() => {
          slot.style.transition = `width ${wDur}ms cubic-bezier(0.2, 0, 0, 1)`;
          slot.style.width = `${newW}px`;
        }, wDelay),
      );
      maxEnd = Math.max(maxEnd, wDelay + wDur);
    }

    maxEnd = Math.max(maxEnd, base + exitOffset + d + (color ? colorFade : 0));

    if (oldFace) {
      timers.push(
        window.setTimeout(() => {
          oldFace.style.transition = rollTrans;
          oldFace.style.transform = `translateY(${outY}px) rotate(${-Number(tilt)}deg)`;
        }, base),
      );
    }

    timers.push(
      window.setTimeout(() => {
        newFace.style.transition = trans;
        newFace.style.transform = "translateY(0) rotate(0deg)";
        if (color) newFace.style.color = restColor;

        const done = (e: TransitionEvent) => {
          if (e.propertyName !== "transform") return;
          newFace.removeEventListener("transitionend", done);
          slot.dataset.char = toChar;
          slot.style.removeProperty("transition");
          slot.style.removeProperty("width");
          slot.classList.remove("is-resizing");
          slot.querySelectorAll(".char-face").forEach((f) => {
            if (f !== newFace) f.remove();
          });
        };
        newFace.addEventListener("transitionend", done);
      }, base + exitOffset),
    );
  }

  const total = maxEnd + 80;
  timers.push(
    window.setTimeout(() => {
      const pending = state.pending;
      states.delete(container);
      buildSlotText(container, toText);
      if (pending) {
        animateSlotText(container, pending.text, pending.options);
      }
    }, total),
  );
}

export function clearSlotText(container: HTMLElement, text = "") {
  settle(container);
  container.classList.remove("slot-text");
  container.textContent = text;
}
