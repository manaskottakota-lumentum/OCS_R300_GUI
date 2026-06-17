const TOAST_COLORS = {
  success: ["#badbcc", "#f0fff4", "#0f5132"],
  warn: ["#f8d7a1", "#fff8e6", "#7a4300"],
  error: ["#fecaca", "#fff1f2", "#991b1b"],
  info: ["#bfdbfe", "#eff6ff", "#1d4ed8"],
};

export function Toast({ toast }) {
  const palette = TOAST_COLORS[toast?.type || "success"];

  return (
    <div
      className={`toast ${toast ? "show" : ""} p-4 text-sm font-semibold`}
      style={{ borderColor: palette[0], background: palette[1], color: palette[2] }}
    >
      {toast?.message}
    </div>
  );
}
