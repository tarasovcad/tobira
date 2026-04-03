"use client";

import * as React from "react";

import {cn} from "@/lib/utils/classnames";

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
} as const;

const avatarFamilies = ["cool", "warm", "pastel", "neonSoft", "tropical", "sunrise"] as const;

type AvatarSize = keyof typeof avatarSizes;
type AvatarFamily = (typeof avatarFamilies)[number];

type AvatarProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  seed?: string | null;
  label?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize | number;
  family?: AvatarFamily | "auto";
  animated?: boolean;
  showInitials?: boolean;
  showFrame?: boolean;
  showUserIcon?: boolean;
};

type AvatarVisual = {
  family: AvatarFamily;
  background: string;
  orbPrimary: string;
  orbSecondary: string;
  glow: string;
  highlight: string;
  primaryPosition: {
    top: string;
    left: string;
  };
  secondaryPosition: {
    top: string;
    left: string;
  };
};

type HslaColorOptions = {
  h: number;
  s: number;
  l: number;
  a?: number;
};

type NumericRange = readonly [number, number];

type AvatarAnchor = {
  top: number;
  left: number;
};

type AvatarFamilyConfig = {
  hueAnchors: readonly number[];
  accentOffsets: readonly number[];
  glowOffsets: readonly number[];
  backgroundStartSaturation: NumericRange;
  backgroundStartLightness: NumericRange;
  backgroundEndSaturation: NumericRange;
  backgroundEndLightness: NumericRange;
  primarySaturation: NumericRange;
  primaryLightness: NumericRange;
  secondarySaturation: NumericRange;
  secondaryLightness: NumericRange;
  glowSaturation: NumericRange;
  glowLightness: NumericRange;
  highlightAlpha: NumericRange;
  primaryAnchor: AvatarAnchor;
  secondaryAnchor: AvatarAnchor;
};

const avatarVisualCache = new Map<string, AvatarVisual>();

const avatarFamilyConfigs: Record<AvatarFamily, AvatarFamilyConfig> = {
  cool: {
    hueAnchors: [198, 214, 228, 248, 268, 292],
    accentOffsets: [18, 34, 48, 64, 82, 108],
    glowOffsets: [-12, 10, 18, 28],
    backgroundStartSaturation: [72, 92],
    backgroundStartLightness: [92, 96],
    backgroundEndSaturation: [62, 84],
    backgroundEndLightness: [84, 90],
    primarySaturation: [84, 98],
    primaryLightness: [60, 68],
    secondarySaturation: [78, 94],
    secondaryLightness: [61, 70],
    glowSaturation: [72, 90],
    glowLightness: [68, 76],
    highlightAlpha: [0.76, 0.86],
    primaryAnchor: {top: 57, left: 42},
    secondaryAnchor: {top: 69, left: 61},
  },
  warm: {
    hueAnchors: [350, 6, 18, 28, 42, 52],
    accentOffsets: [12, 20, 32, 44, 58, 76],
    glowOffsets: [-8, 10, 18, 24],
    backgroundStartSaturation: [76, 96],
    backgroundStartLightness: [91, 95],
    backgroundEndSaturation: [66, 88],
    backgroundEndLightness: [83, 89],
    primarySaturation: [86, 98],
    primaryLightness: [61, 69],
    secondarySaturation: [80, 94],
    secondaryLightness: [62, 70],
    glowSaturation: [76, 92],
    glowLightness: [67, 75],
    highlightAlpha: [0.74, 0.84],
    primaryAnchor: {top: 56, left: 45},
    secondaryAnchor: {top: 70, left: 60},
  },
  pastel: {
    hueAnchors: [320, 338, 12, 42, 222, 278],
    accentOffsets: [16, 26, 38, 52, 70, 92],
    glowOffsets: [-10, 10, 16, 22],
    backgroundStartSaturation: [64, 82],
    backgroundStartLightness: [93, 97],
    backgroundEndSaturation: [56, 74],
    backgroundEndLightness: [86, 92],
    primarySaturation: [72, 88],
    primaryLightness: [64, 72],
    secondarySaturation: [68, 86],
    secondaryLightness: [65, 73],
    glowSaturation: [62, 80],
    glowLightness: [72, 80],
    highlightAlpha: [0.78, 0.9],
    primaryAnchor: {top: 58, left: 44},
    secondaryAnchor: {top: 68, left: 59},
  },
  neonSoft: {
    hueAnchors: [336, 358, 18, 48, 232, 286],
    accentOffsets: [22, 40, 58, 76, 104, 132],
    glowOffsets: [-16, 12, 22, 34],
    backgroundStartSaturation: [80, 98],
    backgroundStartLightness: [90, 94],
    backgroundEndSaturation: [72, 90],
    backgroundEndLightness: [82, 88],
    primarySaturation: [90, 100],
    primaryLightness: [58, 65],
    secondarySaturation: [86, 98],
    secondaryLightness: [58, 66],
    glowSaturation: [82, 96],
    glowLightness: [68, 76],
    highlightAlpha: [0.74, 0.84],
    primaryAnchor: {top: 56, left: 43},
    secondaryAnchor: {top: 70, left: 62},
  },
  tropical: {
    hueAnchors: [346, 12, 32, 54, 196, 284],
    accentOffsets: [18, 30, 44, 60, 84, 118],
    glowOffsets: [-12, 10, 20, 30],
    backgroundStartSaturation: [74, 94],
    backgroundStartLightness: [91, 95],
    backgroundEndSaturation: [66, 86],
    backgroundEndLightness: [83, 89],
    primarySaturation: [84, 98],
    primaryLightness: [59, 68],
    secondarySaturation: [80, 96],
    secondaryLightness: [60, 69],
    glowSaturation: [74, 92],
    glowLightness: [68, 77],
    highlightAlpha: [0.76, 0.86],
    primaryAnchor: {top: 58, left: 43},
    secondaryAnchor: {top: 69, left: 60},
  },
  sunrise: {
    hueAnchors: [342, 356, 14, 26, 40, 50],
    accentOffsets: [10, 18, 28, 40, 56, 74],
    glowOffsets: [-8, 8, 14, 20],
    backgroundStartSaturation: [72, 92],
    backgroundStartLightness: [92, 96],
    backgroundEndSaturation: [64, 84],
    backgroundEndLightness: [84, 90],
    primarySaturation: [82, 98],
    primaryLightness: [62, 70],
    secondarySaturation: [78, 94],
    secondaryLightness: [63, 72],
    glowSaturation: [72, 88],
    glowLightness: [69, 77],
    highlightAlpha: [0.78, 0.88],
    primaryAnchor: {top: 55, left: 46},
    secondaryAnchor: {top: 70, left: 60},
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function positiveMod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function toHsla({h, s, l, a = 1}: HslaColorOptions) {
  return `hsla(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}% / ${a})`;
}

function shiftHue(hue: number, shift: number) {
  return positiveMod(hue + shift, 360);
}

function getShift(hash: number, offset: number, range: number) {
  if (range === 0) {
    return 0;
  }

  return positiveMod(hash >> offset, range * 2 + 1) - range;
}

function getPosition(hash: number, offset: number, anchor: AvatarAnchor) {
  return {
    top: `${anchor.top + getShift(hash, offset, 3)}%`,
    left: `${anchor.left + getShift(hash, offset + 2, 4)}%`,
  };
}

function getNormalizedFactor(hash: number, offset: number, steps = 1024) {
  return positiveMod(hash >> offset, steps + 1) / steps;
}

function getNumberInRange(hash: number, offset: number, [min, max]: NumericRange, precision = 0) {
  const value = min + (max - min) * getNormalizedFactor(hash, offset);
  return Number(value.toFixed(precision));
}

function getValueFromList<T>(hash: number, offset: number, values: readonly T[]) {
  return values[positiveMod(hash >> offset, values.length)]!;
}

function getHueJitter(hash: number, offset: number, range = 10) {
  return getShift(hash, offset, range);
}

function getAdjustedLightness(hue: number, lightness: number) {
  if (hue >= 35 && hue <= 70) {
    return clamp(lightness + 4, 0, 100);
  }

  if (hue >= 345 || hue <= 20) {
    return clamp(lightness + 2, 0, 100);
  }

  return lightness;
}

function getMotionFactor(hash: number, offset: number, min: number, max: number, precision = 3) {
  const value = min + (max - min) * getNormalizedFactor(hash, offset, 1000);
  return Number(value.toFixed(precision));
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getNumericSize(size: AvatarSize | number) {
  if (typeof size === "number") {
    return size;
  }

  switch (size) {
    case "xs":
      return avatarSizes.xs;
    case "sm":
      return avatarSizes.sm;
    case "md":
      return avatarSizes.md;
    case "lg":
      return avatarSizes.lg;
    case "xl":
      return avatarSizes.xl;
  }
}

function getAvatarFamilyConfig(family: AvatarFamily) {
  switch (family) {
    case "cool":
      return avatarFamilyConfigs.cool;
    case "warm":
      return avatarFamilyConfigs.warm;
    case "pastel":
      return avatarFamilyConfigs.pastel;
    case "neonSoft":
      return avatarFamilyConfigs.neonSoft;
    case "tropical":
      return avatarFamilyConfigs.tropical;
    case "sunrise":
      return avatarFamilyConfigs.sunrise;
  }
}

function getAvatarSourceLabel({
  label,
  name,
  email,
  seed,
}: Pick<AvatarProps, "label" | "name" | "email" | "seed">) {
  return label ?? name ?? email ?? seed ?? "";
}

export function getAvatarInitials(value?: string | null) {
  const fallback = "?";
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  const withoutEmailDomain = normalizedValue.includes("@")
    ? (normalizedValue.split("@")[0] ?? normalizedValue)
    : normalizedValue;

  const words = withoutEmailDomain.replace(/[_-]+/g, " ").split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return fallback;
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase() || fallback;
}

export function getAvatarSeed({
  seed,
  label,
  name,
  email,
}: Pick<AvatarProps, "seed" | "label" | "name" | "email">) {
  return (seed ?? label ?? name ?? email ?? "").trim().toLowerCase();
}

export function getAvatarVisual(
  seed: string,
  family: AvatarFamily | "auto" = "auto",
): AvatarVisual {
  const cacheKey = `${family}:${seed || "guest"}`;
  const cachedVisual = avatarVisualCache.get(cacheKey);

  if (cachedVisual) {
    return cachedVisual;
  }

  const hash = hashString(seed || "guest");
  const resolvedFamily = family === "auto" ? getValueFromList(hash, 0, avatarFamilies) : family;
  const config = getAvatarFamilyConfig(resolvedFamily);
  const baseHue = shiftHue(getValueFromList(hash, 1, config.hueAnchors), getHueJitter(hash, 3, 10));
  const primaryHue = baseHue;
  const secondaryHue = shiftHue(primaryHue, getValueFromList(hash, 5, config.accentOffsets));
  const glowHue = shiftHue(primaryHue, getValueFromList(hash, 7, config.glowOffsets));
  const backgroundStartHue = shiftHue(primaryHue, getShift(hash, 9, 8));
  const backgroundEndHue = shiftHue(secondaryHue, getShift(hash, 11, 10));
  const primaryLightness = getAdjustedLightness(
    primaryHue,
    getNumberInRange(hash, 23, config.primaryLightness),
  );
  const secondaryLightness = getAdjustedLightness(
    secondaryHue,
    getNumberInRange(hash, 27, config.secondaryLightness),
  );
  const backgroundStartLightness = getAdjustedLightness(
    backgroundStartHue,
    getNumberInRange(hash, 15, config.backgroundStartLightness),
  );
  const backgroundEndLightness = getAdjustedLightness(
    backgroundEndHue,
    getNumberInRange(hash, 19, config.backgroundEndLightness),
  );
  const glowLightness = getAdjustedLightness(
    glowHue,
    getNumberInRange(hash, 31, config.glowLightness),
  );

  const visual = {
    family: resolvedFamily,
    background: `linear-gradient(180deg, ${toHsla({
      h: backgroundStartHue,
      s: getNumberInRange(hash, 13, config.backgroundStartSaturation),
      l: backgroundStartLightness,
    })} 0%, ${toHsla({
      h: backgroundEndHue,
      s: getNumberInRange(hash, 17, config.backgroundEndSaturation),
      l: backgroundEndLightness,
    })} 100%)`,
    orbPrimary: toHsla({
      h: primaryHue,
      s: getNumberInRange(hash, 21, config.primarySaturation),
      l: primaryLightness,
      a: 0.88,
    }),
    orbSecondary: toHsla({
      h: secondaryHue,
      s: getNumberInRange(hash, 25, config.secondarySaturation),
      l: secondaryLightness,
      a: 0.84,
    }),
    glow: toHsla({
      h: glowHue,
      s: getNumberInRange(hash, 29, config.glowSaturation),
      l: glowLightness,
      a: 0.42,
    }),
    highlight: `rgba(255, 255, 255, ${getNumberInRange(hash, 6, config.highlightAlpha, 2)})`,
    primaryPosition: getPosition(hash, 8, config.primaryAnchor),
    secondaryPosition: getPosition(hash, 12, config.secondaryAnchor),
  };

  avatarVisualCache.set(cacheKey, visual);

  return visual;
}

function AvatarImpl({
  seed,
  label,
  name,
  email,
  size = "md",
  family = "auto",
  animated = true,
  showInitials = true,
  showFrame = true,
  showUserIcon = false,
  className,
  style,
  ...props
}: AvatarProps) {
  const resolvedSeed = getAvatarSeed({seed, label, name, email});
  const resolvedLabel = getAvatarSourceLabel({seed, label, name, email});
  const initials = getAvatarInitials(resolvedLabel);
  const visual = getAvatarVisual(resolvedSeed, family);
  const dimension = clamp(getNumericSize(size), 20, 160);
  const textSize = clamp(Math.round(dimension * 0.34), 10, 32);
  const avatarStyle = {
    ...style,
    contain: "layout paint",
    width: dimension,
    height: dimension,
    fontSize: textSize,
    "--avatar-size": `${dimension}px`,
    ...(animated
      ? (() => {
          const motionHash = hashString(resolvedSeed || "guest");

          return {
            "--avatar-flow-primary-x": `${getMotionFactor(motionHash, 1, 0.015, 0.045)}px`,
            "--avatar-flow-primary-y": `${getMotionFactor(motionHash, 3, 0.02, 0.05)}px`,
            "--avatar-flow-secondary-x": `${getMotionFactor(motionHash, 5, 0.02, 0.055)}px`,
            "--avatar-flow-secondary-y": `${getMotionFactor(motionHash, 7, 0.015, 0.045)}px`,
            "--avatar-flow-highlight-x": `${getMotionFactor(motionHash, 9, 0.01, 0.03)}px`,
            "--avatar-flow-highlight-y": `${getMotionFactor(motionHash, 11, 0.008, 0.025)}px`,
            "--avatar-flow-surface-duration": `${getMotionFactor(motionHash, 13, 16, 24, 2)}s`,
            "--avatar-flow-primary-duration": `${getMotionFactor(motionHash, 15, 10, 16, 2)}s`,
            "--avatar-flow-secondary-duration": `${getMotionFactor(motionHash, 17, 12, 18, 2)}s`,
            "--avatar-flow-highlight-duration": `${getMotionFactor(motionHash, 19, 14, 22, 2)}s`,
            "--avatar-flow-glow-duration": `${getMotionFactor(motionHash, 21, 18, 26, 2)}s`,
          };
        })()
      : null),
  } as React.CSSProperties & Record<string, string | number>;

  return (
    <div
      aria-label={resolvedLabel || "Avatar"}
      data-family={visual.family}
      data-slot="avatar"
      role="img"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 font-semibold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] select-none",
        showFrame && "border border-white/50 ring-1 ring-black/5",
        className,
      )}
      style={avatarStyle}
      {...props}>
      <span
        className={cn("absolute inset-0 rounded-[inherit]", animated && "avatar-surface")}
        style={{
          background: visual.background,
          backgroundSize: animated ? "145% 145%" : undefined,
        }}
      />
      <span
        className={cn("absolute inset-0 rounded-[inherit] opacity-95", animated && "avatar-glow")}
        style={{
          background: `radial-gradient(circle at 50% 66%, ${visual.glow} 0%, transparent 72%)`,
        }}
      />
      <span
        className={cn(
          "absolute h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[inherit] opacity-95",
          animated && "avatar-orb-primary",
        )}
        style={{
          top: visual.primaryPosition.top,
          left: visual.primaryPosition.left,
          background: visual.orbPrimary,
          filter: "blur(calc(var(--avatar-size) * 0.16))",
        }}
      />
      <span
        className={cn(
          "absolute h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[inherit] opacity-90",
          animated && "avatar-orb-secondary",
        )}
        style={{
          top: visual.secondaryPosition.top,
          left: visual.secondaryPosition.left,
          background: visual.orbSecondary,
          filter: "blur(calc(var(--avatar-size) * 0.18))",
        }}
      />
      <span
        className={cn(
          "absolute top-[18%] left-1/2 h-[26%] w-[58%] -translate-x-1/2 rounded-[inherit] opacity-95",
          animated && "avatar-highlight",
        )}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${visual.highlight} 0%, transparent 72%)`,
          filter: "blur(calc(var(--avatar-size) * 0.12))",
        }}
      />
      <span
        className="absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -10px 20px rgba(15,23,42,0.06)",
        }}
      />

      {showUserIcon ? (
        <span
          className="absolute left-1/2 z-10 -translate-x-1/2"
          style={{
            bottom: dimension * (2.85 / 28),
            filter: "drop-shadow(0 1px 8px rgba(15, 23, 42, 0.24))",
          }}>
          <svg
            width={dimension * (14 / 28)}
            height={dimension * (16 / 28)}
            viewBox="0 0 14 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.63724 9.81658C6.74827 9.81669 6.85927 9.81588 6.9703 9.81501C7.88011 9.81227 8.76495 9.94607 9.63236 10.2176C9.69848 10.2383 9.76477 10.2585 9.83106 10.2786C11.0467 10.6612 12.1365 11.3528 13.05 12.2294C13.0712 12.2497 13.0925 12.2701 13.1143 12.291C13.1802 12.3545 13.2457 12.4184 13.3111 12.4824C13.3312 12.502 13.3514 12.5216 13.3722 12.5418C13.4899 12.6585 13.584 12.775 13.6714 12.9156C13.4712 13.1224 13.2677 13.3129 13.0419 13.4919C12.9797 13.5412 12.9182 13.5913 12.8574 13.6423C11.5862 14.7071 9.93262 15.4297 8.28794 15.6509C8.18546 15.6651 8.08353 15.6824 7.98147 15.6993C7.7495 15.7339 7.51888 15.7548 7.28452 15.7637C7.24215 15.7654 7.24215 15.7654 7.19892 15.7672C4.64975 15.8575 2.18597 14.921 0.310714 13.2137C0.291647 13.1965 0.27258 13.1792 0.252936 13.1614C0.158149 13.074 0.073087 12.9875 0 12.8813C0.829874 11.9882 0.829874 11.9882 1.27738 11.646C1.29582 11.6318 1.31425 11.6175 1.33325 11.6028C2.32534 10.8391 3.47303 10.3086 4.69524 10.0333C4.73944 10.0231 4.73944 10.0231 4.78453 10.0127C4.86902 9.99332 4.95362 9.97453 5.03832 9.95609C5.06192 9.9509 5.08553 9.9457 5.10984 9.94036C5.61851 9.83535 6.11932 9.81553 6.63724 9.81658Z"
              fill="#FEFEFE"
            />
            <path
              d="M9.28045 0.852236C10.0201 1.48299 10.5712 2.3318 10.7024 3.30781C10.7144 3.48294 10.7176 3.65775 10.7175 3.83324C10.7175 3.85743 10.7175 3.88161 10.7175 3.90653C10.714 4.97803 10.2952 5.88061 9.55664 6.65554C8.79671 7.3886 7.75942 7.75528 6.71051 7.74868C5.72467 7.72225 4.8629 7.32363 4.14287 6.67056C4.11742 6.64809 4.09196 6.62562 4.06573 6.60246C3.69637 6.25885 3.45047 5.82038 3.24525 5.36663C3.21962 5.3105 3.21962 5.3105 3.19347 5.25324C2.84023 4.41522 2.8467 3.34435 3.17535 2.50082C3.38984 1.98385 3.68503 1.55047 4.07383 1.14605C4.10166 1.11513 4.10166 1.11513 4.13006 1.08359C5.45795 -0.338759 7.81349 -0.302805 9.28045 0.852236Z"
              fill="#FEFEFE"
            />
          </svg>
        </span>
      ) : showInitials ? (
        <span
          className="relative z-10 leading-none"
          style={{
            textShadow: "0 1px 8px rgba(15, 23, 42, 0.24)",
          }}>
          {initials}
        </span>
      ) : null}
    </div>
  );
}

const Avatar = React.memo(AvatarImpl);

export {avatarFamilies, avatarSizes, Avatar};
export type {AvatarSize, AvatarFamily, AvatarProps};
