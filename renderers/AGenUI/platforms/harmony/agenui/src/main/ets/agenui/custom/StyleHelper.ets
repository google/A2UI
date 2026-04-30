const NAMED_COLORS: Map<string, number> = new Map<string, number>([
  ['transparent', 0x00000000],
  ['black', 0xFF000000],
  ['white', 0xFFFFFFFF],
  ['red', 0xFFFF0000],
  ['green', 0xFF00FF00],
  ['blue', 0xFF0000FF],
  ['yellow', 0xFFFFFF00],
  ['gray', 0xFF808080],
  ['grey', 0xFF808080]
]);

export class StyleHelper {
  public static parseColor(value: Object): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value !== 'string') {
      return 0x00000000;
    }

    const raw = value.trim();
    if (raw.length === 0) {
      return 0x00000000;
    }

    const named = NAMED_COLORS.get(raw.toLowerCase());
    if (named !== undefined) {
      return named;
    }

    if (raw.startsWith('#')) {
      const hex = raw.slice(1);
      if (hex.length === 6) {
        return Number.parseInt(`FF${hex}`, 16);
      }
      if (hex.length === 8) {
        const rgba = hex.toUpperCase();
        return Number.parseInt(`${rgba.slice(6, 8)}${rgba.slice(0, 6)}`, 16);
      }
    }

    const rgbaMatch = raw.match(new RegExp('^rgba?\\((.+)\\)$', 'i'));
    if (rgbaMatch && rgbaMatch[1]) {
      const parts = rgbaMatch[1].split(',').map((part: string) => part.trim());
      if (parts.length === 3 || parts.length === 4) {
        const r = Math.max(0, Math.min(255, Number.parseInt(parts[0], 10) || 0));
        const g = Math.max(0, Math.min(255, Number.parseInt(parts[1], 10) || 0));
        const b = Math.max(0, Math.min(255, Number.parseInt(parts[2], 10) || 0));
        const alpha = parts.length === 4 ? Number.parseFloat(parts[3]) : 1;
        const a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
        return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
      }
    }

    return 0x00000000;
  }

  public static parseDimension(value: Object): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value !== 'string') {
      return 0;
    }

    const raw = value.trim().toLowerCase();
    if (raw.length === 0) {
      return 0;
    }
    if (raw === 'auto' || raw === 'wrap_content') {
      return -2;
    }
    if (raw === 'match_parent' || raw === '100%') {
      return -1;
    }
    if (raw.endsWith('px')) {
      return Number.parseFloat(raw.slice(0, -2)) || 0;
    }
    return Number.parseFloat(raw) || 0;
  }
}
