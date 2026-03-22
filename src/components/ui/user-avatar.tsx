"use client";

import type * as React from "react";

import {cn} from "@/lib/utils";

const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
} as const;

const avatarFamilies = [
  "ocean",
  "berry",
  "sunset",
  "mint",
  "lavender",
  "aurora",
  "citrus",
  "ember",
  "lagoon",
  "orchid",
  "peach",
  "twilight",
] as const;

type AvatarSize = keyof typeof avatarSizes;
type UserAvatarFamily = (typeof avatarFamilies)[number];

type UserAvatarProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  seed?: string | null;
  label?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize | number;
  family?: UserAvatarFamily | "auto";
  showInitials?: boolean;
  showFrame?: boolean;
};

type UserAvatarVisual = {
  family: UserAvatarFamily;
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

type AvatarAnchor = {
  top: number;
  left: number;
};

type AvatarFamilyConfig = {
  backgroundStart: HslaColorOptions;
  backgroundEnd: HslaColorOptions;
  primary: HslaColorOptions;
  secondary: HslaColorOptions;
  glow: HslaColorOptions;
  highlight: string;
  hueShiftRange: number;
  accentShiftRange: number;
  primaryAnchor: AvatarAnchor;
  secondaryAnchor: AvatarAnchor;
};

const avatarFamilyConfigs: Record<UserAvatarFamily, AvatarFamilyConfig> = {
  ocean: {
    backgroundStart: {h: 198, s: 82, l: 95},
    backgroundEnd: {h: 210, s: 68, l: 85},
    primary: {h: 198, s: 98, l: 62, a: 0.88},
    secondary: {h: 248, s: 94, l: 64, a: 0.84},
    glow: {h: 214, s: 90, l: 68, a: 0.45},
    highlight: "rgba(255, 255, 255, 0.82)",
    hueShiftRange: 12,
    accentShiftRange: 10,
    primaryAnchor: {top: 58, left: 43},
    secondaryAnchor: {top: 67, left: 62},
  },
  berry: {
    backgroundStart: {h: 302, s: 74, l: 94},
    backgroundEnd: {h: 322, s: 60, l: 86},
    primary: {h: 274, s: 91, l: 60, a: 0.88},
    secondary: {h: 337, s: 88, l: 56, a: 0.82},
    glow: {h: 312, s: 84, l: 62, a: 0.42},
    highlight: "rgba(255, 245, 255, 0.8)",
    hueShiftRange: 12,
    accentShiftRange: 15,
    primaryAnchor: {top: 56, left: 44},
    secondaryAnchor: {top: 70, left: 60},
  },
  sunset: {
    backgroundStart: {h: 15, s: 88, l: 93},
    backgroundEnd: {h: 6, s: 76, l: 85},
    primary: {h: 24, s: 97, l: 60, a: 0.88},
    secondary: {h: 2, s: 96, l: 57, a: 0.82},
    glow: {h: 16, s: 90, l: 63, a: 0.4},
    highlight: "rgba(255, 247, 242, 0.78)",
    hueShiftRange: 9,
    accentShiftRange: 12,
    primaryAnchor: {top: 55, left: 46},
    secondaryAnchor: {top: 71, left: 61},
  },
  mint: {
    backgroundStart: {h: 154, s: 70, l: 94},
    backgroundEnd: {h: 178, s: 54, l: 84},
    primary: {h: 151, s: 88, l: 58, a: 0.86},
    secondary: {h: 191, s: 86, l: 58, a: 0.82},
    glow: {h: 170, s: 82, l: 62, a: 0.4},
    highlight: "rgba(247, 255, 250, 0.82)",
    hueShiftRange: 10,
    accentShiftRange: 12,
    primaryAnchor: {top: 58, left: 43},
    secondaryAnchor: {top: 69, left: 61},
  },
  lavender: {
    backgroundStart: {h: 258, s: 82, l: 95},
    backgroundEnd: {h: 282, s: 62, l: 87},
    primary: {h: 264, s: 90, l: 66, a: 0.86},
    secondary: {h: 303, s: 88, l: 67, a: 0.8},
    glow: {h: 281, s: 82, l: 68, a: 0.4},
    highlight: "rgba(250, 246, 255, 0.82)",
    hueShiftRange: 10,
    accentShiftRange: 14,
    primaryAnchor: {top: 57, left: 42},
    secondaryAnchor: {top: 70, left: 60},
  },
  aurora: {
    backgroundStart: {h: 174, s: 70, l: 94},
    backgroundEnd: {h: 242, s: 58, l: 86},
    primary: {h: 164, s: 92, l: 60, a: 0.86},
    secondary: {h: 244, s: 90, l: 64, a: 0.84},
    glow: {h: 206, s: 86, l: 66, a: 0.42},
    highlight: "rgba(245, 255, 255, 0.8)",
    hueShiftRange: 14,
    accentShiftRange: 16,
    primaryAnchor: {top: 56, left: 43},
    secondaryAnchor: {top: 69, left: 62},
  },
  citrus: {
    backgroundStart: {h: 54, s: 94, l: 94},
    backgroundEnd: {h: 28, s: 76, l: 86},
    primary: {h: 51, s: 98, l: 62, a: 0.86},
    secondary: {h: 25, s: 96, l: 58, a: 0.82},
    glow: {h: 40, s: 88, l: 64, a: 0.38},
    highlight: "rgba(255, 251, 232, 0.82)",
    hueShiftRange: 8,
    accentShiftRange: 10,
    primaryAnchor: {top: 57, left: 44},
    secondaryAnchor: {top: 71, left: 60},
  },
  ember: {
    backgroundStart: {h: 9, s: 90, l: 93},
    backgroundEnd: {h: 332, s: 68, l: 84},
    primary: {h: 13, s: 96, l: 59, a: 0.88},
    secondary: {h: 343, s: 86, l: 56, a: 0.82},
    glow: {h: 354, s: 84, l: 63, a: 0.42},
    highlight: "rgba(255, 244, 239, 0.8)",
    hueShiftRange: 10,
    accentShiftRange: 12,
    primaryAnchor: {top: 55, left: 46},
    secondaryAnchor: {top: 70, left: 60},
  },
  lagoon: {
    backgroundStart: {h: 186, s: 74, l: 94},
    backgroundEnd: {h: 214, s: 58, l: 85},
    primary: {h: 184, s: 92, l: 58, a: 0.86},
    secondary: {h: 217, s: 88, l: 61, a: 0.82},
    glow: {h: 200, s: 86, l: 65, a: 0.4},
    highlight: "rgba(244, 252, 255, 0.8)",
    hueShiftRange: 10,
    accentShiftRange: 12,
    primaryAnchor: {top: 58, left: 42},
    secondaryAnchor: {top: 69, left: 61},
  },
  orchid: {
    backgroundStart: {h: 318, s: 74, l: 95},
    backgroundEnd: {h: 274, s: 62, l: 86},
    primary: {h: 311, s: 91, l: 61, a: 0.86},
    secondary: {h: 268, s: 90, l: 63, a: 0.82},
    glow: {h: 294, s: 84, l: 66, a: 0.4},
    highlight: "rgba(255, 245, 252, 0.8)",
    hueShiftRange: 12,
    accentShiftRange: 14,
    primaryAnchor: {top: 56, left: 45},
    secondaryAnchor: {top: 69, left: 59},
  },
  peach: {
    backgroundStart: {h: 28, s: 92, l: 95},
    backgroundEnd: {h: 350, s: 74, l: 88},
    primary: {h: 23, s: 96, l: 64, a: 0.86},
    secondary: {h: 353, s: 90, l: 66, a: 0.8},
    glow: {h: 13, s: 86, l: 67, a: 0.38},
    highlight: "rgba(255, 248, 244, 0.82)",
    hueShiftRange: 9,
    accentShiftRange: 12,
    primaryAnchor: {top: 56, left: 44},
    secondaryAnchor: {top: 70, left: 60},
  },
  twilight: {
    backgroundStart: {h: 236, s: 66, l: 94},
    backgroundEnd: {h: 265, s: 52, l: 84},
    primary: {h: 231, s: 90, l: 60, a: 0.86},
    secondary: {h: 286, s: 88, l: 64, a: 0.82},
    glow: {h: 257, s: 82, l: 66, a: 0.4},
    highlight: "rgba(246, 245, 255, 0.8)",
    hueShiftRange: 10,
    accentShiftRange: 16,
    primaryAnchor: {top: 57, left: 43},
    secondaryAnchor: {top: 68, left: 61},
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

function getMotionFactor(hash: number, offset: number, min: number, max: number, precision = 3) {
  const steps = 1000;
  const normalized = positiveMod(hash >> offset, steps + 1) / steps;
  return Number((min + (max - min) * normalized).toFixed(precision));
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

function getAvatarFamilyConfig(family: UserAvatarFamily) {
  switch (family) {
    case "ocean":
      return avatarFamilyConfigs.ocean;
    case "berry":
      return avatarFamilyConfigs.berry;
    case "sunset":
      return avatarFamilyConfigs.sunset;
    case "mint":
      return avatarFamilyConfigs.mint;
    case "lavender":
      return avatarFamilyConfigs.lavender;
    case "aurora":
      return avatarFamilyConfigs.aurora;
    case "citrus":
      return avatarFamilyConfigs.citrus;
    case "ember":
      return avatarFamilyConfigs.ember;
    case "lagoon":
      return avatarFamilyConfigs.lagoon;
    case "orchid":
      return avatarFamilyConfigs.orchid;
    case "peach":
      return avatarFamilyConfigs.peach;
    case "twilight":
      return avatarFamilyConfigs.twilight;
  }
}

function getAvatarSourceLabel({
  label,
  name,
  email,
  seed,
}: Pick<UserAvatarProps, "label" | "name" | "email" | "seed">) {
  return label ?? name ?? email ?? seed ?? "";
}

export function getUserAvatarInitials(value?: string | null) {
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

export function getUserAvatarSeed({
  seed,
  label,
  name,
  email,
}: Pick<UserAvatarProps, "seed" | "label" | "name" | "email">) {
  return getAvatarSourceLabel({seed, label, name, email}).trim().toLowerCase();
}

export function getUserAvatarVisual(
  seed: string,
  family: UserAvatarFamily | "auto" = "auto",
): UserAvatarVisual {
  const hash = hashString(seed || "guest");
  const resolvedFamily = family === "auto" ? avatarFamilies[hash % avatarFamilies.length] : family;
  const config = getAvatarFamilyConfig(resolvedFamily);
  const hueShift = getShift(hash, 0, config.hueShiftRange);
  const accentShift = getShift(hash, 3, config.accentShiftRange);

  return {
    family: resolvedFamily,
    background: `linear-gradient(180deg, ${toHsla({...config.backgroundStart, h: shiftHue(config.backgroundStart.h, hueShift)})} 0%, ${toHsla({...config.backgroundEnd, h: shiftHue(config.backgroundEnd.h, hueShift)})} 100%)`,
    orbPrimary: toHsla({...config.primary, h: shiftHue(config.primary.h, hueShift)}),
    orbSecondary: toHsla({...config.secondary, h: shiftHue(config.secondary.h, accentShift)}),
    glow: toHsla({...config.glow, h: shiftHue(config.glow.h, hueShift)}),
    highlight: config.highlight,
    primaryPosition: getPosition(hash, 5, config.primaryAnchor),
    secondaryPosition: getPosition(hash, 9, config.secondaryAnchor),
  };
}

function UserAvatar({
  seed,
  label,
  name,
  email,
  size = "md",
  family = "auto",
  showInitials = true,
  showFrame = true,
  className,
  style,
  ...props
}: UserAvatarProps) {
  const resolvedSeed = getUserAvatarSeed({seed, label, name, email});
  const resolvedLabel = getAvatarSourceLabel({seed, label, name, email});
  const initials = getUserAvatarInitials(resolvedLabel);
  const visual = getUserAvatarVisual(resolvedSeed, family);
  const motionHash = hashString(resolvedSeed || "guest");
  const dimension = clamp(getNumericSize(size), 20, 160);
  const textSize = clamp(Math.round(dimension * 0.34), 10, 32);
  const avatarStyle = {
    ...style,
    width: dimension,
    height: dimension,
    fontSize: textSize,
    "--avatar-size": `${dimension}px`,
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
  } as React.CSSProperties & Record<string, string | number>;

  return (
    <div
      aria-label={resolvedLabel || "User avatar"}
      data-family={visual.family}
      data-slot="user-avatar"
      role="img"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 font-semibold tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] select-none",
        showFrame && "border border-white/50 ring-1 ring-black/5",
        className,
      )}
      style={avatarStyle}
      {...props}>
      <span
        className="user-avatar-surface absolute inset-0"
        style={{
          background: visual.background,
          backgroundSize: "145% 145%",
        }}
      />
      <span
        className="user-avatar-glow absolute inset-0 opacity-95"
        style={{
          background: `radial-gradient(circle at 50% 66%, ${visual.glow} 0%, transparent 72%)`,
        }}
      />
      <span
        className="user-avatar-orb-primary absolute h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-95"
        style={{
          top: visual.primaryPosition.top,
          left: visual.primaryPosition.left,
          background: visual.orbPrimary,
          filter: "blur(calc(var(--avatar-size) * 0.16))",
        }}
      />
      <span
        className="user-avatar-orb-secondary absolute h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
        style={{
          top: visual.secondaryPosition.top,
          left: visual.secondaryPosition.left,
          background: visual.orbSecondary,
          filter: "blur(calc(var(--avatar-size) * 0.18))",
        }}
      />
      <span
        className="user-avatar-highlight absolute top-[18%] left-1/2 h-[26%] w-[58%] -translate-x-1/2 rounded-full opacity-95"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${visual.highlight} 0%, transparent 72%)`,
          filter: "blur(calc(var(--avatar-size) * 0.12))",
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -10px 20px rgba(15,23,42,0.06)",
        }}
      />

      {showInitials ? (
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

export {avatarFamilies, avatarSizes, UserAvatar};
export type {AvatarSize, UserAvatarFamily, UserAvatarProps};
