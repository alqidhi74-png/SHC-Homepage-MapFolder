/* ============================================================================
   Standalone shell — غلاف الصفحات المنفصلة
   ----------------------------------------------------------------------------
   يستبدل الموجّه (router) الخاص بالبوابة الكاملة (js/06-app.js) بغلاف صغير
   يعرض صفحة واحدة فقط: الخريطة التفاعلية أو المدينة ثلاثية الأبعاد.
   Replaces the portal's single-page router with a tiny shell that renders
   exactly one page (map or city3d). Header markup, classes, colours and
   fonts are identical to the portal.

   الروابط بين الصفحتين:  /map?…  → map.html?…   ,   /city3d?… → city3d.html?…
   أي رابط آخر (العقارات، الخدمات…) يُحوَّل إلى البوابة الكاملة PORTAL_URL.
   ============================================================================ */
const STANDALONE={
  pages:{map:'map.html',city3d:'city3d.html'},
  /* عدّل هذا الرابط ليشير إلى البوابة الكاملة (الصفحة الرئيسية) */
  PORTAL_URL:'index.html'
};
const PAGES={};
let CUR={key:''},cleanup=null;

/* shared loading skeleton (was in 08-pages-b.js) */
const mapSk=()=>`<div class="sk-map"><div class="ldc">${lockup(200)}<b>${_('جارٍ تحميل المدينة…','Loading the city…')}</b><i class="ldc-b"></i></div></div>`;

/* ---- links: translate portal routes to standalone files ---- */
function routeUrl(p){
  const [path,qs]=String(p||'/').split('?'),seg=path.split('/').filter(Boolean)[0]||'';
  if(!seg)return STANDALONE.pages.map+(qs?'?'+qs:'');
  if(STANDALONE.pages[seg])return STANDALONE.pages[seg]+(qs?'?'+qs:'');
  return STANDALONE.PORTAL_URL+'#'+p;
}
/* 02-core's go() writes location.hash — catch it and navigate for real */
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&h.startsWith('/')){history.replaceState(null,'',location.pathname+location.search);location.href=routeUrl(h)}});
const queryObj=()=>{const q={};new URLSearchParams(location.search).forEach((v,k)=>q[k]=v);return q};

/* ---- header (same markup & classes as the portal) ---- */
const NAV=[['home','الرئيسية','Home','/'],['map','الخريطة التفاعلية','Interactive Map','/map'],['city3d','المدينة ثلاثية الأبعاد','3D City','/city3d']];
const brandT=()=>`<span class="brand-t"><b>مدينة السلطان هيثم</b><i>Sultan Haitham City</i></span>`;
function renderHeader(){const k=CUR.key;
  if(k==='city3d'&&document.querySelector('.shc-portal-header'))return;
  $('#hdr').innerHTML=`<div class="hdr-in wrap"><div class="hdr-r"><a class="brand" data-go="/" aria-label="${_('الرئيسية','Home')}">${logo(46)}${brandT()}</a><nav class="nav" aria-label="${_('التنقل الرئيسي','Main')}">${NAV.map(n=>`<a class="${k===n[0]?'on':''}" data-go="${n[3]}" ${k===n[0]?'aria-current="page"':''}>${_(n[1],n[2])}</a>`).join('')}</nav></div>
  <div class="hdr-l"><button class="lang" data-act="lang" aria-label="${_('تغيير اللغة','Switch language')}">${ic('globe',16)}<span class="${S.lang==='ar'?'on':''}">AR</span><span class="${S.lang==='en'?'on':''}">EN</span></button>
  <button class="burger" data-act="menu" aria-label="${_('القائمة','Menu')}" aria-expanded="false">${ic('menu',28)}</button></div></div>`;
  $('#mob').innerHTML=`<div class="mob-top"><a class="brand" data-go="/">${logo(42)}${brandT()}</a><button class="burger" data-act="menu" aria-label="${_('إغلاق','Close')}">${ic('close',28)}</button></div><nav class="mob-nav">${NAV.map((n,i)=>`<a data-go="${n[3]}" style="--i:${i}" class="${k===n[0]?'on':''}">${_(n[1],n[2])}${ic('arrow',20,'dirx')}</a>`).join('')}</nav><div class="mob-bot"><button class="btn btn-ghost" data-act="lang">${ic('globe',16)}${S.lang==='ar'?'English':'العربية'}</button></div>`;
}
function toggleMenu(on){const m=$('#mob');on=on===undefined?!m.classList.contains('on'):on;m.classList.toggle('on',on);document.body.classList.toggle('noscroll',on);$$('.burger').forEach(b=>b.setAttribute('aria-expanded',on))}
function applyLang(lang){
  const fromUnifiedHeader=lang==='ar'||lang==='en';
  if(fromUnifiedHeader){S.lang=lang;store.set('lang',S.lang)}
  document.documentElement.lang=S.lang;
  document.documentElement.dir=S.lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('.shc-portal-language [data-shc-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shcLang===S.lang)));
  if(fromUnifiedHeader&&CUR.key&&PAGES[CUR.key])renderPage(false);
}

/* ---- render the one page ---- */
function renderPage(first){
  const pg=PAGES[CUR.key],view=$('#view');
  if(cleanup){try{cleanup()}catch(e){}cleanup=null}
  document.title=pg.title()+' | '+_('مدينة السلطان هيثم','Sultan Haitham City');
  renderHeader();
  const paint=()=>{view.innerHTML=pg.render({},queryObj());cleanup=pg.mount?pg.mount(view,{},queryObj())||null:null};
  if(first){view.innerHTML=pg.skeleton?pg.skeleton():'';setTimeout(paint,60)}else paint();
}

/* ---- global actions & click delegation (as in 06-app.js) ---- */
ACT.menu=()=>toggleMenu();
ACT.noop=(el,e)=>e.preventDefault();
ACT.skip=(el,e)=>{e.preventDefault();$('#view').focus()};
ACT.lang=()=>{S.lang=S.lang==='ar'?'en':'ar';store.set('lang',S.lang);applyLang();toggleMenu(false);renderPage(false)};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act],[data-go]');if(!t)return;
  if(t.dataset.act){const f=ACT[t.dataset.act];if(f)f(t,e);return}
  if(t.dataset.go){e.preventDefault();location.href=routeUrl(t.dataset.go)}});

function bootStandalone(key){
  CUR={key};
  document.documentElement.style.setProperty('--pat',PATTERN);applyLang();
  document.body.dataset.page=key;document.body.classList.add('immersive');
  const unifiedHeader=key==='city3d'?document.querySelector('.shc-portal-header'):null;
  if(unifiedHeader){
    document.body.insertAdjacentHTML('afterbegin',`<a class="skip" href="#view" data-act="skip">${_('تخطي إلى المحتوى','Skip to content')}</a>`);
    unifiedHeader.insertAdjacentHTML('afterend','<main id="view" tabindex="-1"></main><div id="ovl"></div><div id="toasts" aria-live="polite"></div>');
  }else{
    document.body.insertAdjacentHTML('afterbegin',`<a class="skip" href="#view" data-act="skip">${_('تخطي إلى المحتوى','Skip to content')}</a><header class="hdr" id="hdr"></header><div class="mobmenu" id="mob"></div><main id="view" tabindex="-1"></main><div id="ovl"></div><div id="toasts" aria-live="polite"></div>`);
  }
  renderPage(true);
}
