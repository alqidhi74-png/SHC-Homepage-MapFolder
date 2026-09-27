(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let lang = 'ar', mode = 'satellite', category = 'all', selectedDistrict = 'nb5', selectedBuilding = null, activeTab = 'overview', facilityFilter = null;
  const tr = (ar, en) => lang === 'ar' ? ar : en;
  const mobile = () => innerWidth <= 760;
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 950;
  const paths = {
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 6 0 0 1 16 0v3Z"/>',
    grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    services:'<circle cx="12" cy="6" r="3"/><path d="m12 13 5-3 5 3v6l-5 3-5-3-5 3-5-3v-6l5-3 5 3ZM12 13v6M2 13l5 3 5-3 5 3 5-3M7 16v6M17 16v6"/>',
    settings:'<path d="m9 3 1-1h4l1 3 3 1 3 1 1 4-2 2-1 3v3l-4 2-2-2-3-1-3 1-3-3 1-3-1-3-2-2 2-4 3 1Z"/><circle cx="12" cy="12" r="3"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 5 5"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    chevron:'<path d="m6 14 6-6 6 6"/>',
    globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
    home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/><path d="M16 5V3h3v5"/>',
    school:'<path d="m2 8 10-5 10 5-10 5z" fill="currentColor" stroke="none"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v8"/>',
    health:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z" fill="currentColor" stroke="none"/><path d="M7 12h3l2-4 2 8 2-4h2" stroke="#243039" stroke-width="1.5"/>',
    mosque:'<path d="M3 21V8l2-3 2 3v13M10 21v-9c0-3 3-3 3-6 0 3 3 3 3 6v9M19 21V5l2-3v19M2 21h20M12 21v-5h2v5"/>',
    park:'<path d="M12 3c-3-2-6 1-6 4-5 0-5 8 0 8h12c5 0 5-8 0-8 0-3-3-6-6-4ZM12 15v7M8 22h8"/>',
    water:'<path d="M2 7c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 17c3-4 5 4 8 0s5 4 8 0 4 0 4 0"/>',
    civic:'<path d="m2 8 10-6 10 6ZM3 21h18M4 18h16M6 10v8M10 10v8M14 10v8M18 10v8"/>',
    shopping:'<path d="M4 8h16l-1 13H5zM8 8V6a4 4 0 0 1 8 0v2M9 12v2M15 12v2"/>',
    project:'<path d="M3 21V10l4-2v13M10 21V3l5 3v15M18 21V11l3 2v8M1 21h22M12 7v2M12 12v2M12 17v2"/>',
    investment:'<path d="M6 6H3v15h18V6h-3M8 3h8v6H8z"/><path d="M15 12h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-4M12 11v10"/>',
    district:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M10 3h4M10 21h4M3 10v4M21 10v4"/>',
    roads:'<path d="M7 3 4 21M17 3l3 18M12 3v3M12 10v4M12 18v3"/>',
    green:'<path d="M3 8V4h18v4M3 16v4h18v-4M5 15c-7-8 18 2 13-4M7 9c4-8 12-6 12-6 0 7-5 10-9 8M9 11l6-5"/>',
    map:'<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3ZM8 2v17M16 5v17"/>',
    cube:'<path d="m12 2 10 5v10l-10 5-10-5V7zM2 7l10 5 10-5M12 12v10"/>',
    arrow:'<path d="M20 12H4m6-6-6 6 6 6"/>',
    locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    city:'<path d="M3 21V9h6v12M9 21V3h7v18M16 21V12h5v9M1 21h22M12 7h1M12 11h1M12 15h1M5 12h1M5 16h1M18 15h1"/>'
  };
  const icon = name => '<span data-icon="' + name + '"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.project) + '</svg></span>';
  function hydrate(root = document) {
    $$('[data-icon]', root).forEach(el => { if (!el.firstElementChild) el.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[el.dataset.icon] || paths.project) + '</svg>'; });
  }
  hydrate();
  $$('[data-en]').forEach(el => el.dataset.ar = el.textContent);
  const districts = [
    {id:'nb1',ar:'حي الوفاء',en:'Al Wafa',desc:'حي سكني متكامل يجمع بين الوحدات السكنية والخدمات والمساحات الخضراء.',descEn:'A connected residential neighbourhood with community services, landscaped streets and green open spaces.'},
    {id:'nb2',ar:'حي الأحلام',en:'Al Ahlam',desc:'مجتمع سكني حديث يوازن بين الخصوصية والمساحات الخضراء والمرافق اليومية.',descEn:'A contemporary community balancing privacy, green spaces and everyday amenities.'},
    {id:'nb3',ar:'وادي زها',en:'Wadi Zaha',desc:'منطقة سكنية تطل على وادي المدينة، تتصل بممرات خضراء ومسارات للمشي ومرافق مجتمعية.',descEn:'A waterside neighbourhood connected by green corridors, walking trails and community facilities.'},
    {id:'nb4',ar:'واحة الصاروج',en:'Al Sarooj Oasis',desc:'واحة حضرية تجمع أنماطًا سكنية متنوعة مع الحدائق ومسارات المشاة والخدمات المتكاملة.',descEn:'An urban oasis bringing together varied homes, parks, walking routes and local services.'},
    {id:'nb5',ar:'حي الياسمين',en:'Al Yasmeen',desc:'حي الياسمين، أحد الأحياء السكنية في مخطط مدينة السلطان هيثم. يجمع التصميم العصري والمرافق المتكاملة والمساحات الخضراء في بيئة سكنية مترابطة.',descEn:'Al Yasmeen is a residential neighbourhood in the Sultan Haitham City masterplan. Contemporary homes, community facilities and green spaces come together in a connected living environment.'},
    {id:'nb6',ar:'حي النُهى',en:'Al Nuha',desc:'مجتمع حضري معاصر يجمع السكن والعمل والخدمات والمساحات المفتوحة ضمن مخطط متكامل.',descEn:'A contemporary district bringing together homes, workplaces, community services and open spaces.'}
  ];
  const districtById = Object.fromEntries(districts.map(d => [d.id,d]));
  const names = {school:['مدرسة','School'],health:['مرفق صحي','Healthcare'],mosque:['مسجد','Mosque'],park:['حديقة','Park'],shopping:['تسوق وضيافة','Shopping & hospitality'],civic:['مرفق حكومي','Government facility'],investment:['قطعة استثمارية','Investment plot']};
  const pluralNames = {school:['مدارس','Schools'],health:['مرافق صحية','Healthcare'],mosque:['مساجد','Mosques'],park:['حدائق','Parks']};
  const typeName = t => tr(...(names[t] || ['مرفق','Facility']));
  const dName = id => districtById[id]?.[lang] || id;
  function normalizeType(t) {
    if (['school','university','kindergarten','college'].includes(t)) return 'school';
    if (['health','clinic','hospital'].includes(t)) return 'health';
    if (['mosque','mosque_grand','masjid'].includes(t)) return 'mosque';
    if (['park','garden'].includes(t)) return 'park';
    if (['shopping','mall','retail','hospitality','hotel'].includes(t)) return 'shopping';
    return 'civic';
  }
  let toastTimer;
  function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false; toastTimer = setTimeout(() => $('#toast').hidden = true, 4800); }
  function fail(message) {
    toast(message);
  }
  if (!window.maplibregl || !window.SC) { fail('تعذر تحميل الخريطة. تحقق من اتصال الإنترنت ثم أعد المحاولة.'); return; }

  let plan;
  try { plan = SC.ensurePlan(); } catch (e) { console.error(e); fail('تعذر تجهيز بيانات المخطط.'); return; }
  const center = [58.089396,23.6804874], box = plan.bbox;
  const halfLat = 2.775 / 111.32, halfLon = 1.95 / (111.32 * Math.cos(center[1] * Math.PI / 180));
  const ll = (x,z) => [center[0]-halfLon + (x-box[0])/(box[2]-box[0])*halfLon*2,center[1]+halfLat-(z-box[1])/(box[3]-box[1])*halfLat*2];
  const ring = poly => { const c=poly.map(p=>ll(...p)); if(c.length && (c[0][0]!==c.at(-1)[0]||c[0][1]!==c.at(-1)[1])) c.push(c[0]); return c; };
  const polygon = (poly,properties={}) => ({type:'Feature',properties,geometry:{type:'Polygon',coordinates:[ring(poly)]}});
  const fc = features => ({type:'FeatureCollection',features});
  const districtCenters = Object.fromEntries(plan.districts.map(d=>[d.id,ll(...d.c)]));
  const buildingById = new Map(plan.buildings.map(b=>[b.id,b]));
  const buildings = plan.buildings.flatMap(b=>(b.masses?.length?b.masses:[{poly:b.pts,h:b.h,y0:0}]).map(m=>polygon(m.poly,{
    id:b.id,district:b.nb,height:Math.max(3,Math.min(110,(+m.h||6)+(+m.y0||0))),base:+m.y0||0,
    kind:normalizeType(b.t),category:b.cat,plot:b.plotNo||''
  })));
  const facilities = [...(window.CITYD.facs||[]),...(window.CITYD.facsExtra||[])].map(f=>{
    const b=plan.buildings[f.bi];
    return {id:f.id,type:normalizeType(f.t),ar:f.ar,en:f.en,coord:ll(f.x,f.y),building:b,district:b?.nb};
  }).filter(f=>f.coord.every(Number.isFinite));
  // The source links each district to one representative building for 3D navigation.
  // It is the same neighbourhood, not a second project to display or search.
  const districtBuildings = Object.fromEntries((window.CITYD.prjs||[]).map(p=>[p.nb,plan.buildings[p.bi]]));
  const lots = (window.CITYD.lots||[]).map(p=>({...p,type:'investment',coord:ll(p.x,p.y),building:plan.buildings[p.bi]}));
  const facilityName = f => f[lang] || typeName(f.type);
  const style = {version:8,sources:{
    satellite:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,attribution:'Imagery © Esri'},
    planbase:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}
  },layers:[
    {id:'background',type:'background',paint:{'background-color':'#666c54'}},
    {id:'satellite-base',type:'raster',source:'satellite',paint:{'raster-saturation':-.16,'raster-contrast':.08,'raster-brightness-max':.9}},
    {id:'plan-base',type:'raster',source:'planbase',layout:{visibility:'none'},paint:{'raster-saturation':-.75,'raster-opacity':.9}}
  ]};
  let map, ready=false, popup=null, userMarker=null;
  const pins=[], districtPins=[];
  try {
    map=new maplibregl.Map({container:'map',style,center,zoom:14.15,pitch:48,bearing:-19,antialias:true,maxZoom:19,minZoom:10,attributionControl:false});
  } catch(e) { console.error(e); fail('تعذر تشغيل العرض التفاعلي. فعّل تسريع الرسومات في المتصفح ثم أعد المحاولة.'); return; }
  map.addControl(new maplibregl.AttributionControl({compact:false}),'bottom-left');
  map.addControl(new maplibregl.ScaleControl({maxWidth:110,unit:'metric'}),'bottom-right');
  let errorNotified=false;
  map.on('error',e=>{ if(!errorNotified && e.error?.message){errorNotified=true;toast(tr('تعذر تحميل بعض الصور الجوية. المخطط التفاعلي متاح؛ تحقق من الاتصال.','Some map imagery could not load. The interactive masterplan remains available.'));} });
  const loadTimeout=setTimeout(()=>{if(!ready)fail('استغرق تحميل الخريطة وقتًا أطول من المتوقع. تحقق من الاتصال وأعد المحاولة.');},25000);

  function addPlanLayers() {
    const trees=[];
    plan.roads.filter(r=>r.cls!=='loc').forEach(r=>{
      const setback=(SC.CFG.roads[r.cls]?.row||20)/2+5;
      for(let i=1;i<r.pl.length;i++){
        const a=r.pl[i-1],b=r.pl[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
        for(let step=38;step<length;step+=75){
          for(const side of [-1,1]){
            const x=a[0]+dx*step/length-dz/length*setback*side,z=a[1]+dz*step/length+dx/length*setback*side;
            if(!SC.g2.pip(x,z,plan.boundary)||SC.g2.pip(x,z,plan.lake)||SC.g2.pip(x,z,plan.wadi.canalPoly))continue;
            trees.push({type:'Feature',properties:{shade:trees.length%3},geometry:{type:'Point',coordinates:ll(x,z)}});
          }
        }
      }
    });
    map.addSource('city-boundary',{type:'geojson',data:polygon(plan.boundary)});
    map.addSource('districts',{type:'geojson',data:fc(plan.districts.map(d=>polygon(d.outline||d.poly,{id:d.id})))});
    map.addSource('buildings',{type:'geojson',data:fc(buildings)});
    map.addSource('roads',{type:'geojson',data:fc(plan.roads.map((r,i)=>({type:'Feature',properties:{id:i,cls:r.cls},geometry:{type:'LineString',coordinates:r.pl.map(p=>ll(...p))}})))});
    map.addSource('landscape',{type:'geojson',data:fc(plan.blocks.filter(b=>b.poly?.length>2).map(b=>polygon(b.poly,{green:String(b.use).includes('park')||String(b.use).includes('garden')})))});
    map.addSource('water-green',{type:'geojson',data:fc([polygon(plan.wadi.poly,{kind:'wadi'}),polygon(plan.wadi.canalPoly,{kind:'water'}),polygon(plan.lake,{kind:'water'})])});
    map.addSource('trees',{type:'geojson',data:fc(trees)});
    map.addLayer({id:'city-ground',type:'fill',source:'city-boundary',paint:{'fill-color':'#ad9d72','fill-opacity':.42}});
    map.addLayer({id:'land-parcels',type:'fill',source:'landscape',filter:['==',['get','green'],false],paint:{'fill-color':'#9b9e7b','fill-opacity':.65,'fill-outline-color':'#ddd0a855'}});
    map.addLayer({id:'parks',type:'fill',source:'landscape',filter:['==',['get','green'],true],paint:{'fill-color':'#65915a','fill-opacity':.9}});
    map.addLayer({id:'green-spine',type:'fill',source:'water-green',filter:['==',['get','kind'],'wadi'],paint:{'fill-color':'#6a945b','fill-opacity':.9}});
    map.addLayer({id:'water',type:'fill',source:'water-green',filter:['==',['get','kind'],'water'],paint:{'fill-color':'#477e88','fill-opacity':.95}});
    map.addLayer({id:'roads-glow',type:'line',source:'roads',filter:['in',['get','cls'],['literal',['ring','art']]],paint:{'line-color':'#ffe0a3','line-width':9,'line-opacity':.38,'line-blur':4}});
    map.addLayer({id:'roads-main',type:'line',source:'roads',paint:{'line-color':['match',['get','cls'],'ring','#f1cf85','art','#ecd197','col','#e0d5b2','#d7cdaf'],'line-width':['interpolate',['linear'],['zoom'],12,['match',['get','cls'],'ring',2,'art',1.5,.5],16,['match',['get','cls'],'ring',9,'art',6,'col',3,1.4]],'line-opacity':.94}});
    map.addLayer({id:'district-fill',type:'fill',source:'districts',paint:{'fill-color':'#86592d','fill-opacity':.02}});
    map.addLayer({id:'district-outline',type:'line',source:'districts',paint:{'line-color':'#ffe0a0','line-width':1.4,'line-opacity':.65}});
    map.addLayer({id:'district-highlight-fill',type:'fill',source:'districts',filter:['==',['get','id'],'none'],paint:{'fill-color':'#edb63f','fill-opacity':.13}});
    map.addLayer({id:'trees',type:'circle',source:'trees',paint:{'circle-radius':['interpolate',['exponential',1.6],['zoom'],12,.65,15,2.1,18,8],'circle-color':['match',['get','shade'],0,'#4d7140',1,'#6b874c','#3f603a'],'circle-stroke-color':'#aec18b','circle-stroke-width':.35,'circle-pitch-alignment':'map','circle-pitch-scale':'map'}});
    map.addLayer({id:'future-buildings-layer',type:'fill-extrusion',source:'buildings',filter:['!=',['get','category'],'park'],paint:{'fill-extrusion-color':['match',['get','kind'],'mosque','#ead7a2','school','#dbceac','health','#ded0b5','#e5d8bc'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','base'],'fill-extrusion-opacity':.97,'fill-extrusion-vertical-gradient':true}});
    map.addLayer({id:'commercial-areas',type:'fill',source:'buildings',filter:['in',['get','category'],['literal',['commercial','office','shopping','hospitality']]],layout:{visibility:'none'},paint:{'fill-color':'#bb83c8','fill-opacity':.8}});
    map.addLayer({id:'district-highlight-glow',type:'line',source:'districts',filter:['==',['get','id'],'none'],paint:{'line-color':'#ffc96a','line-width':13,'line-opacity':.65,'line-blur':8}});
    map.addLayer({id:'district-highlight',type:'line',source:'districts',filter:['==',['get','id'],'none'],paint:{'line-color':'#ffe3a1','line-width':3,'line-opacity':1}});
    map.addLayer({id:'boundary-glow',type:'line',source:'city-boundary',paint:{'line-color':'#ffc86f','line-width':12,'line-opacity':.55,'line-blur':7}});
    map.addLayer({id:'boundary-line',type:'line',source:'city-boundary',paint:{'line-color':'#ffe3a5','line-width':2.4,'line-opacity':.97}});
    map.setLight({anchor:'viewport',color:'#fff2d5',intensity:.45,position:[1.5,210,40]});
  }
  function addMarkers() {
    districts.forEach(d=>{
      const el=document.createElement('button');el.type='button';el.className='district-marker';el.dataset.id=d.id;
      el.innerHTML='<span class="district-pin">'+icon('home')+'</span><span class="district-label">'+esc(dName(d.id))+'</span>';
      el.setAttribute('aria-label',dName(d.id));el.onclick=e=>{e.stopPropagation();showDistrict(d.id,true);};
      const marker=new maplibregl.Marker({element:el,anchor:'bottom',offset:[0,12]}).setLngLat(districtCenters[d.id]).addTo(map);
      districtPins.push({d,el,marker,coord:districtCenters[d.id]});
    });
    // The wrapper transform belongs to MapLibre. Hover scaling is confined to .pin-face.
    [...facilities,...lots].forEach(f=>{
      const el=document.createElement('button');el.type='button';el.className='poi-marker '+f.type;el.dataset.type=f.type;el.dataset.id=f.id;
      el.innerHTML='<span class="pin-face">'+icon(f.type)+'</span><span class="poi-label"></span>';
      el.onclick=e=>{e.stopPropagation();f.type==='investment'?selectBuilding(f.building):selectFacility(f);};
      const marker=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat(f.coord).addTo(map);
      pins.push({f,el,marker});
    });
    updateLabels();
  }
  const layerEnabled=key=>!!$('[data-layer="'+key+'"]')?.checked;
  function updateLabels() {
    districtPins.forEach(o=>{$('.district-label',o.el).textContent=dName(o.d.id);o.el.setAttribute('aria-label',dName(o.d.id));});
    pins.forEach(o=>{const name=o.f.type==='investment'?typeName('investment')+' '+o.f.id:facilityName(o.f);$('.poi-label',o.el).textContent=name;o.el.setAttribute('aria-label',name);});
  }
  let markersFrame=0;
  function scheduleMarkers(){if(!markersFrame) markersFrame=requestAnimationFrame(()=>{markersFrame=0;updateMarkers();});}
  function updateMarkers() {
    if(!ready)return;
    // Each checkbox is authoritative. Never let one marker hide or replace another.
    // MapLibre clips offscreen markers; panels cover them without changing visibility.
    districtPins.forEach(o=>o.el.hidden=!layerEnabled('district-labels'));
    pins.forEach(o=>o.el.hidden=!layerEnabled(o.f.type));
    $('#compassNeedle').style.transform='rotate('+(-map.getBearing())+'deg)';
    $('#tiltMap').setAttribute('aria-pressed',String(map.getPitch()>20));
  }
  function applyLayers() {
    if(!ready)return;
    const visibility=(id,enabled)=>map.setLayoutProperty(id,'visibility',enabled?'visible':'none');
    visibility('future-buildings-layer',layerEnabled('buildings'));
    ['roads-main','roads-glow'].forEach(id=>visibility(id,layerEnabled('roads')));
    ['district-fill','district-outline','district-highlight','district-highlight-glow','district-highlight-fill'].forEach(id=>visibility(id,layerEnabled('districts')));
    visibility('parks',layerEnabled('park'));
    visibility('green-spine',layerEnabled('green'));
    visibility('trees',layerEnabled('trees'));
    visibility('water',layerEnabled('water'));
    visibility('land-parcels',layerEnabled('parcels'));
    ['boundary-line','boundary-glow'].forEach(id=>visibility(id,layerEnabled('boundary')));
    visibility('commercial-areas',layerEnabled('commercial'));
    const popupLayer=popup?.getElement()?.querySelector('[data-popup-layer]')?.dataset.popupLayer;
    if(popupLayer&&!layerEnabled(popupLayer))popup.remove();
    $('#layerCount').textContent=$$('[data-layer]:checked').length+tr(' طبقات مفعّلة',' active layers');
    scheduleMarkers();
  }
  function toggleLayers(force) {
    const on=force??!$('#layersPanel').classList.contains('open');
    $('#layersPanel').classList.toggle('open',on);$('.map-stage').classList.toggle('layers-closed',!on);
    $('#layersTrigger').setAttribute('aria-expanded',String(on));$('#layersPanel').inert=!on;scheduleMarkers();
  }
  function cardVisible(on){$('#infoCard').classList.toggle('hidden',!on);$('#infoCard').inert=!on;$('.map-stage').classList.toggle('card-open',on);scheduleMarkers();}
  function setHighlight(id){['district-highlight','district-highlight-glow','district-highlight-fill'].forEach(l=>map.setFilter(l,['==',['get','id'],id||'none']));districtPins.forEach(o=>{o.el.classList.toggle('on',o.d.id===id);o.el.setAttribute('aria-pressed',String(o.d.id===id));});}
  function fitPadding() {
    const h=map.getContainer().clientHeight;
    const headerHeight=$('.topbar').offsetHeight;
    if(mobile())return {top:headerHeight+115,bottom:$('#infoCard').classList.contains('hidden')?108:Math.min($('#infoCard').offsetHeight+95,Math.round(h*.6)),left:25,right:49};
    return {top:headerHeight+Math.min(200,h*.25),bottom:110,left:$('#layersPanel').classList.contains('open')?$('#layersPanel').offsetWidth+52:65,right:$('#infoCard').classList.contains('hidden')?Math.min(220,innerWidth*.12):$('#infoCard').offsetWidth+65};
  }
  function bounds(poly){const coords=ring(poly);return coords.reduce((b,p)=>b.extend(p),new maplibregl.LngLatBounds(coords[0],coords[0]));}
  function overview(duration=motion()){
    const pitch=mode==='plan'?0:46,bearing=mode==='plan'?-8:-19;
    const camera=map.cameraForBounds(bounds(plan.boundary),{padding:fitPadding(),bearing,maxZoom:14.6});
    // A pitched city occupies less vertical screen space than its flat bounds.
    const zoomAdjustment=mode==='plan'?0:mobile()?.15:.32;
    if(camera)map.easeTo({...camera,pitch,bearing,zoom:camera.zoom+zoomAdjustment,duration});
  }
  function showDistrict(id,fly=false) {
    if(!districtById[id])return;
    selectedDistrict=id;selectedBuilding=null;activeTab='overview';facilityFilter=null;
    setHighlight(id);cardVisible(true);renderCard();
    if(mobile())toggleLayers(false);
    if(fly){const d=plan.districts.find(x=>x.id===id);map.fitBounds(bounds(d.outline||d.poly),{padding:fitPadding(),pitch:mode==='plan'?0:51,bearing:map.getBearing(),maxZoom:15.7,duration:motion()});}
  }
  function itemHTML(type,title,sub,index){return '<button type="button" class="detail-item" data-item="'+index+'"><span class="'+type+'">'+icon(type)+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></span><span class="item-arrow">'+icon('arrow')+'</span></button>';}
  function renderCard() {
    const district=districtById[selectedDistrict];
    if(!district)return;
    const b=selectedBuilding;
    $('#cardTitle').textContent=b?(b.name?.[lang==='ar'?0:1]||tr('مبنى سكني','Residential building')):dName(selectedDistrict);
    $('#cardSubtitle').textContent=b?tr('قطعة ','Plot ')+b.plotNo:tr('حي سكني متكامل وحديث','A connected, contemporary neighbourhood');
    const focusBuilding=b||districtBuildings[selectedDistrict];
    $('#threeDBtn').href='city3d.html'+(focusBuilding?'?focus='+encodeURIComponent(focusBuilding.id):'');
    $$('[data-tab]').forEach(el=>{const on=el.dataset.tab===activeTab;el.classList.toggle('on',on);el.setAttribute('aria-selected',String(on));el.tabIndex=on?0:-1;});
    $('#tabContent').setAttribute('aria-labelledby','tab-'+activeTab);
    const local=facilities.filter(f=>f.district===selectedDistrict);
    const host=$('#tabContent');
    if(activeTab==='overview') {
      if(b) {
        host.innerHTML='<p class="card-desc">'+esc(tr('مبنى ضمن المخطط المستقبلي في ','A building in the future masterplan of ')+dName(b.nb))+'</p><div class="building-summary"><div><small>'+tr('ارتفاع تقريبي','Approx. height')+'</small><b>'+Math.round(b.h||0)+tr(' م',' m')+'</b></div><div><small>'+tr('رقم القطعة','Plot number')+'</small><b dir="ltr">'+esc(b.plotNo)+'</b></div></div>';
      } else {
        host.innerHTML='<p class="card-desc">'+esc(lang==='ar'?district.desc:district.descEn)+'</p><div class="stat-grid">'+['school','health','mosque','park'].map(t=>'<button type="button" data-stat="'+t+'"><span class="'+t+'">'+icon(t)+'</span><b>'+tr(...pluralNames[t])+'</b><strong>'+local.filter(f=>f.type===t).length+'</strong></button>').join('')+'</div>';
        $$('[data-stat]',host).forEach(el=>el.onclick=()=>{facilityFilter=el.dataset.stat;activeTab='facilities';renderCard();});
      }
    } else if(activeTab==='facilities') {
      const list=local.filter(f=>!facilityFilter||f.type===facilityFilter);
      host.innerHTML='<div class="detail-list">'+(list.length?list.map((f,i)=>itemHTML(f.type,facilityName(f),typeName(f.type),i)).join(''):'<p class="empty-state">'+tr('لا توجد مرافق من هذا النوع في بيانات الحي.','No facilities of this type are listed in this district.')+'</p>')+'</div>';
      $$('[data-item]',host).forEach(el=>el.onclick=()=>selectFacility(list[+el.dataset.item]));
    } else {
      host.innerHTML='<figure class="photo-preview"><img src="assets/district-card.jpg" alt="'+tr('تصور معماري للمجتمع السكني','Architectural concept of the neighbourhood')+'"><figcaption>'+tr('تصور معماري توضيحي للمجتمع السكني','Illustrative architectural concept')+'</figcaption></figure>';
    }
    scheduleMarkers();
  }
  function selectBuilding(b) {
    if(!b)return;popup?.remove();
    selectedBuilding=b;selectedDistrict=b.nb;activeTab='overview';setHighlight(b.nb);cardVisible(true);renderCard();
    if(mobile())toggleLayers(false);
    focusPoint(ll(b.x,b.z),17);
  }
  function focusPoint(coord,zoom) {
    const p=fitPadding();
    map.easeTo({center:coord,zoom,pitch:mode==='plan'?0:57,offset:[(p.left-p.right)/2,(p.top-p.bottom)/2],duration:motion()});
  }
  function selectFacility(f) {
    popup?.remove();if(mobile())cardVisible(false);
    if(!['all','facilities'].includes(category))setCategory('facilities');
    const check=$('[data-layer="'+f.type+'"]');if(check)check.checked=true;
    applyLayers();focusPoint(f.coord,16.5);
    const host=document.createElement('div');
    host.dataset.popupLayer=f.type;
    host.innerHTML='<div class="pop-title">'+esc(facilityName(f))+'</div><div class="pop-sub">'+esc(typeName(f.type)+' · '+dName(f.district))+'</div>'+(f.building?'<a class="pop-action" href="city3d.html?focus='+encodeURIComponent(f.building.id)+'">'+tr('عرض ثلاثي الأبعاد ←','View in 3D →')+'</a>':'');
    popup=new maplibregl.Popup({offset:38,maxWidth:'270px',closeOnClick:true}).setLngLat(f.coord).setDOMContent(host).addTo(map);
  }
  const markerLayerKeys=['district-labels','investment',...new Set(facilities.map(f=>f.type))];
  let layersBeforeFilter=null;
  function markCategory(next) {
    category=next;
    $$('[data-category]').forEach(el=>{el.classList.toggle('on',el.dataset.category===next);el.setAttribute('aria-pressed',String(el.dataset.category===next));});
  }
  function setCategory(next) {
    markCategory(next);
    if(next==='all') {
      if(layersBeforeFilter)markerLayerKeys.forEach(key=>$('[data-layer="'+key+'"]').checked=layersBeforeFilter[key]);
      layersBeforeFilter=null;
    } else {
      if(!layersBeforeFilter)layersBeforeFilter=Object.fromEntries(markerLayerKeys.map(key=>[key,layerEnabled(key)]));
      markerLayerKeys.forEach(key=>{
        $('[data-layer="'+key+'"]').checked=next==='districts'?key==='district-labels':next==='plots'?key==='investment':!['district-labels','investment'].includes(key);
      });
    }
    applyLayers();renderSearch();scheduleMarkers();
  }
  function onLayerChange() {
    // Manual choices take precedence over a quick filter, including unchecked lots.
    layersBeforeFilter=null;markCategory('all');applyLayers();renderSearch();
  }
  function setMode(next){
    if(!ready||!['satellite','plan'].includes(next))return;mode=next;$('.map-stage').dataset.mode=next;
    map.setLayoutProperty('satellite-base','visibility',next==='satellite'?'visible':'none');
    map.setLayoutProperty('plan-base','visibility',next==='plan'?'visible':'none');
    $$('.mode[data-mode]').forEach(el=>{el.classList.toggle('on',el.dataset.mode===next);el.setAttribute('aria-pressed',String(el.dataset.mode===next));});
    map.setPaintProperty('city-ground','fill-color',next==='plan'?'#e3dbc2':'#ad9d72');
    map.setPaintProperty('city-ground','fill-opacity',next==='plan'?.94:.42);
    map.setPaintProperty('land-parcels','fill-color',next==='plan'?'#d4cbb0':'#9b9e7b');
    map.setPaintProperty('future-buildings-layer','fill-extrusion-color',next==='plan'?'#c7b997':['match',['get','kind'],'mosque','#ead7a2','school','#dbceac','health','#ded0b5','#e5d8bc']);
    map.easeTo({pitch:next==='plan'?0:49,duration:motion()});
    popup?.remove();
  }
  function resetView(){popup?.remove();selectedBuilding=null;setCategory('all');cardVisible(false);setHighlight(null);overview();}
  const normal = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  const candidates=[
    ...districts.map(d=>({category:'districts',icon:'home',label:()=>dName(d.id),search:d.ar+' '+d.en,sub:()=>tr('حي / مشروع سكني','District / residential project'),action:()=>showDistrict(d.id,true)})),
    ...facilities.map(f=>({category:'facilities',icon:f.type,label:()=>facilityName(f),search:(f.ar||'')+' '+(f.en||'')+' '+names[f.type].join(' '),sub:()=>typeName(f.type)+' · '+dName(f.district),action:()=>selectFacility(f)})),
    ...plan.buildings.map(b=>({category:'plots',icon:'district',label:()=>b.plotNo||b.id,search:(b.plotNo||'')+' '+b.id+' '+(b.lot||''),sub:()=>tr('قطعة في ','Plot in ')+dName(b.nb),action:()=>selectBuilding(b)}))
  ];
  function closeSearch(){$('#searchResults').hidden=true;$('#searchInput').setAttribute('aria-expanded','false');}
  function renderSearch(){
    const q=normal($('#searchInput').value.trim()),host=$('#searchResults');
    $('#clearSearch').hidden=!q;
    if(!q){closeSearch();return;}
    const matches=candidates.filter(c=>(category==='all'||c.category===category)&&normal(c.search+' '+c.label()).includes(q)).slice(0,9);
    host.innerHTML=matches.length?matches.map((c,i)=>'<button class="search-item" type="button" data-result="'+i+'">'+icon(c.icon)+'<span><strong>'+esc(c.label())+'</strong><small>'+esc(c.sub())+'</small></span></button>').join(''):'<div class="empty-state">'+tr('لا توجد نتائج مطابقة. جرّب اسم حي أو رقم قطعة.','No results. Try a district name or plot number.')+'</div>';
    host.hidden=false;$('#searchInput').setAttribute('aria-expanded','true');
    $$('[data-result]',host).forEach(el=>el.onclick=()=>{matches[+el.dataset.result].action();closeSearch();$('#searchInput').blur();});
  }
  function setLanguage(next){
    if(!['ar','en'].includes(next)||next===lang)return;
    lang=next;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    $$('[data-en]').forEach(el=>el.textContent=el.dataset[lang]);
    $$('.header-actions a').forEach(el=>el.title=$('[data-en]',el).textContent);
    $$('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===lang)));
    $('#searchInput').placeholder=tr('ابحث عن حي، مشروع، مرفق، رقم قطعة…','Search districts, projects, facilities, plots…');
    document.title=tr('مدينة السلطان هيثم | الخريطة التفاعلية','Sultan Haitham City | Interactive map');
    popup?.remove();updateLabels();renderCard();applyLayers();renderSearch();
  }
  function bindUI(){
    $$('[data-language]').forEach(el=>el.onclick=()=>setLanguage(el.dataset.language));
    $('#layersTrigger').onclick=()=>toggleLayers();$('#closeLayers').onclick=()=>{toggleLayers(false);$('#layersTrigger').focus();};
    $('#closeCard').onclick=()=>{cardVisible(false);districtPins.find(o=>o.d.id===selectedDistrict)?.el.focus({preventScroll:true});};
    $$('.group-title').forEach(el=>el.onclick=()=>el.setAttribute('aria-expanded',String(el.getAttribute('aria-expanded')!=='true')));
    $$('[data-layer]').forEach(el=>el.onchange=onLayerChange);
    $('#resetLayers').onclick=()=>{$$('[data-layer]').forEach(el=>el.checked=el.defaultChecked);onLayerChange();};
    $$('[data-category]').forEach(el=>el.onclick=()=>setCategory(el.dataset.category));
    $$('.mode[data-mode]').forEach(el=>el.onclick=()=>setMode(el.dataset.mode));
    $$('[data-tab]').forEach(el=>{el.onclick=()=>{activeTab=el.dataset.tab;facilityFilter=null;renderCard();};el.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-tab]'),n=tabs.length;let i=tabs.indexOf(el);i=e.key==='Home'?0:e.key==='End'?n-1:(i+(e.key==='ArrowRight'?(lang==='ar'?-1:1):(lang==='ar'?1:-1))+n)%n;tabs[i].click();tabs[i].focus();};});
    $('#zoomIn').onclick=()=>map.zoomIn({duration:motion()/3});$('#zoomOut').onclick=()=>map.zoomOut({duration:motion()/3});
    $('#northBtn').onclick=()=>map.easeTo({bearing:0,duration:motion()});
    $('#tiltMap').onclick=()=>map.easeTo({pitch:map.getPitch()>20?0:55,duration:motion()});
    $('#resetMap').onclick=resetView;
    $('#exploreBtn').onclick=()=>{cardVisible(false);if(mobile())toggleLayers(false);if(selectedBuilding)focusPoint(ll(selectedBuilding.x,selectedBuilding.z),17.3);else {const d=plan.districts.find(x=>x.id===selectedDistrict);map.fitBounds(bounds(d.outline||d.poly),{padding:fitPadding(),maxZoom:16,pitch:mode==='plan'?0:58,duration:motion()});}};
    $('#searchInput').addEventListener('input',renderSearch);$('#searchInput').addEventListener('focus',renderSearch);
    $('#searchInput').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){$('.search-item')?.focus();e.preventDefault();}if(e.key==='Enter')$('.search-item')?.click();});
    $('#searchResults').addEventListener('keydown',e=>{const items=$$('.search-item'),i=items.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}});
    $('#clearSearch').onclick=()=>{$('#searchInput').value='';closeSearch();$('#clearSearch').hidden=true;$('#searchInput').focus();};
    document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-box'))closeSearch();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();popup?.remove();if(mobile())toggleLayers(false);}});
    $('#locateBtn').onclick=()=>{
      if(!navigator.geolocation){toast(tr('تحديد الموقع غير متاح في هذا المتصفح.','Geolocation is not available in this browser.'));return;}
      $('#locateBtn').disabled=true;
      navigator.geolocation.getCurrentPosition(p=>{const c=[p.coords.longitude,p.coords.latitude];if(!userMarker){const el=document.createElement('div');el.className='user-location';el.setAttribute('aria-label',tr('موقعك الحالي','Your location'));userMarker=new maplibregl.Marker({element:el}).setLngLat(c).addTo(map);}else userMarker.setLngLat(c);cardVisible(false);map.flyTo({center:c,zoom:15,pitch:0,duration:motion()});$('#locateBtn').disabled=false;},e=>{$('#locateBtn').disabled=false;toast(e.code===1?tr('اسمح للمتصفح بالوصول إلى موقعك لاستخدام هذه الأداة.','Allow location access in your browser to use this tool.'):tr('تعذر تحديد موقعك. حاول مرة أخرى.','Your location could not be determined. Please try again.'));},{timeout:12000,maximumAge:60000});
    };
    map.on('click',e=>{
      if(e.originalEvent.target.closest('.maplibregl-marker'))return;
      const layers=['future-buildings-layer','district-fill'].filter(l=>map.getLayoutProperty(l,'visibility')!=='none');
      const features=map.queryRenderedFeatures(e.point,{layers});
      const building=features.find(f=>f.layer.id==='future-buildings-layer');
      if(building)selectBuilding(buildingById.get(building.properties.id));else if(features[0])showDistrict(features[0].properties.id,true);
    });
    map.on('mousemove',e=>{const f=map.queryRenderedFeatures(e.point,{layers:['future-buildings-layer','district-fill']});map.getCanvas().style.cursor=f.length?'pointer':'';});
    map.on('move',scheduleMarkers);map.on('resize',scheduleMarkers);
    new ResizeObserver(()=>{$('.map-stage').style.setProperty('--sheet-height',$('#infoCard').offsetHeight+'px');scheduleMarkers();}).observe($('#infoCard'));
    let wasMobile=mobile(),wasCompact=innerWidth<=1000;
    window.addEventListener('resize',()=>{
      const isMobile=mobile(),isCompact=innerWidth<=1000;
      if(wasMobile!==isMobile||wasCompact!==isCompact){
        wasMobile=isMobile;wasCompact=isCompact;toggleLayers(!isCompact);map.resize();overview(0);
      }
      scheduleMarkers();
    });
  }
  map.on('load',()=>{
    clearTimeout(loadTimeout);
    try {
      addPlanLayers();ready=true;addMarkers();bindUI();
      toggleLayers(innerWidth>1000);applyLayers();renderCard();cardVisible(false);setHighlight(null);overview(0);
      const params=new URLSearchParams(location.search);
      if(params.has('bld'))selectBuilding(buildingById.get(params.get('bld')));
      else if(districtById[params.get('focus')])showDistrict(params.get('focus'),true);
      scheduleMarkers();
    } catch(e){console.error(e);fail('تعذر إكمال تجهيز الخريطة. أعد المحاولة.');}
  });
})();
