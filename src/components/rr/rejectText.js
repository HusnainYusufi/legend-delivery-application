// The reason a review was rejected, in the app's language when we know the code.
export function rejectText(t, r) {
  if (!r) return "";
  const key = r.rejectCode ? `review_reject.${r.rejectCode}` : null;
  if (key) {
    const s = t(key, { defaultValue: "" });
    if (s) return s;
  }
  return r.rejectReason || "";
}
