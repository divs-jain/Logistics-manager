import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatUnit(value) {
  if (value === null || value === undefined) return "—";

  const normalized = String(value).trim();
  if (!normalized) return "—";

  const cleaned = normalized
    .replace(/\b\d+(?:\.\d+)?\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "unit";

  const parts = cleaned.split(" ");
  return parts[parts.length - 1] || cleaned;
}

export function formatQuantityLabel(quantity, unit) {
  const numericQty = Number(quantity);
  if (!Number.isFinite(numericQty)) return formatUnit(unit);

  const unitLabel = formatUnit(unit);
  return `${numericQty} ${unitLabel}`.trim();
}

export function fuzzyMatch(text, query) {
  if (!query) return true;

  const haystack = String(text ?? "").toLowerCase();
  const needle = String(query).trim().toLowerCase();
  if (!needle) return true;

  let index = 0;
  for (const char of haystack) {
    if (index < needle.length && char === needle[index]) {
      index += 1;
    }
  }

  return index === needle.length;
}
