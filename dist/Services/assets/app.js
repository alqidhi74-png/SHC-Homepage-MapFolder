/* ============================================================
   مدينة السلطان هيثم — بوابة الخدمات
   app.js — سلوك مشترك بين كل صفحات الخدمات:
   الترجمة (AR/EN) · عرض الجوال/الكمبيوتر · حالة الطلب (sessionStorage)
   · مسار الصفحات (الفصول) · طبقة البيانات (Mock API)
   · تسجيل الدخول · الهيدر التفاعلي مع التمرير · الانتقالات بين الصفحات
   ============================================================ */

/* Require a signed-in site session before any service page can be used. */
(() => {
  let authenticated = false;

  try {
    authenticated = window.localStorage.getItem('sh_site_logged_in_v2') === '1';
  } catch (_) {
    authenticated = false;
  }

  if (!authenticated) {
    const returnTo = window.location.pathname + window.location.search + window.location.hash;
    window.location.replace('/login?returnTo=' + encodeURIComponent(returnTo));
  }
})();

/* ---------------- بيانات الخدمات (مشتركة) ---------------- */
const SERVICE_CATALOG = {
  'realestate-reg': {
    cat: 'realestate', catLabel: 'المعاملات العقارية', title: 'تسجيل ملكية عقار',
    desc: 'خدمة نقل وتسجيل ملكية قطعة أرض أو عقار باسم المالك الجديد، بعد استيفاء المستندات المطلوبة والتحقق من سند الملكية السابق.',
    days: '5 أيام', fee: '20 ر.ع', dept: 'قسم العقارات', requestType: 'تسجيل ملكية',
    catLabelEn: 'Real Estate Transactions', titleEn: 'Property Ownership Registration',
    descEn: 'Transfer and register a plot or property in the new owner’s name after verifying the required ownership documents.',
    daysEn: '5 days', feeEn: 'OMR 20', deptEn: 'Real Estate Department', requestTypeEn: 'Ownership Registration',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" style="width:26px;height:26px;stroke:var(--velvet);"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/></svg>',
    docs: ['البطاقة الشخصية', 'سند الملكية الحالي', 'المخطط / الوثيقة المطلوبة'],
    docsEn: ['Identity Card', 'Current Ownership Deed', 'Required Plan or Document']
  },
  'planning-res': {
    cat: 'planning', catLabel: 'الموافقات التخطيطية', title: 'موافقة تخطيطية — بناء سكني',
    desc: 'موافقة تخطيطية أولية لإنشاء مبنى سكني جديد ضمن قطعة الأرض، وفق اشتراطات التخطيط في المدينة.',
    days: '10 أيام', fee: '45 ر.ع', dept: 'قسم التخطيط', requestType: 'موافقة تخطيطية',
    catLabelEn: 'Planning Approvals', titleEn: 'Planning Approval — Residential Construction',
    descEn: 'Initial planning approval to construct a new residential building in accordance with the city planning requirements.',
    daysEn: '10 days', feeEn: 'OMR 45', deptEn: 'Planning Department', requestTypeEn: 'Planning Approval',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" style="width:26px;height:26px;stroke:var(--velvet);"><rect x="3" y="9" width="18" height="11" rx="1"/><path d="M8 9V6a4 4 0 018 0v3"/></svg>',
    docs: ['البطاقة الشخصية', 'سند الملكية', 'مخطط الموقع'],
    docsEn: ['Identity Card', 'Ownership Deed', 'Site Plan']
  },
  'permits-work': {
    cat: 'permits', catLabel: 'التصاريح', title: 'تصريح عمل مؤقت',
    desc: 'استخراج تصريح عمل لفترة محددة لأصحاب الأعمال داخل حدود مدينة السلطان هيثم.',
    days: '3 أيام', fee: '15 ر.ع', dept: 'قسم التراخيص', requestType: 'تصريح عمل',
    catLabelEn: 'Permits', titleEn: 'Temporary Work Permit',
    descEn: 'Apply for a temporary work permit for business owners operating within Sultan Haitham City.',
    daysEn: '3 days', feeEn: 'OMR 15', deptEn: 'Licensing Department', requestTypeEn: 'Work Permit',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" style="width:26px;height:26px;stroke:var(--velvet);"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
    docs: ['البطاقة الشخصية', 'عقد الإيجار أو سند الملكية', 'صورة النشاط'],
    docsEn: ['Identity Card', 'Lease Contract or Ownership Deed', 'Business Activity Image']
  },
  'business-lic': {
    cat: 'business', catLabel: 'تراخيص الأعمال', title: 'رخصة نشاط تجاري',
    desc: 'إصدار أو تجديد رخصة مزاولة نشاط تجاري داخل حدود المدينة بعد استكمال المتطلبات.',
    days: '4 أيام', fee: '30 ر.ع', dept: 'قسم التراخيص', requestType: 'رخصة نشاط تجاري',
    catLabelEn: 'Business Licences', titleEn: 'Business Activity Licence',
    descEn: 'Issue or renew a licence to conduct a business activity within the city after completing the requirements.',
    daysEn: '4 days', feeEn: 'OMR 30', deptEn: 'Licensing Department', requestTypeEn: 'Business Activity Licence',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" style="width:26px;height:26px;stroke:var(--velvet);"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg>',
    docs: ['البطاقة الشخصية', 'سجل تجاري', 'صورة واجهة المحل'],
    docsEn: ['Identity Card', 'Commercial Registration', 'Storefront Image']
  }
};

/* ---------------- حالة الطلب المشتركة بين الصفحات ---------------- */
const STATE_KEY = 'sh_request_state';
function defaultState() {
  return { serviceId: 'realestate-reg', parcel: '', type: '', desc: '', docs: {}, ack: false, signed: false, requestNumber: '', submittedAt: '', citizen: null };
}
function loadState() {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (_) {}
  return defaultState();
}
/* يرجع true عند نجاح الحفظ — مهم لأن sessionStorage محدود (~5MB) ويمكن أن يمتلئ بالصور */
function saveState(state) {
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); return true; } catch (_) { return false; }
}

/* أدوات صغيرة مشتركة */
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- مسار الصفحات (الفصول) — مصدر واحد للترقيم والنصوص ---------------- */
const PAGE_FLOW = {
  'services-catalog.html':    { n: 1, page: 'catalog',        accent: '#B39157', ch: 'الفصل الأول · دليل الخدمات',        chEn: 'CHAPTER 1 · SERVICES GUIDE',  line: 'اختر الخدمة، والباقي مرتّب لك',              lineEn: 'Pick a service — we take care of the rest' },
  'service-details.html':     { n: 2, page: 'detail',         accent: '#3D4E1E', ch: 'الفصل الثاني · تفاصيل الخدمة',      chEn: 'CHAPTER 2 · SERVICE DETAILS', line: 'اعرف المستندات والمدة قبل أن تبدأ',          lineEn: 'Know the documents and timeline before you start' },
  'citizen-data.html':        { n: 3, page: 'citizen',        accent: '#D9C27E', ch: 'الفصل الثالث · بيانات المواطن',     chEn: 'CHAPTER 3 · YOUR DETAILS',    line: 'بياناتك جاهزة — راجعها وأكمل الناقص فقط',    lineEn: 'Your details are ready — review and fill the gaps' },
  'request-documents.html':   { n: 4, page: 'request-docs',   accent: '#F1BB4D', ch: 'الفصل الرابع · المستندات',          chEn: 'CHAPTER 4 · DOCUMENTS',       line: 'أرفق وثائقك — خطوة واحدة من الاعتماد',       lineEn: 'Attach your documents — one step from approval' },
  'request-review.html':      { n: 5, page: 'request-review', accent: '#AC6492', ch: 'الفصل الخامس · المراجعة والتوقيع',  chEn: 'CHAPTER 5 · REVIEW & SIGN',   line: 'مراجعة الطلب وتأكيد الإرسال',                 lineEn: 'Review and confirm your request' },
  'request-confirmation.html':{ n: 6, page: 'confirm',        accent: '#3D4E1E', ch: 'الفصل السادس · تأكيد الطلب',        chEn: 'CHAPTER 6 · CONFIRMATION',    line: 'طلبك في الطريق، واحتفظ بإيصالك',             lineEn: 'Your request is on its way — keep your receipt' },
  'request-tracking.html':    { n: 7, page: 'track',          accent: '#F8633E', ch: 'الفصل السابع · تتبع الطلب',         chEn: 'CHAPTER 7 · TRACKING',        line: 'تابع مسار طلبك من الاستلام حتى الاعتماد',   lineEn: 'Follow your request from receipt to approval' },
};
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function toArabicDigits(n) { return String(n).replace(/\d/g, d => AR_DIGITS[d]); }
function currentPageFile() {
  const page = document.body?.dataset.page;
  const hit = Object.keys(PAGE_FLOW).find(k => PAGE_FLOW[k].page === page);
  return hit || decodeURIComponent(location.pathname.split('/').pop() || '');
}
function flowByN(n) { return Object.keys(PAGE_FLOW).find(k => PAGE_FLOW[k].n === n); }
function chapterLabel(info) { return currentLang === 'en' ? info.chEn : info.ch; }
function chapterLine(info) { return currentLang === 'en' ? info.lineEn : info.line; }

/* يرسم شريط الفصل (الرقم، العنوان، السطر، شريط التقدم) من PAGE_FLOW */
function renderChapterStrip() {
  const file = currentPageFile();
  const info = PAGE_FLOW[file];
  const strip = document.querySelector('.chapter-strip');
  if (!info || !strip) return;
  strip.style.setProperty('--ch-accent', info.accent);
  const mark = strip.querySelector('.ch-mark');
  if (mark) mark.textContent = currentLang === 'en' ? info.n : toArabicDigits(info.n);
  const b = strip.querySelector('.ch-text b');
  if (b) b.textContent = chapterLabel(info);
  const p = strip.querySelector('.ch-text p');
  if (p) p.textContent = chapterLine(info);
  const spine = strip.querySelector('.ch-spine');
  if (spine) {
    spine.innerHTML = Object.values(PAGE_FLOW)
      .map(x => `<i class="${x.n <= info.n ? 'on' : ''}${x.n === info.n ? ' here' : ''}" title="${escapeHtml(chapterLabel(x))}"></i>`).join('');
    spine.setAttribute('aria-label', (currentLang === 'en' ? 'Step ' : 'الخطوة ') + info.n + ' / ' + Object.keys(PAGE_FLOW).length);
  }
  /* زر الرجوع: نص الستارة = الفصل السابق */
  const back = document.getElementById('back-arrow-btn');
  const prevFile = flowByN(info.n - 1);
  if (back && prevFile) {
    back.dataset.chapter = chapterLabel(PAGE_FLOW[prevFile]);
    back.dataset.line = chapterLine(PAGE_FLOW[prevFile]);
    back.dataset.fallback = prevFile;
  }
}

/* ---------------- الترجمة AR / EN ---------------- */
const DICT = {
  'brand-ar': { ar: 'مدينة السلطان هيثم', en: 'Sultan Haitham City' },
  'brand-en': { ar: 'SULTAN HAITHAM CITY', en: 'AN EVERLASTING GIFT' },
  'svc-title': { ar: 'دليل خدمات المدينة', en: 'City Services Guide' },
  'svc-sub': { ar: 'اختر الخدمة التي ترغب بتقديم طلب لها', en: 'Choose the service you would like to apply for' },
  'svc-search-ph': { ar: 'ابحث عن خدمة...', en: 'Search a service...' },
  'filter-all': { ar: 'الكل', en: 'All' },
  'filter-permits': { ar: 'التصاريح', en: 'Permits' },
  'filter-realestate': { ar: 'المعاملات العقارية', en: 'Real Estate' },
  'filter-business': { ar: 'تراخيص الأعمال', en: 'Business Licenses' },
  'filter-planning': { ar: 'الموافقات التخطيطية', en: 'Planning Approvals' },
  'start-request': { ar: 'ابدأ الخدمات', en: 'Start Services' },
  'services-guide': { ar: 'دليل الخدمات', en: 'Services Guide' },
  'req-docs-title': { ar: 'المستندات المطلوبة', en: 'Required Documents' },
  'expected-duration': { ar: 'المدة المتوقعة', en: 'Expected Duration' },
  'fees': { ar: 'الرسوم', en: 'Fees' },
  'dept': { ar: 'القسم المختص', en: 'Responsible Department' },
  'step-data': { ar: 'البيانات', en: 'Details' },
  'step-docs': { ar: 'المستندات', en: 'Documents' },
  'step-review': { ar: 'المراجعة', en: 'Review' },
  'step-confirm': { ar: 'التأكيد', en: 'Confirmation' },
  'request-data-title': { ar: 'بيانات الطلب', en: 'Request Details' },
  'name': { ar: 'الاسم', en: 'Name' },
  'civil-id': { ar: 'الرقم المدني', en: 'Civil ID' },
  'phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'parcel-no': { ar: 'رقم القطعة', en: 'Parcel Number' },
  'request-type': { ar: 'نوع الطلب', en: 'Request Type' },
  'request-desc': { ar: 'وصف الطلب', en: 'Request Description' },
  'next': { ar: 'التالي', en: 'Next' },
  'prev': { ar: 'السابق', en: 'Previous' },
  'req-docs-heading': { ar: 'المستندات المطلوبة', en: 'Required Documents' },
  'dropzone-title': { ar: 'اسحب الملفات هنا أو انقر لاختيارها', en: 'Drag files here or click to choose' },
  'upload': { ar: 'رفع', en: 'Upload' },
  'replace': { ar: 'استبدال', en: 'Replace' },
  'preview': { ar: 'معاينة', en: 'Preview' },
  'delete': { ar: 'حذف', en: 'Delete' },
  'review-title': { ar: 'بيانات مقدم الطلب', en: "Applicant's Information" },
  'edit': { ar: 'تعديل', en: 'Edit' },
  'request-data-h': { ar: 'بيانات الطلب', en: 'Request Data' },
  'documents': { ar: 'المستندات', en: 'Documents' },
  'ack-text': { ar: 'أقر أن جميع البيانات المدخلة والمرفقة في الطلب صحيحة ومطابقة للجهات الرسمية.', en: 'I confirm that all entered and attached information is accurate and matches official records.' },
  'e-sign': { ar: 'توقيع إلكتروني', en: 'E-Signature' },
  'submit-request': { ar: 'إرسال الطلب', en: 'Submit Request' },
  'clear': { ar: 'مسح', en: 'Clear' },
  'cancel': { ar: 'إلغاء', en: 'Cancel' },
  'save-signature': { ar: 'اعتماد التوقيع', en: 'Save Signature' },
  'confirm-title': { ar: 'تم إرسال الطلب بنجاح', en: 'Request Submitted Successfully' },
  'confirm-sub': { ar: 'سيتم إشعارك بأي تحديث على حالة الطلب', en: 'You will be notified of any updates to your request' },
  'service-type': { ar: 'نوع الخدمة', en: 'Service Type' },
  'submit-date': { ar: 'تاريخ التقديم', en: 'Submission Date' },
  'status': { ar: 'الحالة', en: 'Status' },
  'status-review': { ar: 'قيد المراجعة', en: 'Under Review' },
  'track-request': { ar: 'تتبع الطلب', en: 'Track Request' },
  'download-receipt': { ar: 'تحميل الإيصال', en: 'Download Receipt' },
  'track-title': { ar: 'تتبع الطلب', en: 'Track Request' },
  'track-sub': { ar: 'أدخل رقم الطلب لعرض حالته ومسار معالجته', en: 'Enter the request number to view its status and progress' },
  'search': { ar: 'بحث', en: 'Search' },
  'my-requests': { ar: 'طلباتي ▾', en: 'My Requests ▾' },
  'request-number': { ar: 'رقم الطلب', en: 'Request Number' },
  'current-dept': { ar: 'القسم الحالي', en: 'Current Department' },
  'realestate-dept': { ar: 'قسم العقارات', en: 'Real Estate Department' },
  'assigned-agent': { ar: 'الموظف المسؤول', en: 'Assigned Agent' },
  'agent-sarah': { ar: 'سارة الهنائية', en: 'Sarah Al Hinai' },
  'status-progress': { ar: 'قيد المعالجة', en: 'In Progress' },
  'received-stage': { ar: 'استقبال الطلب', en: 'Request Received' },
  'employee-ahmed': { ar: 'الموظف: أحمد', en: 'Employee: Ahmed' },
  'started-finished': { ar: 'بدأ وانتهى: 18/09/2026', en: 'Started and completed: 18/09/2026' },
  'received-note': { ar: 'تم التحقق من اكتمال الطلب وإحالته للمراجعة', en: 'The request was checked for completeness and sent for review' },
  'review-stage': { ar: 'المراجعة', en: 'Review' },
  'employee-sarah': { ar: 'الموظف: سارة', en: 'Employee: Sarah' },
  'started-date': { ar: 'بدأ: 18/09/2026', en: 'Started: 18/09/2026' },
  'needs-completion': { ar: 'مطلوب استكمال', en: 'Action Required' },
  'extra-doc-needed': { ar: 'مطلوب استكمال مستند إضافي', en: 'An additional document is required' },
  'upload-document': { ar: 'رفع مستند', en: 'Upload Document' },
  'processing-stage': { ar: 'المعالجة', en: 'Processing' },
  'final-approval': { ar: 'الاعتماد النهائي', en: 'Final Approval' },
  'request-notifications': { ar: 'إشعارات هذا الطلب', en: 'Request Notifications' },
  'notification-extra-doc': { ar: 'مطلوب استكمال مستند إضافي لإتمام مرحلة المراجعة', en: 'An additional document is required to complete the review' },
  'notification-transferred': { ar: 'تم تحويل طلبك إلى قسم العقارات للمراجعة', en: 'Your request was transferred to the Real Estate Department for review' },
  'notification-received': { ar: 'تم استلام طلبك بنجاح، رقم الطلب SR-2026-0045', en: 'Your request was received successfully, request number SR-2026-0045' },
  'today-time': { ar: 'اليوم — 10:24 ص', en: 'Today — 10:24 AM' },
  'back-receipt': { ar: 'العودة إلى الإيصال', en: 'Back to Receipt' },
  'back-services': { ar: 'العودة إلى الخدمات', en: 'Back to Services' },
  'notifications': { ar: 'الإشعارات', en: 'Notifications' },
  'notif-doc': { ar: 'طلبك SR-2026-0045 يحتاج مستنداً إضافياً', en: 'Your request SR-2026-0045 needs an additional document' },
  'notif-transfer': { ar: 'تم تحويل طلبك إلى قسم العقارات', en: 'Your request was transferred to the Real Estate Department' },
  'notif-welcome': { ar: 'مرحباً بك في بوابة خدمات المدينة', en: 'Welcome to the City Services Portal' },
  'minutes-ago': { ar: 'قبل 12 دقيقة', en: '12 minutes ago' },
  'yesterday': { ar: 'أمس', en: 'Yesterday' },
  'days-ago': { ar: 'قبل 3 أيام', en: '3 days ago' },
  /* صفحة بيانات المواطن */
  'cz-title': { ar: 'بيانات المواطن', en: 'Citizen Details' },
  'cz-sub': { ar: 'جلبنا بياناتك من حسابك — لا حاجة لإعادة إدخال ما هو موجود', en: 'We pulled your details from your account — no need to re-enter them' },
  'save-continue': { ar: 'حفظ ومتابعة', en: 'Save & Continue' },
  'applicant': { ar: 'مقدم الطلب', en: 'Applicant' },
  'hero-title': { ar: 'دليل الخدمات', en: 'Services Guide' },
  'hero-sub': { ar: 'كل خدمات المدينة في مكان واحد — ابدأ طلبك خلال دقائق', en: 'Every city service in one place — start in minutes' },
  'dz-sub': { ar: 'الصيغ المدعومة: JPG · PNG · PDF — الحجم الأقصى 10 ميجابايت · يُملأ أول مستند ناقص تلقائياً', en: 'Supported: JPG · PNG · PDF — max 10 MB · fills the first missing document' },
  'desc-ph': { ar: 'اكتب تفاصيل إضافية...', en: 'Add any extra details...' },
  'explore': { ar: 'استكشف الخدمات', en: 'Explore services' },
};

let currentLang = document.documentElement.lang === 'en' ? 'en' : 'ar';

function getServiceCopy(service, lang = currentLang) {
  const english = lang === 'en';
  return {
    catLabel: english ? service.catLabelEn : service.catLabel,
    title: english ? service.titleEn : service.title,
    desc: english ? service.descEn : service.desc,
    days: english ? service.daysEn : service.days,
    fee: english ? service.feeEn : service.fee,
    dept: english ? service.deptEn : service.dept,
    requestType: english ? service.requestTypeEn : service.requestType,
    docs: english ? service.docsEn : service.docs,
  };
}

function applyLang(lang) {
  currentLang = lang;
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (DICT[key]) el.innerHTML = DICT[key][lang];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (DICT[key]) el.placeholder = DICT[key][lang];
  });
  const btn = document.getElementById('header-lang-btn');
  if (btn) btn.innerHTML = lang === 'ar'
    ? '<strong>Ar</strong><i aria-hidden="true">/</i><span>En</span>'
    : '<span>Ar</span><i aria-hidden="true">/</i><strong>En</strong>';
  const brandHome = document.querySelector('.service-brand-home');
  if (brandHome) brandHome.setAttribute('aria-label', lang === 'en' ? 'Back to direct access' : 'العودة إلى الدخول المباشر');
  document.querySelectorAll('.header-home-link').forEach(link => {
    const label = lang === 'en' ? 'Back to direct access' : 'العودة إلى الدخول المباشر';
    link.setAttribute('aria-label', label);
    link.title = label;
  });
  if (document.getElementById('header-account-btn')) refreshAccountButton();
  updateLoginModalLanguage();
  try { localStorage.setItem('sh_lang', lang); } catch (_) {}
  renderChapterStrip();
  document.dispatchEvent(new CustomEvent('sh:langchange', { detail: { lang } }));
}
function toggleLanguage() { applyLang(currentLang === 'ar' ? 'en' : 'ar'); }

/* ---------------- حالة تسجيل الدخول (مشتركة بين الصفحات) ---------------- */
const LOGIN_KEY = 'sh_site_logged_in_v2';
const PROFILE_KEY = 'sh_site_profile_v2';
const MOCK_USER = { id: 'u-1001', name: 'سالم الحارثي', initials: 'س' };
function isLoggedIn() { try { return localStorage.getItem(LOGIN_KEY) === '1'; } catch (_) { return false; } }
function setLoggedIn(v) {
  try {
    if (v) {
      localStorage.setItem(LOGIN_KEY, '1');
      if (!localStorage.getItem(PROFILE_KEY)) localStorage.setItem(PROFILE_KEY, JSON.stringify(MOCK_USER));
    } else {
      localStorage.removeItem(LOGIN_KEY);
      localStorage.removeItem(PROFILE_KEY);
    }
  } catch (_) {}
}
function currentUser() {
  if (!isLoggedIn()) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    const name = String(stored?.name || MOCK_USER.name);
    return { ...MOCK_USER, ...stored, name, initials: String(stored?.initials || name.charAt(0)) };
  } catch (_) {
    return MOCK_USER;
  }
}

/* طلبات وهمية لعرضها في قائمة "طلباتي" وفي إشعارات المستخدم */
const MY_REQUESTS = [
  { num: 'SR-2026-0045', type: 'تسجيل ملكية', typeEn: 'Property Registration', status: 'قيد المعالجة', statusEn: 'In Progress', badge: 'progress' },
  { num: 'SR-2026-0032', type: 'رخصة نشاط تجاري', typeEn: 'Business License', status: 'مكتمل', statusEn: 'Completed', badge: 'done' },
  { num: 'SR-2026-0019', type: 'تصريح عمل مؤقت', typeEn: 'Temporary Work Permit', status: 'مكتمل', statusEn: 'Completed', badge: 'done' },
];

/* ============================================================
   طبقة البيانات (Mock API)
   ------------------------------------------------------------
   المشروع لا يحتوي على backend أو قاعدة بيانات — كل البيانات وهمية.
   لذلك عُزلت كل عمليات "الخادم" هنا خلف واجهة Promise واحدة:
   عند توفر API حقيقية، استبدل جسم الدوال بـ fetch() فقط، وتبقى
   الصفحات كما هي.
   للاختبار: أضف ?simulate=error أو ?simulate=empty أو ?simulate=save-error للرابط.
   ============================================================ */
const API_LATENCY = 650;
function simFlag() { try { return new URLSearchParams(location.search).get('simulate') || ''; } catch (_) { return ''; } }
let simErrorConsumed = false;   /* الخطأ الوهمي يحدث مرة واحدة فقط حتى تعمل "إعادة المحاولة" */
function simulateRequest(produce, { fail = false, ms = API_LATENCY } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) { reject(new Error('NETWORK_ERROR')); return; }
      try { resolve(typeof produce === 'function' ? produce() : produce); } catch (e) { reject(e); }
    }, ms);
  });
}

/* سجل مدني وهمي — بعض الحقول ناقصة عمداً لإظهار سلوك "أكمل الناقص فقط" */
const CITIZEN_SEED = {
  'u-1001': {
    fullName: 'سالم بن سعيد الحارثي', civilId: '12345678', dob: '1990-04-12', nationality: 'عُماني',
    phone: '91234567', email: 'alqidhi74@gmail.com', governorate: 'مسقط', wilayat: 'بوشر', address: 'بوشر، مسقط'
  }
};
const CITIZEN_DB_KEY = id => 'sh_db_citizen_' + id;

const AuthAPI = {
  login() { return simulateRequest(() => ({ ...MOCK_USER }), { ms: 700 }); },
};
const CitizenAPI = {
  getProfile(userId) {
    const flag = simFlag();
    const fail = flag === 'error' && !simErrorConsumed;
    if (fail) simErrorConsumed = true;
    return simulateRequest(() => {
      if (flag === 'empty') return null;
      try { const saved = localStorage.getItem(CITIZEN_DB_KEY(userId)); if (saved) return JSON.parse(saved); } catch (_) {}
      return CITIZEN_SEED[userId] ? { ...CITIZEN_SEED[userId] } : null;
    }, { fail });
  },
  saveProfile(userId, data) {
    const flag = simFlag();
    const fail = flag === 'save-error' && !simErrorConsumed;
    if (fail) simErrorConsumed = true;
    return simulateRequest(() => {
      const record = { ...data, updatedAt: new Date().toISOString() };
      localStorage.setItem(CITIZEN_DB_KEY(userId), JSON.stringify(record));
      return record;
    }, { fail, ms: 800 });
  },
};

/* تعريف حقول نموذج المواطن — مصدر واحد تستخدمه صفحة البيانات وصفحة المراجعة */
const OMAN_GOVERNORATES = ['مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية', 'شمال الباطنة', 'جنوب الباطنة', 'جنوب الشرقية', 'شمال الشرقية', 'الظاهرة', 'الوسطى'];
const WILAYATS = {
  'مسقط': ['مسقط', 'مطرح', 'بوشر', 'السيب', 'العامرات', 'قريات'],
  'شمال الباطنة': ['صحار', 'شناص', 'لوى', 'صحم', 'الخابورة', 'السويق'],
  'جنوب الباطنة': ['الرستاق', 'العوابي', 'نخل', 'وادي المعاول', 'بركاء', 'المصنعة'],
  'الداخلية': ['نزوى', 'بهلاء', 'منح', 'الحمراء', 'أدم', 'إزكي', 'سمائل', 'بدبد', 'الجبل الأخضر'],
  'ظفار': ['صلالة', 'طاقة', 'مرباط', 'رخيوت', 'ثمريت', 'ضلكوت', 'سدح', 'شليم وجزر الحلانيات', 'المزيونة', 'مقشن'],
};
const CITIZEN_FIELDS = [
  { key: 'fullName',    group: 'id',      label: 'الاسم الكامل',      en: 'Full name',      required: true,  locked: true, autocomplete: 'name' },
  { key: 'civilId',     group: 'id',      label: 'الرقم المدني',      en: 'Civil ID',       required: true,  locked: true, inputmode: 'numeric', ltr: true, pattern: /^\d{8,9}$/, err: 'الرقم المدني يتكون من 8 إلى 9 أرقام' },
  { key: 'dob',         group: 'id',      label: 'تاريخ الميلاد',     en: 'Date of birth',  required: true,  locked: true, type: 'date', ltr: true },
  { key: 'nationality', group: 'id',      label: 'الجنسية',           en: 'Nationality',    required: false, locked: true },
  { key: 'phone',       group: 'contact', label: 'رقم الهاتف',        en: 'Phone',          required: true,  type: 'tel', inputmode: 'tel', ltr: true, prefix: '+968', autocomplete: 'tel-national', pattern: /^[79]\d{7}$/, err: 'أدخل رقماً عُمانياً من 8 أرقام يبدأ بـ 7 أو 9' },
  { key: 'email',       group: 'contact', label: 'البريد الإلكتروني', en: 'Email',          required: true,  type: 'email', inputmode: 'email', ltr: true, autocomplete: 'email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, err: 'صيغة البريد الإلكتروني غير صحيحة', hint: 'نرسل عليه إشعارات حالة الطلب' },
  { key: 'governorate', group: 'address', label: 'المحافظة',          en: 'Governorate',    required: true,  type: 'select', options: OMAN_GOVERNORATES },
  { key: 'wilayat',     group: 'address', label: 'الولاية',           en: 'Wilayat',        required: true,  list: 'wilayat' },
  { key: 'address',     group: 'address', label: 'العنوان التفصيلي',  en: 'Street address', required: true,  type: 'textarea', minLength: 6, hint: 'الحي، الشارع، رقم المنزل أو المبنى', autocomplete: 'street-address' },
];
function isFilled(v) { return v != null && String(v).trim() !== ''; }
function validateCitizenField(f, value) {
  const v = String(value ?? '').trim();
  if (f.required && !v) return 'هذا الحقل مطلوب';
  if (v && f.pattern && !f.pattern.test(v)) return f.err || 'قيمة غير صحيحة';
  if (v && f.minLength && v.length < f.minLength) return 'الرجاء كتابة العنوان بتفصيل أكثر';
  return '';
}
function formatCitizenValue(f, v) {
  if (!isFilled(v)) return '—';
  if (f.type === 'date') {
    const d = new Date(v);
    if (!isNaN(d)) return d.toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'ar-OM', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (f.prefix) return f.prefix + ' ' + v;
  return v;
}

/* ---------------- حالات المستندات (مشتركة بين المستندات والمراجعة) ----------------
   required: لم يُرفع · uploading: جارٍ الرفع · uploaded: تم الرفع (قبل إرسال الطلب)
   pending: بانتظار تحقق الموظف (بعد الإرسال) · approved: معتمد · rejected: مرفوض */
const DOC_STATUS = {
  required:  { ar: 'مطلوب',      en: 'Required' },
  uploading: { ar: 'جارٍ الرفع', en: 'Uploading' },
  uploaded:  { ar: 'تم الرفع',   en: 'Uploaded' },
  pending:   { ar: 'قيد التحقق', en: 'Pending' },
  approved:  { ar: 'معتمد',      en: 'Approved' },
  rejected:  { ar: 'مرفوض',      en: 'Rejected' },
};
function docStatusChip(status) {
  const s = DOC_STATUS[status] || DOC_STATUS.required;
  return `<span class="st-chip st-${status}">${currentLang === 'en' ? s.en : s.ar}</span>`;
}
function isDocDone(entry) { return !!entry && entry.status !== 'rejected'; }
function fileTypeLabel(type, name) {
  if (/pdf/i.test(type) || /\.pdf$/i.test(name || '')) return 'PDF';
  const m = /image\/(\w+)/.exec(type || '');
  if (m) return m[1].toUpperCase().replace('JPEG', 'JPG');
  const ext = /\.(\w+)$/.exec(name || '');
  return ext ? ext[1].toUpperCase() : (currentLang === 'en' ? 'File' : 'ملف');
}

/* ---------------- تنبيهات Toast خفيفة ---------------- */
function showToast(message, type = 'info', ms = 2800) {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const icons = { success: '✓', error: '!', info: 'i' };
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = `<span class="toast-ic" aria-hidden="true">${icons[type] || 'i'}</span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
    setTimeout(() => t.remove(), 600);
  }, ms);
}

/* ---------------- الإشعارات + حساب المستخدم في الهيدر ---------------- */
function buildHeaderExtras() {
  document.querySelectorAll('.header-actions').forEach(actions => {
    if (actions.querySelector('.header-notif-wrap')) return;

    const notifWrap = document.createElement('div');
    notifWrap.className = 'header-dropdown-wrap header-notif-wrap';
    notifWrap.innerHTML = `
      <button class="header-icon-btn" id="header-notif-btn" type="button" title="الإشعارات" aria-label="الإشعارات" aria-haspopup="true" aria-expanded="false">🔔<span class="header-notif-dot" id="header-notif-dot"></span></button>
      <div class="header-dropdown" id="header-notif-dropdown">
        <div class="hd-title" data-i18n="notifications">الإشعارات</div>
        <div class="hd-item"><b data-i18n="notif-doc">طلبك SR-2026-0045 يحتاج مستنداً إضافياً</b><span class="sub" data-i18n="minutes-ago">قبل 12 دقيقة</span></div>
        <div class="hd-item"><b data-i18n="notif-transfer">تم تحويل طلبك إلى قسم العقارات</b><span class="sub" data-i18n="yesterday">أمس</span></div>
        <div class="hd-item"><b data-i18n="notif-welcome">مرحباً بك في بوابة خدمات المدينة</b><span class="sub" data-i18n="days-ago">قبل 3 أيام</span></div>
      </div>`;

    const accountWrap = document.createElement('div');
    accountWrap.className = 'header-dropdown-wrap header-account-wrap';
    accountWrap.innerHTML = `<a class="header-home-link" href="/#direct-access" aria-label="العودة إلى الدخول المباشر" title="العودة إلى الدخول المباشر"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></a>
      <button class="header-account-btn guest" id="header-account-btn" type="button"></button>
      <div class="header-dropdown" id="header-account-dropdown"></div>`;

    actions.appendChild(notifWrap);
    actions.appendChild(accountWrap);

    document.getElementById('header-notif-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllHeaderDropdowns('header-notif-dropdown');
      const dd = document.getElementById('header-notif-dropdown');
      dd.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', dd.classList.contains('open'));
      document.getElementById('header-notif-dot').style.display = 'none';
    });
  });
  refreshAccountButton();
  document.addEventListener('click', () => closeAllHeaderDropdowns());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllHeaderDropdowns(); });
}

function closeAllHeaderDropdowns(exceptId) {
  document.querySelectorAll('.header-dropdown.open').forEach(dd => {
    if (dd.id !== exceptId) dd.classList.remove('open');
  });
}

function refreshAccountButton() {
  document.querySelectorAll('#header-account-btn').forEach(btn => {
    const dropdown = btn.parentElement.querySelector('#header-account-dropdown');
    if (isLoggedIn()) {
      const user = currentUser();
      btn.classList.remove('guest');
      btn.classList.add('icon-only');
      btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>`;
      btn.setAttribute('aria-label', currentLang === 'en' ? 'Account menu' : 'قائمة الحساب');
      btn.title = currentLang === 'en' ? 'Account menu' : 'قائمة الحساب';
      if (dropdown) dropdown.innerHTML = `<div class="hd-item"><b>${escapeHtml(user.name)}</b><span class="sub">${currentLang === 'en' ? 'Signed-in account' : 'حساب مُسجَّل'}</span></div>
        <a class="hd-item" href="citizen-data.html" data-dir="down">${currentLang === 'en' ? 'My details' : 'بياناتي الشخصية'}</a>
        <div class="hd-sep"></div><div class="hd-item hd-logout" id="hd-logout-btn" role="button" tabindex="0">${currentLang === 'en' ? 'Sign out' : 'تسجيل الخروج'}</div>`;
    } else {
      btn.classList.remove('icon-only');
      btn.classList.add('guest');
      btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>`;
      btn.setAttribute('aria-label', currentLang === 'en' ? 'Sign in' : 'تسجيل الدخول');
      btn.title = currentLang === 'en' ? 'Sign in' : 'تسجيل الدخول';
      if (dropdown) dropdown.innerHTML = '';
    }
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isLoggedIn()) {
        closeAllHeaderDropdowns('header-account-dropdown');
        dropdown.classList.toggle('open');
        const logoutBtn = document.getElementById('hd-logout-btn');
        if (logoutBtn) logoutBtn.onclick = () => {
          setLoggedIn(false); refreshAccountButton(); dropdown.classList.remove('open');
          showToast(currentLang === 'en' ? 'Signed out' : 'تم تسجيل الخروج', 'info');
          document.dispatchEvent(new CustomEvent('sh:authchange', { detail: { loggedIn: false } }));
          window.setTimeout(() => window.location.replace('/login'), 250);
        };
      } else {
        requireLogin(() => {});
      }
    };
  });
}

/* الشعار هو رابط العودة الوحيد للرئيسية؛ لا حاجة إلى أيقونة رئيسية إضافية. */
function makeServiceBrandClickable() {
  document.querySelectorAll('.site-header .logo-group').forEach(group => {
    if (group.querySelector('.service-brand-home')) return;
    const mark = group.querySelector('.logo-mark');
    const word = group.querySelector('.logo-word');
    if (!mark || !word) return;
    const link = document.createElement('a');
    link.className = 'service-brand-home';
    link.href = '/#direct-access';
    link.setAttribute('aria-label', currentLang === 'en' ? 'Back to direct access' : 'العودة إلى الدخول المباشر');
    group.insertBefore(link, mark);
    link.append(mark, word);
  });
}

function standardizeServiceHeader() {
  document.querySelectorAll('.site-header').forEach(header => {
    const home = header.querySelector('.header-svc-btn');
    if (home) {
      home.remove();
    }
  });
}

/* ---------------- بوابة تسجيل الدخول قبل بدء أي طلب ---------------- */
let pendingLoginAction = null;
let pendingLoginCancel = null;
let loginReturnFocus = null;
function buildLoginModal() {
  if (document.getElementById('login-modal')) return;
  const el = document.createElement('div');
  el.className = 'login-modal-backdrop';
  el.id = 'login-modal';
  el.innerHTML = `
    <div class="login-modal-box" role="dialog" aria-modal="true" aria-labelledby="lm-title" aria-describedby="lm-desc">
      <div class="lm-ic" aria-hidden="true">🔒</div>
      <h3 id="lm-title">سجّل الدخول للمتابعة</h3>
      <p id="lm-desc">لبدء تقديم الطلب، يجب تسجيل الدخول إلى حسابك أولاً. سنجلب بياناتك المسجّلة تلقائياً.</p>
      <div class="lm-status" id="lm-status" aria-live="polite"></div>
      <div class="lm-actions">
        <button class="btn-gold" id="lm-login-btn" type="button" style="justify-content:center;"><span class="btn-spinner" aria-hidden="true"></span><span class="btn-label">تسجيل الدخول الآن</span></button>
        <button class="btn-ghost" type="button" id="lm-cancel-btn">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => { if (e.target === el) cancelLoginModal(); });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancelLoginModal();
    if (e.key === 'Tab') { /* حصر التركيز داخل النافذة */
      const f = [...el.querySelectorAll('button:not([disabled])')];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.getElementById('lm-cancel-btn').addEventListener('click', cancelLoginModal);
  document.getElementById('lm-login-btn').addEventListener('click', async () => {
    const btn = document.getElementById('lm-login-btn');
    const status = document.getElementById('lm-status');
    if (btn.classList.contains('is-loading')) return;
    btn.classList.add('is-loading'); btn.disabled = true;
    btn.querySelector('.btn-label').textContent = currentLang === 'en' ? 'Verifying your identity…' : 'جارٍ التحقق من هويتك…';
    status.className = 'lm-status'; status.textContent = '';
    try {
      const user = await AuthAPI.login();
      setLoggedIn(true);
      refreshAccountButton();
      status.className = 'lm-status ok';
      status.textContent = currentLang === 'en' ? `✓ Welcome ${user.name.split(' ')[0]}, you are signed in` : '✓ مرحباً ' + user.name.split(' ')[0] + '، تم تسجيل الدخول';
      btn.querySelector('.btn-label').textContent = currentLang === 'en' ? 'Done' : 'تم';
      document.dispatchEvent(new CustomEvent('sh:authchange', { detail: { loggedIn: true } }));
      setTimeout(() => {
        const action = pendingLoginAction;
        closeLoginModal();
        if (action) action();
      }, 520);
    } catch (_) {
      status.className = 'lm-status err';
      status.textContent = currentLang === 'en' ? 'Sign-in failed. Check your connection and try again.' : 'تعذّر تسجيل الدخول. تحقق من الاتصال وحاول مجدداً.';
      btn.classList.remove('is-loading'); btn.disabled = false;
      btn.querySelector('.btn-label').textContent = currentLang === 'en' ? 'Try again' : 'إعادة المحاولة';
    }
  });
}
function updateLoginModalLanguage() {
  const modal = document.getElementById('login-modal');
  if (!modal) return;
  modal.querySelector('#lm-title').textContent = currentLang === 'en' ? 'Sign in to continue' : 'سجّل الدخول للمتابعة';
  modal.querySelector('#lm-desc').textContent = currentLang === 'en'
    ? 'To start your application, sign in first. We will automatically retrieve your saved details.'
    : 'لبدء تقديم الطلب، يجب تسجيل الدخول إلى حسابك أولاً. سنجلب بياناتك المسجّلة تلقائياً.';
  modal.querySelector('#lm-cancel-btn').textContent = currentLang === 'en' ? 'Cancel' : 'إلغاء';
  const button = modal.querySelector('#lm-login-btn .btn-label');
  if (button && !modal.querySelector('#lm-login-btn').classList.contains('is-loading')) button.textContent = currentLang === 'en' ? 'Sign in now' : 'تسجيل الدخول الآن';
}
function closeLoginModal() {
  const m = document.getElementById('login-modal');
  m?.classList.remove('show');
  pendingLoginAction = null;
  pendingLoginCancel = null;
  if (loginReturnFocus && document.contains(loginReturnFocus)) loginReturnFocus.focus({ preventScroll: true });
}
function cancelLoginModal() {
  const btn = document.getElementById('lm-login-btn');
  if (btn?.classList.contains('is-loading')) return;
  const onCancel = pendingLoginCancel;
  closeLoginModal();
  if (onCancel) onCancel();
}
function requireLogin(action, opts = {}) {
  if (isLoggedIn()) { action(); return; }
  buildLoginModal();
  updateLoginModalLanguage();
  pendingLoginAction = action;
  pendingLoginCancel = opts.onCancel || null;
  loginReturnFocus = document.activeElement;
  const btn = document.getElementById('lm-login-btn');
  btn.classList.remove('is-loading'); btn.disabled = false;
  btn.querySelector('.btn-label').textContent = currentLang === 'en' ? 'Sign in now' : 'تسجيل الدخول الآن';
  const status = document.getElementById('lm-status');
  status.className = 'lm-status'; status.textContent = '';
  const m = document.getElementById('login-modal');
  m.classList.add('show');
  setTimeout(() => btn.focus({ preventScroll: true }), 60);
}

/* يبدأ طلباً جديداً لخدمة معيّنة ويأخذ المستخدم للخطوة الأولى (بيانات المواطن) */
function startServiceRequest(id) {
  const svc = SERVICE_CATALOG[id];
  if (!svc) return;
  requireLogin(() => {
    const s = loadState();
    s.serviceId = id; s.parcel = ''; s.type = svc.requestType; s.desc = '';
    s.docs = {}; s.ack = false; s.signed = false; s.requestNumber = ''; s.submittedAt = ''; s.citizen = null;
    saveState(s);
    navigateWithTransition('citizen-data.html', 'down');
  });
}

/* زر "ابدأ الطلب" في بطاقات دليل الخدمات: يتحقق من تسجيل الدخول قبل الانتقال المباشر لتقديم الطلب */
function wireStartButtons() {
  document.querySelectorAll('.svc-start').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('[data-service]');
      startServiceRequest(card?.dataset.service);
    });
  });
}

/* ---------------- عرض الجوال / الكمبيوتر ---------------- */
function applyDeviceView(on) {
  document.body.classList.toggle('mobile-mode', on);
  const btn = document.getElementById('header-device-btn');
  if (btn) btn.textContent = on ? '💻' : '📱';
  try { localStorage.setItem('sh_device', on ? 'mobile' : 'desktop'); } catch (_) {}
  window.dispatchEvent(new Event('resize'));
}
function toggleDeviceView() { applyDeviceView(!document.body.classList.contains('mobile-mode')); }

/* ---------------- الهيدر التفاعلي مع التمرير ----------------
   بدون scroll listener: IntersectionObserver يراقب عنصراً صغيراً في أعلى الصفحة،
   وعند تجاوزه يُضاف body.is-scrolled فيتحول الهيدر لشكل مضغوط زجاجي عبر CSS transitions. */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  document.body.prepend(sentinel);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }
  const setH = () => document.documentElement.style.setProperty('--hdr-h', header.offsetHeight + 'px');
  setH();
  if ('ResizeObserver' in window) new ResizeObserver(setH).observe(header);
}

/* انتقال مباشر بين صفحات الخدمات بدون شاشة أو مؤثر وسيط. */
function navigateWithTransition(href, dir, chapterText, lineText) {
  window.location.href = href;
}

/* تشغيل مؤثر الدخول عند تحميل صفحة جديدة */
function playEntrance() {
  let dir = null;
  try { dir = sessionStorage.getItem('sh_entry_dir'); sessionStorage.removeItem('sh_entry_dir'); } catch (_) {}
  const frame = document.querySelector('.site-frame');
  document.body.classList.add('ready');
  if (!frame) return;
  frame.classList.remove('enter-right', 'enter-left', 'enter-up', 'enter-down', 'enter-plain');
  void frame.offsetWidth; /* إعادة تشغيل الأنيميشن عند الرجوع من bfcache */
  if (!dir || prefersReducedMotion()) { frame.classList.add('enter-plain'); return; }
  const cls = { right: 'enter-right', left: 'enter-left', up: 'enter-up', down: 'enter-down' }[dir] || 'enter-plain';
  frame.classList.add(cls);
}

/* ربط روابط التنقل مع انتقال مباشر. */
function initPageTransitions() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-dir]');
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; /* فتح في تبويب جديد يبقى طبيعياً */
    e.preventDefault();
    navigateWithTransition(link.getAttribute('href'), link.dataset.dir, link.dataset.chapter || '', link.dataset.line || '');
  });
  const back = document.getElementById('back-arrow-btn');
  if (back) {
    back.addEventListener('click', () => {
      /* إذا فُتحت الصفحة مباشرة (لا يوجد تاريخ) نرجع للصفحة السابقة في المسار */
      const hasHistory = window.history.length > 1;
      if (!hasHistory && back.dataset.fallback) {
        window.location.href = back.dataset.fallback;
        return;
      }
      window.history.back();
    });
  }
}

/* ---------------- تشغيل عام عند تحميل كل صفحة ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedLang = localStorage.getItem('sh_lang');
    if (savedLang) applyLang(savedLang); else applyLang(currentLang);
  } catch (_) { applyLang(currentLang); }
  try {
    const savedDevice = localStorage.getItem('sh_device');
    if (savedDevice === 'mobile') applyDeviceView(true);
  } catch (_) {}
  document.getElementById('header-lang-btn')?.addEventListener('click', toggleLanguage);
  document.getElementById('header-device-btn')?.addEventListener('click', toggleDeviceView);
  buildHeaderExtras();
  makeServiceBrandClickable();
  standardizeServiceHeader();
  applyLang(currentLang);
  wireStartButtons();
  initPageTransitions();
  initHeaderScroll();
  playEntrance();
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    playEntrance();
  }
});
