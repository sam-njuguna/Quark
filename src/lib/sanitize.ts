const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /data:text\/html/gi,
];

export function sanitizeText(input: string): string {
  let output = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    output = output.replace(pattern, "");
  }
  return output.trim();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function parseMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_.-]+)/g) ?? [];
  return matches.map((m) => m.slice(1));
}
