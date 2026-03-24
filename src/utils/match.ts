export const DIVISION_COLORS: Record<string, string> = {
  RM: 'var(--div-rm)',
  LM: 'var(--div-lm)',
  O: 'var(--div-o)',
  W: 'var(--div-w)',
  U20: 'var(--div-u20)',
  U15: 'var(--div-u15)',
};

export function isPlaceholder(name: string): boolean {
  return /^[A-Z0-9]{1,4}$/.test(name.trim()) || /^[A-Z]{1,3}\d+$/.test(name.trim());
}

export function isKnockout(matchType: string): boolean {
  return /\b(PQ|Q|S|F|R)\d+\b/i.test(matchType) || /\b(Semi|Final|Quarter|Bronze|Arena)\b/i.test(matchType);
}
