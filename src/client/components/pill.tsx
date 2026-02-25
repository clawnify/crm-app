import { pillColor } from "../utils";

export function Pill({ value }: { value: string }) {
  if (!value) return null;
  const color = pillColor(value);
  return (
    <span class="pill" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
      {value}
    </span>
  );
}
