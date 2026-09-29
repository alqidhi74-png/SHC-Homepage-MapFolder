/* Sultan Haitham City frontend-only demo assistant. */
(() => {
  if (window.__SHC_CHATBOT_LOADED__) return;
  window.__SHC_CHATBOT_LOADED__ = true;

  const copy = {
    ar: {
      name: 'مساعد المدينة',
      subtitle: 'مدينة السلطان هيثم',
      open: 'فتح مساعد المدينة',
      close: 'إغلاق المحادثة',
      greeting: 'مرحباً، أنا مساعد مدينة السلطان هيثم. اسألني عن المدينة أو الموقع أو الخدمات والخرائط والعقارات.',
      placeholder: 'اكتب سؤالك عن المدينة…',
      send: 'إرسال',
      thinking: 'مساعد المدينة يكتب…',
      empty: 'الرجاء كتابة سؤال أولاً.',
      duplicate: 'تم إرسال هذا السؤال للتو.',
      user: 'أنت',
      assistant: 'مساعد المدينة',
    },
    en: {
      name: 'City Assistant',
      subtitle: 'Sultan Haitham City',
      open: 'Open City Assistant',
      close: 'Close chat',
      greeting: 'Hello. I am the Sultan Haitham City assistant. Ask me about the city, this website, services, maps, or properties.',
      placeholder: 'Ask about the city…',
      send: 'Send',
      thinking: 'City Assistant is typing…',
      empty: 'Please enter a question first.',
      duplicate: 'That question was just sent.',
      user: 'You',
      assistant: 'City Assistant',
    },
  };

  const responseSets = {
    ar: {
      greeting: [
        'مرحباً! يمكنني مساعدتك في استكشاف مدينة السلطان هيثم، الخرائط، المشاريع، العقارات، الخدمات والمرافق.',
        'هلا بك! اسألني عن مدينة السلطان هيثم أو اختر ما تريد الوصول إليه مثل الخريطة أو المشاريع أو الخدمات.',
        'أهلاً بك في مساعد المدينة. كيف أساعدك في استكشاف مدينة السلطان هيثم اليوم؟',
      ],
      city: [
        'مدينة السلطان هيثم وجهة عمرانية متكاملة في مسقط، وتعرض هذه التجربة أحياءها ومرافقها ومشاريعها وخدماتها الرقمية.',
        'يمكنك هنا التعرف على مدينة السلطان هيثم واستكشاف أحيائها السكنية ومرافقها ومشاريعها عبر الخريطة التفاعلية.',
      ],
      location: [
        'تقع مدينة السلطان هيثم في مسقط. افتح الخريطة التفاعلية لاستكشاف موقع المدينة وأحيائها ومرافقها.',
        'يمكنك مشاهدة موقع مدينة السلطان هيثم وتفاصيل أحيائها مباشرة على الخريطة ثنائية الأبعاد.',
      ],
      map: [
        'الخريطة التفاعلية تعرض الأحياء والمشاريع والمرافق في تجربة مكانية مترابطة.',
        'يمكنني نقلك إلى الخريطة لاستكشاف المدينة والمرافق والمناطق السكنية.',
      ],
      map2d: [
        'افتح الخريطة ثنائية الأبعاد لتصفح الأحياء والمرافق واختيار المواقع على الخريطة.',
        'الخريطة ثنائية الأبعاد جاهزة وتوفر عرضاً تفاعلياً لمعالم المدينة.',
      ],
      map3d: [
        'يمكنك استكشاف المدينة والمباني من خلال تجربة المدينة ثلاثية الأبعاد.',
        'العرض ثلاثي الأبعاد يتيح لك التجول بصرياً داخل مخطط مدينة السلطان هيثم.',
      ],
      districts: [
        'تعرض الخريطة الأحياء السكنية وحدودها والمرافق المتصلة بها. افتحها لاستكشاف كل حي.',
        'يمكنك استعراض الأحياء والمناطق السكنية من خلال الخريطة التفاعلية للمدينة.',
      ],
      properties: [
        'يمكنك تصفح العقارات والوحدات المتاحة من بوابة المشاريع والعقارات.',
        'انتقل إلى المشاريع والعقارات لاستكشاف الوحدات وتفاصيلها داخل المدينة.',
      ],
      projects: [
        'تجمع صفحة المشاريع والعقارات المشاريع المتاحة وتفاصيل الوحدات والمواقع.',
        'يمكنك استكشاف مشاريع مدينة السلطان هيثم وربطها بموقعها داخل المدينة.',
      ],
      services: [
        'بوابة الخدمات الإلكترونية تتيح بدء الطلبات ومراجعة البيانات والمستندات ومتابعة المعاملات.',
        'انتقل إلى الخدمات الرقمية لاختيار الخدمة المناسبة وبدء الطلب.',
      ],
      status: [
        'يمكنك متابعة حالة الطلب باستخدام رقم الطلب في صفحة التتبع.',
        'افتح تتبع الطلب للاطلاع على الحالة ومسار المعالجة حتى الاعتماد.',
      ],
      schools: ['تظهر المرافق التعليمية ضمن خريطة المدينة. افتح الخريطة لاستكشاف المدارس القريبة من الأحياء.'],
      mosques: ['يمكنك استكشاف المساجد ومواقعها ضمن الأحياء من خلال الخريطة التفاعلية.'],
      parks: ['تعرض التجربة المساحات الخضراء والحدائق داخل المدينة. افتح الخريطة لاستكشافها.'],
      health: ['يمكنك استكشاف المرافق الصحية القريبة من المجتمع على خريطة المدينة.'],
      commercial: ['تعرض الخريطة المراكز والمرافق التجارية القريبة من الأحياء.'],
      roads: ['يمكنك استكشاف شبكة الطرق الرئيسية ومواقع الأحياء والمرافق على الخريطة ثنائية الأبعاد.'],
      facilities: [
        'تشمل تجربة الموقع مرافق التعليم والصحة والمساجد والحدائق والمراكز التجارية داخل أحياء المدينة.',
        'افتح الخريطة التفاعلية لاستكشاف مرافق المدينة حسب مواقعها.',
      ],
      smart: [
        'تجمع التجربة الرقمية بين الخريطة ثنائية وثلاثية الأبعاد والمشاريع والعقارات والخدمات الإلكترونية.',
        'يوفر الموقع وصولاً مترابطاً إلى بيانات المدينة المكانية والمشاريع والخدمات الرقمية.',
      ],
      stats: ['يعرض الموقع مساحة إجمالية قدرها 14.8 كم²، وأكثر من 12,000 وحدة سكنية، وأكثر من 60,000 من السكان المتوقعين، و40% مساحات خضراء.'],
      help: [
        'يمكنني مساعدتك في استكشاف المدينة، الخريطة التفاعلية، المشاريع، العقارات، الخدمات والمرافق.',
        'اسألني عن الخريطة ثنائية أو ثلاثية الأبعاد، الأحياء، المدارس، المساجد، الحدائق، العقارات أو حالة الطلب.',
      ],
      fallback: [
        'هذا النموذج التجريبي يجيب عن مدينة السلطان هيثم ومحتوى الموقع فقط. جرّب السؤال عن الخريطة أو المشاريع أو الخدمات أو المرافق.',
        'لم أفهم الطلب ضمن معلومات الموقع. يمكنني مساعدتك في الخرائط والأحياء والمشاريع والعقارات والخدمات والمرافق.',
      ],
    },
    en: {
      greeting: [
        'Hello! I can help you explore Sultan Haitham City, maps, projects, properties, services and facilities.',
        'Welcome! Ask about Sultan Haitham City or choose where you want to go, such as the map, projects or services.',
        'Hi! How can I help you explore Sultan Haitham City today?',
      ],
      city: [
        'Sultan Haitham City is an integrated urban destination in Muscat. This experience presents its districts, facilities, projects and digital services.',
        'You can explore Sultan Haitham City, its residential districts, facilities and projects through the interactive map.',
      ],
      location: [
        'Sultan Haitham City is in Muscat. Open the interactive map to explore the city, its districts and facilities.',
        'You can view Sultan Haitham City and its districts directly on the 2D map.',
      ],
      map: [
        'The interactive map connects districts, projects and facilities in one spatial experience.',
        'I can take you to the map to explore the city, its facilities and residential areas.',
      ],
      map2d: [
        'Open the 2D map to browse districts and facilities and select locations on the map.',
        'The 2D map provides an interactive view of the city and its destinations.',
      ],
      map3d: [
        'You can explore the city and its buildings through the 3D City experience.',
        'The 3D view lets you visually explore Sultan Haitham City and its buildings.',
      ],
      districts: [
        'The map presents residential districts, their boundaries and connected facilities.',
        'You can browse neighborhoods and residential areas on the interactive city map.',
      ],
      properties: [
        'Browse properties and available units through the Projects and Properties portal.',
        'Open Projects and Properties to explore units and their details within the city.',
      ],
      projects: [
        'The Projects and Properties page brings together available projects, unit details and locations.',
        'You can explore Sultan Haitham City projects and connect them to their city locations.',
      ],
      services: [
        'Digital Services lets you start requests, review details and documents, and follow transactions.',
        'Open Digital Services to choose a service and begin a request.',
      ],
      status: [
        'You can check an application using its request number on the tracking page.',
        'Open Request Tracking to view the current status and processing journey.',
      ],
      schools: ['Educational facilities appear on the city map. Open it to explore schools near residential districts.'],
      mosques: ['You can explore mosques and their locations within the districts on the interactive map.'],
      parks: ['The experience presents parks and green spaces across the city. Open the map to explore them.'],
      health: ['You can explore healthcare facilities close to the community on the city map.'],
      commercial: ['The map presents shopping destinations and commercial facilities near the districts.'],
      roads: ['Explore main roads, districts and facility locations on the 2D map.'],
      facilities: [
        'The website covers education, healthcare, mosques, parks and commercial facilities across the city.',
        'Open the interactive map to explore city facilities by location.',
      ],
      smart: [
        'The digital experience connects 2D and 3D maps with projects, properties and digital services.',
        'The website provides connected access to spatial city information, projects and digital services.',
      ],
      stats: ['The website presents a total area of 14.8 km², more than 12,000 residential units, more than 60,000 expected residents, and 40% green spaces.'],
      help: [
        'I can help you explore the city, interactive map, projects, properties, services and facilities.',
        'Ask about the 2D or 3D map, districts, schools, mosques, parks, properties or request status.',
      ],
      fallback: [
        'This demo assistant only covers Sultan Haitham City and this website. Try asking about maps, projects, services or facilities.',
        'I could not match that to the website information. I can help with maps, districts, projects, properties, services and facilities.',
      ],
    },
  };

  const responseIndex = new Map();

  const routes = () => {
    const sourceMode = /\/src\//i.test(location.pathname)
      || Boolean(document.querySelector('script[src*="/@vite/client"]'));
    const prefix = sourceMode ? '/src' : '';
    return {
      map2d: `${prefix}/Map/map.html`,
      map3d: `${prefix}/Map/city3d.html`,
      projects: `${prefix}/projects/al-wadi/UPDATE.html`,
      services: sourceMode ? '/src/services/services-catalog.html' : '/Services/services-catalog.html',
      tracking: sourceMode ? '/src/services/request-tracking.html' : '/Services/request-tracking.html',
    };
  };

  const normalize = (value) => String(value)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');

  const has = (text, terms) => terms.some((term) => text.includes(normalize(term)));

  const intentFor = (message) => {
    const text = normalize(message);
    if (/^(مرحبا|السلام عليكم|هلا|اهلا|hi|hello|hey)[\s!?.,،؟]*$/i.test(text)) return 'greeting';
    if (has(text, ['3d', 'ثلاثية الأبعاد', 'ثلاثي الابعاد', 'three dimensional', '3d map', '3d city'])) return 'map3d';
    if (has(text, ['2d', 'ثنائية الأبعاد', 'ثنائي الابعاد', '2d map'])) return 'map2d';
    if (has(text, ['حالة الطلب', 'تتبع', 'متابعة الطلب', 'رقم الطلب', 'request status', 'track request', 'tracking', 'application status'])) return 'status';
    if (has(text, ['مدرسة', 'مدارس', 'تعليم', 'school', 'schools', 'education'])) return 'schools';
    if (has(text, ['مسجد', 'مساجد', 'mosque', 'mosques'])) return 'mosques';
    if (has(text, ['حديقة', 'حدائق', 'مساحات خضراء', 'مساحه خضراء', 'park', 'parks', 'green space'])) return 'parks';
    if (has(text, ['صحة', 'صحه', 'مستشفى', 'مرفق صحي', 'health', 'hospital', 'clinic'])) return 'health';
    if (has(text, ['تجاري', 'تسوق', 'محلات', 'مركز تجاري', 'commercial', 'shopping', 'shops'])) return 'commercial';
    if (has(text, ['طرق', 'شارع', 'شوارع', 'road', 'roads', 'street'])) return 'roads';
    if (has(text, ['عقار', 'عقارات', 'وحدة', 'وحدات', 'property', 'properties', 'unit', 'housing'])) return 'properties';
    if (has(text, ['مشروع', 'مشاريع', 'project', 'projects'])) return 'projects';
    if (has(text, ['خدمة', 'خدمات', 'طلب خدمة', 'service', 'services', 'citizen service'])) return 'services';
    if (has(text, ['حي', 'أحياء', 'احياء', 'منطقة سكنية', 'سكني', 'district', 'districts', 'neighborhood', 'residential area'])) return 'districts';
    if (has(text, ['مرفق', 'مرافق', 'facility', 'facilities'])) return 'facilities';
    if (has(text, ['خريطة', 'الخريطة', 'افتح الخريطه', 'map', 'interactive map'])) return 'map';
    if (has(text, ['أين', 'اين', 'موقع المدينة', 'وين', 'location', 'where'])) return 'location';
    if (has(text, ['المساحة', 'المساحه', 'عدد السكان', 'كم وحدة', 'احصائيات', 'area', 'population', 'statistics', 'how many units'])) return 'stats';
    if (has(text, ['مدينة ذكية', 'المدينه الذكيه', 'smart city', 'digital city'])) return 'smart';
    if (has(text, ['مدينة السلطان هيثم', 'السلطان هيثم', 'عن المدينة', 'عن المدينه', 'sultan haitham city', 'about the city'])) return 'city';
    if (has(text, ['مساعدة', 'مساعده', 'ماذا تستطيع', 'help', 'what can you do'])) return 'help';
    return 'fallback';
  };

  const actions = {
    ar: {
      map: 'فتح الخريطة التفاعلية', map2d: 'فتح الخريطة 2D', map3d: 'فتح المدينة 3D',
      projects: 'فتح المشاريع والعقارات', services: 'فتح الخدمات', status: 'تتبع الطلب',
    },
    en: {
      map: 'Open interactive map', map2d: 'Open 2D map', map3d: 'Open 3D City',
      projects: 'Open projects and properties', services: 'Open services', status: 'Track request',
    },
  };

  function getMockAssistantReply(message, lang) {
    const intent = intentFor(message);
    const variants = responseSets[lang][intent] || responseSets[lang].fallback;
    const key = `${lang}:${intent}`;
    const index = responseIndex.get(key) || 0;
    responseIndex.set(key, index + 1);
    const routeMap = routes();
    const routeKey = {
      location: 'map2d', map: 'map2d', map2d: 'map2d', map3d: 'map3d', districts: 'map2d',
      schools: 'map2d', mosques: 'map2d', parks: 'map2d', health: 'map2d', commercial: 'map2d',
      roads: 'map2d', facilities: 'map2d', properties: 'projects', projects: 'projects',
      services: 'services', status: 'tracking',
    }[intent];
    const labelKey = routeKey === 'tracking' ? 'status'
      : routeKey === 'map2d' && intent === 'map' ? 'map'
        : routeKey;
    return {
      text: variants[index % variants.length],
      action: routeKey ? { label: actions[lang][labelKey], href: routeMap[routeKey] } : null,
    };
  }

  const host = document.createElement('div');
  host.id = 'shc-chatbot-root';
  host.setAttribute('data-shc-chatbot', '');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{--wine:#5b1021;--wine-deep:#330914;--gold:#e4c26b;--cream:#fffaf0;position:fixed;inset:auto 22px 22px auto;z-index:2147483000;font-family:"IBM Plex Sans Arabic",Arial,sans-serif;color:#2c171c}
      *,*::before,*::after{box-sizing:border-box}
      button,input,textarea{font:inherit}
      .launcher{display:flex;align-items:center;gap:9px;min-height:52px;padding:0 18px;border:1px solid rgba(228,194,107,.78);border-radius:999px;background:linear-gradient(135deg,var(--wine),var(--wine-deep));color:#fff6dc;box-shadow:0 14px 38px rgba(35,5,13,.34);cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
      .launcher:hover{transform:translateY(-2px);box-shadow:0 17px 44px rgba(35,5,13,.42)}
      .launcher svg{width:22px;height:22px;fill:none;stroke:var(--gold);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
      .launcher span{font-size:13px;font-weight:600;white-space:nowrap}
      .backdrop{position:fixed;inset:0;display:grid;place-items:center;padding:22px;background:rgba(12,8,10,.44);backdrop-filter:blur(5px);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility .22s ease}
      .backdrop.open{opacity:1;visibility:visible}
      .panel{display:flex;flex-direction:column;width:min(520px,calc(100vw - 32px));height:min(650px,calc(100dvh - 44px));overflow:hidden;border:1px solid rgba(228,194,107,.55);border-radius:24px;background:#fffdf8;box-shadow:0 28px 90px rgba(28,5,11,.42);transform:translateY(16px) scale(.98);transition:transform .22s ease}
      .backdrop.open .panel{transform:none}
      .head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(120deg,var(--wine-deep),var(--wine) 62%,#173b38);color:white}
      .mark{display:grid;place-items:center;width:42px;height:42px;flex:0 0 auto;border:1px solid rgba(228,194,107,.55);border-radius:50%;color:var(--gold);background:rgba(255,255,255,.07)}
      .mark svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      .title{min-width:0;flex:1}.title strong,.title small{display:block}.title strong{font-size:15px}.title small{margin-top:2px;color:rgba(255,255,255,.67);font-size:11px;font-weight:400}
      .close{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.24);border-radius:50%;background:rgba(255,255,255,.06);color:white;cursor:pointer}
      .close svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}
      .messages{flex:1;overflow:auto;padding:20px;background:linear-gradient(180deg,#fffdf8,#faf5eb);scrollbar-width:thin;overscroll-behavior:contain}
      .message{display:flex;flex-direction:column;align-items:flex-start;margin:0 0 14px}.message.user{align-items:flex-end}
      .who{margin:0 6px 5px;color:#8b7379;font-size:10px;font-weight:600}
      .bubble{max-width:86%;padding:11px 14px;border:1px solid #eadccd;border-radius:16px 16px 16px 5px;background:white;color:#3a252a;font-size:13px;line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 5px 15px rgba(73,17,29,.06)}
      .user .bubble{border-color:transparent;border-radius:16px 16px 5px 16px;background:var(--wine);color:white}
      .bubble-action{display:inline-flex;align-items:center;justify-content:center;margin-top:10px;padding:8px 13px;border:1px solid #b88734;border-radius:999px;color:var(--wine);background:#fffaf0;font-size:11px;font-weight:600;line-height:1.35;text-decoration:none;transition:background .18s ease,color .18s ease}
      .bubble-action:hover,.bubble-action:focus-visible{background:var(--wine);color:white;outline:none}
      .thinking .bubble{color:#826d72;font-style:italic}
      .form{display:flex;align-items:flex-end;gap:9px;padding:13px;border-top:1px solid #eadccd;background:white}
      .input{min-width:0;flex:1;min-height:46px;max-height:112px;padding:12px 14px;border:1px solid #dccbbc;border-radius:14px;outline:none;background:#fffdf9;color:#2f1d22;font-size:13px;resize:none;line-height:1.55}
      .input:focus{border-color:#b88734;box-shadow:0 0 0 3px rgba(228,194,107,.18)}
      .send{display:grid;place-items:center;width:46px;height:46px;flex:0 0 auto;border:0;border-radius:14px;background:var(--wine);color:#fff;cursor:pointer}
      .send:disabled{opacity:.55;cursor:wait}.send svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      :host([dir="rtl"]){inset:auto auto 22px 22px}.rtl .bubble{border-radius:16px 16px 5px 16px}.rtl .user .bubble{border-radius:16px 16px 16px 5px}
      @media(max-width:640px){:host,:host([dir="rtl"]){inset:auto 14px 14px auto}.launcher{width:52px;padding:0;justify-content:center}.launcher span{display:none}.backdrop{padding:10px}.panel{width:100%;height:min(680px,calc(100dvh - 20px));border-radius:20px}.messages{padding:16px}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
    </style>
    <button class="launcher" type="button" aria-haspopup="dialog">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A8.5 8.5 0 1 1 21 12Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
      <span></span>
    </button>
    <div class="backdrop" aria-hidden="true">
      <section class="panel" role="dialog" aria-modal="true" aria-labelledby="shc-chat-title">
        <header class="head">
          <span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A8.5 8.5 0 1 1 21 12Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg></span>
          <span class="title"><strong id="shc-chat-title"></strong><small></small></span>
          <button class="close" type="button"><span class="sr"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </header>
        <div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div>
        <form class="form">
          <label class="sr" for="shc-chat-input"></label>
          <textarea class="input" id="shc-chat-input" rows="1" maxlength="1200"></textarea>
          <button class="send" type="submit"><span class="sr"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg></button>
        </form>
      </section>
    </div>`;

  const launcher = shadow.querySelector('.launcher');
  const backdrop = shadow.querySelector('.backdrop');
  const panel = shadow.querySelector('.panel');
  const closeButton = shadow.querySelector('.close');
  const messages = shadow.querySelector('.messages');
  const form = shadow.querySelector('.form');
  const input = shadow.querySelector('.input');
  const send = shadow.querySelector('.send');
  let busy = false;
  let initialized = false;
  let lastSubmission = { message: '', time: 0 };

  const language = () => {
    try {
      const stored = localStorage.getItem('sh_lang');
      if (stored === 'en' || stored === 'ar') return stored;
    } catch (_) {}
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  };

  const addMessage = (role, text, extraClass = '', action = null) => {
    const lang = language();
    const item = document.createElement('div');
    item.className = `message ${role} ${extraClass}`.trim();
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = role === 'user' ? copy[lang].user : copy[lang].assistant;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    if (action?.href && action?.label) {
      const link = document.createElement('a');
      link.className = 'bubble-action';
      link.href = action.href;
      link.textContent = action.label;
      bubble.append(document.createElement('br'), link);
    }
    item.append(who, bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  };

  const updateLanguage = () => {
    const lang = language();
    const text = copy[lang];
    host.dir = lang === 'ar' ? 'rtl' : 'ltr';
    panel.classList.toggle('rtl', lang === 'ar');
    launcher.setAttribute('aria-label', text.open);
    launcher.querySelector('span').textContent = text.name;
    shadow.querySelector('.title strong').textContent = text.name;
    shadow.querySelector('.title small').textContent = text.subtitle;
    closeButton.setAttribute('aria-label', text.close);
    closeButton.querySelector('.sr').textContent = text.close;
    input.placeholder = text.placeholder;
    shadow.querySelector('label[for="shc-chat-input"]').textContent = text.placeholder;
    send.setAttribute('aria-label', text.send);
    send.querySelector('.sr').textContent = text.send;
  };

  const open = () => {
    updateLanguage();
    if (!initialized) {
      initialized = true;
      addMessage('assistant', copy[language()].greeting);
    }
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.style.setProperty('--shc-chat-open', '1');
    window.setTimeout(() => input.focus(), 40);
  };

  const close = () => {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.documentElement.style.removeProperty('--shc-chat-open');
    launcher.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const message = input.value.trim();
    if (!message) {
      input.setCustomValidity(copy[language()].empty);
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }
    const now = Date.now();
    if (lastSubmission.message === message && now - lastSubmission.time < 1800) {
      input.setCustomValidity(copy[language()].duplicate);
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }
    lastSubmission = { message, time: now };
    input.value = '';
    addMessage('user', message);

    busy = true;
    send.disabled = true;
    const thinking = addMessage('assistant', copy[language()].thinking, 'thinking');
    const delay = 500 + Math.floor(Math.random() * 401);
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    const reply = getMockAssistantReply(message, language());
    thinking.remove();
    addMessage('assistant', reply.text, '', reply.action);
    busy = false;
    send.disabled = false;
    input.focus();
  });

  launcher.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('pointerdown', (event) => { if (event.target === backdrop) close(); });
  shadow.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && backdrop.classList.contains('open')) close();
    if (event.key === 'Enter' && !event.shiftKey && event.target === input) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  updateLanguage();
  new MutationObserver(updateLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
  document.addEventListener('sh:langchange', updateLanguage);
  document.body.appendChild(host);
})();
