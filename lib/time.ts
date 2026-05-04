export function formatRelativeTime(date: Date, now = new Date()) {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const units = [
    { label: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { label: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { label: "day", ms: 24 * 60 * 60 * 1000 },
    { label: "hour", ms: 60 * 60 * 1000 },
    { label: "minute", ms: 60 * 1000 }
  ];

  const unit = units.find((item) => absMs >= item.ms) ?? units[units.length - 1];
  const value = Math.max(1, Math.round(absMs / unit.ms));
  const plural = value === 1 ? unit.label : `${unit.label}s`;

  return diffMs >= 0 ? `in ${value} ${plural}` : `${value} ${plural} ago`;
}

export function formatReadableDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
