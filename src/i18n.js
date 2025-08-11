// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      brand: "LEGEND DELIVERY",
      splash_tagline: "Fast. Simple. Reliable.",
      scan_or_enter: "Scan QR or enter order number",
      placeholder_order: "e.g. ORD-12345",
      scan: "Scan",
      stop: "Stop",
      reset: "Reset",
      load_status: "Load Status",
      order: "Order",
      customer: "Customer",
      last_updated: "Last updated",
      new_status: "New status",
      apply_status: "Apply Status",
      mock_api: "Mock API",
      live_api: "Live API",
      tip_camera: "Tip: On device, camera scanning needs HTTPS + permission.",
      toast_need_order: "Enter or scan an order number.",
      toast_set_status: "Status set to \"{{status}}\"",
      error_apply_status: "Failed to apply status",
      error_fetch_status: "Failed to fetch status",
      scanned_payload: "Scanned payload",
      language: "Language",
      camera_permission_denied: "Camera permission denied. Please allow camera access in settings.",
      camera_init_failed: "Failed to start camera. Ensure you're on HTTPS and have camera permission.",
      error_scan_image: "Could not read QR from image",
      open_settings: "Open Settings",
      order_details: "Order Details",
      update_status: "Update Status",
      track_order: "Track Order",
      statuses: {
        pending: "Pending",
        processing: "Processing",
        packed: "Packed",
        shipped: "Shipped",
        out_for_delivery: "Out for delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
        returned: "Returned"
      }
    }
  },
  ar: {
    translation: {
      brand: "ليجند ديلفري",
      splash_tagline: "سريع. بسيط. موثوق.",
      scan_or_enter: "امسح رمز QR أو أدخل رقم الطلب",
      placeholder_order: "مثال: ORD-12345",
      scan: "مسح",
      stop: "إيقاف",
      reset: "إعادة تعيين",
      load_status: "عرض الحالة",
      order: "الطلب",
      customer: "العميل",
      last_updated: "آخر تحديث",
      new_status: "حالة جديدة",
      apply_status: "تطبيق الحالة",
      mock_api: "واجهة تجريبية",
      live_api: "واجهة حية",
      tip_camera: "ملاحظة: على الجهاز، المسح يحتاج HTTPS + إذن.",
      toast_need_order: "أدخل أو امسح رقم الطلب.",
      toast_set_status: "تم ضبط الحالة إلى \"{{status}}\"",
      error_apply_status: "تعذر تطبيق الحالة",
      error_fetch_status: "تعذر جلب الحالة",
      scanned_payload: "البيانات الممسوحة",
      language: "اللغة",
      camera_permission_denied: "تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا في الإعدادات.",
      camera_init_failed: "فشل بدء الكاميرا. تأكد من أنك على HTTPS ولديك إذن الكاميرا.",
      error_scan_image: "تعذر قراءة رمز الاستجابة السريعة من الصورة",
      open_settings: "فتح الإعدادات",
      order_details: "تفاصيل الطلب",
      update_status: "تحديث الحالة",
      track_order: "تتبع الطلب",
      statuses: {
        pending: "قيد الانتظار",
        processing: "قيد المعالجة",
        packed: "مُغلف",
        shipped: "تم الشحن",
        out_for_delivery: "خارج للتسليم",
        delivered: "تم التسليم",
        cancelled: "أُلغي",
        returned: "مُرتجع"
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources, 
  lng: "ar", // Default to Arabic
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

function syncDir(lng) {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
}
syncDir(i18n.language);
i18n.on("languageChanged", syncDir);

export default i18n;