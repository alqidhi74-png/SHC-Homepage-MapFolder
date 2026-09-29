(() => {
  const AUTH_KEY = 'sh_site_logged_in_v2';
  const PROFILE_KEY = 'sh_site_profile_v2';
  const ADMIN_KEY = 'shc.demo-admin.session';
  const script = document.currentScript;
  const assets = script?.dataset.assets || '/assets/';

  const authenticated = (() => {
    try { return localStorage.getItem(AUTH_KEY) === '1'; } catch (_) { return false; }
  })();

  const profile = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return {
        name: String(value?.name || 'المستخدم'),
        role: value?.role === 'admin' ? 'admin' : 'citizen',
      };
    } catch (_) {
      return { name: 'المستخدم', role: 'citizen' };
    }
  })();

  const icon = (name) => {
    if (name === 'logout') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5"/></svg>';
    if (name === 'chevron') return '<svg class="shc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
    if (name === 'home') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/></svg>';
    return '<svg class="shc-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0115 0"/></svg>';
  };

  const header = document.createElement('header');
  header.className = 'shc-portal-header';
  header.setAttribute('aria-label', 'أدوات الحساب واللغة');
  header.innerHTML = `
    <div class="shc-portal-account">
      <button class="shc-portal-account-button" type="button" aria-label="${authenticated ? 'فتح قائمة الحساب' : 'تسجيل الدخول'}" aria-haspopup="menu" aria-expanded="false">
        ${icon('user')}${authenticated ? icon('chevron') : ''}
      </button>
      <div class="shc-portal-account-menu" role="menu">
        <div class="shc-portal-identity">
          <span class="shc-portal-avatar" aria-hidden="true"></span>
          <span class="shc-portal-person"><strong></strong><small>${profile.role === 'admin' ? 'حساب إداري' : 'حساب مواطن'}</small></span>
        </div>
        <a class="shc-portal-home" href="/" role="menuitem" aria-label="الصفحة الرئيسية" title="الصفحة الرئيسية">${icon('home')}</a>
        <button class="shc-portal-logout" type="button" role="menuitem">${icon('logout')}<span>تسجيل الخروج</span></button>
      </div>
    </div>
    <div class="shc-portal-brand" aria-label="مدينة السلطان هيثم">
      <img src="${assets}logo.png" alt="">
      <img src="${assets}city-name.png" alt="مدينة السلطان هيثم">
    </div>
    <div class="shc-portal-language" role="group" aria-label="اختيار اللغة">
      <button type="button" data-shc-lang="ar" aria-pressed="true">العربية</button><span>/</span><button type="button" data-shc-lang="en" lang="en" aria-pressed="false">English</button>
    </div>`;

  const existing = document.querySelector('.site-header');
  if (existing) {
    existing.replaceWith(header);
  } else {
    document.body.prepend(header);
    document.body.classList.add('shc-project-page');
  }

  let projectBackLabel = null;
  if (/\/projects\/al-wadi\/(?:index\.html)?$/i.test(location.pathname)) {
    const projectBack = document.createElement('a');
    projectBack.className = 'shc-project-back';
    projectBack.href = 'UPDATE.html';
    projectBack.setAttribute('aria-label', 'العودة للعقارات');
    projectBack.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span></span>';
    projectBackLabel = projectBack.querySelector('span');
    header.insertAdjacentElement('afterend', projectBack);
  }

  const avatar = header.querySelector('.shc-portal-avatar');
  const name = header.querySelector('.shc-portal-person strong');
  avatar.textContent = profile.name.trim().charAt(0) || 'م';
  name.textContent = profile.name;

  const accountButton = header.querySelector('.shc-portal-account-button');
  const accountMenu = header.querySelector('.shc-portal-account-menu');
  accountButton.addEventListener('click', () => {
    if (!authenticated) {
      const returnTo = location.pathname + location.search + location.hash;
      location.assign('/login?returnTo=' + encodeURIComponent(returnTo));
      return;
    }
    const open = accountMenu.classList.toggle('is-open');
    accountButton.setAttribute('aria-expanded', String(open));
  });

  header.querySelector('.shc-portal-logout').addEventListener('click', () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ADMIN_KEY);
      sessionStorage.removeItem(ADMIN_KEY);
    } catch (_) {}
    location.replace('/');
  });

  document.addEventListener('pointerdown', (event) => {
    if (!header.querySelector('.shc-portal-account')?.contains(event.target)) {
      accountMenu.classList.remove('is-open');
      accountButton.setAttribute('aria-expanded', 'false');
    }
  });

  const setLanguageState = (lang) => {
    header.querySelectorAll('[data-shc-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.shcLang === lang));
    });
    if (projectBackLabel) {
      const label = lang === 'en' ? 'Back to properties' : 'العودة للعقارات';
      projectBackLabel.textContent = label;
      projectBackLabel.parentElement.setAttribute('aria-label', label);
    }
  };

  header.querySelectorAll('[data-shc-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.shcLang;
      if (typeof window.applyLang === 'function') {
        window.applyLang(lang);
      } else {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        try { localStorage.setItem('sh_lang', lang); } catch (_) {}
      }
      setLanguageState(lang);
    });
  });

  let initialLanguage = document.documentElement.lang === 'en' ? 'en' : 'ar';
  try { initialLanguage = localStorage.getItem('sh_lang') || initialLanguage; } catch (_) {}
  setLanguageState(initialLanguage);
})();
