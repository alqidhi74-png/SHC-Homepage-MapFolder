/* ============================================================================
   SMART CITY — LANDSCAPE & STREET FURNITURE PLACEMENT (SC.landscape)
   ----------------------------------------------------------------------------
   Everything here is placed by rule, never at random over the map:
     street trees     in the tree verge of each road class (palms on
                      arterials, ghaf on collectors, shade trees on locals),
                      clear of junction mouths, crossings, lights, bridges
     medians          date palms + shrubs on boulevard medians
     roundabouts      landscaped islands with palms and an Omani monument
     parks            path network (perimeter loop, diagonals, central
                      plaza with fountain), playground, fitness corner,
                      tree clusters only on lawns (never on paths / water)
     central park     lakeside promenade, radial avenues, kiosks, jetty
     wadi             trail-side trees, benches and lights along the canal
     villas           garden palms & trees inside each compound
     facilities       perimeter planting inside the site, clear of masses
     smart poles      on the curb side of the verge at class spacing;
                      double-arm poles on boulevard medians
     bus stops        smart shelters every ~450 m on arterials/collectors
     benches / bins / sensors / info kiosks / EV chargers
     people hotspots  entrances, plazas, parks, cafés, bus stops, souq
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,clamp=SC.clamp;
const side=(pl,o)=>g2.plOffset(pl,-o);
SC.landscape={build(plan){
  const R=SC.rng(4242);const T=[],FUR=[],PATHS=[],SPOTS=[],PARKS=[];
  /* occupancy grid for spacing / conflicts */
  const OCC=SC.Grid(20);const occ=(x,z,r,kind)=>OCC.add([x-r,z-r,x+r,z+r],{x,z,r,kind});
  const free=(x,z,r)=>{for(const o of OCC.qp(x,z,r+8))if(Math.hypot(o.x-x,o.z-z)<o.r+r)return false;return true};
  /* building masses and water are hard obstacles */
  const BG=SC.Grid(60);for(const b of plan.buildings)for(const m of b.masses){if(m.role==='sailroof')continue;BG.add(g2.bbox(m.poly),m)}
  const inBld=(x,z,pad=0)=>{for(const m of BG.qp(x,z,pad+1)){if(g2.pip(x,z,m.poly)||(pad&&g2.dPolyEdge(x,z,m.poly)<pad))return true}return false};
  const inWater=(x,z,pad=0)=>g2.pip(x,z,plan.lake)||g2.pip(x,z,plan.wadi.canalPoly)||(pad&&(g2.dPoly(x,z,plan.lake)<pad));
  const EG=SC.Grid(100);for(const e of plan.edges)EG.add(g2.bbox(e.pl),e);const NG=SC.Grid(80);for(const n of plan.nodes)NG.add([n.x,n.z,n.x,n.z],n);
  const inCarriage=(x,z,pad=0)=>{for(const e of EG.qp(x,z,30)){if(e.core&&g2.dPolyline(x,z,e.core)<e.R.cw/2+pad&&!(e.R.median>0&&g2.dPolyline(x,z,e.core)<e.R.median/2-.3))return true}for(const n of NG.qp(x,z,60)){if(n.surface&&g2.pip(x,z,n.surface))return true;if(n.R&&Math.hypot(n.x-x,n.z-z)<n.R+pad&&Math.hypot(n.x-x,n.z-z)>(n.ri||0))return true;if(n.ctrl==='culdesac'&&Math.hypot(n.x-x,n.z-z)<n.rr+pad)return true}return false};
  const tree=(x,z,kind,h,s,extra)=>{if(!(extra&&extra.median)&&inCarriage(x,z,.6))return;T.push(Object.assign({x,z,kind,h,s},extra||{}));occ(x,z,kind==='palm'?1.2:2.2,'tree')};

  /* ---------- 1 smart poles along every street ---------- */
  for(const e of plan.edges){const core=e.core;if(!core)continue;const L=g2.plLen(core);const sp=e.R.light,x=e.x;const lamps=[];
    for(const sd of [1,-1]){if(e.cls==='loc'&&sd<0)continue;const off=x.verge0+.45;const pl=side(core,sd*off);const L2=g2.plLen(pl);const n=Math.max(1,Math.round(L2/sp));
      for(let k=0;k<=n;k++){let s=clamp(k*L2/n,3,L2-3);if(e.cls!=='loc'&&sd<0)s=clamp(s+sp/2,3,L2-3);if(k===n&&e.cls!=='loc'&&sd<0)continue;const a=g2.plAt(pl,s);const d=g2.plAt(core,s*L/L2).d;
        if(e.xings.some(xg=>Math.abs(s*L/L2-(xg.s0+xg.s1)/2)<6))continue;if(!free(a.p[0],a.p[1],1.5)||inCarriage(a.p[0],a.p[1],.5))continue;
        const yaw=Math.atan2(-sd*d[0]*0+(-sd)*-d[0]*0+(sd>0?-1:1)*(d[0]),(sd>0?1:-1)*d[1]);
        /* arm points across the road (towards the centre line) */const arm=[-(-d[1])*sd,-(d[0])*sd];const ay=Math.atan2(arm[1],arm[0]);
        const pole={t:'pole',x:a.p[0],z:a.p[1],yaw:ay,h:e.cls==='loc'||e.cls==='drv'?7.5:10,arm:e.cls==='loc'?1.4:2.2,wifi:k%3===0,cam:e.cls!=='loc'&&k%4===1,ev:e.cls==='loc'&&k%6===3,nb:e.fidD};
        FUR.push(pole);occ(a.p[0],a.p[1],1,'pole');lamps.push(pole)}}
    if(e.R.median>4){const n=Math.max(1,Math.round(L/e.R.light));for(let k=0;k<n;k++){const a=g2.plAt(core,(k+.5)*L/n);FUR.push({t:'pole2',x:a.p[0],z:a.p[1],yaw:Math.atan2(a.d[0],-a.d[1]),h:11,arm:2.4});occ(a.p[0],a.p[1],1,'pole')}}
    e.lamps=lamps}
  /* ---------- 2 signals & signs ---------- */
  for(const s of plan.signals){FUR.push({t:'signal',x:s.x,z:s.z,face:s.face,reach:s.reach});occ(s.x,s.z,1.2,'sig');if(R()<.6){const p=[s.x+s.face[1]*2,s.z-s.face[0]*2];FUR.push({t:'sensor',x:p[0],z:p[1]});occ(p[0],p[1],.6,'s')}}
  for(const s of plan.signs){FUR.push({t:'sign',x:s.x,z:s.z,face:s.face,kind:s.kind});occ(s.x,s.z,.6,'sign')}
  /* ---------- 3 bus stops (smart shelters) on arterials & collectors ---------- */
  const STOPS=[];for(const e of plan.edges){if(!e.core||!(e.cls==='art'||e.cls==='col'||e.cls==='ring'))continue;const L=g2.plLen(e.core);if(L<140)continue;
    for(const sd of [1,-1]){const s=L*(sd>0?.35:.65);const off=e.x.foot;const pl=side(e.core,sd*off);const a=g2.plAt(pl,s*g2.plLen(pl)/L);const d=g2.plAt(e.core,s).d;if(inBld(a.p[0],a.p[1],3))continue;
      const yaw=Math.atan2(d[1],d[0])+(sd>0?0:Math.PI);STOPS.push({e,s,side:sd,x:a.p[0],z:a.p[1],yaw});FUR.push({t:'bus',x:a.p[0],z:a.p[1],yaw});occ(a.p[0],a.p[1],3,'bus');
      FUR.push({t:'bin',x:a.p[0]+d[0]*3.4,z:a.p[1]+d[1]*3.4});SPOTS.push({x:a.p[0],z:a.p[1],r:2.5,n:2+Math.floor(R()*4),kind:'wait',yaw})}}
  plan.busStops=STOPS;
  /* ---------- 4 street trees ---------- */
  for(const e of plan.edges){const core=e.core;if(!core||e.bridge)continue;const L=g2.plLen(core);const x=e.x;const cls=e.cls;const kind=cls==='art'||cls==='ring'?'palm':cls==='col'?'ghaf':'tree';const sp=kind==='palm'?10:kind==='ghaf'?12.5:11;
    const vw=x.verge1-x.verge0;if(vw<1)continue;
    for(const sd of [1,-1]){const pl=side(core,sd*(x.verge0+x.verge1)/2);const L2=g2.plLen(pl);for(let s=6;s<L2-6;s+=sp){const a=g2.plAt(pl,s);if(!free(a.p[0],a.p[1],kind==='palm'?1.6:2.4))continue;if(e.xings.some(xg=>Math.abs(s*L/L2-(xg.s0+xg.s1)/2)<7))continue;if(inBld(a.p[0],a.p[1],2))continue;
        tree(a.p[0],a.p[1],kind,kind==='palm'?8+R()*3:kind==='ghaf'?6+R()*1.5:6.5+R()*2,kind==='palm'?1:kind==='ghaf'?.8:.9)}}
    /* median planting */if(e.R.median>3){for(let s=8;s<L-8;s+=12){const a=g2.plAt(core,s);if(!free(a.p[0],a.p[1],1.4))continue;tree(a.p[0],a.p[1],'palm',8.5+R()*3,1,{median:1})}
      for(let s=14;s<L-8;s+=12){const a=g2.plAt(core,s);FUR.push({t:'shrub',x:a.p[0]+(R()-.5),z:a.p[1]+(R()-.5)})}}}
  /* ---------- 5 roundabout islands ---------- */let mon=0;
  for(const n of plan.nodes){if(n.ctrl!=='roundabout')continue;const ri=n.ri;if(ri>10){FUR.push({t:'monument',x:n.x,z:n.z,kind:mon++%2})}const k=Math.max(6,Math.floor(ri*2*Math.PI/9));for(let i=0;i<k;i++){const a=i/k*Math.PI*2;tree(n.x+Math.cos(a)*(ri-2.5),n.z+Math.sin(a)*(ri-2.5),'palm',8+R()*2,1,{median:1})}
    for(let i=0;i<k;i++){const a=(i+.5)/k*Math.PI*2;FUR.push({t:'shrub',x:n.x+Math.cos(a)*(ri-1.5),z:n.z+Math.sin(a)*(ri-1.5)})}}
  /* ---------- 6 parks ---------- */
  const parkRecs=plan.buildings.filter(b=>b.kind==='park'||b.kind==='park_central');
  const pocket=plan.blocks.filter(b=>b.use==='park:pocket');
  const plantPoly=(poly,dens,exclude,kinds,avoidPaths)=>{const bb=g2.bbox(poly),A=g2.absArea(poly);const n=Math.floor(A*dens);let placed=0,tries=0;
    while(placed<n&&tries++<n*6){/* clustered: pick a centre, scatter a few */const cx=bb[0]+R()*(bb[2]-bb[0]),cz=bb[1]+R()*(bb[3]-bb[1]);const m=1+Math.floor(R()*4);
      for(let j=0;j<m&&placed<n;j++){const x=cx+(R()-.5)*16,z=cz+(R()-.5)*16;if(!g2.pip(x,z,poly)||g2.dPolyEdge(x,z,poly)<3)continue;if(exclude&&exclude(x,z))continue;if(inWater(x,z,4)||inBld(x,z,3))continue;if(avoidPaths&&PATHS.some(p=>Math.abs(p.pl[0][0]-x)<p.box&&g2.dPolyline(x,z,p.pl)<p.w/2+2.2))continue;
        const k=SC.pick(R,kinds);if(!free(x,z,k==='palm'?2:3.2))continue;tree(x,z,k,k==='palm'?7+R()*4:k==='ghaf'?6+R()*2:7+R()*3,k==='ghaf'?1+R()*.4:.9+R()*.5);placed++}}};
  const addPath=(pl,w,kind)=>{if(pl.length<2)return;const bb=g2.bbox(pl);PATHS.push({pl,w,kind,box:Math.max(bb[2]-bb[0],bb[3]-bb[1])+w+10})};
  for(const pr of parkRecs){const poly=pr.kind==='park_central'?pr.plot:pr.plot;const c=g2.centroid(poly);const cut=pr.kind==='park_central'?(plan.central.sites||[]).map(s=>s.poly):[];
    const exclude=(x,z)=>cut.some(q=>g2.dPoly(x,z,q)<4);
    if(pr.kind==='park_central'){/* lakeside promenade + radial avenues + secondary loop */const lk=plan.lake;const prom=g2.inset(lk,-22);addPath(prom.concat([prom[0]]),7,'promenade');
      const ob=g2.obb(poly);const cc=c;const ext=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2+plan.frame.ang;ext.push([cc[0]+Math.cos(a)*1000,cc[1]+Math.sin(a)*1000])}
      for(const q of ext){/* from the promenade to the park edge */const dir=[q[0]-cc[0],q[1]-cc[1]],l=Math.hypot(...dir);const d=[dir[0]/l,dir[1]/l];let s0=0,s1=0;for(let s=0;s<700;s+=5){const x=cc[0]+d[0]*s,z=cc[1]+d[1]*s;if(!s0&&!g2.pip(x,z,g2.inset(lk,-26)))s0=s;if(s0&&g2.pip(x,z,poly)&&!exclude(x,z))s1=s}if(s1>s0+20)addPath([[cc[0]+d[0]*s0,cc[1]+d[1]*s0],[cc[0]+d[0]*s1,cc[1]+d[1]*s1]],5,'avenue')}
      const loop=g2.inset(g2.ccw(poly),60);if(loop.length>2)addPath(g2.chaikin(loop,2).concat([g2.chaikin(loop,2)[0]]),4,'loop');
      for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.4;const p=[cc[0]+Math.cos(a)*(CFGR(lk)+70),cc[1]+Math.sin(a)*(CFGR(lk)*.7+70)];if(g2.pip(p[0],p[1],poly)&&!inWater(p[0],p[1],12)){if(k%3===0)FUR.push({t:'playground',x:p[0],z:p[1],size:26});else if(k%3===1)FUR.push({t:'fountain',x:p[0],z:p[1],r:6});else FUR.push({t:'kiosk',x:p[0],z:p[1]});SPOTS.push({x:p[0],z:p[1],r:14,n:10+Math.floor(R()*10),kind:'park'})}}
      /* jetty into the lake */const jd=plan.frame.UX;const j0=[cc[0]-jd[0]*CFGR(lk)*.95,cc[1]-jd[1]*CFGR(lk)*.95];FUR.push({t:'jetty',x:j0[0],z:j0[1],yaw:Math.atan2(jd[1],jd[0])});
      plantPoly(poly,1/420,(x,z)=>exclude(x,z)||g2.pip(x,z,g2.inset(lk,-30))&&!g2.pip(x,z,g2.inset(lk,-40)),['broad','ghaf','palm','broad'],true);
      for(const p of PATHS.filter(p=>p.kind==='promenade')){const L=g2.plLen(p.pl);for(let s=0;s<L;s+=14){const a=g2.plAt(p.pl,s);const o=side([a.p,[a.p[0]+a.d[0],a.p[1]+a.d[1]]],5)[0];if(free(o[0],o[1],1.5)&&!inWater(o[0],o[1],2))tree(o[0],o[1],'palm',9+R()*2,1)}
        for(let s=7;s<L;s+=28){const a=g2.plAt(p.pl,s);const o=side([a.p,[a.p[0]+a.d[0],a.p[1]+a.d[1]]],-4.2)[0];FUR.push({t:'bench',x:o[0],z:o[1],yaw:Math.atan2(a.d[1],a.d[0])});FUR.push({t:'lamp',x:o[0]+a.d[0]*4,z:o[1]+a.d[1]*4})}}}
    else{/* neighbourhood park: loop + diagonals + central plaza with fountain + playground + fitness */const loop=g2.inset(g2.ccw(poly),5);if(loop.length>2){addPath(loop.concat([loop[0]]),3.2,'loop')}
      const ob=g2.obb(poly);for(const k of [0,1,2,3]){const q=loop[Math.floor(k*loop.length/4)%loop.length];if(q)addPath([q,c],3,'diag')}
      FUR.push({t:'fountain',x:c[0],z:c[1],r:5});PATHS.push({pl:g2.chaikin([[c[0]+9,c[1]],[c[0],c[1]+9],[c[0]-9,c[1]],[c[0],c[1]-9]],2).concat([[c[0]+9,c[1]]]),w:4,kind:'plaza',box:30});
      const pg=[c[0]+(loop[1]?(loop[1][0]-c[0])*.45:12),c[1]+(loop[1]?(loop[1][1]-c[1])*.45:12)];FUR.push({t:'playground',x:pg[0],z:pg[1],size:18});
      const fz=[c[0]+(loop[3]?(loop[3][0]-c[0])*.45:-12),c[1]+(loop[3]?(loop[3][1]-c[1])*.45:-12)];FUR.push({t:'fitness',x:fz[0],z:fz[1]});
      SPOTS.push({x:pg[0],z:pg[1],r:10,n:6+Math.floor(R()*8),kind:'park'});SPOTS.push({x:c[0],z:c[1],r:12,n:4+Math.floor(R()*6),kind:'park'});
      plantPoly(poly,1/260,(x,z)=>Math.hypot(x-pg[0],z-pg[1])<14||Math.hypot(x-c[0],z-c[1])<12||Math.hypot(x-fz[0],z-fz[1])<8,['broad','ghaf','broad','palm'],true);
      if(loop.length>2){const L=g2.plLen(loop);for(let s=10;s<L;s+=30){const a=g2.plAt(loop.concat([loop[0]]),s);FUR.push({t:'bench',x:a.p[0],z:a.p[1],yaw:Math.atan2(a.d[1],a.d[0])});FUR.push({t:'lamp',x:a.p[0]+a.d[0]*6,z:a.p[1]+a.d[1]*6})}}
      FUR.push({t:'sensor',x:c[0]+14,z:c[1]+4});FUR.push({t:'screen',x:c[0]-10,z:c[1]+10,yaw:0})}}
  for(const b of pocket){const c=b.c;plantPoly(b.poly,1/300,null,['broad','ghaf','palm'],false);if(b.A>600)FUR.push({t:'bench',x:c[0],z:c[1],yaw:0})}
  function CFGR(lk){const c=g2.centroid(lk);return lk.reduce((m,p)=>Math.max(m,Math.hypot(p[0]-c[0],p[1]-c[1])),0)}
  /* wadi: trees & benches along the trails */{const cn=plan.wadi.canal;const L=g2.plLen(cn);for(const off of [-12,12,-31,31]){const pl=side(cn,off);for(let s=0;s<L;s+=off*off>400?16:22){const a=g2.plAt(pl,s);if(!g2.pip(a.p[0],a.p[1],plan.wadi.poly)||inCarriage(a.p[0],a.p[1],3)||inWater(a.p[0],a.p[1],3)||!free(a.p[0],a.p[1],2.5))continue;tree(a.p[0],a.p[1],Math.abs(off)>20?'ghaf':'palm',Math.abs(off)>20?6.5+R()*2:8+R()*3,1)}}
    for(const off of [-18,18]){const pl=side(cn,off);for(let s=20;s<L;s+=60){const a=g2.plAt(pl,s);if(!g2.pip(a.p[0],a.p[1],plan.wadi.poly)||inCarriage(a.p[0],a.p[1],4))continue;const o=side([a.p,[a.p[0]+a.d[0],a.p[1]+a.d[1]]],off>0?2.6:-2.6)[0];FUR.push({t:'bench',x:o[0],z:o[1],yaw:Math.atan2(a.d[1],a.d[0])});FUR.push({t:'lamp',x:o[0]+a.d[0]*5,z:o[1]+a.d[1]*5})}}
    for(let s=0;s<L;s+=240){const a=g2.plAt(side(cn,18),s);if(g2.pip(a.p[0],a.p[1],plan.wadi.poly))SPOTS.push({x:a.p[0],z:a.p[1],r:20,n:4+Math.floor(R()*5),kind:'walk'})}
    /* wadi grass cover plus scattered ghaf on the wider banks */for(const b of plan.blocks.filter(q=>q.use==='park:wadi'))plantPoly(b.poly,1/700,(x,z)=>g2.dPolyline(x,z,cn)<40,['ghaf','broad'],false)}
  /* ---------- 7 villa gardens & facility planting ---------- */
  for(const r of plan.buildings){const t0=T.length;plantFor(r);for(let i=t0;i<T.length;i++)T[i].bi=r.idx}
  function plantFor(r){if(r.kind==='villa'||r.kind==='townhouse'){const pl=r.plot;if(!pl)return;const bb=g2.bbox(pl);const n=r.kind==='villa'?2+Math.floor(R()*2):1;for(let k=0;k<n*3&&k<9;k++){const x=bb[0]+R()*(bb[2]-bb[0]),z=bb[1]+R()*(bb[3]-bb[1]);if(!g2.pip(x,z,pl)||g2.dPolyEdge(x,z,pl)<1.6||inBld(x,z,2.2)||!free(x,z,2.2))continue;const kk=R()<.55?'palm':'tree';tree(x,z,kk,kk==='palm'?6+R()*3:5+R()*2,.75)}}
    else if(r.masses.length&&r.cat!=='residential'&&r.cat!=='commercial'&&r.cat!=='office'){const pl=r.plot;const L=g2.perim(pl);const ring=g2.inset(g2.ccw(pl),3);if(ring.length<3)return;const rl=ring.concat([ring[0]]);const LL=g2.plLen(rl);
      for(let s=4;s<LL;s+=11){const a=g2.plAt(rl,s);if(inBld(a.p[0],a.p[1],3)||!free(a.p[0],a.p[1],2.4))continue;if((r.ground||[]).some(gd=>gd.kind!=='garden'&&gd.kind!=='lawn'&&gd.kind!=='plaza'&&g2.pip(a.p[0],a.p[1],gd.poly)))continue;tree(a.p[0],a.p[1],r.cat==='religious'||r.cat==='civic'?'palm':SC.pick(R,['palm','ghaf','tree']),7+R()*3,.9)}
      for(const gd of r.ground||[])if(gd.kind==='garden'||gd.kind==='lawn'||gd.kind==='courtyard')plantPoly(gd.poly,1/180,(x,z)=>inBld(x,z,3),['palm','tree','ghaf'],false)}}
  /* ---------- 8 people hotspots at facilities ---------- */
  for(const r of plan.buildings){if(!r.entrances)continue;for(const en of r.entrances){if(en.kind!=='main')continue;const k=r.kind;const n=k==='mall'?30:k==='mosque_grand'?26:k==='stadium'?40:k==='university'?30:k==='souq'?26:k==='hospital'?14:['school','library','cultural','museum','civic'].includes(k)?10:4;
      SPOTS.push({x:en.p[0]+en.dir[0]*12,z:en.p[1]+en.dir[1]*12,r:k==='stadium'?40:14,n,kind:'plaza',bi:r.idx})}
    if(r.kind==='cafe'||r.kind==='restaurant'){SPOTS.push({x:r.x,z:r.z,r:12,n:6,kind:'sit',bi:r.idx})}
    if(r.kind==='university'){const c=g2.centroid(r.plot);SPOTS.push({x:c[0],z:c[1],r:60,n:50,kind:'plaza',bi:r.idx})}}
  plan.trees=T;plan.furniture=FUR;plan.paths=PATHS;plan.spots=SPOTS;
  plan.stats.trees=T.length;plan.stats.furniture=FUR.length;
  /* validation helpers for QA */
  plan.checkLandscape=()=>{const v={treesInCarriageway:0,treesInBuildings:0,treesInWater:0,polesInCarriageway:0,polesInBuildings:0};for(const t of T){if(!t.median&&inCarriage(t.x,t.z,.2))v.treesInCarriageway++;if(inBld(t.x,t.z))v.treesInBuildings++;if(inWater(t.x,t.z))v.treesInWater++}
    for(const f of FUR){if(f.t!=='pole')continue;if(inCarriage(f.x,f.z,.1))v.polesInCarriageway++;if(inBld(f.x,f.z))v.polesInBuildings++}return v};
  return plan}};
})(typeof window!=='undefined'?window:globalThis);
