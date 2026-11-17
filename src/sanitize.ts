const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function safeChar(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) return "";
  return String.fromCodePoint(code);
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, body: string) => {
    const lower = body.toLowerCase();
    if (lower.startsWith("#x")) return safeChar(Number.parseInt(lower.slice(2), 16)) || full;
    if (lower.startsWith("#")) return safeChar(Number.parseInt(lower.slice(1), 10)) || full;
    return NAMED[lower] ?? full;
  });
}

const BLOCK =
  /<(script|style|iframe|object|embed|noscript|svg|math|textarea|title|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

function stripTags(value: string): string {
  let next = value;
  for (let pass = 0; pass < 4; pass += 1) {
    const stripped = next.replace(BLOCK, " ");
    if (stripped === next) break;
    next = stripped;
  }
  next = next.replace(
    /<(script|style|iframe|object|embed|noscript|svg|math|textarea|title|template)\b[^>]*>[\s\S]*$/gi,
    " ",
  );
  next = next.replace(/<br\s*\/?\s*>/gi, "\n");
  next = next.replace(/<\/(p|div|tr|li|h[1-6]|blockquote|section|article|table|ul|ol|pre)>/gi, "\n");
  next = next.replace(/<[^>\n]*>/g, " ");
  return next;
}

export interface SanitizedText {
  text: string;
  htmlRemoved: boolean;
}

/**
 * Turn untrusted paste into plain text.
 * Tags are removed. Script and style contents are discarded, not executed.
 * Entities are decoded once, then any revealed tags are removed without a second decode.
 */
export function sanitizeToText(input: string): SanitizedText {
  const original = input.replace(/\0/g, "");
  const hadTag = /<[a-z!/]/i.test(original) || /&lt;\s*\/?\s*[a-z]/i.test(original);
  let text = original.replace(/<!--[\s\S]*?-->/g, " ");
  text = stripTags(text);
  text = decodeEntities(text);
  if (/<[a-z!/]/i.test(text)) text = stripTags(text);
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return { text, htmlRemoved: hadTag };
}

export function normalizeText(input: string): string {
  let text = input.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
  text = text
    .replace(/\u3000/g, " ")
    .replace(/[×✕✖∗＊]/g, "x")
    .replace(/[″“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/㎜/g, "mm")
    .replace(/㎝/g, "cm")
    .replace(/㎡/g, "m2")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
