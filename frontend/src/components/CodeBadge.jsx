/**
 * Colored badge showing a schedule code (e.g. "L", "c+", "B")
 * small prop = compact size for calendar cells / week grid
 */
export default function CodeBadge({ code, color, small }) {
  return (
    <span style={{
      backgroundColor: color + "20",
      borderColor: color,
      color,
      border: "1.5px solid",
      borderRadius: "5px",
      padding: small ? "1px 6px" : "3px 9px",
      fontSize: small ? "10px" : "12px",
      fontWeight: 700,
      fontFamily: "monospace",
      whiteSpace: "nowrap",
      letterSpacing: "0.04em",
    }}>
      {code}
    </span>
  );
}