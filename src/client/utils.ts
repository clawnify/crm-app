const PILL_COLORS = [
  { bg: "#fef2f2", text: "#dc2626" },
  { bg: "#ecfdf5", text: "#059669" },
  { bg: "#eff6ff", text: "#2563eb" },
  { bg: "#fffbeb", text: "#d97706" },
  { bg: "#f5f3ff", text: "#7c3aed" },
  { bg: "#f0fdfa", text: "#0d9488" },
  { bg: "#fdf2f8", text: "#db2777" },
  { bg: "#fff7ed", text: "#ea580c" },
  { bg: "#faf5ff", text: "#9333ea" },
  { bg: "#f0fdf4", text: "#16a34a" },
];

export function pillColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  const c = PILL_COLORS[Math.abs(hash) % PILL_COLORS.length];
  return { bg: c.bg, text: c.text };
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
