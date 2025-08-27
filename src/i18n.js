// src/i18n.js
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
      load_status: "Load Status",
      order: "Order",
      tracking_number: "Tracking Number",
      last_updated: "Last updated",
      order_steps: "Status Steps",
      special_statuses: "Special Statuses",
      next_suggested: "Next Suggested",
      current: "Current",
      occurred: "Occurred",
      tip_camera: "Tip: On device, camera scanning needs HTTPS + permission.",
      toast_need_order: "Enter or scan an order number.",
      error_fetch_status: "Failed to fetch status",
      scanned_payload: "Scanned payload",
      language: "Language",
      camera_permission_denied: "Camera permission denied. Please allow camera access in settings.",
      camera_init_failed: "Failed to start camera. Ensure you're on HTTPS and have camera permission.",
      error_scan_image: "Could not read QR from image",
      open_settings: "Open Settings",
      order_details: "Order Details",
      track_order: "Track Order",
      menu: "Menu",
      close: "Close",

      // Orders list
      orders_title: "My Orders",
      orders_nav: "Orders",
      loading: "Loading…",
      no_orders: "No orders found",
      order_date: "Order Date",
      items: "Items",
      more: "more",
      load_more: "Load more",
      customer: "Customer",
      city: "City",

      // Login
      login: "Login",
      logout: "Logout",
      login_title: "Welcome Back",
      login_subtitle: "Sign in to your account",
      email: "Email",
      password: "Password",
      email_placeholder: "your.email@example.com",
      password_placeholder: "••••••••",
      login_button: "Sign In",
      login_error: "Invalid email or password. Please try again.",
      forgot_password: "Forgot your password?",
      reset_here: "Reset here",
      show_password: "Show password",
      hide_password: "Hide password",

      // Driver pickup pool
      pool_nav: "Pickup Pool",
      pickup_pool_title: "Pickup Pool",
      pickup_pool_sub: "Unassigned orders awaiting pickup.",
      pickup_search_placeholder: "Search by order no, name, city, phone, tracking…",
      no_pool_orders: "No pickup orders available",
      no_matches: "No matches",
      address: "Address",
      boxes: "Boxes",
      weight: "Weight",
      call_customer: "Call",
      claim: "Claim",

      statuses: {
        PENDING: "Pending",
        PREPARING: "Preparing",
        PREPARED: "Prepared",
        AWAITING_PICKUP: "Awaiting Pickup",
        IN_TRANSIT: "In Transit",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        DELIVERY_FAILED: "Delivery Failed",
        ON_HOLD: "On Hold",
        RETURNED: "Returned",
        CANCELLED: "Cancelled",
      },
    },
  },
  ar: {
    translation: {
      brand: "ليجند ديلفري",
      splash_tagline: "سريع. بسيط. موثوق.",
      scan_or_enter: "امسح رمز QR أو أدخل رقم الطلب",
      placeholder_order: "مثال: ORD-12345",
      scan: "مسح",
      load_status: "عرض الحالة",
      order: "الطلب",
      tracking_number: "رقم التتبع",
      last_updated: "آخر تحديث",
      order_steps: "خطوات الحالة",
      special_statuses: "حالات خاصة",
      next_suggested: "مقترح التالي",
      current: "حالي",
      occurred: "حدث",
      tip_camera: "ملاحظة: على الجهاز، المسح يحتاج HTTPS + إذن.",
      toast_need_order: "أدخل أو امسح رقم الطلب.",
      error_fetch_status: "تعذر جلب الحالة",
      scanned_payload: "البيانات الممسوحة",
      language: "اللغة",
      camera_permission_denied: "تم رفض إذن الكاميرا. يرجى السماح بالوصول إلى الكاميرا في الإعدادات.",
      camera_init_failed: "فشل بدء الكاميرا. تأكد من أنك على HTTPS ولديك إذن الكاميرا.",
      error_scan_image: "تعذر قراءة رمز الاستجابة السريعة من الصورة",
      open_settings: "فتح الإعدادات",
      order_details: "تفاصيل الطلب",
      track_order: "تتبع الطلب",
      menu: "القائمة",
      close: "إغلاق",

      // Orders list
      orders_title: "طلباتي",
      orders_nav: "الطلبات",
      loading: "جارٍ التحميل…",
      no_orders: "لا توجد طلبات",
      order_date: "تاريخ الطلب",
      items: "العناصر",
      more: "أخرى",
      load_more: "تحميل المزيد",
      customer: "العميل",
      city: "المدينة",

      // Login
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      login_title: "مرحبًا بعودتك",
      login_subtitle: "سجل الدخول إلى حسابك",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      email_placeholder: "بريدك@example.com",
      password_placeholder: "••••••••",
      login_button: "تسجيل الدخول",
      login_error: "بريد إلكتروني أو كلمة مرور غير صحيحة.",
      forgot_password: "نسيت كلمة المرور؟",
      reset_here: "إعادة التعيين من هنا",
      show_password: "إظهار كلمة المرور",
      hide_password: "إخفاء كلمة المرور",

      // Driver pickup pool
      pool_nav: "طلبات الاستلام",
      pickup_pool_title: "طلبات بانتظار الاستلام",
      pickup_pool_sub: "طلبات غير مُعيّنة بانتظار الاستلام.",
      pickup_search_placeholder: "ابحث برقم الطلب أو الاسم أو المدينة أو الهاتف أو التتبع…",
      no_pool_orders: "لا توجد طلبات للاستلام",
      no_matches: "لا توجد نتائج",
      address: "العنوان",
      boxes: "الصناديق",
      weight: "الوزن",
      call_customer: "اتصال",
      claim: "استلام",

      statuses: {
        PENDING: "قيد الانتظار",
        PREPARING: "قيد التحضير",
        PREPARED: "تم التحضير",
        AWAITING_PICKUP: "بانتظار الاستلام",
        IN_TRANSIT: "قيد النقل",
        OUT_FOR_DELIVERY: "خارج للتسليم",
        DELIVERED: "تم التسليم",
        DELIVERY_FAILED: "فشل التسليم",
        ON_HOLD: "معلق",
        RETURNED: "مرتجع",
        CANCELLED: "ملغى",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ar",
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
