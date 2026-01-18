export function textColorFromHex(hex: string) {
  const c = hex.replace("#", "");
  const num = parseInt(
    c.length === 3
      ? c.split("").map(x => x + x).join("")
      : c,
    16
  );

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const luminance =
    0.2126 * (r / 255) +
    0.7152 * (g / 255) +
    0.0722 * (b / 255);

  return luminance > 0.5 ? "black" : "white";
}
