import {
  MAX_ZOOM,
  MIN_ZOOM,
  VIEWPORT_HORIZONTAL_PADDING,
  VIEWPORT_VERTICAL_PADDING,
} from "./constants";
import type {Pan, PanBounds, Rect} from "./types";

const PAN_OVERSHOOT_LIMIT = 80;
const PAN_OVERSHOOT_RESISTANCE = 0.35;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function clampPanOffset(value: number, maxOffset: number): number {
  return Math.min(maxOffset, Math.max(-maxOffset, value));
}

function getMaxPanOffset(length: number, zoom: number): number {
  return (length * zoom - length) / 2;
}

function applyPanResistance(value: number, maxOffset: number): number {
  if (value >= -maxOffset && value <= maxOffset) {
    return value;
  }

  const overflow = Math.abs(value) - maxOffset;
  const resistedOverflow = Math.min(overflow * PAN_OVERSHOOT_RESISTANCE, PAN_OVERSHOOT_LIMIT);

  return Math.sign(value) * (maxOffset + resistedOverflow);
}

export function clampPanToBounds(pan: Pan, bounds: PanBounds, zoom: number): Pan {
  if (zoom <= MIN_ZOOM) {
    return {x: 0, y: 0};
  }

  return {
    x: clampPanOffset(pan.x, getMaxPanOffset(bounds.width, zoom)),
    y: clampPanOffset(pan.y, getMaxPanOffset(bounds.height, zoom)),
  };
}

export function applyElasticPan(pan: Pan, bounds: PanBounds, zoom: number): Pan {
  if (zoom <= MIN_ZOOM) {
    return {x: 0, y: 0};
  }

  return {
    x: applyPanResistance(pan.x, getMaxPanOffset(bounds.width, zoom)),
    y: applyPanResistance(pan.y, getMaxPanOffset(bounds.height, zoom)),
  };
}

export function getTargetRect(ratio: number): Rect {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const maxWidth = viewportWidth - VIEWPORT_HORIZONTAL_PADDING * 2;
  const maxHeight = viewportHeight - VIEWPORT_VERTICAL_PADDING * 2;

  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    top: (viewportHeight - height) / 2,
    left: (viewportWidth - width) / 2,
    width,
    height,
  };
}
