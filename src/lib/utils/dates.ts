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
