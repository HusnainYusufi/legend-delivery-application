// Why a review was rejected, in the app's language when we know the codes.
// Several reasons (e.g. old AND negative) read as a list, one per line.
const FSI = "⁨"; // keep the screenshot's own words ("5 months ago") in their direction
const PDI = "⁩";

function oneReason(t, code, detail) {
  if (code === "REVIEW_TOO_OLD" && detail?.postedRelative) {
    const s = t("review_reject_detail.REVIEW_TOO_OLD", { when: `${FSI}${detail.postedRelative}${PDI}`, defaultValue: "" });
    if (s) return s;
  }
  if (code === "NEGATIVE_REVIEW" && detail?.rating) {
    const s = t("review_reject_detail.NEGATIVE_REVIEW", { rating: detail.rating, defaultValue: "" });
    if (s) return s;
  }
  return t(`review_reject.${code}`, { defaultValue: "" });
}

export function rejectText(t, r) {
  if (!r) return "";
  const codes = r.rejectCodes?.length ? r.rejectCodes : r.rejectCode ? [r.rejectCode] : [];
  const lines = codes.map((c) => oneReason(t, c, r.rejectDetail));
  // A code this app version does not know: use the server's text, which has them all.
  if (!lines.length || lines.some((l) => !l)) return r.rejectReason || "";
  return lines.length === 1 ? lines[0] : `${t("review_reject_many")}\n${lines.map((l) => `• ${l}`).join("\n")}`;
}
