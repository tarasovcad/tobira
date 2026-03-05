import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeTagParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
