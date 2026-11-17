/** Plain integer quantities. Commas may be thousands separators. Dots are not. */
export function parseQty(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  if (!/^\d{1,3}(?:,\d{3})+$/.test(trimmed) && !/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(/,/g, ""));
  if (!Number.isSafeInteger(value) || value <= 0 || value > 10_000_000) return null;
  return value;
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  let normalized = trimmed;
  if (/^\d{1,3}(?:,\d{3})+$/.test(trimmed)) normalized = trimmed.replace(/,/g, "");
  else if (/^\d{1,3},\d{1,2}$/.test(trimmed)) normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function canonicalDim(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{1,3}(?:,\d{3})+$/.test(trimmed)) return trimmed.replace(/,/g, "");
  if (/^\d{1,3},\d{1,2}$/.test(trimmed)) return trimmed.replace(",", ".");
  return trimmed;
}

export function formatGrouped(value: number, locale: "en" | "zh"): string {
  return value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}
