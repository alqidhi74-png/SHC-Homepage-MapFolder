/* ============================================================================
   SMART CITY — WORLD BUILDER (SC.World)
   ----------------------------------------------------------------------------
   Converts the plan into chunked meshes for the engine:
     LOD1 (built once, whole city): terrain, block ground, streets, junctions,
          water, parks, building masses with procedural façades, boundary walls
     LOD0 (built on demand near the camera, faded in): curbs, markings,
          crossings, street furniture, detailed trees, architectural detail,
          parked cars, playgrounds, fields' lines …
   Items are assigned to the chunk that contains their anchor point; chunk
   bounds grow to fit, so nothing is ever split or duplicated.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,MAT=SC.MAT,PAT=SC.PAT,clamp=SC.clamp;
const CH=360;
const side=(pl,o)=>g2.plOffset(pl,-o);          /* right-positive offset */
const C={asph:[62,62,66],asph2:[56,56,60],cyc:[150,74,60],foot:[206,196,180],verge:[176,160,130],curb:[214,210,202],median:[120,138,88],island:[108,142,72],
  block:[206,190,160],plot:[196,178,148],paveL:[214,204,186],grass:[104,142,62],grassD:[92,128,56],sand:[204,178,138],desert:[210,182,140],water:[40,110,118],
  wall:[226,214,192],wallStone:[204,188,160],white:[244,242,236],yellow:[236,188,60],red:[196,60,50],parking:[74,74,78],field:[82,150,64],track:[176,78,58],court:[62,120,150],
  plaza:[218,208,190],court2:[196,120,74],rubber:[210,110,70],pool:[70,170,200],apron:[176,172,166],yard:[184,178,166],trail:[214,198,168],drop:[120,120,124]};
SC.WCOL=C;

SC.World=function(plan,opts={}){
  const chunks=new Map();   /* key → {bb, hmax, items:[]} */
  const key=(x,z)=>Math.floor(x/CH)+'_'+Math.floor(z/CH);
  const put=(x,z,it,bb,h)=>{const k=key(x,z);let c=chunks.get(k);if(!c){c={k,bb:[1e9,1e9,-1e9,-1e9],hmax:1,items:[]};chunks.set(k,c)}c.items.push(it);c.bb[0]=Math.min(c.bb[0],bb[0]);c.bb[1]=Math.min(c.bb[1],bb[1]);c.bb[2]=Math.max(c.bb[2],bb[2]);c.bb[3]=Math.max(c.bb[3],bb[3]);c.hmax=Math.max(c.hmax,h||1)};
  /* ---- register items ---- */
  for(const e of plan.edges){const m=g2.plAt(e.pl,e.L/2).p;const bb=g2.bbox(e.pl);const w=e.R.row/2;put(m[0],m[1],{t:'edge',e},[bb[0]-w,bb[1]-w,bb[2]+w,bb[3]+w],2)}
  for(const n of plan.nodes)put(n.x,n.z,{t:'node',n},[n.x-40,n.z-40,n.x+40,n.z+40],2);
  for(const b of plan.blocks){put(b.c[0],b.c[1],{t:'block',b},g2.bbox(b.poly),1)}
  for(const r of plan.buildings){const bb=g2.bbox(r.plot||r.pts);put(r.x,r.z,{t:'bld',r},bb,r.h+4)}
  /* water & wadi in pieces so they are culled sensibly */
  {const W=plan.wadi;put(plan.lake[0][0],plan.lake[0][1],{t:'lake'},g2.bbox(plan.lake),1);
    const n=W.path.length,step=8;for(let i=0;i<n-1;i+=step){const seg=W.path.slice(i,Math.min(n,i+step+1));const bb=g2.bbox(seg);put(seg[0][0],seg[0][1],{t:'wadi',i0:i,i1:Math.min(n-1,i+step)},[bb[0]-200,bb[1]-200,bb[2]+200,bb[3]+200],1)}}
  /* park paths (LOD1, visible from afar) and street furniture (LOD0) */
  for(const p of plan.paths||[]){const bb=g2.bbox(p.pl);put(p.pl[0][0],p.pl[0][1],{t:'path',p},[bb[0]-p.w,bb[1]-p.w,bb[2]+p.w,bb[3]+p.w],1)}
  for(const f of plan.furniture||[])put(f.x,f.z,{t:'fur',f},[f.x-6,f.z-6,f.x+6,f.z+6],f.t==='monument'?8:f.t==='pole2'?12:10);

  /* ================================================== LOD1 builders ==== */
  const L1={};
  L1.edge=(M,{e})=>{const core=e.core;if(!core)return;M.F=e.fidD;const x=e.x;
    /* carriageway (with parking bays) */M.layer=2;M.ribbon(core,e.R.cw,.02,e.cls==='ring'||e.cls==='art'?C.asph2:C.asph,MAT.asphalt);
    if(e.R.median>0){M.layer=3;M.ribbon(core,e.R.median,.2,e.R.median>3?C.median:C.curb,e.R.median>3?MAT.grass:MAT.paver)}
    /* cycle tracks + tree verge + footpath (raised) */
    for(const sd of [1,-1]){if(e.R.cyc>0){M.layer=3;M.ribbon(side(core,sd*(x.cyc0+x.cyc1)/2),e.R.cyc,.12,C.cyc,MAT.asphalt)}
      M.layer=3;M.ribbon(side(core,sd*(x.verge0+x.verge1)/2),x.verge1-x.verge0,.17,C.verge,MAT.sand);
      M.ribbon(side(core,sd*(x.verge1+x.row)/2),x.row-x.verge1,.17,C.foot,MAT.paver)}
    /* bridges: deck edge + parapets over water */
    if(e.bridge){M.layer=0;for(const pc of plan.clipPl(core,plan.wadi.canalPoly,true).concat(plan.clipPl(core,plan.lake,true))){for(const sd of [1,-1]){const pl=side(pc,sd*(x.row-.2));for(let i=0;i<pl.length-1;i++){M.P=[0,0,0,0];M.wall(pl[i][0],pl[i][1],pl[i+1][0],pl[i+1][1],.17,1.25,C.wallStone,MAT.matte);M.wall(pl[i+1][0],pl[i+1][1],pl[i][0],pl[i][1],.17,1.25,C.wallStone,MAT.matte)}
          const eo=side(pc,sd*x.row);for(let i=0;i<eo.length-1;i++){const a=eo[i],b=eo[i+1];const [p,q]=sd>0?[b,a]:[a,b];M.wall(p[0],p[1],q[0],q[1],-1.6,.17,[170,160,146],MAT.matte)}}}}
    M.layer=0};
  L1.node=(M,{n})=>{M.F=n.fidD;if(n.ctrl==='roundabout'){const seg=40;const ring=[];for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;ring.push([n.x+Math.cos(a)*n.R,n.z+Math.sin(a)*n.R])}M.layer=2;M.flat(ring,.02,C.asph,MAT.asphalt);
      const isl=[];for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;isl.push([n.x+Math.cos(a)*n.ri,n.z+Math.sin(a)*n.ri])}M.layer=0;M.prism(isl,0,.35,C.curb,MAT.matte,{topC:C.island,topM:MAT.grass});
      /* sidewalk ring between the mouths */const w=Math.max(...n.arms.map(a=>a.e.R.sw+a.e.R.cyc));const mouths=n.arms.map(a=>({ang:a.ang,hw:Math.asin(clamp(a.row/(n.R+w/2),0,.99))}));
      for(let i=0;i<mouths.length;i++){const m0=mouths[i],m1=mouths[(i+1)%mouths.length];let a0=m0.ang+m0.hw,a1=m1.ang-m1.hw;if(mouths.length===1)a1=a0+Math.PI*2-2*m0.hw;while(a1<a0)a1+=Math.PI*2;const arc=[];for(let t=a0;t<=a1+1e-6;t+=(a1-a0)/Math.max(2,Math.ceil((a1-a0)/.12)))arc.push([n.x+Math.cos(t)*(n.R+w/2),n.z+Math.sin(t)*(n.R+w/2)]);M.layer=3;if(arc.length>1)M.ribbon(arc,w,.17,C.foot,MAT.paver)}
      M.layer=0;return}
    if(n.ctrl==='culdesac'){const seg=28,disk=[];for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;disk.push([n.x+Math.cos(a)*n.rr,n.z+Math.sin(a)*n.rr])}M.layer=2;M.flat(disk,.02,C.asph,MAT.asphalt);
      const a=n.arms[0];const w=a.e.R.sw;const hw=Math.asin(clamp(a.cw/(n.rr+w/2),0,.99));const arc=[];for(let t=a.ang+hw;t<=a.ang+Math.PI*2-hw;t+=.15)arc.push([n.x+Math.cos(t)*(n.rr+w/2),n.z+Math.sin(t)*(n.rr+w/2)]);M.layer=3;M.ribbon(arc,w+.2,.17,C.foot,MAT.paver);M.layer=0;return}
    if(n.surface){M.layer=2;M.flat(n.surface,.02,C.asph,MAT.asphalt);
      for(const c of n.corners){if(c.reflex)continue;const poly=c.curb.concat(c.outer.slice().reverse());M.layer=3;if(g2.absArea(poly)>1)M.flat(g2.ccw(poly),.17,C.foot,MAT.paver)}}
    M.layer=0};
  const BLOCKC={villas:C.plot,townhouses:C.plot,apartments:C.block,apartments_hi:C.block,cbd:C.paveL,business:C.block,mixed:C.block,'commercial:strip':C.block};
  L1.block=(M,{b})=>{M.F=b.fidD;const u=b.use||'';const park=u.startsWith('park')||u==='centre:park';M.layer=1;
    if(park)M.flat(b.poly,.18,u==='park:pocket'?C.grassD:C.grass,MAT.grass);else M.flat(b.poly,.17,BLOCKC[u]||C.block,MAT.sand);
    if(b.court){const q=g2.clipConvex(b.poly,g2.ccw(b.court));if(q.length>=3){M.layer=2;M.flat(g2.ccw(q),.18,C.parking,MAT.asphalt)}}
    if(b.plaza){const q=g2.clipConvex(b.poly,g2.ccw(b.plaza));if(q.length>=3){M.layer=2;M.flat(g2.ccw(q),.19,C.plaza,MAT.tile)}}
    M.layer=0};
  L1.lake=(M)=>{M.F=-1;M.layer=4;const lk=plan.lake;M.flat(lk,.22,C.water,MAT.water);M.layer=0;edgeWall(M,lk,-.2,.42)};   /* water sits just below the stone coping, above the park lawn */
  const edgeWall=(M,poly,y0,y1)=>{poly=g2.ccw(poly);for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];M.wall(b[0],b[1],a[0],a[1],y0,y1,C.wallStone,MAT.matte)}
    const top=g2.plOffset(poly.concat([poly[0]]),-.6);M.layer=3;M.ribbon(poly.concat([poly[0]]),1.2,y1,[222,212,194],MAT.matte,{off:.6});M.layer=0};
  L1.wadi=(M,{i0,i1})=>{const W=plan.wadi;M.F=-1;const pl=W.path.slice(i0,i1+1);
    /* canal: water surface + retaining walls for this stretch */
    const cp=W.canalPoly;const bb=g2.bbox(pl);const loc=cp.filter(p=>p[0]>bb[0]-120&&p[0]<bb[2]+120&&p[1]>bb[1]-120&&p[1]<bb[3]+120);
    const cL=W.canal.slice(i0,i1+1);if(cL.length>1){const wl=[],wr=[];let s=i0*30;for(let k=0;k<cL.length;k++){const w=W.canalHalf?W.canalHalf(s+k*30):11;wl.push(w)}
      const left=[],right=[];for(let k=0;k<cL.length;k++){const a=cL[Math.max(0,k-1)],b=cL[Math.min(cL.length-1,k+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,w=wl[k];left.push([cL[k][0]-dz/l*w,cL[k][1]+dx/l*w]);right.push([cL[k][0]+dz/l*w,cL[k][1]-dx/l*w])}
      const inLake=(p)=>g2.pip(p[0],p[1],plan.lake);for(let k=0;k<cL.length-1;k++){if(inLake(cL[k])&&inLake(cL[k+1]))continue;M.quad([left[k][0],-.8,left[k][1]],[right[k][0],-.8,right[k][1]],[right[k+1][0],-.8,right[k+1][1]],[left[k+1][0],-.8,left[k+1][1]],C.water,MAT.water);
        M.wall(left[k+1][0],left[k+1][1],left[k][0],left[k][1],-1.3,.24,C.wallStone,MAT.matte);M.wall(right[k][0],right[k][1],right[k+1][0],right[k+1][1],-1.3,.24,C.wallStone,MAT.matte)}
      const outL=pl=>plan.clipPl(pl,plan.lake,false).filter(q=>q.length>1);M.layer=3;for(const q of outL(left))M.ribbon(q,1.1,.24,[222,212,194],MAT.matte,{off:.55});for(const q of outL(right))M.ribbon(q,1.1,.24,[222,212,194],MAT.matte,{off:-.55});
      /* promenades & cycle path along both banks */M.layer=3;for(const q of outL(side(cL,-18)))M.ribbon(q,4,.2,C.trail,MAT.paver);for(const q of outL(side(cL,18)))M.ribbon(q,4,.2,C.trail,MAT.paver);for(const q of outL(side(cL,26)))M.ribbon(q,2.6,.2,C.cyc,MAT.asphalt);M.layer=0}};
  L1.terrain=(M)=>{M.F=-1;const bb=plan.bbox;const pad=6000;M.layer=0;M.flat([[bb[0]-pad,bb[1]-pad],[bb[2]+pad,bb[1]-pad],[bb[2]+pad,bb[3]+pad],[bb[0]-pad,bb[3]+pad]],-.05,C.desert,MAT.sand);
    M.layer=1;M.flat(plan.boundary,.0,[200,184,150],MAT.sand);M.layer=0};
  L1.mountains=(M)=>{/* distant Hajar-like ridges on three sides */M.F=-1;const c=[(plan.bbox[0]+plan.bbox[2])/2,(plan.bbox[1]+plan.bbox[3])/2];const R0=11000,seg=180;const R=SC.rng(99);const h=[];for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;h.push(420+380*Math.abs(Math.sin(a*3.1+1))+260*Math.abs(Math.sin(a*7.7))+140*R()+(Math.cos(a+.6)>0?500:0))}
    for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;const p0=[c[0]+Math.cos(a0)*R0,c[1]+Math.sin(a0)*R0],p1=[c[0]+Math.cos(a1)*R0,c[1]+Math.sin(a1)*R0],q0=[c[0]+Math.cos(a0)*(R0+3000),c[1]+Math.sin(a0)*(R0+3000)],q1=[c[0]+Math.cos(a1)*(R0+3000),c[1]+Math.sin(a1)*(R0+3000)];
      const col=[150,126,104];M.quad([p0[0],0,p0[1]],[p1[0],0,p1[1]],[q1[0],h[i+1],q1[1]],[q0[0],h[i],q0[1]],col,MAT.sand)}};

  L1.path=(M,{p})=>{M.F=-1;M.layer=5;const c=p.kind==='promenade'?[220,206,178]:p.kind==='avenue'?[214,202,180]:p.kind==='plaza'?[224,214,194]:[210,196,170];M.ribbon(p.pl,p.w,.24,c,MAT.paver);M.layer=0};
  /* ================================================== LOD0 builders ==== */
  const L0={};const WHITE=[240,240,236],YEL=[236,190,60];
  const mark=(M,pl,s0,s1,off,w,c=WHITE,dash)=>{const sub=SC.streets.subPl(pl,s0,s1);if(!sub)return;const q=side(sub,off);M.layer=7;if(dash)M.dashes(q,w,.05,c,dash[0],dash[1]);else M.ribbon(q,w,.05,c,MAT.paint);M.layer=0};
  L0.edge=(M,{e})=>{const core=e.core;if(!core)return;M.F=e.fidD;const L=g2.plLen(core),R=e.R,x=e.x;
    /* curbs: 15 cm faces along the carriageway (and median) */
    for(const sd of [1,-1]){const q=side(core,sd*x.cw);for(let i=0;i<q.length-1;i++)M.panel(q[i][0],q[i][1],q[i+1][0],q[i+1][1],.02,.17,C.curb,MAT.matte);
      if(R.median>0){const m=side(core,sd*R.median/2);for(let i=0;i<m.length-1;i++)M.panel(m[i][0],m[i][1],m[i+1][0],m[i+1][1],.02,.2,C.curb,MAT.matte)}
      if(R.cyc>0){const c=side(core,sd*x.cyc1);for(let i=0;i<c.length-1;i++)M.panel(c[i][0],c[i][1],c[i+1][0],c[i+1][1],.12,.17,C.curb,MAT.matte)}}
    /* marking span between the crossings / stop lines */
    const xa=e.xings.find(q=>q.end==='a'),xb=e.xings.find(q=>q.end==='b');const s0=xa?xa.s1-e.trimA+1.4:1,s1=xb?xb.s0-e.trimA-1.4:L-1;if(s1-s0<4)return;
    const lw=R.laneW,med=R.median/2;
    if(R.median<=0){mark(M,core,s0,s1,0,.14,WHITE,e.cls==='loc'||e.cls==='drv'?[3,5]:null);if(e.cls==='col'){mark(M,core,s0,s1,.15,.12,YEL);mark(M,core,s0,s1,-.15,.12,YEL)}}
    for(const sd of [1,-1]){for(let k=1;k<R.lanes;k++)mark(M,core,s0,s1,sd*(med+lw*k),.14,WHITE,[3,6]);
      if(R.park>0){const po=med+lw*R.lanes;mark(M,core,s0,s1,sd*po,.12);for(let s=s0+6;s<s1-2;s+=6.2)mark(M,core,s,s+.12,sd*(po+R.park/2),R.park-.2)}
      else mark(M,core,s0,s1,sd*(x.cw-.35),.15,WHITE)}
    /* stop lines + turn arrows on the approach side of each crossing */
    for(const xg of e.xings){const sd=xg.end==='b'?1:-1;const s=xg.end==='b'?xg.s0-e.trimA-.6:xg.s1-e.trimA+.6;if(xg.ctrl==='roundabout'){for(let o=med+.4;o<x.cw-.4;o+=.9)mark(M,core,s-.3,s+.3,sd*o,.45)}else mark(M,core,s-.25,s+.25,sd*(med+(x.cw-med)/2),x.cw-med-.4);
      if(xg.ctrl==='signals'&&R.lanes>1){for(let k=0;k<R.lanes;k++){const o=sd*(med+lw*(k+.5));const a0=xg.end==='b'?s-9:s+9,a1=xg.end==='b'?s-4:s+4;mark(M,core,Math.min(a0,a1),Math.max(a0,a1),o,.18);const tip=xg.end==='b'?Math.max(a0,a1):Math.min(a0,a1);const q=g2.plAt(side(core,o),tip);const d=g2.plAt(core,tip).d;const dir=xg.end==='b'?1:-1;const n=[-d[1],d[0]];
          M.layer=7;const base=M.count;M.v(q.p[0]+d[0]*dir*1.4,.05,q.p[1]+d[1]*dir*1.4,0,1,0,WHITE,MAT.paint,0,0);M.v(q.p[0]+n[0]*.6,.05,q.p[1]+n[1]*.6,0,1,0,WHITE,MAT.paint,0,0);M.v(q.p[0]-n[0]*.6,.05,q.p[1]-n[1]*.6,0,1,0,WHITE,MAT.paint,0,0);M.tri(base,base+1,base+2);M.tri(base,base+2,base+1);M.layer=0}}
      /* zebra: stripes parallel to traffic, evenly spaced across the carriageway */
      if(xg.ctrl!=='roundabout'||true){for(let o=-x.cw+.8;o<x.cw-.5;o+=1.1){if(R.median>0&&Math.abs(o+.28)<med+.2)continue;mark(M,core,xg.s0-e.trimA,xg.s1-e.trimA,o+.28,.55)}}}
    /* bridge railings */if(e.bridge){for(const pc of plan.clipPl(core,plan.wadi.canalPoly,true)){for(const sd of [1,-1]){const q=side(pc,sd*(x.row-.2));for(let i=0;i<q.length-1;i++){M.box((q[i][0]+q[i+1][0])/2,(q[i][1]+q[i+1][1])/2,Math.hypot(q[i+1][0]-q[i][0],q[i+1][1]-q[i][1])/2,.06,1.25,1.35,Math.atan2(q[i+1][1]-q[i][1],q[i+1][0]-q[i][0]),[70,74,80],MAT.metal)}}}}
    M.F=-1};
  L0.node=(M,{n})=>{M.F=n.fidD;if(n.ctrl==='roundabout'){const r=(n.ri+n.R)/2,pts=[];for(let k=0;k<=64;k++){const a=k/64*Math.PI*2;pts.push([n.x+Math.cos(a)*r,n.z+Math.sin(a)*r])}M.layer=7;M.dashes(pts,.14,.05,WHITE,3,4);
      const c2=[];for(let k=0;k<=48;k++){const a=k/48*Math.PI*2;c2.push([n.x+Math.cos(a)*(n.ri+.35),n.z+Math.sin(a)*(n.ri+.35)])}M.ribbon(c2,.35,.36,[230,50,40],MAT.matte);M.layer=0}
    if(n.ctrl==='culdesac'){const pts=[];for(let k=0;k<=24;k++){const a=k/24*Math.PI*2;pts.push([n.x+Math.cos(a)*3,n.z+Math.sin(a)*3])}M.prism(pts.slice(0,24),0,.3,C.curb,MAT.matte,{topC:C.island,topM:MAT.grass})}
    M.F=-1};
  const PRP=()=>SC.props;
  L0.fur=(M,{f})=>{const p=PRP();M.F=-1;switch(f.t){case'pole':p.smartPole(M,f.x,f.z,f.yaw,f.h,f.arm,f);break;case'pole2':p.smartPole(M,f.x,f.z,f.yaw,f.h,f.arm);p.smartPole(M,f.x,f.z,f.yaw+Math.PI,f.h,f.arm);break;
    case'signal':p.signal(M,f.x,f.z,f.face,f.reach);break;case'sign':p.sign(M,f.x,f.z,f.face,f.kind);break;case'bus':p.busShelter(M,f.x,f.z,f.yaw);break;case'bin':p.bin(M,f.x,f.z);break;case'sensor':p.sensor(M,f.x,f.z);break;
    case'bench':p.bench(M,f.x,f.z,f.yaw);break;case'lamp':p.lamp(M,f.x,f.z);break;case'shrub':p.shrub(M,f.x,f.z,SC.rng(Math.round(f.x*7+f.z)));break;case'fountain':p.fountain(M,[f.x,f.z],f.r);break;
    case'playground':M.layer=5;M.flat(g2.ccw([[f.x-f.size/2,f.z-f.size/2],[f.x+f.size/2,f.z-f.size/2],[f.x+f.size/2,f.z+f.size/2],[f.x-f.size/2,f.z+f.size/2]]),.26,[206,120,74],MAT.sand);M.layer=0;p.playground(M,[f.x,f.z],f.size,SC.rng(Math.round(f.x)));break;
    case'fitness':for(let k=0;k<4;k++)M.box(f.x+k*3,f.z,.08,.8,0,2.2,0,[60,140,110],MAT.metal);break;case'kiosk':M.box(f.x,f.z,3,2.5,0,3.2,.3,[236,226,206],MAT.matte);M.box(f.x,f.z,4.2,3.6,3.2,3.4,.3,[160,110,70],MAT.matte);p.cafeTable(M,f.x+6,f.z,SC.rng(3));p.cafeTable(M,f.x+6,f.z+4,SC.rng(4));break;
    case'monument':p.monument(M,[f.x,f.z],null,f.kind);break;case'screen':p.infoScreen(M,f.x,f.z,f.yaw);break;
    case'jetty':{const L=34,w=3.2;M.box(f.x+Math.cos(f.yaw)*L/2,f.z+Math.sin(f.yaw)*L/2,L/2,w/2,.1,.4,f.yaw,[150,112,78],MAT.matte);for(let k=0;k<6;k++)M.cyl(f.x+Math.cos(f.yaw)*k*6,f.z+Math.sin(f.yaw)*k*6,.15,-1,.1,6,[110,84,60],MAT.matte);break}}};
  /* building / facility builders are registered by the architecture module */
  const out={chunks,CH,L1,L0,key,
    buildLOD1(k){const c=chunks.get(k);const M=SC.Mesh(8192);for(const it of c.items){const f=it.t==='bld'?SC.arch&&SC.arch.lod1:out.L1[it.t];if(f)f(M,it,plan)}return M.count?M.finish():null},
    buildLOD0(k){const c=chunks.get(k);const M=SC.Mesh(8192);for(const it of c.items){const f=it.t==='bld'?SC.arch&&SC.arch.lod0:out.L0[it.t];if(f)f(M,it,plan)}return M.count?M.finish():null}};
  return out};
})(typeof window!=='undefined'?window:globalThis);
