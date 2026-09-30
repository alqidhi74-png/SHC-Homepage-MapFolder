/* ============================================================
   صفحة المدينة ثلاثية الأبعاد — منطق الصفحة (مأخوذ حرفيًا من js/08-pages-b.js)
   3D City page logic (verbatim from js/08-pages-b.js)
   ============================================================ */
PAGES.city3d={immersive:true,title:()=>_('المدينة ثلاثية الأبعاد','3D city'),skeleton:null,delay:0,
render(){return `<div class="c3"><canvas id="c3cv" aria-label="${_('نموذج ثلاثي الأبعاد للمدينة','3D city model')}" role="img"></canvas>
  <div class="c3-top"><div class="c3-row"><label class="srch2 c3s">${ic('search',18)}<input id="c3q" type="search" placeholder="${_('رقم القطعة أو اسم المبنى','Plot number or building name')}" aria-label="${_('بحث','Search')}"></label>
  <select id="c3t" aria-label="${_('نوع المبنى','Building type')}"><option value="all">${_('كل الأنواع','All types')}</option>${Object.entries(BT).map(([k,v])=>`<option value="${k}">${L(v)}</option>`).join('')}</select>
  <select id="c3st" aria-label="${_('الحالة','Status')}"><option value="all">${_('كل الحالات','All statuses')}</option>${Object.entries(BSTATN).map(([k,v])=>`<option value="${k}">${L(v)}</option>`).join('')}</select>
  <div class="tools"><button data-tool="dist" aria-label="${_('قياس المسافة','Measure distance')}" data-tip="${_('قياس المسافة','Measure distance')}">${ic('ruler',18)}<span>${_('المسافة','Distance')}</span></button><button data-tool="height" aria-label="${_('قياس الارتفاع','Measure height')}" data-tip="${_('قياس الارتفاع','Measure height')}">${ic('height',18)}<span>${_('الارتفاع','Height')}</span></button><button id="c3r" aria-label="${_('إعادة ضبط الكاميرا','Reset camera')}" data-tip="${_('إعادة ضبط الكاميرا','Reset camera')}">${ic('rot',18)}<span>${_('إعادة ضبط','Reset')}</span></button></div>
  <label class="fv"><input type="checkbox" id="c3fv"><span class="sw"></span><span>${_('الرؤية المستقبلية','Future Vision')}</span></label></div><div class="c3-chip" id="c3chip" hidden></div></div>
  <aside class="c3-card" id="c3card" hidden></aside>
  <div class="c3-lg">${Object.entries(BT).map(([k,v])=>`<span><i style="background:${v.hex}"></i>${L(v)}</span>`).join('')}<span><i class="gh"></i>${_('مقترح','Proposed')}</span></div>
  <div class="c3-z"><div class="cmp" aria-hidden="true"><i></i><b>N</b></div><button id="zi" aria-label="${_('تكبير','Zoom in')}">${ic('plus',18)}</button><button id="zo" aria-label="${_('تصغير','Zoom out')}">${ic('minus',18)}</button></div>
  <div class="c3-tip" id="c3tip" hidden></div>
  <div class="c3-tl"><button id="tlp" class="tl-p" aria-label="${_('تشغيل','Play')}">${ic('play',20)}</button><div class="tl-m"><input id="tl" type="range" min="2024" max="2035" step="0.02" value="2026" aria-label="${_('الجدول الزمني','Timeline')}"><div class="tl-t">${Array.from({length:12},(_a,i)=>`<span>${2024+i}</span>`).join('')}</div></div><div class="tl-y"><b class="num" id="tly">2026</b><small id="tls"></small></div></div></div>`},
mount(el,_p,q){const cv=$('#c3cv',el),card=$('#c3card',el),chip=$('#c3chip',el),tip=$('#c3tip',el),tl=$('#tl',el);let play=null;
  const isEmp=()=>S.user&&S.user.role==='employee';
  const stats=()=>{const s=C.stats();$('#tls',el).innerHTML=`<span class="num">${s.done}</span> ${_('قائم','built')} · <span class="num">${s.mid}</span> ${_('قيد الإنشاء','building')} · <span class="num">${s.plan}</span> ${_('مخطط','planned')}`;$('#tly',el).textContent=Math.floor(C.year()+1e-6)};
  let liveT=null;
  const showCard=b=>{clearInterval(liveT);if(!b){card.hidden=true;return}card.hidden=false;card.classList.remove('in');void card.offsetWidth;card.classList.add('in');const inf=bInfo(b);
    const kv=rows=>rows.map(r=>`<div><dt>${r[0]}</dt><dd class="num">${r[1]}</dd></div>`).join('');
    card.innerHTML=`<button class="c3-x" data-act="c3x" aria-label="${_('إغلاق','Close')}">${ic('close',18)}</button><span class="ty" style="--c:${BT[b.type].hex}">${ic(inf.icon,13)}${inf.label}</span><h3>${bName(b)}</h3><small>${b.plot} · ${L(NB[b.nb])}${inf.t2?' · '+inf.t2:''}</small>
    <p class="c3-desc">${inf.desc}</p>
    ${inf.live.length?`<div class="c3-live"><h4><i class="c3-dot"></i>${_('بيانات مباشرة','Live data')}</h4><dl id="c3live">${kv(inf.live)}</dl></div>`:''}
    <dl><div><dt>${_('الحالة','Status')}</dt><dd><span class="badge sb-${b.status}">${L(BSTATN[b.status])}</span></dd></div>${kv(inf.metrics)}<div><dt>${_('الارتفاع','Height')}</dt><dd class="num">${Math.round(b.h)} m</dd></div><div><dt>${_('الطوابق','Floors')}</dt><dd class="num">${b.floors}</dd></div><div><dt>${_('المساحة الطابقية','Floor area')}</dt><dd class="num">${N(b.area)} m²</dd></div><div><dt>${_('سنة الإكمال','Completion')}</dt><dd class="num">${b.year}</dd></div><div><dt>${_('الموقع','Location')}</dt><dd class="num" dir="ltr">${Math.round(b.x)}, ${Math.round(b.z)}</dd></div>
    <div><dt>${_('المالك','Owner')}</dt><dd>${isEmp()?b.owner:`<span class="lock">${ic('lock',14)}${_('بيانات مقيدة','Restricted data')}</span>`}</dd></div></dl>
    ${inf.services.length?`<div class="c3-sec"><h4>${_('الخدمات','Services')}</h4><ul class="c3-chips">${inf.services.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
    ${inf.smart.length?`<div class="c3-sec"><h4>${ic('wifi',14)}${_('أنظمة المدينة الذكية','Smart-city systems')}</h4><ul class="c3-chips sm">${inf.smart.map(t=>`<li>${t}</li>`).join('')}</ul></div>`:''}
    ${isEmp()?'':`<p class="c3-n">${_('بيانات المالك متاحة لموظفي الوزارة فقط.','Owner details are visible to ministry staff only.')}</p>`}
    <div class="acts"><button class="btn btn-em btn-sm" style="flex-basis:100%" data-go="/map?bld=${b.id}" data-morph="city">${ic('map',15)}${_('عرض على الخريطة','View on map')}</button>${b.type==='res'||b.pr?`<button class="btn btn-gold btn-sm" data-act="c3units" data-id="${b.id}">${_('عرض الوحدات','View units')}</button>`:''}<button class="btn btn-ghost btn-sm" data-act="c3cons" data-id="${b.id}">${ic('bolt',15)}${_('عرض الاستهلاك','View consumption')}</button></div>`;
    /* refresh the live readings every few seconds while the card is open */
    if(inf.live.length)liveT=setInterval(()=>{const d=$('#c3live',card);if(!d||card.hidden){clearInterval(liveT);return}d.innerHTML=kv(bInfo(b).live)},3000)};
  const C=City3D(cv,{onSelect:showCard,onMeasure:t=>{chip.hidden=!t;chip.innerHTML=t?`${ic('ruler',15)}${t}`:''},onYear:y=>{tl.value=y;stats()},onCam:yaw=>{const c=$('.cmp i',el);c&&(c.style.transform=`rotate(${yaw}rad)`)},
    onHover:(b,x,y)=>{if(!b){tip.hidden=true;return}tip.hidden=false;tip.textContent=bName(b)+' · '+b.plot;tip.style.transform=`translate(${x+14}px,${y+14}px)`}});
  ACT.c3x=()=>C.select(null);ACT.c3units=b=>{const bl=BLD[b.dataset.id];if(!bl)return;if(bl.plot==='PL-A-699'){const url=new URL('../projects/al-wadi/details.html',location.href);url.searchParams.set('code',bl.plot);location.assign(url.href);return}const pr=PROJECTS.find(p=>p.bld===bl.id);go(pr?'/properties?pr='+pr.id:'/properties?nb='+bl.nb)};
  ACT.c3cons=b=>{const bl=BLD[b.dataset.id],d=bEnergy(bl),tot=d.reduce((a,c)=>a+c,0),pk=d.indexOf(Math.max(...d));
    openModal(`<h3>${_('استهلاك الطاقة','Energy consumption')}</h3><p class="mut">${bName(bl)} · ${bl.plot}</p><div class="en-k"><div><b class="num">${N(tot)}</b><small>MWh ${_('سنويًا','per year')}</small></div><div><b class="num">${N(Math.round(tot/12))}</b><small>${_('المتوسط الشهري','monthly average')}</small></div><div><b>${MONTHS12()[pk]}</b><small>${_('ذروة الاستهلاك','peak month')}</small></div></div>${CH.bar({labels:MONTHS12(),data:d,color:'#6B1C2C',color2:'#DBC47D',fmt:v=>N(Math.round(v)),h:220,title:'energy'})}<p class="mut sm">${_('مرّر المؤشر فوق الأعمدة لعرض القيمة الشهرية.','Hover over the bars to see monthly values.')}</p>`,{cls:'mdl-md'})};
  $('#c3q',el).addEventListener('input',e=>{C.set('q',e.target.value.trim())});$('#c3q',el).addEventListener('keydown',e=>{if(e.key==='Enter'){const b=C.firstMatch();b?C.focus(b.id):toast(_('لا توجد نتيجة مطابقة','No matching building'),'search')}});
  $('#c3t',el).addEventListener('change',e=>C.set('type',e.target.value));$('#c3st',el).addEventListener('change',e=>C.set('status',e.target.value));
  $('#c3fv',el).addEventListener('change',e=>{C.set('fv',e.target.checked);toast(e.target.checked?_('الرؤية المستقبلية: المباني المقترحة ظاهرة بشفافية','Future Vision on: proposed buildings shown translucent'):_('تم إيقاف الرؤية المستقبلية','Future Vision off'),'eye')});
  $$('[data-tool]',el).forEach(b=>b.addEventListener('click',()=>{const on=!b.classList.contains('on');$$('[data-tool]',el).forEach(x=>x.classList.remove('on'));b.classList.toggle('on',on);C.set('tool',on?b.dataset.tool:null);if(on)toast(b.dataset.tool==='dist'?_('انقر نقطتين على الخريطة لقياس المسافة','Click two points to measure distance'):_('انقر على مبنى لقياس ارتفاعه','Click a building to measure its height'),'ruler')}));
  $('#c3r',el).addEventListener('click',()=>{C.reset();C.select(null)});$('#zi',el).onclick=()=>C.zoom(.75);$('#zo',el).onclick=()=>C.zoom(1.33);
  /* Canvas drag now pans the city by default (free navigation), so the
     compass is the dedicated, always-reachable rotate control: drag it to
     orbit the camera around the current focus point (a selected building,
     once you've clicked one), and a plain click/tap snaps back to north. */
  const cmp=$('.cmp',el);if(cmp){cmp.setAttribute('role','slider');cmp.setAttribute('aria-label',_('تدوير الكاميرا (اسحب) أو إعادة توجيهها للشمال (اضغط)','Drag to rotate the camera, or tap to reset to north'));cmp.tabIndex=0;
    let dragging=false,lastX=0,movedCmp=0;
    cmp.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;movedCmp=0;cmp.setPointerCapture(e.pointerId);cmp.classList.add('grab')});
    cmp.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;movedCmp+=Math.abs(dx);C.orbit(dx*.012)});
    const cmpEnd=()=>{if(!dragging)return;dragging=false;cmp.classList.remove('grab');if(movedCmp<4)C.reset()};
    cmp.addEventListener('pointerup',cmpEnd);cmp.addEventListener('pointercancel',cmpEnd);
    cmp.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')C.orbit(-.15);else if(e.key==='ArrowRight')C.orbit(.15);else if(e.key==='Enter'||e.key===' '){e.preventDefault();C.reset()}});
  }
  tl.addEventListener('input',()=>{C.set('year',+tl.value);stats()});
  $('#tlp',el).addEventListener('click',e=>{const b=e.currentTarget;if(play){clearInterval(play);play=null;b.innerHTML=ic('play',20);return}b.innerHTML=ic('pause',20);if(+tl.value>=2034.9)tl.value=2024;play=setInterval(()=>{tl.value=Math.min(2035,+tl.value+.03);C.set('year',+tl.value);stats();if(+tl.value>=2035){clearInterval(play);play=null;b.innerHTML=ic('play',20)}},40)});
  stats();if(q.focus&&BLD[q.focus])setTimeout(()=>C.focus(q.focus),700);
  return()=>{clearInterval(play);clearInterval(liveT);C.destroy()}}};
