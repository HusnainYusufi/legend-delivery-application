import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      brand: "SHAHEEN",
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
      menu: "Menu",
      show_password: "Show password",
      hide_password: "Hide password",

      orders_title: "Orders",
      orders_nav: "Orders",
      loading: "Loading…",
      no_orders: "No orders found.",
      customer: "Customer",
      city: "City",
      items: "Items",
      more: "more",
      order_date: "Order Date",

      pickup_pool: "Pickup Pool",
      tab_pool: "Pool",
      tab_mine: "My Claimed",
      search_orders: "Search by order number",
      claim: "Claim",
      scan_to_claim: "Scan & Claim",
      claimed_success: "Order claimed ✓",
    }
  },
  ar: {
    translation: {
      brand: "شاهين",
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

      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      login_title: "مرحبًا بعودتك",
      login_subtitle: "سجل الدخول إلى حسابك",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      email_placeholder: "بريدك@example.com",
      password_placeholder: "••••••••",
      login_button: "تسجيل الدخول",
      login_error: "بريد إلكتروني أو كلمة مرور غير صحيحة. حاول مرة أخرى.",
      forgot_password: "نسيت كلمة المرور؟",
      reset_here: "إعادة تعيين هنا",
      menu: "القائمة",
      show_password: "إظهار كلمة المرور",
      hide_password: "إخفاء كلمة المرور",

      orders_title: "الطلبات",
      orders_nav: "الطلبات",
      loading: "جارٍ التحميل…",
      no_orders: "لا توجد طلبات.",
      customer: "العميل",
      city: "المدينة",
      items: "العناصر",
      more: "أخرى",
      order_date: "تاريخ الطلب",

      pickup_pool: "طلبات بانتظار الاستلام",
      tab_pool: "المسبح",
      tab_mine: "طلباتـي",
      search_orders: "ابحث برقم الطلب",
      claim: "استلام",
      scan_to_claim: "مسح للاستلام",
      claimed_success: "تم الاستلام ✓",
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ar",
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

function syncDir(lng){
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
}
syncDir(i18n.language);
i18n.on("languageChanged", syncDir);

export default i18n;
