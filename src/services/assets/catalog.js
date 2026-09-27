/* Use the existing language and request state shared with the service steps. */
(() => {
  const copy = {
    skip: { ar: 'انتقل إلى الخدمات', en: 'Skip to services' },
    login: { ar: 'تسجيل الدخول', en: 'Sign in' },
    title: { ar: 'دليل الخدمات', en: 'Services Guide' },
    subtitle: { ar: 'كل خدمات المدينة في مكان واحد', en: 'All city services in one place' },
    available: { ar: 'الخدمات المتاحة', en: 'Available services' },
    intro: { ar: 'اختر الخدمة المناسبة لاحتياجاتك وابدأ طلبك إلكترونياً', en: 'Choose the service you need and start your application online' },
    services: { ar: 'خدمات', en: 'services' },
    fees: { ar: 'الرسوم', en: 'Fees' },
    duration: { ar: 'المدة', en: 'Duration' },
    start: { ar: 'ابدأ الطلب', en: 'Start application' },
  };
  const descriptions = {
    'planning-res': { ar: 'موافقة تخطيطية أولية لإنشاء مبنى سكني جديد ضمن قطعة الأرض.', en: 'Initial planning approval to build a new home on your land.' },
    'realestate-reg': { ar: 'نقل وتسجيل ملكية قطعة أرض أو وحدة باسم المالك الجديد.', en: 'Transfer and register a plot or property in the new owner’s name.' },
    'business-lic': { ar: 'إصدار أو تجديد رخصة مزاولة نشاط تجاري داخل حدود المدينة.', en: 'Issue or renew a licence to operate a business within the city.' },
    'permits-work': { ar: 'استخراج تصريح عمل لفترة محددة لأصحاب الأعمال داخل المدينة.', en: 'Apply for a temporary work permit for business owners in the city.' },
  };
  const englishTitles = {
    'planning-res': 'Planning approval – residential',
    'realestate-reg': 'Property ownership registration',
    'business-lic': 'Business activity licence',
    'permits-work': 'Temporary work permit',
  };

  function renderLanguage(lang) {
    const language = lang === 'en' ? 'en' : 'ar';
    document.querySelectorAll('[data-copy]').forEach(el => {
      el.textContent = copy[el.dataset.copy][language];
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    const homeLabel = language === 'ar' ? 'الرئيسية' : 'Home';
    const home = document.querySelector('.catalog-home');
    home.setAttribute('aria-label', homeLabel);
    home.title = homeLabel;
    document.querySelector('.header-brand').setAttribute('aria-label', language === 'ar' ? 'مدينة السلطان هيثم — الرئيسية' : 'Sultan Haitham City — Home');
    document.querySelector('[data-nav-label]').setAttribute('aria-label', language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation');
    document.title = language === 'ar' ? 'دليل الخدمات — مدينة السلطان هيثم' : 'Services Guide — Sultan Haitham City';
    document.querySelectorAll('.catalog-card').forEach(card => {
      const id = card.dataset.service;
      const service = SERVICE_CATALOG[id];
      const title = language === 'ar' ? service.title.replace('—', '–') : englishTitles[id];
      card.querySelector('[data-service-title]').textContent = title;
      card.querySelector('[data-service-description]').textContent = descriptions[id][language];
      card.querySelector('[data-service-days]').textContent = language === 'ar' ? service.days : `${parseInt(service.days, 10)} days`;
      card.querySelector('[data-service-fee]').textContent = language === 'ar' ? service.fee : `OMR ${parseInt(service.fee, 10)}`;
      card.querySelector('.catalog-start').setAttribute('aria-label', `${copy.start[language]}: ${title}`);
    });
  }

  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => applyLang(button.dataset.language));
  });
  document.querySelectorAll('.catalog-detail-link').forEach(link => {
    link.addEventListener('click', () => {
      const state = loadState();
      state.serviceId = link.closest('[data-service]').dataset.service;
      saveState(state);
    });
  });
  document.addEventListener('sh:langchange', event => renderLanguage(event.detail.lang));
  renderLanguage(document.documentElement.lang);
})();
