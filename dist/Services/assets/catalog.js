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
    start: { ar: 'ابدأ الخدمات', en: 'Start Services' },
  };

  function renderLanguage(lang) {
    const language = lang === 'en' ? 'en' : 'ar';
    document.querySelectorAll('[data-copy]').forEach(el => {
      el.textContent = copy[el.dataset.copy][language];
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    const login = document.querySelector('[data-copy-label="login"]');
    if (login) {
      login.setAttribute('aria-label', copy.login[language]);
      login.title = copy.login[language];
    }
    const home = document.querySelector('.catalog-home');
    if (home) {
      const homeLabel = language === 'ar' ? 'الرئيسية' : 'Home';
      home.setAttribute('aria-label', homeLabel);
      home.title = homeLabel;
    }
    const brand = document.querySelector('.header-brand, .service-brand-home');
    if (brand) brand.setAttribute('aria-label', language === 'ar' ? 'مدينة السلطان هيثم — الرئيسية' : 'Sultan Haitham City — Home');
    const nav = document.querySelector('[data-nav-label]');
    if (nav) nav.setAttribute('aria-label', language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation');
    document.title = language === 'ar' ? 'دليل الخدمات — مدينة السلطان هيثم' : 'Services Guide — Sultan Haitham City';
    document.querySelectorAll('.catalog-card').forEach(card => {
      const id = card.dataset.service;
      const service = SERVICE_CATALOG[id];
      const localized = getServiceCopy(service, language);
      card.querySelector('[data-service-title]').textContent = localized.title.replace('—', '–');
      card.querySelector('[data-service-description]').textContent = localized.desc;
      card.querySelector('[data-service-days]').textContent = localized.days;
      card.querySelector('[data-service-fee]').textContent = localized.fee;
      card.querySelector('.catalog-start').setAttribute('aria-label', `${copy.start[language]}: ${localized.title}`);
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
