// src/lib/format.js
// Dates in the app's language. Arabic uses Arabic month names with Western
// digits on the Gregorian calendar ("25 نوفمبر 2026، 9:55 ص"), so a date reads
// naturally inside Arabic text instead of being an English date flipped by RTL.
import i18n from "../i18n.js";

const locale = () => (String(i18n.language || "").startsWith("ar") ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB");

/** "25 Nov 2026" / "25 نوفمبر 2026" */
export function fmtDay(d, extra = {}) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric", ...extra });
}

/** "25 Nov 2026, 9:55 am" / "25 نوفمبر 2026، 9:55 ص" (pass { year: undefined } to drop the year) */
export function fmtDateTime(d, extra = {}) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale(), { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, ...extra });
}
