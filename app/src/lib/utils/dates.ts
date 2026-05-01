export function formatDateAbsolute(date: string) {
  const dateObject = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return dateObject.toLocaleDateString("en-US", options);
}

export function formatDateWithTime(date: string) {
  const dateObject = new Date(date);
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const formattedDate = dateObject.toLocaleDateString("en-US", dateOptions);
  const formattedTime = dateObject.toLocaleTimeString("en-US", timeOptions);

  return `${formattedDate} - ${formattedTime}`;
}

export function formatTimeRelative(date: string) {
  const dateObject = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObject.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/**
 * Normalizes a UTC-ish timestamp string into a `Date`-parseable ISO string.
 *
 * Supports:
 * - ISO strings (passed through)
 * - "YYYY-MM-DD HH:MM:SS.SSSSSS+00" (converted to "YYYY-MM-DDTHH:MM:SS.SSSZ")
 */
export function normalizeUtcTimestamp(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  // If it's already ISO-ish, let Date handle it.
  if (trimmed.includes("T")) return trimmed;

  // Expected example: "2026-04-17 01:00:13.723394+00"
  const [dateTimePart, offsetPart] = trimmed.split("+");
  if (!dateTimePart || offsetPart === undefined) return trimmed;

  const [datePart, timePartRaw] = dateTimePart.trim().split(" ");
  if (!datePart || !timePartRaw) return trimmed;

  const [hms, fractionalRaw] = timePartRaw.split(".");
  const fractional = fractionalRaw ? fractionalRaw.slice(0, 3).padEnd(3, "0") : undefined;
  const timePart = fractional ? `${hms}.${fractional}` : hms;

  const normalizedOffset = offsetPart.trim();
  const suffix = normalizedOffset === "00" ? "Z" : `+${normalizedOffset}:00`;

  return `${datePart}T${timePart}${suffix}`;
}

export function formatTimeRelativeUtc(utcTimestamp: string) {
  return formatTimeRelative(normalizeUtcTimestamp(utcTimestamp));
}

export function formatHumanDate(date: string) {
  const dateObject = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - dateObject.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 7) {
    return formatTimeRelative(date); // e.g., "3 days ago"
  } else {
    return formatDateAbsolute(date); // e.g., "July 19, 2025"
  }
}

export function formatMixedDate(date: string) {
  const dateObject = new Date(date);
  const now = new Date();

  // Reset time to start of day for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const diffInDays = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));

  // Today → show time (2:30 PM)
  if (diffInDays === 0) {
    return dateObject.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Yesterday → show "Yesterday"
  if (diffInDays === 1) {
    return "Yesterday";
  }

  // Within 7 days → show day name (Mon, Tue)
  if (diffInDays > 1 && diffInDays < 7) {
    return dateObject.toLocaleDateString("en-US", {weekday: "short"});
  }

  // Older → show date (Aug 10, Jul 2024)
  const currentYear = now.getFullYear();
  const dateYear = dateObject.getFullYear();

  if (dateYear === currentYear) {
    // Same year: show month and day (Aug 10)
    return dateObject.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } else {
    // Different year: show month and year (Jul 2024)
    return dateObject.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
}
