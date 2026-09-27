/* ---------- interactive map engine: GIS-style vector city built from the official master plan ---------- */
const inPoly=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const LAYER_OF={project:'projects',property:'projects',school:'schools',health:'health',mosque:'mosques',park:'parks',lot:'lots',govt:'govt',culture:'culture',kindergarten:'kindergarten',petrol:'petrol',post:'post',shopping:'shopping',hospitality:'shopping',sports:'sports',utility:'utility'};
const FICON={school:'school',health:'clinic',mosque:'mosque',park:'tree',project:'building',lot:'star',govt:'shield',culture:'image',kindergarten:'kid',petrol:'drop',post:'mail',shopping:'store',hospitality:'bed',sports:'gym',utility:'bolt'};
const FNAME={school:['تعليم','Education'],health:['مرافق صحية','Healthcare'],mosque:['مساجد','Mosques'],park:['حدائق','Parks'],govt:['أمن وخدمات حكومية','Security & government'],culture:['ثقافة','Culture'],kindergarten:['رياض أطفال','Kindergartens'],petrol:['وقود وشحن كهربائي','Fuel & EV charging'],post:['مكاتب بريد','Post offices'],shopping:['تسوق وضيافة','Shopping & hospitality'],hospitality:['ضيافة','Hospitality'],sports:['رياضة','Sports'],utility:['مرافق عامة','Utilities']};
const HC_E=[1.6,3.6,6.5,11],hcOf=h=>h<16?0:h<32?1:h<60?2:3;
const flatD=(f,close=true)=>{let d='M'+f[0]+' '+f[1];for(let i=2;i<f.length;i+=2)d+='L'+f[i]+' '+f[i+1];return d+(close?'Z':'')};
const polyD=(p,close=true)=>{let d='',px=null,pz=null;for(let i=0;i<p.length;i++){const x=Math.round(p[i][0]*2)/2,z=Math.round(p[i][1]*2)/2;if(x===px&&z===pz)continue;d+=(d?'L':'M')+x+' '+z;px=x;pz=z}return d+(close?'Z':'')};
const circD=(x,z,r)=>`M${(x-r).toFixed(1)} ${z.toFixed(1)}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
/* zoning colours for the "master plan" mode */
const ZONEC={villas:'#EFE08A',townhouses:'#E7A37E',apartments:'#D46A5E',apartments_hi:'#C0453F',cbd:'#6F79A8',business:'#8790BA',mixed:'#D9A4BE','commercial:strip':'#E2B8CB',park:'#9CC77E',centre:'#DCCBE3',facility:'#9FD0EE'};
const zoneOf=u=>ZONEC[u]||ZONEC[(u||'').split(':')[0]]||'#d8d0c0';
let MAPBASE=null;
function mapBase(){
  if(MAPBASE)return MAPBASE;
  /* the 2D map is drawn from the same master plan as the 3D twin */
  const P=ensureCityPlan(),g2=SC.g2,B=P.bbox;let s='';
  s+=`<defs><pattern id="trees" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.4" class="m-tr"/><circle cx="15" cy="11" r="3" class="m-tr"/><circle cx="7" cy="16" r="2" class="m-tr"/></pattern></defs>`;
  s+=`<rect x="${B[0]-4000}" y="${B[1]-4000}" width="${B[2]-B[0]+8000}" height="${B[3]-B[1]+8000}" class="m-land"/><g class="m-vec">`;
  s+=`<path class="m-city" d="${polyD(P.boundary)}"/>`;
  /* green: parks, the wadi corridor, park blocks */
  const parks=P.blocks.filter(b=>(b.use||'').startsWith('park')||b.use==='centre:park').map(b=>polyD(b.poly)).join('');
  s+=`<path class="m-green" d="${polyD(P.wadi.poly)}" opacity=".55"/><path class="m-green" d="${parks}"/><path class="m-trees" fill="url(#trees)" d="${parks}"/>`;
  s+=`<path class="m-water" d="${polyD(P.lake)}${polyD(P.wadi.canalPoly)}"/>`;
  /* roads: right-of-way (sidewalks) + carriageway, junctions, roundabouts */
  const ribbon=(pl,w)=>{const a=g2.plOffset(pl,w/2),b=g2.plOffset(pl,-w/2).reverse();return polyD(a.concat(b))};
  let row='',cw='',cw1='';for(const e of P.edges){row+=ribbon(e.pl,e.R.row);(e.cls==='art'||e.cls==='ring'?(x=>cw1+=x):(x=>cw+=x))(ribbon(e.pl,e.R.cw))}
  for(const n of P.nodes){if(n.ctrl==='roundabout'&&n.rr){row+=circD(n.x,n.z,n.rr+5);cw1+=circD(n.x,n.z,n.rr)}else if(n.e.length>2){const w=Math.max(...n.e.map(e=>e.R.cw))/2;(n.e.some(e=>e.cls==='art'||e.cls==='ring')?(x=>cw1+=x):(x=>cw+=x))(circD(n.x,n.z,w))}else if(n.ctrl==='culdesac'&&n.rr)cw+=circD(n.x,n.z,n.rr)}
  s+=`<g class="m-roads"><path class="m-flat" d="${row}"/><path class="m-r2" d="${cw}"/><path class="m-r1c" d="${cw1}"/><path class="m-r1" d="${cw1}"/></g>`;
  /* buildings, extruded by height class (shadow · walls · roof) */
  const sh=['','','',''],bs=[{},{},{},{}],rf=[{},{},{},{}];let flat='';
  BLDS.forEach(b=>{const r=b.r;if(!r.masses||!r.masses.length){if(r.plot)flat+=polyD(r.plot);return}const d=r.masses.filter(m=>m.role!=='sailroof').map(m=>polyD(m.poly)).join('');if(b.flat){flat+=d;return}
    const hc=hcOf(b.h),key=b.t2||b.type;sh[hc]+=d;bs[hc][b.type]=(bs[hc][b.type]||'')+d;rf[hc][key]=(rf[hc][key]||'')+d});
  s+=`<path class="m-flat" d="${flat}"/>`;
  s+=`<g class="m-bld"><g class="m-shd">${sh.map((d,i)=>d?`<path d="${d}" transform="translate(${(HC_E[i]*1.1).toFixed(1)} ${(HC_E[i]*.7).toFixed(1)})"/>`:'').join('')}</g>`;
  s+=`<g class="m-bs">${bs.map(o=>Object.entries(o).map(([t,d])=>`<path class="t-${t}" d="${d}"/>`).join('')).join('')}</g>`;
  s+=`<g class="m-rf">${rf.map((o,i)=>Object.entries(o).map(([t,d])=>`<path class="t-${t}" d="${d}" transform="translate(0 ${-HC_E[i]})"/>`).join('')).join('')}</g></g>`;
  s+=`<g class="m-nbs">${NBS.map(n=>`<path id="poly-${n.id}" d="${flatD(n.poly.flat())}" class="m-nb" style="--c:${n.col}"/>`).join('')}</g><path class="m-bound" d="${polyD(P.boundary)}"/><g class="m-sel" id="msel"></g></g>`;
  /* master-plan mode: land-use zoning of every block */
  const zones={};P.blocks.forEach(b=>{const c=zoneOf(b.use);zones[c]=(zones[c]||'')+polyD(b.poly)});
  s+=`<g class="m-planlayer"><path d="${polyD(P.boundary)}" fill="#f4efe4"/>${Object.entries(zones).map(([c,d])=>`<path d="${d}" fill="${c}" stroke="#fff" stroke-width="1.5"/>`).join('')}<path d="${polyD(P.lake)}${polyD(P.wadi.canalPoly)}" fill="#8cc4d8"/><path d="${polyD(P.boundary)}" fill="none" stroke="#6b1c2c" stroke-width="6" stroke-dasharray="40 16"/></g>`;
  return MAPBASE=s;
}
function MapEngine(root,cfg={}){
  let pts=cfg.points||[],layers=cfg.layers||new Set(['projects','schools','health','mosques','parks','lots','roads','nbs','buildings']),mode=cfg.mode||(cfg.sat?'sat':'map'),tx=0,ty=0,k=1,W=0,H=0,fit=1,mks=[],pop=null,sel=null,selB=null,lastK=-1,anim=0,me=null;
  const B=ensureCityPlan().bbox,bw=B[2]-B[0]+500,bh=B[3]-B[1]+500,bcx=(B[0]+B[2])/2,bcy=(B[1]+B[3])/2;
  root.classList.add('mp');
  const modes=[['map',_('خريطة','Map')],['sat',_('قمر صناعي','Satellite')],['plan',_('المخطط العام','Master plan')]];
  root.innerHTML=`<svg class="mp-svg" role="img" aria-label="${_('خريطة مدينة السلطان هيثم','Sultan Haitham City map')}"><g class="mp-world">${mapBase()}</g></svg><div class="mp-mk"></div><div class="mp-pop" hidden></div>${cfg.controls===false?'':`<div class="mp-ctl"><button data-m="in" aria-label="${_('تكبير','Zoom in')}">${ic('plus',18)}</button><button data-m="out" aria-label="${_('تصغير','Zoom out')}">${ic('minus',18)}</button><button data-m="reset" aria-label="${_('إعادة ضبط العرض','Reset view')}">${ic('rot',18)}</button><button data-m="me" aria-label="${_('موقعي','My location')}">${ic('locate',18)}</button>${cfg.legend===false?'':`<button data-m="lg" aria-label="${_('دليل الخريطة','Legend')}">${ic('info',18)}</button>`}</div>`}${cfg.satBtn===false?'':`<div class="mp-modes" role="group" aria-label="${_('نمط الخريطة','Map mode')}">${modes.map(m=>`<button data-mode="${m[0]}" class="${m[0]===mode?'on':''}">${m[1]}</button>`).join('')}</div>`}<div class="mp-scale"><i></i><span></span></div>${cfg.legend===false?'':`<div class="mp-legend" hidden><h5>${_('دليل الخريطة','Legend')}</h5><div><i class="lg pj"></i>${_('مشاريع عقارية','Real-estate projects')}</div>${Object.entries(FNAME).map(([t,n])=>`<div><i class="lg fc">${ic(FICON[t],12)}</i>${_(n[0],n[1])}</div>`).join('')}<div><i class="lg fc lot">${ic('star',12)}</i>${_('قطع استثمارية','Investment lots')}</div><div><i class="lg rd"></i>${_('طرق رئيسية','Main roads')}</div><div><i class="lg bd"></i>${_('حدود الأحياء','Neighborhood boundaries')}</div><div class="lg-cat"><span><i style="background:#49111D"></i>${_('سكني','Residential')}</span><span><i style="background:#3D4E1E"></i>${_('حكومي','Government')}</span><span><i style="background:#F8633E"></i>${_('تجاري','Commercial')}</span><span><i style="background:#F1BB4D"></i>${_('خدمات','Services')}</span></div></div>`}`;
  const svg=$('.mp-svg',root),world=$('.mp-world',svg),mk=$('.mp-mk',root),popEl=$('.mp-pop',root),scale=$('.mp-scale',root),msel=$('#msel',world);
  const sync=()=>{world.setAttribute('transform',`translate(${tx} ${ty}) scale(${k})`);
    mks.forEach(m=>{m.el.style.transform=`translate(${(m.x*k+tx).toFixed(1)}px,${(m.y*k+ty).toFixed(1)}px)`});
    if(pop)popEl.style.transform=`translate(${(pop.x*k+tx).toFixed(1)}px,${(pop.y*k+ty).toFixed(1)}px)`;
    const m=[50,100,200,500,1000,2000].find(v=>v*k>=64)||2000;$('i',scale).style.width=(m*k)+'px';$('span',scale).textContent=m>=1000?(m/1000)+' km':m+' m';
    if(Math.abs(k-lastK)>1e-4){lastK=k;build()}};
  const resize=()=>{const r=root.getBoundingClientRect();if(!r.width)return;const first=!W;W=r.width;H=r.height;fit=Math.min(W/bw,H/bh)*(cfg.mini?1.05:.98);if(first){const v=cfg.view||{x:bcx,y:bcy,k:1};k=fit*(v.k||1);tx=W/2-v.x*k;ty=H/2-v.y*k}sync()};
  const ro=new ResizeObserver(resize);ro.observe(root);resize();
  function build(){
    mk.innerHTML='';mks=[];const cell=54/k,groups={};
    const vis=pts.filter(p=>layers.has(LAYER_OF[p.type]||'projects'));
    vis.forEach(p=>{const key=Math.floor(p.x/cell)+'_'+Math.floor(p.y/cell);(groups[key]=groups[key]||[]).push(p)});
    Object.values(groups).forEach(g=>{
      if(g.length>1&&k<fit*6){const cx=g.reduce((a,p)=>a+p.x,0)/g.length,cy=g.reduce((a,p)=>a+p.y,0)/g.length,b=document.createElement('button');b.className='mk mk-cl';b.innerHTML=`<span class="mk-in">${g.length}</span>`;b.setAttribute('aria-label',g.length+' '+_('عناصر','items'));b.onclick=e=>{e.stopPropagation();flyTo({x:cx,y:cy,k:Math.min(k*2.2,fit*14)},700)};mk.appendChild(b);mks.push({el:b,x:cx,y:cy})}
      else g.forEach(p=>{const b=document.createElement('button');b.className='mk mk-'+p.type+(sel&&sel.id===p.id?' on':'');b.dataset.id=p.id;b.setAttribute('aria-label',p.label||'');
        b.innerHTML=p.type==='project'?`<span class="mk-in">${ic('building',16)}</span><span class="mk-p"></span>`:p.type==='property'?`<span class="mk-in num">${p.label}</span>`:`<span class="mk-in">${ic(FICON[p.type],14)}</span>`;
        b.onclick=e=>{e.stopPropagation();select(p)};mk.appendChild(b);mks.push({el:b,x:p.x,y:p.y})})});
    if(layers.has('nbs')&&cfg.labels!==false)NBS.forEach(n=>{const l=document.createElement('div');l.className='mp-lbl';l.textContent=L(n);mk.appendChild(l);mks.push({el:l,x:n.c[0],y:n.c[1]})});
    if(me){const b=document.createElement('div');b.className='mk-me';b.innerHTML='<i></i>';mk.appendChild(b);mks.push({el:b,x:me.x,y:me.y})}
    mks.forEach(m=>{m.el.style.transform=`translate(${(m.x*k+tx).toFixed(1)}px,${(m.y*k+ty).toFixed(1)}px)`});
  }
  const ping=el=>{const pg=document.createElement('span');pg.className='ping';el.appendChild(pg);setTimeout(()=>pg.remove(),4300)};
  function select(p,open=true){selB=null;msel.innerHTML='';sel=p;$$('.mk.on',mk).forEach(e=>e.classList.remove('on'));const el=$(`.mk[data-id="${p.id}"]`,mk);el&&el.classList.add('on');if(el&&p.type!=='project'&&p.type!=='property')ping(el);
    const html=cfg.popup?cfg.popup(p):null;if(html&&open){showPop(html,p.x,p.y-(p.type==='project'?2:0))}cfg.onSelect&&cfg.onSelect(p)}
  function showPop(html,x,y){popEl.hidden=false;popEl.innerHTML=`<div class="pop-c"><button class="pop-x" aria-label="${_('إغلاق','Close')}">${ic('close',16)}</button>${html}</div>`;pop={x,y};popEl.classList.remove('in');void popEl.offsetWidth;popEl.classList.add('in');$('.pop-x',popEl).onclick=closePop;sync()}
  function closePop(){pop=null;popEl.hidden=true;sel=null;selB=null;msel.innerHTML='';$$('.mk.on',mk).forEach(e=>e.classList.remove('on'))}
  /* buildings: hit-testing + Light Gold highlight */
  let grid=null;const CS=120;
  const gridInit=()=>{grid={};BLDS.forEach(b=>{if(b.flat)return;const x0=Math.floor(b.bx0/CS),x1=Math.floor(b.bx1/CS),y0=Math.floor((b.bz0-14)/CS),y1=Math.floor(b.bz1/CS);for(let a=x0;a<=x1;a++)for(let c=y0;c<=y1;c++)(grid[a+'_'+c]=grid[a+'_'+c]||[]).push(b)})};
  const bldAt=(x,y)=>{if(!grid)gridInit();const l=grid[Math.floor(x/CS)+'_'+Math.floor(y/CS)]||[];let best=null;for(const b of l){const e=HC_E[hcOf(b.h)];if(inPoly(x,y+e,b.pts)||inPoly(x,y,b.pts)){if(!best||b.h>best.h)best=b}}return best};
  function selectBuilding(b,fly=true){if(!b)return;sel=null;$$('.mk.on',mk).forEach(e=>e.classList.remove('on'));selB=b;const e=HC_E[hcOf(b.h)],d=flatD(b.pts.flat());
    msel.innerHTML=`<path class="m-selb" d="${d}"/><path class="m-selp" d="${d}" transform="translate(0 ${-e})"/>`;
    if(fly)flyTo({x:b.x,y:b.z,k:Math.max(k,fit*8),dy:cfg.mini?40:190},900);
    setTimeout(()=>{const html=cfg.bPopup?cfg.bPopup(b):null;if(html)showPop(html,b.x,b.z-e)},fly?880:0);cfg.onBuilding&&cfg.onBuilding(b)}
  function flyTo(v,ms=800){cancelAnimationFrame(anim);const k1=v.k||k,tx1=W/2-v.x*k1-(v.dx||0),ty1=H/2-v.y*k1+(v.dy||0),k0=k,tx0=tx,ty0=ty,t0=performance.now();
    const st=n=>{const p=clamp((n-t0)/ms,0,1),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;k=lerp(k0,k1,e);tx=lerp(tx0,tx1,e);ty=lerp(ty0,ty1,e);sync();if(p<1)anim=requestAnimationFrame(st)};anim=requestAnimationFrame(st)}
  function focusNb(id){const n=NB[id];if(!n)return;const xs=n.poly.map(p=>p[0]),ys=n.poly.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
    flyTo({x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,k:Math.min(W/(w*1.3),H/(h*1.3))},1100);const el=$('#poly-'+id,world);if(el){$$('.hl',world).forEach(e=>e.classList.remove('hl'));el.classList.add('hl');setTimeout(()=>el.classList.remove('hl'),3800)}}
  function focusPoint(p,open=true){flyTo({x:p.x,y:p.y,k:Math.max(k,fit*7),dy:cfg.popOffset||0},900);setTimeout(()=>select(p,open),880)}
  const zoom=(f,cx=W/2,cy=H/2)=>{const k1=clamp(k*f,fit*.8,fit*40),r=k1/k;tx=cx-(cx-tx)*r;ty=cy-(cy-ty)*r;k=k1;sync()};
  const ptrs=new Map();let drag=null,pinch=0,moved=0;
  root.addEventListener('pointerdown',e=>{if(e.target.closest('.mk,.mp-ctl,.pop-c,.mp-legend,.mp-modes'))return;root.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);drag=[e.clientX,e.clientY,tx,ty];moved=0;cancelAnimationFrame(anim);root.classList.add('grab');if(ptrs.size===2){const a=[...ptrs.values()];pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])}});
  root.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);
    if(ptrs.size===2){const a=[...ptrs.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),r=root.getBoundingClientRect();zoom(d/pinch,(a[0][0]+a[1][0])/2-r.left,(a[0][1]+a[1][1])/2-r.top);pinch=d;moved=9;return}
    if(drag){const dx=e.clientX-drag[0],dy=e.clientY-drag[1];moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));tx=drag[2]+dx;ty=drag[3]+dy;sync()}});
  const up=e=>{ptrs.delete(e.pointerId);if(!ptrs.size){drag=null;root.classList.remove('grab');if(moved<4&&e.type==='pointerup'&&!e.target.closest('.mk,.mp-ctl,.pop-c,.mp-legend,.mp-modes')){
      const r=root.getBoundingClientRect(),wx=(e.clientX-r.left-tx)/k,wy=(e.clientY-r.top-ty)/k;const b=cfg.buildings!==false&&mode!=='plan'&&k>fit*2.4?bldAt(wx,wy):null;if(b)selectBuilding(b,true);else closePop()}}};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('wheel',e=>{e.preventDefault();const r=root.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.0016),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  const setMode=m=>{mode=m;root.classList.toggle('sat',m==='sat');root.classList.toggle('plan',m==='plan');$$('.mp-modes button',root).forEach(b=>b.classList.toggle('on',b.dataset.mode===m))};
  root.addEventListener('click',e=>{const md=e.target.closest('[data-mode]');if(md){setMode(md.dataset.mode);return}const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m;
    if(m==='in')zoom(1.7);else if(m==='out')zoom(1/1.7);else if(m==='reset'){closePop();flyTo({x:bcx,y:bcy,k:fit},900)}else if(m==='lg'){const l=$('.mp-legend',root);l.hidden=!l.hidden}
    else if(m==='me'){me={x:bcx-200,y:bcy-150};build();flyTo({x:me.x,y:me.y,k:fit*5},1000);toast(_('تم تحديد موقعك التقريبي داخل المدينة','Showing your approximate position in the city'),'locate')}});
  const cls=()=>{root.classList.toggle('no-roads',!layers.has('roads'));root.classList.toggle('no-nbs',!layers.has('nbs'));root.classList.toggle('no-bld',!layers.has('buildings'));root.classList.toggle('bcat',layers.has('bcat'))};
  const api={el:root,select,selectBuilding,bldAt,closePop,flyTo,focusNb,focusPoint,zoom,setMode,
    setLayers(l){layers=l;cls();build()},setPoints(p){pts=p;pop&&closePop();lastK=-1;build()},setSat(b){setMode(b?'sat':'map')},
    points:()=>pts,fit:()=>fit,destroy(){ro.disconnect();cancelAnimationFrame(anim)}};
  cls();setMode(mode);return api;
}
const projPoints=()=>PROJECTS.map(p=>({id:p.id,type:'project',x:p.x,y:p.y,label:L(p),ref:p,plot:p.plot}));
const facPoints=()=>[...FAC.map(f=>({id:f.id,type:f.t,x:f.x,y:f.y,label:L(f),plot:f.plot,ref:f})),...LOTS.map(f=>({id:f.id,type:'lot',x:f.x,y:f.y,label:L(f),plot:f.plot,ref:f}))];
const projPopup=p=>{const pr=p.ref,av=PROPS.filter(x=>x.pr===pr.id&&x.status==='available').length+Math.round(pr.units*.18);
  return `<div class="pop-img" ${bg(pr.kind,pr.seed,pr.mood)}></div><div class="pop-b"><h4>${L(pr)}</h4><small>${L(NB[pr.nb])} · ${L(DEV[pr.dev])}</small><div class="pop-s"><div><b class="num">${N(av)}</b><span>${_('وحدة متاحة','units available')}</span></div><div><b class="num">${N(projFrom(pr.id)/1000)}k</b><span>${_('أقل سعر (ر.ع)','from (OMR)')}</span></div></div><div class="pop-a"><button class="btn btn-gold btn-sm" data-go="/properties?pr=${pr.id}">${_('عرض الوحدات','View units')}</button><button class="btn btn-ghost btn-sm" data-go="/city3d?focus=${BLD_OF_PR(pr.id)}" data-morph="city">${ic('cube',16)}${_('عرض ثلاثي الأبعاد','View in 3D')}</button></div></div>`};
const facPopup=p=>p.type==='lot'?`<div class="pop-b"><h4>${p.label}</h4><small>${_('قطعة استثمارية','Investment lot')} · ${p.plot}</small><div class="pop-a"><button class="btn btn-gold btn-sm" data-go="/city3d?focus=${p.ref.bld}" data-morph="city">${ic('cube',16)}${_('عرض ثلاثي الأبعاد','View in 3D')}</button></div></div>`:`<div class="pop-b"><h4>${p.label}</h4><small>${_(FNAME[p.type][0],FNAME[p.type][1])} · ${p.plot}</small>${p.ref&&p.ref.bld?`<div class="pop-a"><button class="btn btn-ghost btn-sm" data-go="/city3d?focus=${p.ref.bld}" data-morph="city">${ic('cube',16)}${_('عرض ثلاثي الأبعاد','View in 3D')}</button></div>`:''}</div>`;
const T2LABEL={apartment:['سكني عالي الكثافة','High-density apartment'],res_med:['سكني متوسط الكثافة','Medium-density residential'],
 villa:['فلل منخفضة الكثافة','Low-density villas'],edu:['تعليم','Education'],healthcare:['رعاية صحية','Healthcare'],
 religious:['ديني','Religious'],civic:['مدني','Civic'],culture:['ثقافة','Culture'],office:['مكاتب','Office'],
 retail:['تجزئة','Retail'],hospitality:['ضيافة','Hospitality'],industry:['صناعة وبحث وزراعة','Industry, R&D, agriculture'],
 transport:['نقل','Transport'],sports:['رياضة وترفيه','Sports / recreation'],utilities:['مرافق','Utilities']};
const bldPopup=b=>`<div class="pop-b bpop"><span class="ty" style="--c:${BT[b.type].hex}">${b.t2&&T2LABEL[b.t2]?_(...T2LABEL[b.t2]):L(BT[b.type])}</span><h4>${bName(b)}</h4><small>${b.plot} · ${L(NB[b.nb])}</small><div class="pop-s"><div><b class="num">${Math.round(b.h)} m</b><span>${_('الارتفاع','Height')}</span></div><div><b class="num">${b.floors}</b><span>${_('طوابق','Floors')}</span></div><div><b class="num">${b.year}</b><span>${_('الإكمال','Completion')}</span></div></div><dl class="pop-d"><div><dt>${_('الحالة','Status')}</dt><dd>${L(BSTATN[b.status])}</dd></div><div><dt>${_('المساحة','Area')}</dt><dd class="num">${N(b.area)} m²</dd></div><div><dt>${_('الاستخدام','Usage')}</dt><dd>${_(...b.use)}</dd></div></dl><div class="pop-a"><button class="btn btn-gold btn-sm" data-go="/city3d?focus=${b.id}" data-morph="city">${ic('cube',16)}${_('فتح في المدينة ثلاثية الأبعاد','Open in the 3D city')}</button></div></div>`;
