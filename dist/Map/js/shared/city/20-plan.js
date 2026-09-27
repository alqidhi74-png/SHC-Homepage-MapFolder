/* ============================================================================
   SMART CITY — MASTER PLAN GENERATOR (SC.plan)
   ----------------------------------------------------------------------------
   Builds the city in planning order, each step constrained by the previous:
     1  boundary + planning frame
     2  blue-green spine: wadi corridor, canal, ponds, central lake
     3  road hierarchy: ring boulevard → arterials (1250 m) → collectors
        (625 m) → wadi drives → local streets (per-zone spacing)
     4  facility sites that need whole neighbourhood units are reserved
        BEFORE local streets, so campuses / stadium / hospital are not cut up
     5  network graph: exact noding, junction merging, stub pruning,
        cul-de-sacs, junction control (roundabout / signals / priority),
        bridges where roads cross water
     6  blocks = faces of the planar road graph, inset by each road's
        right-of-way (so no block can touch a carriageway)
     7  districts (power diagram of district seeds) and zoning
     8  public facilities sited by rules (district, frontage, size, spacing)
        + one neighbourhood centre per residential superblock
     9  parcels and building records for every remaining block
   The result is plain data (SC.plan) consumed by the 3D engine, the 2D map
   and the portal pages; geometry is produced later by the builders.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,CFG=SC.CFG,clamp=SC.clamp;
/* The plan is generated once, on first use (the map, the 3D twin or a
   property page ask for it); the rest of the portal loads instantly. */
SC.ensurePlan=()=>SC.plan||build();let CITYD_LIVE=null;
function build(){
const T0=(root.performance||Date).now();
const R=SC.rng(CFG.seed);

/* ------------------------------------------------------------ 1 frame ---- */
const F=CFG.frame,CA=Math.cos(F.ang),SA=Math.sin(F.ang);
const toU=(x,z)=>[(x-F.o[0])*CA+(z-F.o[1])*SA,-(x-F.o[0])*SA+(z-F.o[1])*CA];
const toW=(u,v)=>[F.o[0]+u*CA-v*SA,F.o[1]+u*SA+v*CA];
const UX=[CA,SA],VX=[-SA,CA];           /* world directions of the u and v axes */
const SB=F.sb,UNIT=SB/2;
const boundary=g2.ccw(g2.chaikin(CFG.boundary,2));
const RC=CFG.roads;
const ringLine=g2.ccw(g2.insetOK(boundary,RC.ring.row/2+14)||boundary);   /* ring boulevard centre line */
const inCity=(x,z)=>g2.pip(x,z,ringLine);

/* ------------------------------------------------ 2 water & green spine -- */
const wadiPath=g2.resample(g2.chaikin(CFG.wadi.path,3,false),30);
const WL=g2.plLen(wadiPath);
const wadiHalf=s=>{let w=CFG.wadi.width/2;for(const p of CFG.wadi.ponds){const d=Math.abs(s/WL-p)*WL;if(d<220)w+=70*Math.cos(d/220*Math.PI/2)**2}return w};
const bufferPl=(pl,fw)=>{const L=[],Rr=[];let s=0;for(let i=0;i<pl.length;i++){if(i)s+=Math.hypot(pl[i][0]-pl[i-1][0],pl[i][1]-pl[i-1][1]);const a=pl[Math.max(0,i-1)],b=pl[Math.min(pl.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,w=fw(s);L.push([pl[i][0]-dz/l*w,pl[i][1]+dx/l*w]);Rr.push([pl[i][0]+dz/l*w,pl[i][1]-dx/l*w])}return g2.ccw(L.concat(Rr.reverse()))};
const wadiPoly=bufferPl(wadiPath,wadiHalf);                     /* linear park */
const drvOff=s=>wadiHalf(s)+10+RC.drv.row/2;
const wadiDrivePoly=bufferPl(wadiPath,drvOff);                  /* drives run on its edge */
/* canal: gently meandering channel inside the park */
const canal=wadiPath.map((p,i)=>{const s=i*30,a=wadiPath[Math.max(0,i-1)],b=wadiPath[Math.min(wadiPath.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,m=Math.sin(s/260)*22+Math.sin(s/97)*6;return[p[0]-dz/l*m,p[1]+dx/l*m]});
const canalW=s=>{let w=CFG.wadi.channel/2;for(const p of CFG.wadi.ponds){const d=Math.abs(s/WL-p)*WL;if(d<200)w+=62*Math.cos(d/200*Math.PI/2)**1.5}return w};
const canalPoly=bufferPl(canal,canalW);
/* central lake: organic ellipse */
const lake=(()=>{const L=CFG.lake,Rl=SC.rng(L.seed),pts=[],n=48;const ph=[Rl()*6,Rl()*6,Rl()*6];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1+.08*Math.sin(3*a+ph[0])+.05*Math.sin(5*a+ph[1])+.04*Math.sin(2*a+ph[2]);const lx=Math.cos(a)*L.rx*k,lz=Math.sin(a)*L.rz*k;pts.push([L.c[0]+lx*Math.cos(L.rot)-lz*Math.sin(L.rot),L.c[1]+lx*Math.sin(L.rot)+lz*Math.cos(L.rot)])}return g2.ccw(pts)})();
const centralSq=[toW(-UNIT,-UNIT),toW(UNIT,-UNIT),toW(UNIT,UNIT),toW(-UNIT,UNIT)];   /* Central Park superblock (inside the arterials) */
const inCentral=(x,z)=>{const [u,v]=toU(x,z);return Math.abs(u)<UNIT&&Math.abs(v)<UNIT};

/* --------------------------------------------- clipping a line/polyline --- */
/* intervals of a polyline inside (keep=true) / outside a polygon */
/* polygons used for clipping get a cached bbox + edge grid (clipping runs thousands of times) */
const PIDX=new WeakMap();const pidx=poly=>{let I=PIDX.get(poly);if(!I){const G=SC.Grid(120);for(let j=0;j<poly.length;j++)G.add(g2.bbox([poly[j],poly[(j+1)%poly.length]]),j);I={G,bb:g2.bbox(poly)};PIDX.set(poly,I)}return I};
function clipPl(pl,poly,keepInside){const out=[];let cur=[];const inside=p=>g2.pip(p[0],p[1],poly);const I=pidx(poly);
  for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1];const ts=[0,1];const sb=g2.bbox([a,b]);
    if(!(sb[2]<I.bb[0]||sb[0]>I.bb[2]||sb[3]<I.bb[1]||sb[1]>I.bb[3]))for(const j of I.G.q(sb)){const r=g2.segX(a,b,poly[j],poly[(j+1)%poly.length]);if(r&&r[0]>0&&r[0]<1&&r[1]>=0&&r[1]<=1)ts.push(r[0])}ts.sort((x,y)=>x-y);
    for(let k=0;k<ts.length-1;k++){const t0=ts[k],t1=ts[k+1];if(t1-t0<1e-9)continue;const m=[a[0]+(b[0]-a[0])*(t0+t1)/2,a[1]+(b[1]-a[1])*(t0+t1)/2],ok=inside(m)===keepInside;const p0=[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],p1=[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1];
      if(ok){if(!cur.length)cur.push(p0);cur.push(p1)}else if(cur.length){out.push(cur);cur=[]}}}
  if(cur.length>1)out.push(cur);return out.filter(p=>g2.plLen(p)>1)}
const lineUV=(fixed,isU,a0,a1)=>isU?[toW(fixed,a0),toW(fixed,a1)]:[toW(a0,fixed),toW(a1,fixed)];

/* ---------------------------------------------------- 3 road hierarchy --- */
const ROADS=[];   /* {pl, cls, src} */
const addRoad=(pl,cls,src)=>{if(pl.length>1&&g2.plLen(pl)>20)ROADS.push({pl,cls,src})};
/* ring boulevard (closed) */
{const r=ringLine.slice();r.push(r[0].slice());addRoad(r,'ring','ring')}
const EXT=7000;
const gridLines=(start,step,cls)=>{for(let k=-8;k<=8;k++){const f=start+k*step;for(const isU of [true,false]){let pls=clipPl(lineUV(f,isU,-EXT,EXT),ringLine,true);
      if(cls==='col')pls=pls.flatMap(pl=>clipPl(pl,centralSq,false));       /* collectors do not cross the Central Park */
      for(const pl of pls)addRoad(pl,cls,(isU?'u':'v')+f)}}};
gridLines(UNIT,SB,'art');gridLines(0,SB,'col');
/* wadi drives: park-edge streets on both banks (outside the Central Park) */
{const n=wadiPath.length;const L=[],Rr=[];let s=0;for(let i=0;i<n;i++){if(i)s+=30;const a=wadiPath[Math.max(0,i-1)],b=wadiPath[Math.min(n-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,w=drvOff(s);L.push([wadiPath[i][0]-dz/l*w,wadiPath[i][1]+dx/l*w]);Rr.push([wadiPath[i][0]+dz/l*w,wadiPath[i][1]-dx/l*w])}
  for(const side of [L,Rr])for(const pl of clipPl(g2.simplify(side,1.5,false),ringLine,true))for(const q of clipPl(pl,g2.inset(centralSq,-40),false))addRoad(q,'drv','wadi')}

/* ------------------------------------------- 7a districts (power diagram) */
const DIST=CFG.districts.map(d=>{let poly=boundary.slice();for(const o of CFG.districts){if(o===d)continue;const sx=o.seed[0]-d.seed[0],sz=o.seed[1]-d.seed[1];
    /* keep points with 2x·(so-sd) <= |so|²-|sd|² - wo² + wd² */const c=(o.seed[0]**2+o.seed[1]**2-d.seed[0]**2-d.seed[1]**2-o.w**2+d.w**2)/2;
    /* half-plane (x·s <= c) → origin point on line and inward normal -s */const l2=sx*sx+sz*sz,px=sx*c/l2,pz=sz*c/l2;poly=g2.clipHalf(poly,px,pz,-sx,-sz)}
  return Object.assign({poly:g2.ccw(poly)},d)});
const districtAt=(x,z)=>{let best=DIST[0],bd=1e18;for(const d of DIST){const v=(x-d.seed[0])**2+(z-d.seed[1])**2-d.w**2;if(v<bd){bd=v;best=d}}return best};

/* --------------------------------- 4 neighbourhood units + zoning + sites */
const UNITS=[];
for(let iu=-7;iu<=7;iu++)for(let iv=-9;iv<=9;iv++){const u0=iu*UNIT,v0=iv*UNIT,sq=[toW(u0,v0),toW(u0+UNIT,v0),toW(u0+UNIT,v0+UNIT),toW(u0,v0+UNIT)];
  const land=g2.clipConvex(ringLine,sq);if(land.length<3)continue;const A=g2.absArea(land);if(A<20000)continue;const c=toW(u0+UNIT/2,v0+UNIT/2),lc=g2.centroid(land);
  const d=districtAt(lc[0],lc[1]);const wadiShare=(()=>{const wb=g2.bbox(wadiDrivePoly),lb=g2.bbox(land);if(lb[2]<wb[0]||lb[0]>wb[2]||lb[3]<wb[1]||lb[1]>wb[3])return 0;let n=0,t=0;for(let a=.1;a<1;a+=.2)for(let b=.1;b<1;b+=.2){const p=toW(u0+UNIT*a,v0+UNIT*b);if(!inCity(p[0],p[1]))continue;t++;if(g2.pip(p[0],p[1],wadiDrivePoly))n++}return t?n/t:0})();
  /* which sides are arterials (cell edges at odd multiples of UNIT) */
  const artU0=Math.abs(((u0/UNIT)%2+2)%2-1)<.01,artV0=Math.abs(((v0/UNIT)%2+2)%2-1)<.01;
  UNITS.push({iu,iv,u0,v0,sq,land,A,full:A/(UNIT*UNIT),c,lc,d:d.id,dist:d,wadi:wadiShare,central:Math.abs(u0+UNIT/2)<UNIT&&Math.abs(v0+UNIT/2)<UNIT,
    artSides:{u0:artU0,u1:!artU0,v0:artV0,v1:!artV0},zone:null,site:null})}
const rDist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
for(const U of UNITS){if(U.central){U.zone='central';continue}
  const role=U.dist.role,z=CFG.zoning[role];const dSeed=rDist(U.lc,U.dist.seed);
  let zone=role==='core'?(rDist(U.lc,F.o)<1000?z.near:z.far):role==='wadi'?(U.wadi>.05||dSeed<700?z.near:z.far):role==='front'?(dSeed<650?z.near:z.far):role==='hills'?(dSeed<1100?z.near:z.far):role==='villas'?(dSeed<900?z.near:z.far):z.near;
  U.zone=zone}
/* reserve whole-unit / part-unit facility sites before laying local streets */
const SITES=[];
for(const P of CFG.program.filter(p=>p.site==='unit'||p.site==='unitpart')){
  const cands=UNITS.filter(U=>!U.central&&!U.site&&U.d===P.district&&U.wadi<.08&&U.full>.8);
  cands.sort((a,b)=>{const sa=(P.kind==='stadium'?-1:1)*rDist(a.lc,a.dist.seed)*.4+rDist(a.lc,F.o)*(P.kind==='stadium'?-.2:.6),sb=(P.kind==='stadium'?-1:1)*rDist(b.lc,b.dist.seed)*.4+rDist(b.lc,F.o)*(P.kind==='stadium'?-.2:.6);return sa-sb});
  const U=cands[0];if(!U){console.warn('[plan] no unit for',P.kind);continue}
  let rect=[0,UNIT,0,UNIT];   /* unit-local (du0,du1,dv0,dv1) */
  if(P.site==='unitpart'){/* the half of the unit that faces an arterial */const s=U.artSides;rect=s.v0?[0,UNIT,0,UNIT*.52]:s.v1?[0,UNIT,UNIT*.48,UNIT]:s.u0?[0,UNIT*.52,0,UNIT]:[UNIT*.48,UNIT,0,UNIT]}
  U.site=U.site||[];U.site.push({P,rect});SITES.push({P,U,rect})}

/* --------------------------------------------------------- local streets */
const LOCAL_LINES=[];
for(const U of UNITS){if(U.central||['park'].includes(U.zone))continue;const sp=CFG.streets[U.zone]||CFG.streets.mixed;
  const flip=((U.iu+U.iv)&1)&&U.zone!=='cbd';const [sv,su]=flip?[sp[1],sp[0]]:sp;
  const res=(U.site||[]).map(s=>s.rect);
  if(res.some(r=>r[1]-r[0]>=UNIT-1&&r[3]-r[2]>=UNIT-1))continue;   /* whole unit reserved */
  const nV=Math.max(1,Math.round(UNIT/sv)),nU=Math.max(1,Math.round(UNIT/su));
  const lines=[];
  for(let k=1;k<nV;k++){const dv=UNIT*k/nV;lines.push({isU:false,f:U.v0+dv,a0:U.u0,a1:U.u0+UNIT,loc:dv,axis:'v'})}
  for(let k=1;k<nU;k++){const du=UNIT*k/nU;lines.push({isU:true,f:U.u0+du,a0:U.v0,a1:U.v0+UNIT,loc:du,axis:'u'})}
  /* a reserved half-unit is bounded by the nearest local line: drop lines inside it,
     trim perpendicular lines at its edge, and add the edge line if missing */
  for(const r of res){const bound=[];
    for(const L of lines){if(L.axis==='v'){if(L.loc>r[2]+1&&L.loc<r[3]-1)L.drop=true;else{/* trim along u */}}
      else{if(L.loc>r[0]+1&&L.loc<r[1]-1)L.drop=true}}
    for(const L of lines){if(L.drop)continue;if(L.axis==='u'){const du=L.loc;if(du>r[0]&&du<r[1]){/* perpendicular: cut the part inside reserved v-range */if(r[2]<=0.5){L.a0=U.v0+r[3]}else if(r[3]>=UNIT-.5){L.a1=U.v0+r[2]}}}
      else{const dv=L.loc;if(dv>r[2]&&dv<r[3]){if(r[0]<=0.5)L.a0=U.u0+r[1];else if(r[1]>=UNIT-.5)L.a1=U.u0+r[0]}}}
    /* boundary street of the reserved area */
    if(r[3]<UNIT-1)lines.push({isU:false,f:U.v0+r[3],a0:U.u0+r[0],a1:U.u0+r[1],axis:'v',loc:r[3],edge:1});
    if(r[2]>1)lines.push({isU:false,f:U.v0+r[2],a0:U.u0+r[0],a1:U.u0+r[1],axis:'v',loc:r[2],edge:1});
    if(r[1]<UNIT-1)lines.push({isU:true,f:U.u0+r[1],a0:U.v0+r[2],a1:U.v0+r[3],axis:'u',loc:r[1],edge:1});
    if(r[0]>1)lines.push({isU:true,f:U.u0+r[0],a0:U.v0+r[2],a1:U.v0+r[3],axis:'u',loc:r[0],edge:1})}
  /* snap reserved-edge lines onto an existing parallel local line if close */
  for(const L of lines){if(L.drop||L.a1-L.a0<20)continue;let pls=clipPl(lineUV(L.f,L.isU,L.a0,L.a1),ringLine,true);
    pls=pls.flatMap(pl=>clipPl(pl,wadiDrivePoly,false)).flatMap(pl=>clipPl(pl,centralSq,false));
    for(const pl of pls){LOCAL_LINES.push(pl);addRoad(pl,'loc','U'+U.iu+'_'+U.iv)}}}

/* -------------------------------------------------- 5 network noding ----- */
const SEG=[];ROADS.forEach((r,ri)=>{for(let i=0;i<r.pl.length-1;i++)SEG.push({a:r.pl[i],b:r.pl[i+1],ri,cuts:[0,1]})});
{const G=SC.Grid(120);SEG.forEach((s,i)=>G.add(g2.bbox([s.a,s.b]),i));
  SEG.forEach((s,i)=>{for(const j of G.q(g2.bbox([s.a,s.b]))){if(j<=i)continue;const t=SEG[j];if(s.ri===t.ri&&Math.abs(i-j)<=1)continue;const r=g2.segX(s.a,s.b,t.a,t.b);if(!r)continue;const e=1e-7;
    if(r[0]>=-e&&r[0]<=1+e&&r[1]>=-e&&r[1]<=1+e){s.cuts.push(clamp(r[0],0,1));t.cuts.push(clamp(r[1],0,1))}}});
  /* T-junctions: an endpoint lying on another segment (within 0.5 m) */
  SEG.forEach((s,i)=>{for(const end of [s.a,s.b])for(const j of G.qp(end[0],end[1],1)){if(j===i)continue;const t=SEG[j];const d=g2.dSeg(end[0],end[1],t.a,t.b);if(d<.5){const dx=t.b[0]-t.a[0],dz=t.b[1]-t.a[1],l2=dx*dx+dz*dz;t.cuts.push(clamp(((end[0]-t.a[0])*dx+(end[1]-t.a[1])*dz)/l2,0,1))}}})}
const NODES=[],NK=new Map();const nodeAt=(x,z)=>{const k=Math.round(x*2)+'_'+Math.round(z*2);let n=NK.get(k);if(!n){n={id:NODES.length,x,z,e:[]};NODES.push(n);NK.set(k,n)}return n};
let EDGES=[];
/* rebuild each road as a chain of node-to-node edges */
{const perRoad=ROADS.map(()=>[]);SEG.forEach(s=>perRoad[s.ri].push(s));
  ROADS.forEach((r,ri)=>{let cur=null,pts=[];const flush=n=>{if(cur&&n&&cur!==n&&pts.length>1)EDGES.push({a:cur,b:n,pl:pts,cls:r.cls,src:r.src,ri});};
    for(const s of perRoad[ri]){const cs=[...new Set(s.cuts.map(c=>+c.toFixed(9)))].sort((x,y)=>x-y);
      for(let k=0;k<cs.length;k++){const t=cs[k],p=[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];
        const isCut=(t>0&&t<1)||(t===0&&s===perRoad[ri][0])||(t===1&&s===perRoad[ri][perRoad[ri].length-1])||s.cuts.filter(c=>Math.abs(c-t)<1e-9).length>1;
        if(!cur){cur=nodeAt(p[0],p[1]);pts=[p];continue}
        const last=pts[pts.length-1];if(Math.hypot(p[0]-last[0],p[1]-last[1])>1e-6)pts.push(p);
        if(isCut){const n=nodeAt(p[0],p[1]);flush(n);cur=n;pts=[p]}}}
    if(pts.length>1&&cur){const e=pts[pts.length-1];const n=nodeAt(e[0],e[1]);flush(n)}})}
/* merge junctions closer than 14 m (keep the one on the higher-class road) */
{const rankN=n=>n.e.reduce((m,e)=>Math.max(m,CFG.rank[e.cls]),0);
  EDGES.forEach(e=>{e.a.e.push(e);e.b.e.push(e)});
  const G=SC.Grid(40);NODES.forEach(n=>G.add([n.x,n.z,n.x,n.z],n));const rep=new Map();
  const find=n=>{while(rep.has(n))n=rep.get(n);return n};
  for(const n of NODES){if(!n.e.length)continue;for(const m of G.qp(n.x,n.z,14)){if(m===n||!m.e.length)continue;const a=find(n),b=find(m);if(a===b)continue;if(Math.hypot(a.x-b.x,a.z-b.z)>14)continue;
    /* do not merge two nodes on the same straight road that are far apart along it */const [keep,drop]=rankN(a)>=rankN(b)?[a,b]:[b,a];rep.set(drop,keep)}}
  for(const e of EDGES){const a=find(e.a),b=find(e.b);if(a!==e.a){e.pl[0]=[a.x,a.z];e.a=a}if(b!==e.b){e.pl[e.pl.length-1]=[b.x,b.z];e.b=b}}
  EDGES=EDGES.filter(e=>e.a!==e.b&&g2.plLen(e.pl)>2);
  /* duplicates (same node pair, same class) */const seen=new Set();EDGES=EDGES.filter(e=>{const k=Math.min(e.a.id,e.b.id)+'_'+Math.max(e.a.id,e.b.id);if(seen.has(k))return false;seen.add(k);return true})}
/* prune short stubs; keep long dead ends as cul-de-sacs */
const relink=()=>{NODES.forEach(n=>n.e=[]);EDGES.forEach(e=>{e.a.e.push(e);e.b.e.push(e)})};
relink();for(let it=0;it<6;it++){let ch=false;EDGES=EDGES.filter(e=>{const L=g2.plLen(e.pl);const dead=(e.a.e.length===1)||(e.b.e.length===1);if(dead&&L<75&&e.cls!=='ring'){ch=true;return false}return true});relink();if(!ch)break}
EDGES.forEach((e,i)=>{e.id=i;e.len=g2.plLen(e.pl);e.R=RC[e.cls];
  /* bridge: part of the edge crosses water */e.bridge=clipPl(e.pl,wadiPoly,true).reduce((s,p)=>s+g2.plLen(p),0)>1||clipPl(e.pl,lake,true).length>0});
const NODES_USED=NODES.filter(n=>n.e.length);
/* junction control */
for(const n of NODES_USED){/* classify by the distinct ROADS meeting here (a straight road through a node counts once) */
  const byRoad=new Map();for(const e of n.e){byRoad.set(e.ri,e.cls)}const cl=[...byRoad.values()].sort((a,b)=>CFG.rank[b]-CFG.rank[a]);n.deg=n.e.length;n.top=cl[0];n.second=cl[1]||null;
  const key=[cl[0],cl[1]].join('/');n.ctrl=n.deg===1?'culdesac':cl.length<2?'bend':CFG.junction.roundR[key]&&n.deg>=4?'roundabout':(CFG.rank[cl[0]]>=3&&CFG.rank[cl[1]]>=2)?(n.deg>=3?'signals':'bend'):n.deg>=3?'priority':'bend';
  if(n.ctrl==='roundabout')n.rr=CFG.junction.roundR[key];
  if(n.ctrl==='culdesac')n.rr=11}

/* -------------------------------------------------------- 6 blocks ------- */
/* faces of the planar graph: at every node sort outgoing half-edges by
   angle; walking "next = previous outgoing edge around the head node" traces
   each face exactly once */
const HE=[];for(const e of EDGES){for(const dir of [0,1]){const pl=dir?e.pl.slice().reverse():e.pl;const from=dir?e.b:e.a,to=dir?e.a:e.b;const d=[pl[1][0]-pl[0][0],pl[1][1]-pl[0][1]];HE.push({e,dir,from,to,pl,ang:Math.atan2(d[1],d[0]),used:false})}}
const OUT=new Map();HE.forEach(h=>{let l=OUT.get(h.from);if(!l)OUT.set(h.from,l=[]);l.push(h)});OUT.forEach(l=>l.sort((a,b)=>a.ang-b.ang));
const twinOf=h=>HE[HE.indexOf(h)^1];
HE.forEach((h,i)=>h.i=i);const twin=h=>HE[h.i^1];
const FACES=[];
for(const h0 of HE){if(h0.used)continue;const ring=[];let h=h0,guard=0;
  while(!h.used&&guard++<5000){h.used=true;ring.push(h);const outs=OUT.get(h.to),t=twin(h),k=outs.indexOf(t);h=outs[(k-1+outs.length)%outs.length]}
  if(h!==h0)continue;
  /* dead-end streets poke into a face and come back: keep them aside (their
     corridor is cut out of the block below) and trace the face without them */
  const inRing=new Set(ring);const dangling=ring.filter(r=>inRing.has(twin(r))&&r.dir===0).map(r=>r.e);const clean=ring.filter(r=>!inRing.has(twin(r)));if(clean.length<2)continue;
  const pts=[],dist=[];for(const r of clean){for(let i=0;i<r.pl.length-1;i++){pts.push(r.pl[i]);dist.push(r.e.R.row/2+.6)}}
  const A=g2.area(pts);FACES.push({ring:clean,pts,dist,A,dangling})}
/* interior faces have one consistent sign; the outer face is the largest of the other sign */
const sgn=Math.sign(FACES.reduce((s,f)=>s+Math.sign(f.A)*Math.min(Math.abs(f.A),1e5),0))||1;
const BLOCKS=[];
for(const f of FACES){if(Math.sign(f.A)!==sgn)continue;let pts=f.pts,dist=f.dist;if(g2.area(pts)<0){pts=pts.slice().reverse();dist=dist.slice().reverse();/* edge i now between reversed points: shift */dist.push(dist.shift())}
  /* remove collinear duplicate points */
  let inner=g2.insetOK(pts,i=>dist[i]);if(!inner){/* concave corner too tight: shrink the inset slightly */inner=g2.insetOK(pts,i=>dist[i]*.9)}
  if(!inner)continue;
  /* keep clear of roundabouts / cul-de-sacs */
  for(const r of f.ring){const n=r.from;if(n.ctrl==='roundabout'||n.ctrl==='culdesac'){const rr=n.ctrl==='roundabout'?n.rr+RC[n.top].sw+RC[n.top].cyc+2:n.rr+4;const oct=[];for(let k=0;k<12;k++){const a=k/12*Math.PI*2;oct.push([n.x+Math.cos(a)*rr,n.z+Math.sin(a)*rr])}
      /* chamfer the block corner facing the junction (one half-plane → stays a single polygon) */
      if(g2.overlap(inner,oct)){const bc=g2.centroid(inner),dx=bc[0]-n.x,dz=bc[1]-n.z,l=Math.hypot(dx,dz)||1;inner=g2.clipHalf(inner,n.x+dx/l*rr,n.z+dz/l*rr,dx/l,dz/l);if(inner.length<3){inner=null;break}}}}
  if(!inner||g2.absArea(inner)<400)continue;
  /* cut the dead-end street corridors (plus turning circle) out of the block */
  let pieces=[inner];for(const e of f.dangling){const hw=e.R.row/2+.6;for(let i=0;i<e.pl.length-1;i++){const a=e.pl[i],b=e.pl[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
      const K=[[a[0]-uz*hw-ux*hw,a[1]+ux*hw-uz*hw],[b[0]-uz*hw+ux*hw,b[1]+ux*hw+uz*hw],[b[0]+uz*hw+ux*hw,b[1]-ux*hw+uz*hw],[a[0]+uz*hw-ux*hw,a[1]-ux*hw-uz*hw]];
      pieces=pieces.flatMap(p=>g2.overlap(p,K)?g2.subConvex(p,K):[p])}
    for(const n of [e.a,e.b])if(n.ctrl==='culdesac'){const oct=[];for(let k=0;k<12;k++){const a=k/12*Math.PI*2;oct.push([n.x+Math.cos(a)*(n.rr+5),n.z+Math.sin(a)*(n.rr+5)])}pieces=pieces.flatMap(p=>g2.overlap(p,oct)?g2.subConvex(p,oct):[p])}}
  pieces=pieces.map(g2.ccw).filter(p=>g2.absArea(p)>=400);
  for(const piece of pieces){inner=piece;
  const c=g2.centroid(inner),d=districtAt(c[0],c[1]);const [cu,cv]=toU(c[0],c[1]);const U=UNITS.find(q=>q.iu===Math.floor(cu/UNIT)&&q.iv===Math.floor(cv/UNIT));
  const edges=[...new Set(f.ring.map(r=>r.e))];const front=edges.slice().sort((a,b)=>CFG.rank[b.cls]-CFG.rank[a.cls])[0];
  BLOCKS.push({id:BLOCKS.length,poly:inner,face:f.pts,A:g2.absArea(inner),c,d:d.id,unit:U||null,edges,frontCls:front.cls,
    inWadi:g2.pip(c[0],c[1],wadiDrivePoly),inCentral:inCentral(c[0],c[1]),use:null})}}

/* ------------------------------------------ 6b corridor enforcement ---- */
/* every block is cut back from EVERY nearby road corridor (not only the
   roads that bound its face): acute junctions with the ring or the wadi
   drives can otherwise leave a corner inside a neighbouring right-of-way */
{const EG=SC.Grid(120);EDGES.forEach(e=>EG.add(g2.bbox(e.pl),e));
  for(let i=BLOCKS.length-1;i>=0;i--){const b=BLOCKS[i];let poly=b.poly;const A0=b.A;
    for(const e of EG.q(g2.bbox(poly))){const hw=e.R.row/2+.6;for(let k=0;k<e.pl.length-1;k++){const a=e.pl[k],c=e.pl[k+1];if(!poly.some(p=>g2.dSeg(p[0],p[1],a,c)<hw)&&!g2.overlap(poly,[a,c,c]))continue;
        const dx=c[0]-a[0],dz=c[1]-a[1],l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l,ex=hw*.02;const K=[[a[0]-uz*hw-ux*ex,a[1]+ux*hw-uz*ex],[c[0]-uz*hw+ux*ex,c[1]+ux*hw+uz*ex],[c[0]+uz*hw+ux*ex,c[1]-ux*hw+uz*ex],[a[0]+uz*hw-ux*ex,a[1]-ux*hw-uz*ex]];
        if(!g2.overlap(poly,K))continue;const ov=g2.clipConvex(poly,K);if(ov.length<3||g2.absArea(ov)<2)continue;const pcs=g2.subConvex(poly,K).map(g2.ccw);if(!pcs.length){poly=null;break}pcs.sort((x,y)=>g2.absArea(y)-g2.absArea(x));poly=pcs[0]}if(!poly)break}
    if(!poly||g2.absArea(poly)<Math.max(300,A0*.55)){BLOCKS.splice(i,1);continue}
    if(poly!==b.poly){b.poly=poly;b.A=g2.absArea(poly);b.c=g2.centroid(poly)}}
  BLOCKS.forEach((b,i)=>b.id=i)}
/* ---------------------------------------- 7b district outlines (on roads) */
/* blocks belong to the district of their neighbourhood unit, so district
   borders run along arterials / collectors; outlines are traced with
   marching squares over a 30 m sample grid */
const UMAP=new Map(UNITS.map(q=>[q.iu+'_'+q.iv,q]));const unitOf=(x,z)=>{const [u,v]=toU(x,z);return UMAP.get(Math.floor(u/UNIT)+'_'+Math.floor(v/UNIT))||null};
const distOfPt=(x,z)=>{const U=unitOf(x,z);return U?U.d:districtAt(x,z).id};
for(const b of BLOCKS){b.d=b.unit?b.unit.d:b.d}
const OUTLINES=(()=>{const bb=g2.bbox(boundary),st=40,nx=Math.ceil((bb[2]-bb[0])/st)+2,nz=Math.ceil((bb[3]-bb[1])/st)+2,ids=DIST.map(d=>d.id),val=new Int8Array(nx*nz).fill(-1);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=bb[0]-st+i*st,z=bb[1]-st+j*st;if(!g2.pip(x,z,boundary))continue;val[j*nx+i]=ids.indexOf(distOfPt(x,z))}
  const out={};ids.forEach((id,di)=>{const segs=[];const at=(i,j)=>i>=0&&j>=0&&i<nx&&j<nz&&val[j*nx+i]===di?1:0;const P=(i,j)=>[bb[0]-st+i*st,bb[1]-st+j*st];
    for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const c=at(i,j)|at(i+1,j)<<1|at(i+1,j+1)<<2|at(i,j+1)<<3;if(c===0||c===15)continue;
      const e=[[i+.5,j],[i+1,j+.5],[i+.5,j+1],[i,j+.5]].map(q=>P(q[0],q[1]));const T={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,2],[1,0]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[2,0]],10:[[0,3],[2,1]],11:[[2,1]],12:[[1,3]],13:[[1,0]],14:[[0,3]]}[c];
      for(const [a,b] of T)segs.push([e[a],e[b]])}
    /* chain segments into loops */const key=p=>Math.round(p[0])+'_'+Math.round(p[1]);const next=new Map();for(const s of segs)next.set(key(s[0]),s);const loops=[];const used=new Set();
    for(const s of segs){const k0=key(s[0]);if(used.has(k0))continue;const loop=[];let cur=s,g=0;while(cur&&!used.has(key(cur[0]))&&g++<100000){used.add(key(cur[0]));loop.push(cur[0]);cur=next.get(key(cur[1]))}if(loop.length>3)loops.push(loop)}
    loops.sort((a,b)=>g2.absArea(b)-g2.absArea(a));out[id]=loops.length?g2.ccw(g2.simplify(loops[0],10)):DIST.find(d=>d.id===id).poly});
  return out})();
DIST.forEach(d=>{d.outline=OUTLINES[d.id];d.c=g2.centroid(d.outline)});

/* ------------------------------------------------------ 7c block helpers */
const RANK=CFG.rank;
/* direction from a block towards its most important adjacent street */
function frontOf(b,minCls){let best=null;const P=b.poly;
  for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length],mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2,L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<8)continue;
    for(const e of b.edges){if(minCls&&RANK[e.cls]<RANK[minCls])continue;const d=g2.dPolyline(mx,mz,e.pl);if(d>e.R.row/2+6)continue;const sc=RANK[e.cls]*1000+L-d;if(!best||sc>best.sc){let nx=(c[1]-a[1])/L,nz=-(c[0]-a[0])/L;const bc=g2.centroid(P);if((mx-bc[0])*nx+(mz-bc[1])*nz<0){nx=-nx;nz=-nz}best={sc,dir:[nx,nz],cls:e.cls,mid:[mx,mz],e}}}}
  return best}
const fill=b=>{const o=g2.obb(b.poly);return b.A/o.A};
for(const b of BLOCKS){b.fill=fill(b);b.front=frontOf(b);b.frontArt=frontOf(b,'art');b.frontCol=frontOf(b,'col')}

/* ----------------------------------------------------------- 8 facilities */
const FAC_SITES=[];      /* {kind,block,poly,front,P,name,t} */
const place=(b,kind,P,poly,front)=>{const s={kind,block:b,poly:poly||b.poly,front:front||(b.front&&b.front.dir)||[UX[1]*-1,UX[0]],P,name:P&&P.name,t:P&&P.t,fac:P&&P.fac};FAC_SITES.push(s);return s};
/* (a) unit / part-unit sites reserved earlier: the block that fills the reserved rectangle */
for(const S of SITES){const r=S.rect,U=S.U;const cc=toW(U.u0+(r[0]+r[1])/2,U.v0+(r[2]+r[3])/2);let best=null,bd=1e9;
  for(const b of BLOCKS){if(b.use)continue;const d=Math.hypot(b.c[0]-cc[0],b.c[1]-cc[1]);if(d<bd&&g2.pip(b.c[0],b.c[1],[toW(U.u0+r[0],U.v0+r[2]),toW(U.u0+r[1],U.v0+r[2]),toW(U.u0+r[1],U.v0+r[3]),toW(U.u0+r[0],U.v0+r[3])])){bd=d;best=b}}
  if(!best){console.warn('[plan] site block missing',S.P.kind);continue}best.use='facility:'+S.P.kind;place(best,S.P.kind,S.P,null,(best.frontArt||best.front).dir)}
/* (b) Central Park superblock: park + lake with culture / civic sites carved on its edges */
const centralBlock=BLOCKS.filter(b=>b.inCentral).sort((a,b)=>b.A-a.A)[0];
const CENTRAL={block:centralBlock,sites:[]};
if(centralBlock){centralBlock.use='park:central';const cb=centralBlock;const o=g2.obb(cb.poly);
  /* sites along the edges of the park, each 120 m wide x 90 m deep, facing the boulevard */
  const edgeSites=[['cultural',[0,-1],.0],['library',[-1,0],-.25],['museum',[1,0],.2],['hotel',[0,1],.3]];
  const pk=CFG.program.filter(p=>p.nearLake);
  for(const P of pk){const E=edgeSites.find(e=>e[0]===P.kind);if(!E)continue;const [du,dv]=E[1];
    /* local rectangle in grid coords around the central square edge */const half=UNIT-RC.art.row/2-2,depth=P.kind==='cultural'?120:95,wide=P.kind==='cultural'?170:120,off=E[2]*half;
    let rect;if(dv){const v1=dv*half,v0=v1-dv*depth;rect=[toW(off-wide/2,Math.min(v0,v1)),toW(off+wide/2,Math.min(v0,v1)),toW(off+wide/2,Math.max(v0,v1)),toW(off-wide/2,Math.max(v0,v1))]}
    else{const u1=du*half,u0=u1-du*depth;rect=[toW(Math.min(u0,u1),off-wide/2),toW(Math.max(u0,u1),off-wide/2),toW(Math.max(u0,u1),off+wide/2),toW(Math.min(u0,u1),off+wide/2)]}
    const poly=g2.ccw(g2.clipConvex(cb.poly,rect));if(g2.absArea(poly)<3000)continue;const fd=dv?[VX[0]*dv,VX[1]*dv]:[UX[0]*du,UX[1]*du];
    const s=place(cb,P.kind,P,poly,fd);s.central=1;CENTRAL.sites.push(s)}}
/* (c) block-level programme */
const usedBy=kind=>FAC_SITES.filter(s=>s.kind===kind);
const residentialZone=z=>['villas','townhouses','apartments'].includes(z);
for(const P of CFG.program.filter(p=>p.site==='block'&&!p.nearLake)){
  const need=P.front?P.front:null;
  const cands=BLOCKS.filter(b=>!b.use&&!b.inWadi&&!b.inCentral&&b.d===P.district&&b.A>=P.minA&&b.A<=Math.max(P.minA*4,26000)&&b.fill>.72&&(!need||(need==='art'?b.frontArt:b.frontCol)));
  const seed=P.district==='nb2'?F.o:CFG.districts.find(d=>d.id===P.district).seed;
  const score=b=>{let s=Math.hypot(b.c[0]-seed[0],b.c[1]-seed[1]);if(P.edge)s=g2.dPolyEdge(b.c[0],b.c[1],ringLine)*3;for(const o of usedBy(P.kind))if(Math.hypot(o.block.c[0]-b.c[0],o.block.c[1]-b.c[1])<900)s+=4000;
    for(const o of FAC_SITES)if(o.block&&Math.hypot(o.block.c[0]-b.c[0],o.block.c[1]-b.c[1])<160)s+=600;return s+b.A*.002};
  const sc=new Map(cands.map(b=>[b,score(b)]));cands.sort((a,b)=>sc.get(a)-sc.get(b));const b=cands[0];if(!b){console.warn('[plan] no block for',P.kind,P.district);continue}
  b.use='facility:'+P.kind;place(b,P.kind,P,null,((need==='art'?b.frontArt:need==='col'?b.frontCol:null)||b.front).dir)}

/* (d) neighbourhood centres: one per residential superblock, at its collector crossing */
const CENTRES=[];const nameIdx={mosque:0,school:0,park:0,kg:0};
const nextName=k=>{const L=CFG.centreNames[k];const n=L[nameIdx[k]%L.length];nameIdx[k]++;return n};
for(let ku=-4;ku<=4;ku++)for(let kv=-5;kv<=5;kv++){const C=toW(ku*SB,kv*SB);if(!inCity(C[0],C[1])||inCentral(C[0],C[1]))continue;
  const near=BLOCKS.filter(b=>!b.use&&!b.inWadi&&b.unit&&residentialZone(b.unit.zone)&&Math.hypot(b.c[0]-C[0],b.c[1]-C[1])<520&&b.fill>.7).sort((a,b)=>Math.hypot(a.c[0]-C[0],a.c[1]-C[1])-Math.hypot(b.c[0]-C[0],b.c[1]-C[1]));
  if(near.length<4)continue;const cen={c:C,d:near[0].d,items:[]};
  const take=(kind,minA,t)=>{const b=near.find(x=>!x.use&&x.A>=minA);if(!b)return;const nm=nextName(kind==='kindergarten'?'kg':kind);b.use='centre:'+kind;const P={kind,name:[nm[0],nm[1]],fac:nm[2],t};const s=place(b,kind==='park'?'park':kind,P,null,(b.frontCol||b.front).dir);s.centre=cen;cen.items.push(s)};
  take('mosque',5200,'mosque');take('school',11000,'school');take('park',4500,'park');take('kindergarten',3000,'kindergarten');
  if(cen.items.length)CENTRES.push(cen)}
/* district parks carry the portal's park names that are still unused */
for(const P of CFG.program.filter(p=>p.site==='central'))Object.assign(CENTRAL,{P});

/* ------------------------------------------------------ 9 zoning of rest */
const BUILD=[];   /* building records */
const R2=SC.rng(CFG.seed+11);
const dYear=(b)=>{const d=CFG.districts.find(q=>q.id===b.d)||CFG.districts[0],ds=Math.hypot(b.c[0]-d.seed[0],b.c[1]-d.seed[1]);return Math.round(d.infra+1+ds/650+R2()*2.2)};
for(const b of BLOCKS){if(b.use)continue;if(b.inWadi){b.use='park:wadi';continue}
  const z=b.unit?b.unit.zone:'villas';
  if(b.A<1800||b.fill<.55){b.use='park:pocket';continue}
  /* commercial frontage only at the major junctions (neighbourhood shopping nodes), not along whole arterials */
  if(residentialZone(z)&&b.frontArt&&z!=='apartments'&&NODES_USED.some(n=>(n.ctrl==='signals'||n.ctrl==='roundabout')&&Math.hypot(n.x-b.c[0],n.z-b.c[1])<165)){b.use='commercial:strip';continue}
  if(z==='cbd'&&R2()<.4){b.use='apartments_hi';continue}
  if(z==='apartments'&&b.frontArt){b.use='mixed';continue}
  b.use=z}

/* ------------------------------------------------- 9b parcels & buildings */
const H=(fl,g=4.2,t=3.4)=>+(g+(fl-1)*t+1.2).toFixed(1);
let bid=0;
function rec(o){o.idx=BUILD.length;o.id='B-'+(1001+BUILD.length);BUILD.push(o);return o}
/* local frame of a block: its OBB long axis */
function bframe(b){const o=g2.obb(b.poly);const c=g2.centroid(b.poly);let ux=o.ux,uz=o.uz;let L=o.u1-o.u0,Dd=o.v1-o.v0;if(Dd>L){[ux,uz]=[-uz,ux];[L,Dd]=[Dd,L]}
  /* centre of the OBB in world */const cu=(o.u0+o.u1)/2,cv=(o.v0+o.v1)/2,cx=cu*o.ux-cv*o.uz,cz=cu*o.uz+cv*o.ux;
  const P=(a,d)=>[cx+ux*a-uz*d,cz+uz*a+ux*d];return{P,L,D:Dd,ux,uz,nx:-uz,nz:ux,rect:(a0,a1,d0,d1)=>[P(a0,d0),P(a1,d0),P(a1,d1),P(a0,d1)],c:[cx,cz]}}
const inside=(poly,site)=>poly.every(p=>g2.pip(p[0],p[1],site));
const clipTo=(poly,site)=>{const q=g2.clipConvex(site,poly);return q.length>=3?g2.ccw(q):null};  /* site ∩ convex poly */
/* villas: two rows of plots back to back, each plot walled with a gate on its street side */
function layVillas(b){const f=bframe(b);const rows=f.D>=54?2:1,pw0=26+R2()*4;const n=Math.max(1,Math.floor(f.L/pw0)),pw=f.L/n;const pd=f.D/rows;
  for(let r=0;r<rows;r++)for(let k=0;k<n;k++){const a0=-f.L/2+k*pw,a1=a0+pw,d0=-f.D/2+r*pd,d1=d0+pd;const plot=clipTo(f.rect(a0,a1,d0,d1),b.poly);if(!plot||g2.absArea(plot)<pw*pd*.72){continue}
    const front=r===0&&rows===2?[-f.nx,-f.nz]:[f.nx,f.nz];const fsgn=r===0&&rows===2?-1:1;
    /* villa footprint: main two-storey volume + one-storey majlis wing, set back 6 m front / 3 m sides */
    const w=pw-6,dd=Math.min(pd-10,19),cA=(a0+a1)/2,fr=fsgn>0?d1-6:d0+6,bk=fr-fsgn*dd;
    const mw=w*(.62+R2()*.12),side=R2()<.5?-1:1,mA0=side<0?a0+3:a1-3-mw,mA1=mA0+mw;
    const masses=[{poly:g2.ccw(f.rect(mA0,mA1,Math.min(fr,bk),Math.max(fr,bk))),h:H(2,4,3.5),role:'villa',floors:2}];
    const wA0=side<0?mA1:a0+3,wA1=side<0?a1-3:mA0,wd=dd*.62;if(wA1-wA0>5)masses.push({poly:g2.ccw(f.rect(wA0,wA1,fsgn>0?fr-wd:fr,fsgn>0?fr:fr+wd)),h:H(1,4.6),role:'majlis',floors:1});
    rec({kind:'villa',cat:'residential',block:b,plot,front,masses,floors:2,h:masses[0].h+(R2()<.6?3:0),frame:{u:[f.ux,f.uz],sgn:fsgn},gate:f.P(cA,fsgn>0?d1:d0),seed:(bid++)*97+13,pool:R2()<.35,style:SC.pick(R2,['gulf','classic','pergola','luxury','omani'])})}}
function layTownhouses(b){const f=bframe(b);const rows=f.D>=52?2:1,pd=f.D/rows,uw=8.4;
  for(let r=0;r<rows;r++){const fsgn=r===0&&rows===2?-1:1,d0=-f.D/2+r*pd,d1=d0+pd;const fr=fsgn>0?d1-5:d0+5,bk=fr-fsgn*Math.min(14,pd-9);
    const segL=Math.min(60,f.L-12);const nseg=Math.max(1,Math.floor((f.L-8)/(segL+8)));const sl=(f.L-8-(nseg-1)*8)/nseg;
    for(let k=0;k<nseg;k++){const a0=-f.L/2+4+k*(sl+8),a1=a0+sl;const poly=clipTo(f.rect(a0,a1,Math.min(fr,bk),Math.max(fr,bk)),b.poly);if(!poly||g2.absArea(poly)<sl*Math.abs(fr-bk)*.9)continue;
      const units=Math.max(2,Math.round(sl/uw));rec({kind:'townhouse',cat:'residential',block:b,plot:clipTo(f.rect(a0-3,a1+3,d0,d1),b.poly)||poly,front:fsgn>0?[f.nx,f.nz]:[-f.nx,-f.nz],masses:[{poly,h:H(R2()<.5?2:3,3.8,3.4),role:'townhouse',floors:3,units}],floors:3,units,frame:{u:[f.ux,f.uz],sgn:fsgn},seed:(bid++)*97+5,style:SC.pick(R2,['pergola','omani','gulf'])})}}}
function layApartments(b,hi){const f=bframe(b);const fl=hi?6+Math.floor(R2()*6):4+Math.floor(R2()*4);const dep=16;
  const L=f.L-10,Dd=f.D-10;const layout=L>90&&Dd>70?(R2()<.5?'slabs':'blocks'):'slab1';const out=[];
  if(layout==='slabs'){for(const sg of [-1,1])out.push(f.rect(-L/2,L/2,sg<0?-Dd/2:Dd/2-dep,sg<0?-Dd/2+dep:Dd/2))}
  else if(layout==='blocks'){const s=24;for(const a of [-1,1])for(const d of [-1,1])out.push(f.rect(a<0?-L/2:L/2-s,a<0?-L/2+s:L/2,d<0?-Dd/2:Dd/2-s,d<0?-Dd/2+s:Dd/2))}
  else out.push(f.rect(-L/2,L/2,-dep/2,dep/2));
  out.forEach((q,i)=>{const poly=clipTo(q,b.poly);if(!poly||g2.absArea(poly)<150)return;const flv=fl+(i%2);rec({kind:'apartment',cat:'residential',block:b,plot:b.poly,front:frontOf(b)?frontOf(b).dir:[f.nx,f.nz],masses:[{poly,h:H(flv,4.2,3.3),role:'apartment',floors:flv}],floors:flv,seed:(bid++)*97+3,style:SC.pick(R2,['midrise','omani','midrise','gulf']),layout})});
  b.court=layout==='slabs'?f.rect(-L/2+4,L/2-4,-Dd/2+dep+6,Dd/2-dep-6):layout==='blocks'?f.rect(-L/2+28,L/2-28,-Dd/2+4,Dd/2-4):f.rect(-L/2,L/2,dep/2+6,Dd/2);b.courtKind='parking'}
function layCBD(b){const f=bframe(b);const dO=Math.hypot(b.c[0]-F.o[0],b.c[1]-F.o[1]);const tall=clamp(1-(dO-700)/1500,0,1);
  const L=f.L-12,Dd=f.D-12;const pod=f.rect(-L/2,L/2*.55,-Dd/2,Dd/2),ts=Math.min(34,L*.34);
  const fl=Math.round(14+tall*26+R2()*8),podFl=3;const tw=f.rect(-L/2+8,-L/2+8+ts,-ts/2,ts/2);
  const p1=clipTo(pod,b.poly),p2=clipTo(tw,b.poly);if(!p1||!p2)return layApartments(b,true);
  const masses=[{poly:p1,h:H(podFl,5,4.2),role:'podium',floors:podFl},{poly:p2,h:H(fl,5,3.6),role:'tower',floors:fl}];
  rec({kind:'tower',cat:R2()<.55?'office':'residential',block:b,plot:b.poly,front:(b.front||{}).dir||[f.nx,f.nz],masses,floors:fl,seed:(bid++)*97+7,style:SC.pick(R2,['tower','glass','omani_tower']),landmark:fl>34});
  b.plaza=f.rect(L/2*.55+4,L/2,-Dd/2,Dd/2)}
function layBusiness(b){const f=bframe(b);const L=f.L-12,Dd=f.D-12;const n=L>110?2:1;for(let k=0;k<n;k++){const a0=-L/2+k*(L/n),a1=a0+L/n-14;const q=clipTo(f.rect(a0,a1,Dd/2-24,Dd/2),b.poly);if(!q)continue;const fl=6+Math.floor(R2()*8);
    rec({kind:'office',cat:'office',block:b,plot:b.poly,front:[f.nx,f.nz],masses:[{poly:q,h:H(fl,5,3.8),role:'office',floors:fl}],floors:fl,seed:(bid++)*97+1,style:SC.pick(R2,['glass','tower','civic'])})}
  b.court=f.rect(-L/2,L/2,-Dd/2,Dd/2-30);b.courtKind='parking'}
function layMixed(b){const f=bframe(b);const fr=frontOf(b,'art')||frontOf(b);const L=f.L-10,Dd=f.D-10;const dep=18;
  /* long mixed-use building on the arterial side, parking court behind */const sg=fr&&((fr.dir[0]*f.nx+fr.dir[1]*f.nz)>0)?1:-1;
  const q=clipTo(f.rect(-L/2,L/2,sg>0?Dd/2-dep:-Dd/2,sg>0?Dd/2:-Dd/2+dep),b.poly);if(!q)return;const fl=4+Math.floor(R2()*3);
  rec({kind:'mixed',cat:'commercial',block:b,plot:b.poly,front:fr?fr.dir:[f.nx,f.nz],masses:[{poly:q,h:H(fl,5,3.4),role:'mixed',floors:fl}],floors:fl,seed:(bid++)*97+9,style:SC.pick(R2,['midrise','omani','gulf'])});
  b.court=f.rect(-L/2,L/2,sg>0?-Dd/2:-Dd/2+dep+6,sg>0?Dd/2-dep-6:Dd/2);b.courtKind='parking'}
function layStrip(b){const f=bframe(b);const fr=frontOf(b,'art');const sg=fr&&((fr.dir[0]*f.nx+fr.dir[1]*f.nz)>0)?1:-1;const L=f.L-10,Dd=f.D-8;
  /* showrooms / restaurants / cafés set back behind a front parking row on the arterial */
  const n=Math.max(1,Math.floor(L/48));for(let k=0;k<n;k++){const a0=-L/2+k*L/n+3,a1=a0+L/n-6;const d1=sg>0?Dd/2-26:-Dd/2+26,d0=d1-sg*Math.min(24,Dd-34);const q=clipTo(f.rect(a0,a1,Math.min(d0,d1),Math.max(d0,d1)),b.poly);if(!q)continue;
    const kind=SC.pick(R2,['retail','retail','restaurant','cafe','showroom','supermarket']);const fl=kind==='cafe'?1:1+Math.floor(R2()*2);
    rec({kind,cat:'commercial',block:b,plot:b.poly,front:fr?fr.dir:[f.nx,f.nz],masses:[{poly:q,h:H(fl,5.2,4),role:kind,floors:fl}],floors:fl,seed:(bid++)*97+11,style:'shop'})}
  b.court=f.rect(-L/2,L/2,sg>0?Dd/2-24:-Dd/2+2,sg>0?Dd/2-2:-Dd/2+24);b.courtKind='parking';
  /* the back of a strip block keeps villas / townhouses facing the local street */}
/* facilities: run their site plans */
function layFacility(s){const fn=SC.sites[s.kind]||SC.sites.park;const ctx=SC.siteCtx(s.poly,s.front,SC.rng(SC.hash(s.kind+s.block.id)));fn(ctx);
  /* keep every element inside the site */const site=s.poly,hullS=g2.hull(site);
  ctx.masses=ctx.masses.filter(m=>m.role==='sailroof'||inside(m.poly,site));ctx.ground=ctx.ground.map(gd=>{if(gd.kind==='park')return gd;const q=g2.clipConvex(gd.poly,hullS);return q.length>=3&&g2.absArea(q)>20&&g2.pip(...g2.centroid(q),site)?Object.assign(gd,{poly:g2.ccw(q)}):null}).filter(Boolean);
  const P=s.P||{},cat={park:'culture'}[s.kind];const kind=s.kind;
  const catOf={mosque_grand:'religious',mosque:'religious',masjid:'religious',school:'education',kindergarten:'education',university:'education',college:'education',hospital:'health',clinic:'health',police_hq:'security',police:'security',fire:'security',mall:'shopping',souq:'shopping',hotel:'hospitality',civic:'civic',post:'civic',fuel:'commercial',parking:'transport',library:'culture',cultural:'culture',museum:'culture',community:'culture',stadium:'sports',sportshall:'sports',substation:'utility',reservoir:'utility',depot:'transport',park:'culture'}[kind]||'civic';
  const h=ctx.masses.reduce((m,q)=>Math.max(m,(q.y0||0)+q.h),0),fl=ctx.masses.reduce((m,q)=>Math.max(m,q.floors||1),1);
  return rec({kind,cat:kind==='park'?'park':catOf,block:s.block,plot:site,front:s.front,masses:ctx.masses,ground:ctx.ground,entrances:ctx.entrances,walls:ctx.walls,paths:ctx.paths,floors:fl,h:Math.max(h,1),
    name:P.name,fac:P.fac,t:P.t,landmark:!!P.landmark||ctx.masses.some(m=>m.landmark),seed:SC.hash(kind+s.block.id),site:s,centre:s.centre||null})}
for(const s of FAC_SITES){if(s.kind==='park'&&!s.central){const r=layFacility(s);s.rec=r;continue}s.rec=layFacility(s)}
/* central park itself (the part not used by the edge sites) */
if(centralBlock){CENTRAL.rec=rec({kind:'park_central',cat:'park',block:centralBlock,plot:centralBlock.poly,front:[UX[0],UX[1]],masses:[],ground:[{poly:centralBlock.poly,kind:'park'}],entrances:[],walls:[],floors:0,h:0,name:CENTRAL.P?CENTRAL.P.name:['حديقة المدينة','City Park'],fac:CENTRAL.P&&CENTRAL.P.fac,t:'park',seed:77}) }
for(const b of BLOCKS){switch(b.use){case'villas':layVillas(b);break;case'townhouses':layTownhouses(b);break;case'apartments':layApartments(b,b.d==='nb2');break;
  case'cbd':layCBD(b);break;case'apartments_hi':layApartments(b,true);break;case'business':layBusiness(b);break;case'mixed':layMixed(b);break;case'commercial:strip':layStrip(b);break}}
/* a small neighbourhood masjid in every residential unit without one (replaces two plots) */
for(const U of UNITS){if(!['villas','townhouses'].includes(U.zone))continue;const hasM=FAC_SITES.some(s=>(s.kind==='mosque'||s.kind==='mosque_grand')&&s.block.unit===U);if(hasM)continue;
  const vs=BUILD.filter(r=>(r.kind==='villa')&&r.block.unit===U);if(vs.length<8)continue;const cc=toW(U.u0+UNIT/2,U.v0+UNIT/2);vs.sort((a,b)=>Math.hypot(...g2.centroid(a.plot).map((v,i)=>v-cc[i]))-Math.hypot(...g2.centroid(b.plot).map((v,i)=>v-cc[i])));
  const v=vs[0];const nm=nextName('mosque');const ctx=SC.siteCtx(v.plot,v.front,SC.rng(v.seed));SC.sites.masjid(ctx);Object.assign(v,{kind:'masjid',cat:'religious',masses:ctx.masses,ground:ctx.ground,entrances:ctx.entrances,walls:[],name:[nm[0],nm[1]],fac:nm[2],t:'mosque',h:22,floors:1,pool:false})}

/* ------------------------------------------ 9b' building / corridor check */
{const EG=SC.Grid(120);EDGES.forEach(e=>EG.add(g2.bbox(e.pl),e));
  const onRoad=poly=>{for(const e of EG.q(g2.bbox(poly)))if(poly.some(p=>g2.dPolyline(p[0],p[1],e.pl)<e.R.row/2+.8))return true;return false};
  for(let i=BUILD.length-1;i>=0;i--){const r=BUILD[i];let drop=false;
    r.masses=r.masses.map((m,k)=>{if(m.role==='sailroof')return m;let q=m.poly;if(!q.every(p=>g2.pip(p[0],p[1],r.block.poly))||onRoad(q)){const c=g2.clipConvex(r.block.poly,q);if(c.length<3||g2.absArea(c)<g2.absArea(q)*.85||onRoad(c)){if(k===0)drop=true;return null}q=g2.ccw(c)}return Object.assign(m,{poly:q})}).filter(Boolean);
    if(drop||!r.masses.length&&r.cat!=='park'){BUILD.splice(i,1)}}
  BUILD.forEach((r,i)=>{r.idx=i;r.id='B-'+(1001+i)})}
/* ------------------------------ 9b'' block edges never enter a road ROW */
{const EG=SC.Grid(120);EDGES.forEach(e=>EG.add(g2.bbox(e.pl),e));
  const near=(x,z,pl)=>{let best=null,bd=1e9;for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1],ex=b[0]-a[0],ez=b[1]-a[1],l2=ex*ex+ez*ez||1;const t=clamp(((x-a[0])*ex+(z-a[1])*ez)/l2,0,1);const q=[a[0]+ex*t,a[1]+ez*t];const d=Math.hypot(x-q[0],z-q[1]);if(d<bd){bd=d;best=q}}return[best,bd]};
  for(let pass=0;pass<3;pass++)for(const b of BLOCKS){let moved=false;b.poly=b.poly.map(v=>{let p=v;for(const e of EG.q([v[0]-60,v[1]-60,v[0]+60,v[1]+60])){const need=e.R.row/2+.3;const [q,d]=near(p[0],p[1],e.pl);if(d<need&&d>1e-3){const k=(need-d)/d;p=[p[0]+(p[0]-q[0])*k,p[1]+(p[1]-q[1])*k];moved=true}}return p});if(moved){b.poly=g2.ccw(b.poly);b.c=g2.centroid(b.poly)}}
  /* leftover pocket-park slivers squeezed between two roads are dropped */
  for(let i=BLOCKS.length-1;i>=0;i--){const b=BLOCKS[i];if(b.use!=='park:pocket')continue;if(b.poly.some(v=>EG.q([v[0]-60,v[1]-60,v[0]+60,v[1]+60]).some(e=>near(v[0],v[1],e.pl)[1]<e.R.row/2-.3)))BLOCKS.splice(i,1)}}
/* ---------------------------------------------------- 9c metadata / years */
const DISTM=Object.fromEntries(CFG.districts.map(d=>[d.id,d]));
const NBLET={nb1:'A',nb2:'B',nb3:'C',nb4:'D',nb5:'E',nb6:'F'};
const cnt={};
const FUT={college:2028,hotel:2027,museum:2027,parking:2027,depot:2028,reservoir:2025,substation:2024};
for(const r of BUILD){const b=r.block;r.nb=b.d;const all=r.masses.flatMap(m=>m.poly);r.pts=r.masses.length?(r.masses.length===1?r.masses[0].poly:g2.hull(all)):r.plot;
  const bb=g2.bbox(r.masses.length?all:r.plot);[r.bx0,r.bz0,r.bx1,r.bz1]=bb;const c=g2.centroid(r.pts);r.x=c[0];r.z=c[1];
  if(!r.h)r.h=r.masses.reduce((m,q)=>Math.max(m,(q.y0||0)+q.h),0);r.floors=r.floors||1;
  r.year=r.cat==='park'?DISTM[r.nb].infra+1:(FUT[r.kind]||(['mosque_grand','hospital','university','stadium','mall','police_hq','civic','school','mosque','clinic','fire','police','library','cultural','kindergarten'].includes(r.kind)?DISTM[r.nb].infra+2+Math.floor(R2()*3):dYear(b)));
  if(r.kind==='tower'&&r.landmark)r.year=Math.max(r.year,2027+Math.floor(R2()*6));
  cnt[r.nb]=(cnt[r.nb]||0)+1;r.plotNo='PL-'+NBLET[r.nb]+'-'+String(cnt[r.nb]).padStart(3,'0')}
/* investment lots: three planned towers on prime CBD / business blocks */
const LOTS=[];{const pool=BUILD.filter(r=>(r.kind==='tower'||r.kind==='office')&&(r.nb==='nb2'||r.nb==='nb6')).sort((a,b)=>b.h-a.h);for(const [i,r] of [pool[1],pool[4],pool[9]].entries()){if(!r)continue;const id=['6-42','10-19','9-91'][i];r.lot=id;r.year=2031+i;LOTS.push({id,bi:r.idx,x:Math.round(r.x),y:Math.round(r.z)})}}
/* portal projects → representative building in their district */
const PRJ_KIND={nb1:['villa','townhouse'],nb2:['tower','apartment'],nb3:['apartment'],nb4:['villa'],nb5:['townhouse','villa'],nb6:['office','tower','apartment']};
const PRJS=['nb1','nb2','nb3','nb4','nb5','nb6'].map((nb,i)=>{const d=DISTM[nb];const pool=BUILD.filter(r=>r.nb===nb&&PRJ_KIND[nb].includes(r.kind)&&!r.lot&&r.year<=2026).sort((a,b)=>Math.hypot(a.x-d.seed[0],a.z-d.seed[1])-Math.hypot(b.x-d.seed[0],b.z-d.seed[1]));const r=pool[0]||BUILD.find(x=>x.nb===nb);r.project='pr'+(i+1);return{id:'pr'+(i+1),bi:r.idx,x:Math.round(r.x),y:Math.round(r.z),nb}});
/* portal facility list: keep ids f1…f17 on the matching planned facility */
const FACS=[],FACS_EXTRA=[];let fx=18;
for(const r of BUILD){if(!r.t)continue;const e={id:r.fac||('f'+(fx++)),t:r.t==='culture'&&r.kind==='park'?'park':r.t,bi:r.idx,x:Math.round(r.x),y:Math.round(r.z),ar:r.name?r.name[0]:'',en:r.name?r.name[1]:''};r.facId=e.id;(r.fac?FACS:FACS_EXTRA).push(e)}

/* ---------------------------------------------------------- 10 validate */
function validate(){const v={buildingsOnRoads:0,buildingsOutsidePlot:0,buildingsOverlap:0,buildingsInWater:0,roadsInWaterNotBridge:0,blocksOnRoads:0,deadEndsWithoutTurnaround:0,facilitiesMissing:0};
  const EG=SC.Grid(120);EDGES.forEach(e=>EG.add(g2.bbox(e.pl),e));
  const corridor=(e,x,z)=>g2.dPolyline(x,z,e.pl)<e.R.row/2+.5;
  for(const r of BUILD){for(const m of r.masses){if(m.role==='sailroof')continue;const bb=g2.bbox(m.poly);for(const e of EG.q(bb)){if(m.poly.some(p=>corridor(e,p[0],p[1]))){v.buildingsOnRoads++;break}}
      if(m.poly.some(p=>g2.pip(p[0],p[1],lake)||g2.pip(p[0],p[1],canalPoly)))v.buildingsInWater++;
      if(m.role!=='sailroof'&&!m.poly.every(p=>g2.pip(p[0],p[1],g2.inset(r.block.poly,-.6))))v.buildingsOutsidePlot++}}
  for(const b of BLOCKS){const bb=g2.bbox(b.poly);for(const e of EG.q(bb)){if(b.poly.some(p=>g2.dPolyline(p[0],p[1],e.pl)<e.R.row/2-.3)){v.blocksOnRoads++;break}}}
  for(const e of EDGES){if(e.bridge)continue;if(clipPl(e.pl,canalPoly,true).length||clipPl(e.pl,lake,true).length)v.roadsInWaterNotBridge++}
  for(const n of NODES_USED)if(n.e.length===1&&n.ctrl!=='culdesac')v.deadEndsWithoutTurnaround++;
  const kinds=['school','mosque','mosque_grand','hospital','clinic','university','police_hq','police','fire','mall','stadium','sportshall','library','cultural','museum','park','kindergarten','civic','fuel'];for(const k of kinds)if(!BUILD.some(r=>r.kind===k))v.facilitiesMissing++;
  return v}

/* ------------------------------------------- portal compatibility export */
const flat=p=>p.flatMap(q=>[Math.round(q[0]*10)/10,Math.round(q[1]*10)/10]);
CITYD_LIVE=root.CITYD={S:3,planOrigin:[0,0],bbox:g2.bbox(boundary).map(Math.round),boundary:flat(boundary),
  nbs:DIST.map(d=>({id:d.id,p:flat(d.outline),c:d.c.map(Math.round)})),prjs:PRJS,facs:FACS,facsExtra:FACS_EXTRA,lots:LOTS};

SC.plan={frame:{toU,toW,UX,VX,SB,UNIT,o:F.o,ang:F.ang},boundary,bbox:g2.bbox(boundary),ringLine,wadi:{path:wadiPath,poly:wadiPoly,drivePoly:wadiDrivePoly,canal,canalPoly,canalHalf:canalW,half:wadiHalf},lake,centralSq,
  districts:DIST,units:UNITS,sites:SITES,roads:ROADS,edges:EDGES,nodes:NODES_USED,blocks:BLOCKS,buildings:BUILD,facSites:FAC_SITES,centres:CENTRES,central:CENTRAL,lots:LOTS,validate,clipPl,
  stats:{roads:ROADS.length,edges:EDGES.length,nodes:NODES_USED.length,blocks:BLOCKS.length,faces:FACES.length,buildings:BUILD.length}};
SC.plan.stats.ms=Math.round((root.performance||Date).now()-T0);
if(typeof root.cityLink==='function')root.cityLink();   /* js/03-data.js hook */
return SC.plan}
})(typeof window!=='undefined'?window:globalThis);
