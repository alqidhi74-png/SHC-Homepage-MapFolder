# لوحة التحكم — React / Vite

هذا المجلد مكوّن React جاهز للدمج. لا يحتاج Next.js أو إعداد Tailwind، ولا يحتوي على `node_modules`.

## التركيب

1. انسخ مجلد `dashboard` كاملًا إلى `src/dashboard` في مشروعك.
2. من مجلد مشروعك الأساسي، ثبّت المكتبتين:

```bash
npm install framer-motion@^12 recharts@^3
```

يعتمد المكوّن أيضًا على React وReact DOM الموجودين في مشروعك (React 18 أو 19).

3. استورده في الصفحة التي تريد عرض لوحة التحكم فيها:

```tsx
import Dashboard from './dashboard';

export default function App() {
  return <Dashboard />;
}
```

إذا كنت تستخدم React Router، يمكنك عرضه داخل المسار الموجود لديك:

```tsx
<Route path="/dashboard" element={<Dashboard />} />
```

يتغير مسار الاستيراد بحسب مكان ملف الصفحة. المكوّن يستورد ملف CSS تلقائيًا.
إذا كان مشروعك JavaScript، يمكن لـ Vite قراءة ملفات TS/TSX في هذا المجلد أيضًا؛ لا تحتاج تحويلها إلى JSX.

## السلوك

- كل الصفحات موجودة: الملخص، الطلبات، العقارات، المدينة المباشرة، التقارير والإعدادات.
- التنقل داخلي بين الصفحات ولا يغيّر عنوان مشروعك أو يتطلب Router جديدًا. تحديث المتصفح يعيد الصفحة واللغة إلى القيم الابتدائية.
- العربية هي اللغة الافتراضية. يمكن تغييرها من الإعدادات أو البدء بـ `<Dashboard initialLocale="en" />`.
- يمكن بدء صفحة أخرى: `<Dashboard initialPage="requests" />`. القيم: `overview`, `requests`, `properties`, `city-live`, `reports`, `settings`.
- الثيم واتجاه الكتابة مطبّقان على لوحة التحكم. تُحفظ تفضيلات الثيم في `localStorage` بالمفتاح `shc-dashboard-theme`.
- البيانات تجريبية. يمكنك تمرير بيانات متوافقة مع النوع `CityData` عبر `<Dashboard data={yourData} />`.
- تصدير PDF يستخدم نافذة طباعة المتصفح؛ ليس مولّد PDF أو خدمة خلفية.
- الخط يستخدم `IBM Plex Sans Arabic` إذا كان متاحًا في مشروعك، وإلا يستخدم خط النظام. لا يحتاج تحميل خط من Google عند التشغيل.

اعرض المكوّن في صفحة بعرض كامل. إذا كان قالب Vite لديك يضع `max-width` أو `padding` على `#root`، عدّل قيود الحاوية في مشروعك حسب تصميم الصفحة.

## الملفات

`Dashboard.tsx` نقطة العرض، و`index.ts` نقطة الاستيراد. بقية مجلدات `components`, `lib`, `types`, `data` مطلوبة. ملف `dashboard.css` جاهز ويعمل بدون Tailwind في المشروع المضيف.

ملفات `styles/` و`scripts/` مخصّصة لتعديل التنسيقات وليست مطلوبة للتشغيل. عند إضافة أصناف Tailwind جديدة إلى المكوّنات، أعد توليد CSS:

```bash
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4 postcss@^8
node src/dashboard/scripts/build-styles.mjs
```

لا تنسخ `package.json` أو `tsconfig.json` من مشروع Next.js إلى مشروعك الحالي. جميع استيرادات هذا المجلد نسبية ولا تحتاج alias باسم `@/`.
