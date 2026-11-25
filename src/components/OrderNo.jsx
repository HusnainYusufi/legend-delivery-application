// src/components/OrderNo.jsx
// "Order #40301" / "طلب #40301": the number and its "#" stay together, left to
// right, so Arabic text does not move the "#" to the other side.
import React from "react";
import { useTranslation } from "react-i18next";

export default function OrderNo({ no }) {
  const { t } = useTranslation();
  return <>{t("order_label")} <bdi dir="ltr">#{no == null ? "" : String(no)}</bdi></>;
}
