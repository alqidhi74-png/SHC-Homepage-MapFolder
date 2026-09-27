/* ---------- 3D city: real-time digital twin of the master plan ---------- */
/* ============================================================================
   INTEGRATION NOTES
   ----------------------------------------------------------------------------
   The city itself lives in js/city/*.js (namespace SC):
     00-core     math / geometry          40-streets    street engineering
     10-config   planning rules           45-landscape  trees, furniture, people
     15-sites    facility site plans      50/52-arch    buildings & facilities
     20-plan     master-plan generator    55-props      vehicles, props, models
     30-mesh     mesh builder             60-world      chunked LOD meshes
     70-engine   WebGL2 renderer          80-sim        traffic & pedestrians
     90-catalog  building / facility information (description, services,
                 smart systems, key figures, live readings)
   This file is the portal adapter. Globals it publishes (used by the pages):
     BT, BT2, BSTATN            category / status labels & colours
     bName(b)                   display name of a building
     BLDS, BLD                  building list / lookup (lazy: first access
                                generates the plan)
     BLD_OF_PR(id)              project id → building id
     bEnergy(b)                 synthetic monthly energy series
     bInfo(b)                   catalog information for a building
     City3D(canvas, callbacks)  the 3D twin (API listed at the bottom)
     ensureCityPlan()           generate / return the plan (SC.plan)
   ============================================================================ */
(function(){
'use strict';
const SC=window.SC,g2=SC.g2,clampN=SC.clamp,lerpN=SC.lerp||((a,b,t)=>a+(b-a)*t);
const BT={res:{ar:'سكني',en:'Residential',c:[73,17,29],hex:'#49111D'},gov:{ar:'حكومي',en:'Government',c:[61,78,30],hex:'#3D4E1E'},com:{ar:'تجاري',en:'Commercial',c:[248,99,62],hex:'#F8633E'},svc:{ar:'خدمات',en:'Services',c:[241,187,77],hex:'#F1BB4D'}};
const BT2={apartment:{ar:'سكني عالي الكثافة',en:'High-density apartment',hex:'#C82627'},res_med:{ar:'سكني متوسط الكثافة',en:'Medium-density residential',hex:'#D65E3C'},villa:{ar:'فلل منخفضة الكثافة',en:'Low-density villas',hex:'#F6EC3A'},
  edu:{ar:'تعليم',en:'Education',hex:'#7FC9F0'},healthcare:{ar:'رعاية صحية',en:'Healthcare',hex:'#A6C9C8'},religious:{ar:'ديني',en:'Religious',hex:'#B4DEEE'},civic:{ar:'مدني',en:'Civic',hex:'#76B8C1'},culture:{ar:'ثقافة',en:'Culture',hex:'#DAC6E0'},
  office:{ar:'مكاتب',en:'Office',hex:'#566196'},retail:{ar:'تجزئة',en:'Retail',hex:'#CF9AB6'},hospitality:{ar:'ضيافة',en:'Hospitality',hex:'#F198A5'},industry:{ar:'صناعة وبحث وزراعة',en:'Industry, R&D, agriculture',hex:'#696968'},
  transport:{ar:'نقل',en:'Transport',hex:'#959695'},sports:{ar:'رياضة وترفيه',en:'Sports / recreation',hex:'#C5E8CB'},utilities:{ar:'مرافق',en:'Utilities',hex:'#CCD1D2'}};
const BSTATN={existing:{ar:'قائم',en:'Existing'},constr:{ar:'تحت الإنشاء',en:'Under construction'},proposed:{ar:'مقترح',en:'Proposed'}};
const OWNERS=['شركة الأفق العمرانية','مسار للتطوير العقاري','دار الوادي','لؤلؤة الخليج للعقارات','وزارة الإسكان والتخطيط العمراني','بلدية المدينة'];
const bStatus=y=>y<=2026?'existing':y<=2030?'constr':'proposed';
const tr=(a)=>typeof _==='function'?_(a[0],a[1]):a[1];

/* ------------------------------------------------ building records ---- */
const BLDS_=[],BLD_={};
/* one-time scene preparation: plan → street engineering → landscape */
function prepare(){const plan=SC.ensurePlan();if(!plan._prepared){plan._prepared=true;SC.streets.build(plan);SC.landscape.build(plan);
    for(const e of plan.edges)e.fidD=-1;for(const n of plan.nodes)n.fidD=-1;for(const b of plan.blocks)b.fidD=-1}return plan}
/* called by js/03-data.js cityLink() right after the plan is generated */
function cityLinkBuildings(){const plan=SC.plan;if(!plan||BLDS_.length)return;const R=SC.rng(2026);
  for(const r of plan.buildings){SC.catalog.prep(r);const k=SC.catalog.of(r);
    const b={id:r.id,i:r.idx,r,plot:r.plotNo,nb:r.nb,type:k.bt,t2:k.t2,kind:r.kind,cat:r.cat,h:Math.round(r.h*10)/10,year:r.year,status:bStatus(r.year),floors:r.floors||1,
      area:r.gfa||r.area||0,use:k.label,owner:OWNERS[Math.floor(R()*OWNERS.length)],kwh:Math.max(20,Math.round((r.gfa||200)*.11/10)*10),fac:r.facId||null,lot:r.lot||null,pr:r.project||null,
      pts:r.pts,x:r.x,z:r.z,bx0:r.bx0,bz0:r.bz0,bx1:r.bx1,bz1:r.bz1,flat:r.cat==='park',landmark:!!r.landmark,name:r.name||null};
    BLDS_.push(b);BLD_[b.id]=b}
  if(typeof PROJECTS!=='undefined')PROJECTS.forEach(p=>{const b=BLDS_[p.bi];p.bld=b?b.id:null});
  if(typeof FAC!=='undefined')FAC.forEach(f=>{f.bld=f.bi!=null&&f.bi>=0&&BLDS_[f.bi]?BLDS_[f.bi].id:null});
  if(typeof LOTS!=='undefined')LOTS.forEach(l=>{l.bld=BLDS_[l.bi]?BLDS_[l.bi].id:null})}
const ensureCityPlan=()=>{const p=SC.ensurePlan();if(!BLDS_.length)cityLinkBuildings();return p};
Object.defineProperty(window,'BLDS',{configurable:true,get(){ensureCityPlan();return BLDS_}});
Object.defineProperty(window,'BLD',{configurable:true,get(){ensureCityPlan();return BLD_}});
const BLD_OF_PR=id=>{ensureCityPlan();return PR[id]&&PR[id].bld};
const bName=b=>{if(!b)return'';const f=b.fac&&typeof FAC!=='undefined'&&FAC.find(x=>x.id===b.fac);if(f)return L(f);if(b.lot)return _('برج القطعة ','Lot tower ')+b.lot;if(b.name)return _(b.name[0],b.name[1]);const k=SC.catalog.of(b.r);return _(k.label[0],k.label[1])+' '+b.plot};
const bEnergy=b=>{const R=SC.rng(b.kwh+b.i),base=b.kwh;return Array.from({length:12},(_a,i)=>Math.round(base*(.78+.3*Math.sin((i-3)/12*6.283)+R()*.12)))};
/* catalog view of a building, localised */
const bInfo=b=>{const r=b.r,k=SC.catalog.of(r);const loc=v=>Array.isArray(v)?tr(v):v;
  return{label:tr(k.label),icon:k.icon,desc:tr(k.desc),services:k.services.map(tr),smart:k.smart.map(tr),
    metrics:SC.catalog.metrics(r).map(m=>[tr(m[0]),loc(m[1])]),live:SC.catalog.live(r,performance.now()/1000).map(m=>[tr(m[0]),loc(m[1])]),t2:BT2[k.t2]?L(BT2[k.t2]):''}};

/* ============================================================== City3D === */
function City3D(canvas,cb={}){
  const plan=prepare();ensureCityPlan();
  const host=canvas.parentElement;
  const E=SC.Engine&&(()=>{try{return SC.Engine(canvas,{features:plan.buildings.length+8})}catch(err){console.error(err);return null}})();
  if(!E){const m=document.createElement('div');m.className='c3-nogl';m.style.cssText='position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;color:#fff;background:#2b2b2b';
    m.innerHTML=`<p>${_('يتطلب النموذج ثلاثي الأبعاد متصفحًا يدعم WebGL2.','The 3D model needs a browser with WebGL2 support.')}</p>`;host&&host.appendChild(m);
    const nop=()=>{};return{select:nop,focus:nop,reset:nop,orbit:nop,zoom:nop,view:nop,camera:()=>null,perf:()=>null,set:nop,firstMatch:()=>null,stats:()=>({done:0,mid:0,plan:0,total:0}),count:()=>0,year:()=>2026,info:()=>null,destroy(){m.remove()}}}
  const B=plan.buildings,NB_=B.length;
  /* ---------------------------------------------------------------- world */
  const W=SC.World(plan);
  {const M=SC.Mesh(1024);W.L1.terrain(M);E.setChunk('terrain',{bb:[-9e3,-9e3,2e4,2e4],hmax:1,lod1:M.finish(),noShadow:true})}
  {const M=SC.Mesh(1024);W.L1.mountains(M);E.setChunk('mtn',{bb:[-2e4,-2e4,3e4,3e4],hmax:2000,lod1:M.finish(),noShadow:true})}
  const CK=[...W.chunks.keys()];const pend1=new Set(CK);const lod0=new Map();   /* key → 'built' | 'queued' */
  /* ------------------------------------------------------ instanced models */
  SC.props.buildModels();const PM=SC.props.models;
  const mk=f=>{const M=SC.Mesh(2048);M.F=-1;f(M);return M.finish()};
  const TREE={palm:{md:mk(M=>SC.props.palm(M,0,0,9,SC.rng(3))),h:9,cap:2600},ghaf:{md:mk(M=>SC.props.ghaf(M,0,0,7,SC.rng(4))),h:7,cap:1600},
    tree:{md:mk(M=>SC.props.tree(M,0,0,7,SC.rng(5))),h:7,cap:1600},broad:{md:mk(M=>SC.props.tree(M,0,0,7,SC.rng(6),1.35,[64,104,44])),h:7,cap:1300}};
  const LY={};for(const k in TREE)LY['t_'+k]=E.layer(TREE[k].md,TREE[k].cap,{shadow:true});
  LY.farPalm=E.layer(PM.farPalm,14000);LY.farTree=E.layer(PM.farTree,12000);
  const VL={car:E.layer(PM.car,1400,{shadow:true}),taxi:E.layer(PM.taxi,120,{shadow:true}),bus:E.layer(PM.bus,60,{shadow:true}),ambulance:E.layer(PM.ambulance,20,{shadow:true}),police:E.layer(PM.police,30,{shadow:true}),person:E.layer(PM.person,4200)};
  const sim=SC.Sim(plan,{cars:1100,walkers:3000});sim.hidden=bi=>prog[bi]<=0;
  const trees=plan.trees.map((t,i)=>{const h=SC.hash('t'+i)/4294967296;return{x:t.x,z:t.z,kind:t.kind,h:t.h,bi:t.bi,yaw:h*6.283,v:.88+.24*((h*7)%1)}});
  /* ------------------------------------------------------ picking grid */
  const PG=SC.Grid(80);B.forEach(r=>{if(r.masses&&r.masses.length)PG.add([r.bx0,r.bz0,r.bx1,r.bz1],r)});
  const EG=SC.Grid(160);plan.edges.forEach(e=>EG.add(g2.bbox(e.pl),e));
  /* ------------------------------------------------------ state */
  const st={year:2026,fv:false,type:'all',status:'all',q:'',tool:null,sel:null,hover:null,mA:null,mB:null,labels:true};
  const prog=new Float32Array(NB_);const stateDirty={v:true};
  const progressOf=r=>clampN(st.year-(r.year-1),0,1);
  /* search text: plot / id / names and type labels in both languages */
  const sText=b=>b._s||(b._s=(()=>{const k=SC.catalog.of(b.r);const f=b.fac&&typeof FAC!=='undefined'&&FAC.find(x=>x.id===b.fac);return[b.plot,b.id,b.kind,k.label[0],k.label[1],b.name?b.name.join(' '):'',f?f.ar+' '+f.en:'',b.lot?'lot '+b.lot:''].join(' ').toLowerCase()})());
  const matches=b=>(st.type==='all'||b.type===st.type)&&(st.status==='all'||b.status===st.status)&&(!st.q||sText(b).includes(st.q.toLowerCase()));
  const filtering=()=>st.type!=='all'||st.status!=='all'||!!st.q;
  const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  B.forEach((r,i)=>{const c=hexRGB(BT[BLDS_[i].type].hex);E.state(i,1,c[0],c[1],c[2],255)});
  function writeState(){const f=filtering();for(let i=0;i<NB_;i++){const r=B[i],b=BLDS_[i];const p=progressOf(r);prog[i]=p;
      const ghost=st.fv&&p<1?255:0;const hl=st.sel===b.id?255:st.hover===b.id?120:0;const dim=f&&!matches(b)?210:0;E.state(i,0,Math.round(p*255),ghost,hl,dim)}stateDirty.v=false;treeEye=null}
  /* ------------------------------------------------------ camera */
  const CX=(plan.bbox[0]+plan.bbox[2])/2,CZ=(plan.bbox[1]+plan.bbox[3])/2;const C0=plan.lake?g2.centroid(plan.lake):[CX,CZ];
  const DEF={t:[C0[0]+120,0,C0[1]+160],dist:2300,pitch:.6,yaw:-.42};
  const PITCH_MIN=.04,PITCH_MAX=1.5,MIN_DIST=18,MAX_DIST=14000;
  const cam={t:DEF.t.slice(),dist:DEF.dist,pitch:DEF.pitch,yaw:DEF.yaw};let distTarget=cam.dist,tTarget=null,flying=null,inertia={yaw:0,pitch:0,px:0,pz:0};
  const eyeOf=c=>{const cp=Math.cos(c.pitch);return[c.t[0]+c.dist*cp*Math.sin(c.yaw),c.t[1]+c.dist*Math.sin(c.pitch),c.t[2]+c.dist*cp*Math.cos(c.yaw)]};
  let vclock=null;const clock=()=>vclock!=null?vclock:performance.now();   /* QA runs on a virtual clock */
  const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  function fly(to,ms=1200){const from={t:cam.t.slice(),dist:cam.dist,pitch:cam.pitch,yaw:cam.yaw};let dy=((to.yaw!=null?to.yaw:cam.yaw)-from.yaw)%(Math.PI*2);if(dy>Math.PI)dy-=Math.PI*2;if(dy<-Math.PI)dy+=Math.PI*2;
    flying={from,to:{t:to.t||from.t,dist:to.dist||from.dist,pitch:to.pitch!=null?to.pitch:from.pitch,yaw:from.yaw+dy},t0:clock(),ms};inertia={yaw:0,pitch:0,px:0,pz:0};tTarget=null}
  function stepFly(n){if(!flying)return;const f=flying,p=clampN((n-f.t0)/f.ms,0,1),e=ease(p);
    /* arc: zoom out a little in the middle of long flights */const span=Math.hypot(f.to.t[0]-f.from.t[0],f.to.t[2]-f.from.t[2]);const lift=Math.sin(p*Math.PI)*Math.min(span*.35,1800);
    for(let k=0;k<3;k++)cam.t[k]=lerpN(f.from.t[k],f.to.t[k],e);cam.dist=Math.exp(lerpN(Math.log(f.from.dist),Math.log(f.to.dist),e))+lift;cam.pitch=lerpN(f.from.pitch,f.to.pitch,e);cam.yaw=lerpN(f.from.yaw,f.to.yaw,e);distTarget=cam.dist;
    if(p>=1){flying=null;distTarget=cam.dist}}
  /* ------------------------------------------------------ overlay (2D) */
  const ov=document.createElement('canvas');ov.className='c3-ov';ov.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';if(host){if(getComputedStyle(host).position==='static')host.style.position='relative';canvas.insertAdjacentElement('afterend',ov)}
  const og=ov.getContext('2d');
  /* ------------------------------------------------------ picking */
  let DPR=1;const rect=()=>canvas.getBoundingClientRect();
  const toPx=(cx,cy)=>{const r=rect();return[(cx-r.left)*E.W/r.width,(cy-r.top)*E.H/r.height]};
  function rayPrism(o,d,poly,y0,y1){let best=Infinity;
    if(d[1]<0&&o[1]>y1){const t=(y1-o[1])/d[1];const x=o[0]+d[0]*t,z=o[2]+d[2]*t;if(g2.pip(x,z,poly))best=t}
    for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];const ex=b[0]-a[0],ez=b[1]-a[1];const den=d[0]*ez-d[2]*ex;if(Math.abs(den)<1e-9)continue;
      const t=((a[0]-o[0])*ez-(a[1]-o[2])*ex)/den,u=((a[0]-o[0])*d[2]-(a[1]-o[2])*d[0])/den;if(t<=0||u<0||u>1||t>=best)continue;const y=o[1]+d[1]*t;if(y>=y0&&y<=y1)best=t}
    return best}
  function pick(px,py){const R_=E.ray(px,py),o=R_.o,d=R_.d;let tmax=9000;if(d[1]<-1e-4)tmax=Math.min(tmax,(o[1]-0)/-d[1]+5);
    const seen=new Set();let best=null,bt=Infinity;const hl=Math.hypot(d[0],d[2])||1e-6;const step=40/hl;
    for(let t=0;t<tmax&&t<bt;t+=step){const x=o[0]+d[0]*t,z=o[2]+d[2]*t;for(const r of PG.q([x-45,z-45,x+45,z+45])){if(seen.has(r))continue;seen.add(r);const p=prog[r.idx];const full=st.fv&&p<1;if(p<=0&&!full)continue;const s=full?1:p;
        for(const m of r.masses){if(m.role==='sailroof')continue;const y0=(m.y0||0)*s,y1=((m.y0||0)+m.h)*s;const tt=rayPrism(o,d,m.poly,y0,y1);if(tt<bt){bt=tt;best=r}}}}
    return best?BLDS_[best.idx]:null}
  function ground(px,py){const R_=E.ray(px,py),o=R_.o,d=R_.d;if(d[1]>-1e-4)return null;const t=o[1]/-d[1];return[o[0]+d[0]*t,o[2]+d[2]*t]}
  /* ------------------------------------------------------ input */
  const ptr=new Map();let drag=null,moved=0,pinchD=0,lastIn=performance.now(),hoverT=0;const touch=()=>{lastIn=performance.now()};
  canvas.style.touchAction='none';canvas.style.cursor='grab';
  const panBy=(dx,dy)=>{/* screen pixels → metres at the target depth */const k=cam.dist*Math.tan(.8/2)*2/(rect().height||1);const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw);
    const mx=-(dx*cy+dy*sy/Math.max(.35,Math.sin(cam.pitch)))*k,mz=-(-dx*sy+dy*cy/Math.max(.35,Math.sin(cam.pitch)))*k;
    cam.t[0]=clampN(cam.t[0]+mx,plan.bbox[0]-2500,plan.bbox[2]+2500);cam.t[2]=clampN(cam.t[2]+mz,plan.bbox[1]-2500,plan.bbox[3]+2500);return[mx,mz]};
  const onDown=e=>{touch();cb.onHover&&cb.onHover(null);flying=null;tTarget=null;inertia={yaw:0,pitch:0,px:0,pz:0};canvas.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);
    drag={x:e.clientX,y:e.clientY,rotate:e.button===2||e.shiftKey||e.ctrlKey,t:performance.now(),v:[0,0]};moved=0;if(ptr.size===2){const a=[...ptr.values()];pinchD=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);drag.rotate=false}canvas.style.cursor='grabbing'};
  const onMove=e=>{const now=performance.now();
    if(!ptr.has(e.pointerId)){if(e.pointerType==='mouse'&&now-hoverT>55){hoverT=now;const [px,py]=toPx(e.clientX,e.clientY);const b=pick(px,py);const id=b?b.id:null;
        if(id!==st.hover){st.hover=id;stateDirty.v=true;canvas.style.cursor=b?'pointer':'grab'}const r=rect();cb.onHover&&cb.onHover(b,e.clientX-r.left,e.clientY-r.top)}return}
    touch();const p0=ptr.get(e.pointerId),dx=e.clientX-p0[0],dy=e.clientY-p0[1];ptr.set(e.pointerId,[e.clientX,e.clientY]);moved+=Math.abs(dx)+Math.abs(dy);
    if(ptr.size===2){const a=[...ptr.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinchD>0)distTarget=clampN(distTarget*pinchD/d,MIN_DIST,MAX_DIST);pinchD=d;panBy(dx/2,dy/2);return}
    if(!drag)return;const dt=Math.max(8,now-drag.t);drag.t=now;
    if(drag.rotate){const ry=-dx*.005,rp=dy*.004;cam.yaw+=ry;cam.pitch=clampN(cam.pitch+rp,PITCH_MIN,PITCH_MAX);drag.v=[ry/dt*16,rp/dt*16]}
    else{const m=panBy(dx,dy);drag.v=[m[0]/dt*16,m[1]/dt*16]}};
  const onUp=e=>{const was=ptr.has(e.pointerId);ptr.delete(e.pointerId);if(!was)return;if(ptr.size)return;canvas.style.cursor='grab';
    if(moved<6&&e.type==='pointerup'){const [px,py]=toPx(e.clientX,e.clientY);click(px,py)}
    else if(drag&&performance.now()-drag.t<90){if(drag.rotate)inertia={yaw:clampN(drag.v[0],-.08,.08),pitch:clampN(drag.v[1],-.06,.06),px:0,pz:0};else inertia={yaw:0,pitch:0,px:clampN(drag.v[0],-80,80),pz:clampN(drag.v[1],-80,80)}}
    drag=null};
  const onWheel=e=>{e.preventDefault();touch();cb.onHover&&cb.onHover(null);flying=null;const f=Math.exp(e.deltaY*.0012),nd=clampN(distTarget*f,MIN_DIST,MAX_DIST);
    if(f<1){const [px,py]=toPx(e.clientX,e.clientY);const g=ground(px,py);if(g){const k=(1-nd/distTarget)*.9,b0=tTarget||cam.t;tTarget=[b0[0]+(g[0]-b0[0])*k,0,b0[2]+(g[1]-b0[2])*k]}}distTarget=nd};
  const onLeave=()=>{if(st.hover){st.hover=null;stateDirty.v=true}cb.onHover&&cb.onHover(null)};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('pointerleave',onLeave);canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  function click(px,py){const b=pick(px,py);
    if(st.tool==='dist'){const g=b?[b.x,b.z]:ground(px,py);if(!g)return;if(st.mA&&!st.mB){st.mB=g;const m=Math.round(Math.hypot(st.mA[0]-g[0],st.mA[1]-g[1]));cb.onMeasure&&cb.onMeasure(m>=1000?(m/1000).toFixed(2)+' km':m+' m')}else{st.mA=g;st.mB=null;cb.onMeasure&&cb.onMeasure(null)}return}
    if(st.tool==='height'){if(b){api.select(b.id);cb.onMeasure&&cb.onMeasure(_('الارتفاع','Height')+': '+Math.round(b.h*Math.max(prog[b.i],st.fv?1:0))+' m')}return}
    api.select(b?b.id:null);if(b)recenterOn(b)}
  function recenterOn(b){const d=clampN(cam.dist,Math.max(90,b.h*2.2+60),1400);fly({t:[b.x,Math.min(b.h*.35,60),b.z],dist:d,pitch:clampN(cam.pitch,.2,1.05),yaw:cam.yaw},750)}
  /* the street a building faces: direction from the building to its nearest road */
  function frontYaw(b){let best=null,bd=1e9;for(const e of EG.q([b.x-220,b.z-220,b.x+220,b.z+220])){const d=g2.dPolyline(b.x,b.z,e.pl);if(d<bd){bd=d;best=e}}
    if(!best)return cam.yaw;let q=null,qd=1e9;for(let i=0;i<best.pl.length-1;i++){const a=best.pl[i],c=best.pl[i+1];const ex=c[0]-a[0],ez=c[1]-a[1],l2=ex*ex+ez*ez||1;const t=clampN(((b.x-a[0])*ex+(b.z-a[1])*ez)/l2,0,1);const p=[a[0]+ex*t,a[1]+ez*t];const d=Math.hypot(p[0]-b.x,p[1]-b.z);if(d<qd){qd=d;q=p}}
    return Math.atan2(q[0]-b.x,q[1]-b.z)}
  /* keep the eye out of buildings and above the ground */
  function keepOutside(eye){if(eye[1]<1.8){cam.pitch=Math.min(PITCH_MAX,cam.pitch+.01)}
    for(const r of PG.q([eye[0]-2,eye[2]-2,eye[0]+2,eye[2]+2])){const p=prog[r.idx];if(p<=0)continue;for(const m of r.masses){if(m.role==='sailroof')continue;if(eye[1]<((m.y0||0)+m.h)*p+2.5&&g2.pip(eye[0],eye[2],m.poly)){cam.dist=Math.min(MAX_DIST,cam.dist*1.05+2);distTarget=Math.max(distTarget,cam.dist);return}}}}
  /* ------------------------------------------------------ streaming */
  const chunkDist=(bb,eye)=>{const dx=Math.max(bb[0]-eye[0],0,eye[0]-bb[2]),dz=Math.max(bb[1]-eye[2],0,eye[2]-bb[3]);return Math.hypot(dx,dz,Math.max(0,eye[1]-40)*.9)};
  let QUAL=1;
  function stream(eye,budget){const t0=performance.now();
    /* LOD1 first (nearest chunks first) */
    if(pend1.size){const order=[...pend1].map(k=>[k,chunkDist(W.chunks.get(k).bb,eye)]).sort((a,b)=>a[1]-b[1]);
      for(const [k] of order){const c=W.chunks.get(k);const md=W.buildLOD1(k);if(md)E.setChunk(k,{bb:c.bb,hmax:c.hmax,lod1:md});else E.setChunk(k,{bb:c.bb,hmax:c.hmax});pend1.delete(k);if(performance.now()-t0>budget)break}
      cb.onProgress&&cb.onProgress(1-pend1.size/CK.length);if(pend1.size)return}
    const R0=400*QUAL,R1=680*QUAL,RB=R1+60,RF=R1+420;let cand=null,cd=1e9;
    for(const k of CK){const ec=E.chunks.get(k);if(!ec)continue;const d=chunkDist(W.chunks.get(k).bb,eye);const want=clampN((R1-d)/(R1-R0),0,1);
      if(lod0.get(k)==='built'){ec.detail+=(want-ec.detail)*.12;if(Math.abs(want-ec.detail)<.01)ec.detail=want;if(d>RF){E.setChunkLod0(k,null);lod0.delete(k)}}
      else if(d<RB&&d<cd){cd=d;cand=k}}
    if(cand&&performance.now()-t0<budget){const md=W.buildLOD0(cand);E.setChunkLod0(cand,md);lod0.set(cand,'built');const ec=E.chunks.get(cand);if(ec)ec.detail=0}}
  /* ------------------------------------------------------ trees */
  let treeEye=null,treeT=0;
  function placeTrees(eye,n){if(treeEye&&n-treeT<250&&Math.hypot(eye[0]-treeEye[0],eye[1]-treeEye[1],eye[2]-treeEye[2])<12)return;treeEye=eye.slice();treeT=n;
    const RN=Math.min(430*QUAL,380+eye[1]*.2),cnt={};for(const k in LY)cnt[k]=0;const far=eye[1]<4200;
    const push=(k,x,z,yaw,s,sy,r,g,b)=>{const l=LY[k];if(cnt[k]>=l.cap)return;const o=cnt[k]*12,d=l.data;d[o]=x;d[o+1]=0;d[o+2]=z;d[o+3]=yaw;d[o+4]=s;d[o+5]=sy;d[o+6]=s;d[o+7]=0;d[o+8]=r;d[o+9]=g;d[o+10]=b;d[o+11]=0;cnt[k]++};
    for(const t of trees){if(t.bi!=null&&prog[t.bi]<=0)continue;const d=Math.hypot(t.x-eye[0],t.z-eye[2],eye[1]);
      if(d<RN){const T=TREE[t.kind]||TREE.tree;const s=t.h/T.h;push('t_'+(TREE[t.kind]?t.kind:'tree'),t.x,t.z,t.yaw,s,s,t.v,t.v,t.v)}
      else if(far&&d<9000){if(t.kind==='palm')push('farPalm',t.x,t.z,t.yaw,t.h*.95,t.h,t.v,t.v,t.v);else{const s=t.h*(t.kind==='broad'?1.35:1.05);push('farTree',t.x,t.z,t.yaw,s*1.05,s*1.1,.36*t.v,.5*t.v,.24*t.v)}}}
    for(const k in LY)E.setLayer(LY[k],cnt[k])}
  /* ------------------------------------------------------ overlay drawing */
  const proj=(x,y,z)=>{const p=E.project([x,y,z]);return p?[p[0]/ovS,p[1]/ovS,p[2]]:null};let ovS=1;
  function outline(b,color,w){const r=b.r,p=Math.max(prog[b.i],st.fv?1:0);if(p<=0)return;og.strokeStyle=color;og.lineWidth=w;og.lineJoin='round';
    for(const m of r.masses){if(m.role==='sailroof')continue;const y=((m.y0||0)+m.h)*p+.3;og.beginPath();let ok=true;m.poly.forEach((q,i)=>{const s=proj(q[0],y,q[1]);if(!s){ok=false;return}i?og.lineTo(s[0],s[1]):og.moveTo(s[0],s[1])});if(ok){og.closePath();og.stroke()}}}
  const LBL=B.filter(r=>r.name&&r.t);
  function drawOverlay(eye){const r=rect();const w=Math.round(r.width*DPR),h=Math.round(r.height*DPR);if(ov.width!==w||ov.height!==h){ov.width=w;ov.height=h}
    ovS=E.W/Math.max(1,w);og.setTransform(1,0,0,1,0,0);og.clearRect(0,0,w,h);
    if(st.hover&&st.hover!==st.sel)outline(BLD_[st.hover],'rgba(255,236,190,.75)',1.5*DPR);
    if(st.sel)outline(BLD_[st.sel],'#E9C46A',2.6*DPR);
    /* facility labels: nearest named facilities, decluttered */
    if(st.labels&&cam.dist<5200){const L_=[];for(const q of LBL){const p=prog[q.idx];if(p<=0&&!st.fv)continue;const d=Math.hypot(q.x-eye[0],q.z-eye[2],eye[1]);if(d>3200||d<40)continue;
        const imp=q.kind==='villa'?0:['mosque_grand','hospital','university','stadium','mall','park_central','civic','police_hq','museum','hotel','souq','cultural','library','college'].includes(q.kind)?2.2:q.kind==='masjid'||q.kind==='kindergarten'?.7:1;if(d>1400*imp)continue;
        const s=proj(q.x,q.h*Math.max(p,st.fv?1:0)+6,q.z);if(!s||s[0]<0||s[1]<0||s[0]>w||s[1]>h)continue;L_.push({q,s,d:d/imp})}
      L_.sort((a,b)=>a.d-b.d);const boxes=[];og.font=`600 ${12*DPR}px system-ui,sans-serif`;og.textBaseline='middle';og.textAlign='center';let n=0;
      for(const l of L_){if(n>=22)break;const txt=tr(l.q.name);const tw=og.measureText(txt).width+16*DPR,th=22*DPR;const x=l.s[0],y=l.s[1]-th;const bx=[x-tw/2,y-th/2,x+tw/2,y+th/2];
        if(boxes.some(o=>!(bx[2]<o[0]||bx[0]>o[2]||bx[3]<o[1]||bx[1]>o[3])))continue;boxes.push(bx);n++;const a=clampN(1.25-l.d/2400,.35,1);
        og.globalAlpha=a;og.strokeStyle='rgba(255,255,255,.8)';og.lineWidth=1*DPR;og.beginPath();og.moveTo(x,l.s[1]);og.lineTo(x,y+th/2);og.stroke();
        og.fillStyle=BLD_[l.q.id]&&BLD_[l.q.id].id===st.sel?'rgba(107,28,44,.95)':'rgba(28,30,34,.78)';const rr=th/2;og.beginPath();og.moveTo(bx[0]+rr,bx[1]);og.arcTo(bx[2],bx[1],bx[2],bx[3],rr);og.arcTo(bx[2],bx[3],bx[0],bx[3],rr);og.arcTo(bx[0],bx[3],bx[0],bx[1],rr);og.arcTo(bx[0],bx[1],bx[2],bx[1],rr);og.fill();
        og.fillStyle='#fff';og.fillText(txt,x,y+1*DPR)}og.globalAlpha=1}
    /* distance measurement */
    if(st.tool==='dist'&&st.mA){const a=proj(st.mA[0],.5,st.mA[1]);const bb=st.mB?proj(st.mB[0],.5,st.mB[1]):null;og.fillStyle='#E9C46A';og.strokeStyle='#E9C46A';og.lineWidth=2.5*DPR;
      if(a){og.beginPath();og.arc(a[0],a[1],5*DPR,0,7);og.fill()}if(a&&bb){og.setLineDash([8*DPR,6*DPR]);og.beginPath();og.moveTo(a[0],a[1]);og.lineTo(bb[0],bb[1]);og.stroke();og.setLineDash([]);og.beginPath();og.arc(bb[0],bb[1],5*DPR,0,7);og.fill()}}}
  /* ------------------------------------------------------ frame loop */
  let raf=0,alive=true,lastT=performance.now(),lastYaw=null;const perfT=[];
  const resizeObs=new ResizeObserver(()=>{DPR=Math.min(devicePixelRatio||1,1.5)});resizeObs.observe(canvas);DPR=Math.min(devicePixelRatio||1,1.5);
  let frozen=false;function frame(n){if(!alive||frozen)return;raf=requestAnimationFrame(frame);tick(n)}
  function tick(n,budget,noRender){const dt=Math.min(.1,(n-lastT)/1000);lastT=n;const f0=performance.now();
    stepFly(n);
    if(!flying){if(Math.abs(distTarget-cam.dist)>.05)cam.dist=lerpN(cam.dist,distTarget,.18);
      if(tTarget){cam.t[0]=lerpN(cam.t[0],tTarget[0],.18);cam.t[2]=lerpN(cam.t[2],tTarget[2],.18);if(Math.hypot(cam.t[0]-tTarget[0],cam.t[2]-tTarget[2])<.05)tTarget=null}
      if(inertia.yaw||inertia.pitch){cam.yaw+=inertia.yaw;cam.pitch=clampN(cam.pitch+inertia.pitch,PITCH_MIN,PITCH_MAX);inertia.yaw*=.92;inertia.pitch*=.92;if(Math.abs(inertia.yaw)<.0003)inertia.yaw=0;if(Math.abs(inertia.pitch)<.0003)inertia.pitch=0}
      if(inertia.px||inertia.pz){cam.t[0]+=inertia.px*dt*3.5;cam.t[2]+=inertia.pz*dt*3.5;inertia.px*=.9;inertia.pz*=.9;if(Math.hypot(inertia.px,inertia.pz)<.05)inertia.px=inertia.pz=0}
      const idle=n-lastIn>9000&&!st.sel&&!st.tool&&!matchMedia('(prefers-reduced-motion:reduce)').matches;if(idle)cam.yaw+=.00035}
    let eye=eyeOf(cam);if(cam.dist<420&&!flying){keepOutside(eye);eye=eyeOf(cam)}
    E.setCamera(eye,cam.t,.8);
    if(stateDirty.v)writeState();
    stream(eye,budget||(pend1.size?40:7));
    placeTrees(eye,n);
    if(cam.dist<3200&&!pend1.size){sim.step(dt);sim.emit(E,VL,eye,Math.min(1600,300+cam.dist),Math.min(520,160+cam.dist*.4))}else for(const k in VL)E.setLayer(VL[k],0);
    const dataView=clampN((cam.dist-1600)/3000,0,.8);
    if(!noRender){E.render(n/1000,{shadows:QUAL>.55,ghosts:st.fv,dataView,dprCap:1+.5*QUAL});drawOverlay(eye)}
    if(lastYaw===null||Math.abs(lastYaw-cam.yaw)>.002){lastYaw=cam.yaw;cb.onCam&&cb.onCam(cam.yaw)}
    const ft=performance.now()-f0;perfT.push(ft);if(perfT.length>120)perfT.shift();
    /* adaptive quality: slow frames shrink the detail radius and resolution */
    if(!frozen&&perfT.length>=60&&!pend1.size&&n%30<17){const avg=perfT.slice(-30).reduce((a,b)=>a+b,0)/30;if(avg>34&&QUAL>.55)QUAL-=.05;else if(avg<16&&QUAL<1)QUAL+=.02}}
  writeState();raf=requestAnimationFrame(frame);
  if(!cb.noIntro&&!matchMedia('(prefers-reduced-motion:reduce)').matches){cam.dist=distTarget=9000;cam.pitch=.75;cam.yaw=DEF.yaw-.6;setTimeout(()=>fly({t:DEF.t.slice(),dist:DEF.dist,pitch:DEF.pitch,yaw:DEF.yaw},3200),150)}
  /* ------------------------------------------------------ API */
  const api={
    select(id){touch();const b=id&&BLD_[id]?BLD_[id]:null;st.sel=b?b.id:null;stateDirty.v=true;cb.onSelect&&cb.onSelect(b)},
    focus(id){const b=BLD_[id];if(!b)return;if(b.year>st.year){st.year=Math.ceil(b.year);stateDirty.v=true;cb.onYear&&cb.onYear(st.year)}api.select(id);
      const yaw=frontYaw(b);fly({t:[b.x,Math.min(b.h*.4,80),b.z],dist:clampN(b.h*2.3+Math.sqrt(Math.max(1,b.r.fp||400))*1.6+40,90,1600),pitch:b.h>60?.28:.36,yaw},1500)},
    reset(){fly({t:DEF.t.slice(),dist:DEF.dist,pitch:DEF.pitch,yaw:DEF.yaw},1300)},
    orbit(dyaw,dpitch){touch();flying=null;inertia={yaw:0,pitch:0,px:0,pz:0};cam.yaw+=dyaw;if(dpitch)cam.pitch=clampN(cam.pitch+dpitch,PITCH_MIN,PITCH_MAX)},
    zoom(f){touch();distTarget=clampN(distTarget*f,MIN_DIST,MAX_DIST)},
    view(v){flying=null;tTarget=null;if(v.t)cam.t=v.t.slice();if(v.dist){cam.dist=v.dist;distTarget=v.dist}if(v.pitch!=null)cam.pitch=clampN(v.pitch,PITCH_MIN,PITCH_MAX);if(v.yaw!=null)cam.yaw=v.yaw;touch()},
    camera:()=>({t:cam.t.slice(),dist:cam.dist,pitch:cam.pitch,yaw:cam.yaw}),
    perf(){const a=perfT.slice().sort((x,y)=>x-y);return a.length?{avg:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(1),p95:+a[Math.floor(a.length*.95)].toFixed(1),quality:+QUAL.toFixed(2),loading:pend1.size,lod0:lod0.size,gpuMB:Math.round([...E.chunks.values()].reduce((s,c)=>s+(c.lod1?c.lod1.bytes:0)+(c.lod0?c.lod0.bytes:0),0)/1048576)}:null},
    set(k,v){touch();st[k]=v;if(k==='tool'){st.mA=st.mB=null;cb.onMeasure&&cb.onMeasure(null)}if(['year','fv','type','status','q'].includes(k))stateDirty.v=true},
    firstMatch(){return BLDS_.filter(b=>matches(b)).sort((a,b)=>(b.fac?2:b.name?1:0)-(a.fac?2:a.name?1:0)||(a.flat?1:0)-(b.flat?1:0)||a.plot.localeCompare(b.plot))[0]},
    stats(){let done=0,mid=0,pl=0;for(const r of B){const p=progressOf(r);p>=1?done++:p>0?mid++:pl++}return{done,mid,plan:pl,total:B.length}},
    count:()=>BLDS_.filter(matches).length,year:()=>st.year,info:id=>BLD_[id]?bInfo(BLD_[id]):null,
    engine:E,sim,plan,
    /* QA hooks: stop the loop and advance frames by hand */
    freeze(on){frozen=!!on;cancelAnimationFrame(raf);if(!frozen){vclock=null;lastT=performance.now();raf=requestAnimationFrame(frame)}},
    tick(ms=16,budget,noRender){if(vclock==null)vclock=performance.now();lastT=vclock;vclock+=ms;tick(vclock,budget,noRender)},
    destroy(){alive=false;cancelAnimationFrame(raf);resizeObs.disconnect();ov.remove();E.dispose();if(window.__city3d===api)window.__city3d=null}};
  window.__city3d=api;   /* handle for tours / automated QA */
  return api}

Object.assign(window,{BT,BT2,BSTATN,bName,bInfo,BLD_OF_PR,bEnergy,City3D,ensureCityPlan,cityLinkBuildings,prepareCity:prepare});
})();
