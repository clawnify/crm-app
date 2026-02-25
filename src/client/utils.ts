const PILL_COLORS = [
  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
  { bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8" },
  { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
];

export function pillColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  const c = PILL_COLORS[Math.abs(hash) % PILL_COLORS.length];
  return { bg: c.bg, text: c.text, border: c.border };
}

const AVATAR_COLORS = [
  "#dc2626", "#059669", "#2563eb", "#d97706", "#7c3aed",
  "#0d9488", "#db2777", "#ea580c", "#9333ea", "#16a34a",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
