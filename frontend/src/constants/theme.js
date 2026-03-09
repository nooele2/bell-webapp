// ─── Colors ──────────────────────────────────────────────────────────────────

export const C = {
  navy:        "#1a3a6b",
  navyLight:   "#2a5298",
  red:         "#c0392b",
  white:       "#ffffff",
  offwhite:    "#f8f7f4",
  border:      "#e5e0d5",
  text:        "#1c1c1c",
  textMuted:   "#6b6560",
  textLight:   "#a09890",
  success:     "#2d7d4e",
  danger:      "#b03030",
  dangerBg:    "#fdf2f2",
  dangerBorder:"#f5c6c6",
};

export const SCHEDULE_COLORS = [
  "#2a5298","#2d7d4e","#c0392b","#b03030","#7b3fb5",
  "#1a7a8a","#8a6a1a","#4a7a2a","#a04060","#3a6a9a","#6a3a8a","#1a6a5a",
];

export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const LOGO_URL =
  "https://crics.asia/wp-content/uploads/2021/01/cropped-CRICS-logo-NEW-600-px-1-1.png";

// NOTE: Normal bell times are no longer hardcoded here.
// They live in the database as the schedule with isNormal=true.
// Use: schedules.find(s => s.isNormal)