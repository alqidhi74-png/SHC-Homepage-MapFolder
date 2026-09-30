(() => {
  const AUTH_KEY = 'sh_site_logged_in_v2';
  const PROFILE_KEY = 'sh_site_profile_v2';
  const ADMIN_KEY = 'shc.demo-admin.session';
  const script = document.currentScript;
  const assets = script?.dataset.assets || '/assets/';

  if (script?.src && !document.querySelector('script[data-shc-login-transition]')) {
    const transition = document.createElement('script');
    transition.src = new URL('login-transition.js', script.src).href;
    transition.dataset.shcLoginTransition = '';
    document.head.appendChild(transition);
  }

  if (script?.src && !document.querySelector('script[data-shc-chatbot-loader]')) {
    const chatbot = document.createElement('script');
    chatbot.src = new URL('chatbot.js', script.src).href;
    chatbot.defer = true;
    chatbot.dataset.shcChatbotLoader = '';
    document.head.appendChild(chatbot);
  }

  const authenticated = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return localStorage.getItem(AUTH_KEY) === '1' && value?.role === 'citizen';
    } catch (_) { return false; }
  })();

  const profile = (() => {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return {
        name: String(value?.name || 'المستخدم'),
        role: 'citizen',
      };
    } catch (_) {
      return { name: 'المستخدم', role: 'citizen' };
    }
  })();

  const icon = (name) => {
    if (name === 'logout') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 012 2v14a2 2 0 01-2 2h-5"/></svg>';
    if (name === 'chevron') return '<svg class="shc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
    if (name === 'back') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
    return '<svg class="shc-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0115 0"/></svg>';
  };

  const backHref = '/#direct-access';

  const header = document.createElement('header');
  header.className = 'shc-portal-header';
  header.setAttribute('aria-label', 'أدوات الحساب واللغة');
  header.innerHTML = `
    <div class="shc-portal-account-actions">
      <a class="shc-portal-home" href="${backHref}" aria-label="رجوع" title="رجوع">${icon('back')}</a>
      <div class="shc-portal-account">
        <button class="shc-portal-account-button" type="button" aria-label="${authenticated ? 'فتح قائمة الحساب' : 'تسجيل الدخول'}" aria-haspopup="menu" aria-expanded="false">
          ${icon('user')}${authenticated ? icon('chevron') : ''}
        </button>
        <div class="shc-portal-account-menu" role="menu">
          <div class="shc-portal-identity">
            <span class="shc-portal-avatar" aria-hidden="true"></span>
            <span class="shc-portal-person"><strong></strong><small>${profile.role === 'admin' ? 'حساب إداري' : 'حساب مواطن'}</small></span>
          </div>
          <button class="shc-portal-logout" type="button" role="menuitem">${icon('logout')}<span>تسجيل الخروج</span></button>
        </div>
      </div>
    </div>
    <div class="shc-portal-brand" aria-label="مدينة السلطان هيثم">
      <img src="${assets}logo.png" alt="">
      <img src="${assets}city-name.png" alt="مدينة السلطان هيثم">
    </div>
    <div class="shc-portal-language" role="group" aria-label="اختيار اللغة">
      <button type="button" data-shc-lang="ar" aria-pressed="true">Ar</button><span>/</span><button type="button" data-shc-lang="en" lang="en" aria-pressed="false">En</button>
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
  const localizedProfileName = (lang) => {
    if (lang !== 'en') return profile.name;
    const names = {
      'سالم الحارثي': 'Salim Al Harthi',
      'سالم بن سعيد الحارثي': 'Salim bin Saeed Al Harthi',
      'إسراء الوهيبية': 'Esraa Al Wahibiya',
      'المستخدم': 'User',
    };
    return names[profile.name] || profile.name;
  };

  const accountButton = header.querySelector('.shc-portal-account-button');
  const accountMenu = header.querySelector('.shc-portal-account-menu');
  accountButton.addEventListener('click', () => {
    if (!authenticated) {
      const returnTo = location.pathname + location.search + location.hash;
      const target = '/login?returnTo=' + encodeURIComponent(returnTo);
      if (window.shcNavigateToLogin) window.shcNavigateToLogin(target);
      else {
        const fallback = window.setTimeout(() => location.assign(target), 900);
        window.addEventListener('shc:login-transition-ready', () => {
          window.clearTimeout(fallback);
          window.shcNavigateToLogin(target);
        }, { once: true });
      }
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
    const directBack = header.querySelector('.shc-portal-home');
    const directBackLabel = lang === 'en' ? 'Back' : 'رجوع';
    directBack.setAttribute('aria-label', directBackLabel);
    directBack.title = directBackLabel;
    header.setAttribute('aria-label', lang === 'en' ? 'Account and language tools' : 'أدوات الحساب واللغة');
    accountButton.setAttribute('aria-label', authenticated
      ? (lang === 'en' ? 'Open account menu' : 'فتح قائمة الحساب')
      : (lang === 'en' ? 'Sign in' : 'تسجيل الدخول'));
    header.querySelector('.shc-portal-person small').textContent = profile.role === 'admin'
      ? (lang === 'en' ? 'Administrator account' : 'حساب إداري')
      : (lang === 'en' ? 'Citizen account' : 'حساب مواطن');
    header.querySelector('.shc-portal-logout span').textContent = lang === 'en' ? 'Sign out' : 'تسجيل الخروج';
    const displayName = localizedProfileName(lang);
    name.textContent = displayName;
    avatar.textContent = displayName.trim().charAt(0) || (lang === 'en' ? 'U' : 'م');
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
