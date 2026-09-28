/* ============================================================
   صفحة الخريطة التفاعلية — منطق الصفحة (مأخوذ حرفيًا من js/08-pages-b.js)
   Interactive Map page logic (verbatim from js/08-pages-b.js)
   ============================================================ */
const LAYERS=[['projects','مشاريع عقارية','Real Estate Projects','building'],['schools','مدارس','Schools','school'],['health','مرافق صحية','Healthcare Facilities','clinic'],['mosques','مساجد','Mosques','mosque'],['govt','حكومي ومدني','Govt / civic','shield'],['culture','ثقافة','Culture','image'],['kindergarten','رياض أطفال','Kindergartens','kid'],['petrol','محطات وقود','Petrol stations','drop'],['post','مكاتب بريد','Post offices','mail'],['shopping','تسوق وضيافة','Shopping & hospitality','store'],['sports','رياضة','Sports','gym'],['utility','مرافق عامة','Utilities','bolt'],['parks','حدائق','Parks','tree'],['lots','قطع استثمارية','Investment Lots','star'],['roads','الطرق الرئيسية','Main Roads','road'],['nbs','حدود الأحياء','Neighborhood Boundaries','layers'],['buildings','المباني','Buildings','building'],['bcat','تلوين المباني حسب الاستخدام','Colour buildings by use','layers']];
PAGES.map={immersive:true,title:()=>_('الخريطة التفاعلية','Interactive map'),skeleton:mapSk,delay:420,
render(){return `<div class="mapx"><aside class="mpanel" id="mpanel"><button class="sheet-h" data-act="sheet" aria-label="${_('لوحة الخريطة','Map panel')}"><i></i></button><div class="mp-in"><label class="srch2">${ic('search',18)}<input id="mq" type="search" placeholder="${_('ابحث بالاسم أو رقم القطعة','Search by name or plot number')}" aria-label="${_('بحث','Search')}"></label>
  <div class="lyr"><h4>${_('الطبقات','Layers')}</h4>${LAYERS.map(l=>`<label class="lyr-i"><input type="checkbox" data-l="${l[0]}" ${l[0]==='bcat'?'':'checked'}><span class="cbx">${ic('check',13)}</span>${ic(l[3],16)}<span>${_(l[1],l[2])}</span></label>`).join('')}</div>
  <div class="mres"><h4 id="mrh"></h4><ul id="mres"></ul></div></div></aside><div class="mapv" id="mapv"></div></div>`},
mount(el,_p,q){const layers=new Set(LAYERS.filter(l=>l[0]!=='bcat').map(l=>l[0])),pts=[...projPoints(),...facPoints()];
  const map=MapEngine($('#mapv',el),{points:pts,layers,popup:p=>p.type==='project'?projPopup(p):facPopup(p),bPopup:bldPopup,popOffset:60});
  const res=$('#mres',el),rh=$('#mrh',el),panel=$('#mpanel',el);
  const show=()=>{const s=$('#mq',el).value.trim().toLowerCase();let items=[];
    if(!s){items=[...NBS.map(n=>({k:'nb',n,name:L(n),sub:_('حي','Neighborhood'),i:'layers'})),...pts.filter(p=>p.type==='project').map(p=>({k:'pt',p,name:p.label,sub:p.plot+' · '+L(NB[p.ref.nb]),i:'building'}))];rh.textContent=_('الأحياء والمشاريع','Neighborhoods & projects')}
    else{items=[...NBS.filter(n=>L(n).toLowerCase().includes(s)||n.ar.includes(s)||n.en.toLowerCase().includes(s)).map(n=>({k:'nb',n,name:L(n),sub:_('حي','Neighborhood'),i:'layers'})),...pts.filter(p=>p.label.toLowerCase().includes(s)||(p.ref&&(p.ref.ar.includes(s)||p.ref.en.toLowerCase().includes(s)))||p.plot.toLowerCase().includes(s)).map(p=>({k:'pt',p,name:p.label,sub:p.plot+' · '+_(...(p.type==='project'?['مشروع','Project']:FNAME[p.type])),i:FICON[p.type]}))];
      BLDS.filter(b=>b.plot.toLowerCase().includes(s)||b.id.toLowerCase()===s||bName(b).toLowerCase().includes(s)).slice(0,5).forEach(b=>items.push({k:'bl',b,name:bName(b),sub:b.plot+' · '+L(BT[b.type]),i:'cube'}));PROPS.filter(x=>x.code.toLowerCase().includes(s)).slice(0,4).forEach(x=>items.push({k:'pt',p:{id:'pp'+x.id,type:'project',x:PR[x.pr].x,y:PR[x.pr].y,label:L(PR[x.pr]),ref:PR[x.pr]},name:pName(x),sub:L(PR[x.pr]),i:'home'}));rh.textContent=items.length+' '+_('نتيجة','results')}
    res.innerHTML=items.length?items.map((it,i)=>`<li><button data-i="${i}">${ic(it.i,18)}<span><b>${it.name}</b><small>${it.sub}</small></span>${ic('chevR',16,'dirx')}</button></li>`).join(''):`<li class="empty">${ic('search',24)}<b>${_('لا توجد نتائج','No results')}</b><small>${_('جرّب اسمًا أو رقم قطعة مختلفًا.','Try a different name or plot number.')}</small></li>`;
    res._items=items};
  res.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const it=res._items[+b.dataset.i];if(it.k==='nb')map.focusNb(it.n.id);else if(it.k==='bl')map.selectBuilding(it.b);else map.focusPoint(it.p.ref&&it.p.type==='project'&&!pts.includes(it.p)?pts.find(x=>x.id===it.p.ref.id):it.p);sheetTo(peek())});
  $('#mq',el).addEventListener('input',show);show();
  $$('[data-l]',el).forEach(c=>c.addEventListener('change',()=>{c.checked?layers.add(c.dataset.l):layers.delete(c.dataset.l);map.setLayers(new Set(layers))}));
  /* mobile bottom sheet */
  const vh=()=>panel.parentElement.getBoundingClientRect().height,peek=()=>96,snaps=()=>[96,vh()*.46,vh()*.82];let sh=96;
  const sheetTo=h=>{if(matchMedia('(min-width:901px)').matches)return;sh=h;panel.style.height=h+'px'};
  ACT.sheet=()=>{const s=snaps(),i=s.findIndex(v=>Math.abs(v-sh)<8);sheetTo(s[(i+1)%3])};
  const grab=$('.sheet-h',el);let d=null;grab.addEventListener('pointerdown',e=>{d=[e.clientY,sh,0];grab.setPointerCapture(e.pointerId);panel.style.transition='none'});grab.addEventListener('pointermove',e=>{if(!d)return;d[2]=Math.abs(e.clientY-d[0]);sh=clamp(d[1]-(e.clientY-d[0]),96,vh()*.9);panel.style.height=sh+'px'});
  grab.addEventListener('pointerup',()=>{if(!d)return;panel.style.transition='';if(d[2]>6){const s=snaps().reduce((a,b)=>Math.abs(b-sh)<Math.abs(a-sh)?b:a);sheetTo(s)}d=null});
  if(!matchMedia('(min-width:901px)').matches)sheetTo(snaps()[1]*.9);
  if(q.focus&&NB[q.focus])setTimeout(()=>map.focusNb(q.focus),500);
  if(q.bld&&BLD[q.bld])setTimeout(()=>map.selectBuilding(BLD[q.bld]),700);
  return()=>map.destroy()}};
