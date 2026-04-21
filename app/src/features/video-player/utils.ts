export function shouldSilencePlayError(err: unknown) {
  if (!err || typeof err !== "object") return false;

  const name = "name" in err ? String((err as {name?: unknown}).name) : "";
  const message = "message" in err ? String((err as {message?: unknown}).message) : "";

  return (
    name === "AbortError" ||
    message.includes("play() request was interrupted") ||
    message.includes("interrupted by a call to pause") ||
    message.includes("interrupted by a new load request")
  );
}

export function formatVideoTime(timeInSeconds: number) {
  if (Number.isNaN(timeInSeconds) || !Number.isFinite(timeInSeconds)) return "0:00";

  const validTime = Math.max(0, timeInSeconds);
  const minutes = Math.floor(validTime / 60);
  const seconds = Math.floor(validTime % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isEditableElementActive() {
  return (
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA" ||
    document.activeElement?.getAttribute("contenteditable") === "true"
  );
}

export function callEventHandler<T>(handler: ((event: T) => void) | undefined, event: T) {
  handler?.(event);
}
