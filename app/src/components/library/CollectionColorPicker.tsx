"use client";

import {useRef, useState, type PointerEvent, type RefObject} from "react";

import {Button} from "@/components/ui/coss/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/coss/input-group";
import {Label} from "@/components/ui/coss/label";
import type {CollectionColor} from "@/db/schema";
import {cn} from "@/lib/utils";

export const COLLECTION_COLOR_OPTIONS = [
  {value: "#38bdf8"},
  {value: "#8b5cf6"},
  {value: "#f43f5e"},
  {value: "#f59e0b"},
  {value: "#10b981"},
  {value: "#64748b"},
  {value: "#06b6d4"},
  {value: "#3b82f6"},
  {value: "#6366f1"},
  {value: "#d946ef"},
  {value: "#ec4899"},
  {value: "#FEF3C6"},
] as const;

export const DEFAULT_COLLECTION_COLOR_VALUE: CollectionColor = {
  hex: COLLECTION_COLOR_OPTIONS[0].value,
  opacity: 100,
};

export function getRandomCollectionColorValue(): CollectionColor {
  const option =
    COLLECTION_COLOR_OPTIONS[Math.floor(Math.random() * COLLECTION_COLOR_OPTIONS.length)];

  return {hex: option.value, opacity: DEFAULT_COLLECTION_COLOR_VALUE.opacity};
}

const DEFAULT_COLLECTION_COLOR = DEFAULT_COLLECTION_COLOR_VALUE.hex;

const PRESET_BUTTON_CLASS =
  "outline-border focus-visible:ring-ring focus-visible:ring-offset-background flex cursor-pointer items-center rounded-md p-1 hover:outline-[1.5px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
const COLOR_SWATCH_CLASS = "border border-black/10 shadow-xs dark:border-white/15";
const RANGE_INPUT_CLASS =
  "h-3 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.35)] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.35)]";

type CollectionColorPickerProps = {
  value?: CollectionColor | null;
  onChange?: (value: CollectionColor) => void;
};

export function CollectionColorPicker({value, onChange}: CollectionColorPickerProps) {
  const initialColor = normalizeCollectionColor(value);
  const initialHsv = hexToHsv(initialColor.hex);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor.hex);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [customHue, setCustomHue] = useState(initialHsv.h);
  const [customSaturation, setCustomSaturation] = useState(initialHsv.s);
  const [customValue, setCustomValue] = useState(initialHsv.v);
  const [customAlpha, setCustomAlpha] = useState(initialColor.opacity);
  const [customHexInput, setCustomHexInput] = useState(initialColor.hex.slice(1));
  const colorAreaRef = useRef<HTMLDivElement>(null);

  const selectColor = (color: string) => {
    const nextColor = normalizeCollectionColor({hex: color, opacity: customAlpha});
    const hsv = hexToHsv(nextColor.hex);

    setSelectedColor(nextColor.hex);
    setCustomHue(hsv.h);
    setCustomSaturation(hsv.s);
    setCustomValue(hsv.v);
    setCustomHexInput(nextColor.hex.slice(1).toUpperCase());
    onChange?.(nextColor);
  };

  const updateCustomColor = (hue: number, saturation: number, value: number) => {
    const color = hsvToHex(hue, saturation, value);

    setCustomHue(hue);
    setCustomSaturation(saturation);
    setCustomValue(value);
    setSelectedColor(color);
    setCustomHexInput(color.slice(1).toUpperCase());
    onChange?.({hex: color, opacity: customAlpha});
  };

  const updateOpacity = (opacity: number) => {
    const nextOpacity = clamp(opacity, 0, 100);

    setCustomAlpha(nextOpacity);
    onChange?.({hex: selectedColor, opacity: nextOpacity});
  };

  const updateCustomColorFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = colorAreaRef.current?.getBoundingClientRect();

    if (!bounds) return;

    const saturation = clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100);
    const value = clamp(100 - ((event.clientY - bounds.top) / bounds.height) * 100, 0, 100);

    updateCustomColor(customHue, saturation, value);
  };

  const pickColorFromScreen = async () => {
    if (typeof window === "undefined") return;

    const EyeDropper = (window as Window & {EyeDropper?: EyeDropperApi}).EyeDropper;

    if (!EyeDropper) return;

    try {
      const {sRGBHex} = await new EyeDropper().open();

      selectColor(sRGBHex);
    } catch {
      // The API rejects when the user cancels picking a color.
    }
  };

  const selectedColorIsPreset = COLLECTION_COLOR_OPTIONS.some(
    (color) => color.value.toLowerCase() === selectedColor.toLowerCase(),
  );

  return (
    <div className="space-y-2">
      <Label id="collection-color-label">Color</Label>
      <div
        className="flex flex-wrap items-center gap-[1.5px]"
        role="group"
        aria-labelledby="collection-color-label">
        {COLLECTION_COLOR_OPTIONS.map((color) => (
          <PresetColorButton
            key={color.value}
            color={color.value}
            isSelected={selectedColor.toLowerCase() === color.value.toLowerCase()}
            onSelect={selectColor}
          />
        ))}
        <CustomColorToggle
          open={customPickerOpen}
          isPreset={selectedColorIsPreset}
          color={selectedColor}
          opacity={customAlpha}
          onToggle={() => setCustomPickerOpen((open) => !open)}
        />
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          customPickerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}>
        <div className="overflow-hidden">
          <div
            id="custom-collection-color-picker"
            className={cn(
              "bg-popover mt-3 space-y-3 rounded-xl border p-3 transition-[opacity,transform] duration-200 ease-out",
              customPickerOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            )}
            aria-hidden={!customPickerOpen}>
            <ColorArea
              areaRef={colorAreaRef}
              hue={customHue}
              saturation={customSaturation}
              value={customValue}
              onPointerChange={updateCustomColorFromPointer}
            />

            <ColorSliders
              hue={customHue}
              opacity={customAlpha}
              color={selectedColor}
              onPickFromScreen={pickColorFromScreen}
              onHueChange={(hue) => updateCustomColor(hue, customSaturation, customValue)}
              onOpacityChange={updateOpacity}
            />

            <ColorInputs
              hexInput={customHexInput}
              color={selectedColor}
              opacity={customAlpha}
              onHexInputChange={(nextHex) => {
                setCustomHexInput(nextHex);

                if (nextHex.length === 6) {
                  selectColor(`#${nextHex}`);
                }
              }}
              onHexInputBlur={() => setCustomHexInput(selectedColor.slice(1).toUpperCase())}
              onOpacityChange={updateOpacity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type PresetColorButtonProps = {
  color: string;
  isSelected: boolean;
  onSelect: (color: string) => void;
};

function PresetColorButton({color, isSelected, onSelect}: PresetColorButtonProps) {
  return (
    <button
      type="button"
      className={cn(PRESET_BUTTON_CLASS, isSelected && "outline-[1.5px]")}
      aria-label={`${color} collection color`}
      aria-pressed={isSelected}
      onClick={() => onSelect(color)}>
      <span
        className={cn("flex size-6.5 items-center justify-center rounded-full", COLOR_SWATCH_CLASS)}
        style={{backgroundColor: color}}
        aria-hidden="true">
        {isSelected && <CheckIcon />}
      </span>
    </button>
  );
}

type CustomColorToggleProps = {
  open: boolean;
  isPreset: boolean;
  color: string;
  opacity: number;
  onToggle: () => void;
};

function CustomColorToggle({open, isPreset, color, opacity, onToggle}: CustomColorToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "size-8 rounded-md border-dashed",
        !isPreset && "border-foreground/20 bg-muted",
      )}
      aria-label="Open custom collection color picker"
      aria-expanded={open}
      aria-controls="custom-collection-color-picker"
      onClick={onToggle}>
      {isPreset ? (
        <PlusIcon />
      ) : (
        <span
          className={cn("size-5 rounded-full", COLOR_SWATCH_CLASS)}
          style={{backgroundColor: hexToRgba(color, opacity)}}
          aria-hidden="true"
        />
      )}
    </Button>
  );
}

type ColorAreaProps = {
  areaRef: RefObject<HTMLDivElement | null>;
  hue: number;
  saturation: number;
  value: number;
  onPointerChange: (event: PointerEvent<HTMLDivElement>) => void;
};

function ColorArea({areaRef, hue, saturation, value, onPointerChange}: ColorAreaProps) {
  return (
    <div
      ref={areaRef}
      className="border-border relative h-56 touch-none overflow-hidden rounded-lg border shadow-inner"
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))`,
      }}
      role="slider"
      aria-label="Choose color saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(saturation)}
      aria-valuetext={`${Math.round(saturation)}% saturation, ${Math.round(value)}% brightness`}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerChange(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return;
        onPointerChange(event);
      }}>
      <span
        className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"
        style={{
          left: `${saturation}%`,
          top: `${100 - value}%`,
        }}
      />
    </div>
  );
}

type ColorSlidersProps = {
  hue: number;
  opacity: number;
  color: string;
  onPickFromScreen: () => void | Promise<void>;
  onHueChange: (hue: number) => void;
  onOpacityChange: (opacity: number) => void;
};

function ColorSliders({
  hue,
  opacity,
  color,
  onPickFromScreen,
  onHueChange,
  onOpacityChange,
}: ColorSlidersProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-xl"
        className="size-10! shrink-0 rounded-lg [&_svg]:size-7"
        aria-label="Use eyedropper color picker"
        onClick={() => void onPickFromScreen()}>
        <EyeDropperIcon />
      </Button>
      <div className="w-full space-y-1">
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          aria-label="Color hue"
          className={RANGE_INPUT_CLASS}
          style={{
            background:
              "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
          onChange={(event) => onHueChange(Number(event.target.value))}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          aria-label="Color opacity"
          className={RANGE_INPUT_CLASS}
          style={{
            background: `linear-gradient(90deg, transparent, ${color}), repeating-conic-gradient(#2f3340 0% 25%, #242832 0% 50%) 50% / 14px 14px`,
          }}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

type ColorInputsProps = {
  hexInput: string;
  color: string;
  opacity: number;
  onHexInputChange: (hex: string) => void;
  onHexInputBlur: () => void;
  onOpacityChange: (opacity: number) => void;
};

function ColorInputs({
  hexInput,
  color,
  opacity,
  onHexInputChange,
  onHexInputBlur,
  onOpacityChange,
}: ColorInputsProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
      <InputGroup>
        <InputGroupInput
          value={`#${hexInput}`}
          aria-label="Custom color hex value"
          maxLength={7}
          inputMode="text"
          pattern="#[0-9A-Fa-f]{6}"
          placeholder="#000000"
          spellCheck={false}
          onChange={(event) => onHexInputChange(normalizeHexInput(event.target.value))}
          onBlur={onHexInputBlur}
        />
        <InputGroupAddon className="border-r pe-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 font-medium"
            aria-label="Color format HEX">
            HEX
          </Button>
        </InputGroupAddon>
        <InputGroupAddon className="pointer-events-none gap-1.5 ps-2 pe-0">
          <span
            className={cn("size-3.5 rounded-full", COLOR_SWATCH_CLASS)}
            style={{backgroundColor: hexToRgba(color, opacity)}}
            aria-hidden="true"
          />
        </InputGroupAddon>
      </InputGroup>

      <InputGroup>
        <InputGroupInput
          type="number"
          min="0"
          max="100"
          value={opacity}
          className="text-right"
          aria-label="Custom color opacity percentage"
          onChange={(event) => onOpacityChange(Number(event.target.value))}
        />
        <InputGroupAddon align="inline-end" className="pointer-events-none ps-0">
          <InputGroupText>%</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2C8.3682 2 8.66667 2.29848 8.66667 2.66667V7.33333H13.3333C13.7015 7.33333 14 7.6318 14 8C14 8.3682 13.7015 8.66667 13.3333 8.66667H8.66667V13.3333C8.66667 13.7015 8.3682 14 8 14C7.6318 14 7.33333 13.7015 7.33333 13.3333V8.66667H2.66667C2.29848 8.66667 2 8.3682 2 8C2 7.6318 2.29848 7.33333 2.66667 7.33333H7.33333V2.66667C7.33333 2.29848 7.6318 2 8 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeDropperIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.9669 4.13377C18.8723 2.22842 21.9614 2.22842 23.8668 4.13377C25.7722 6.03914 25.7722 9.12833 23.8668 11.0337L9.91683 24.9837C9.47925 25.4212 8.88575 25.667 8.26692 25.667H3.50016C2.85584 25.667 2.3335 25.1447 2.3335 24.5004V19.7337C2.3335 19.1148 2.57932 18.5213 3.01692 18.0837L14.1005 7.0002L21.0002 13.8999L22.6501 12.25L15.7504 5.35029L16.9669 4.13377Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.91699 7.4375L5.83366 11.0833L11.0837 2.91667"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type Hsv = {
  h: number;
  s: number;
  v: number;
};

type EyeDropperApi = new () => {
  open: () => Promise<{sRGBHex: string}>;
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeHexInput(value: string) {
  return value
    .replace(/[^0-9a-f]/gi, "")
    .slice(0, 6)
    .toUpperCase();
}

function normalizeCollectionColor(value?: CollectionColor | null): CollectionColor {
  const hex = normalizeHexInput(value?.hex ?? "");

  return {
    hex: hex.length === 6 ? `#${hex}` : DEFAULT_COLLECTION_COLOR,
    opacity: clamp(value?.opacity ?? DEFAULT_COLLECTION_COLOR_VALUE.opacity, 0, 100),
  };
}

function hexToHsv(hex: string): Hsv {
  return rgbToHsv(hexToRgb(hex) ?? {r: 56, g: 189, b: 248});
}

function hexToRgb(hex: string): Rgb | null {
  const normalizedHex = normalizeHexInput(hex);

  if (normalizedHex.length !== 6) return null;

  const value = Number.parseInt(normalizedHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHsv({r, g, b}: Rgb): Hsv {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  return {
    h: hue,
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    v: Math.round(max * 100),
  };
}

function hsvToHex(hue: number, saturation: number, value: number) {
  const chroma = (value / 100) * (saturation / 100);
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = value / 100 - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime >= 3 && huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return rgbToHex({
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  });
}

function rgbToHex({r, g, b}: Rgb) {
  return `#${[r, g, b]
    .map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);

  if (!rgb) return hex;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 100) / 100})`;
}
