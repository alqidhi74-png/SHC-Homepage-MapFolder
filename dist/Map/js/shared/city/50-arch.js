/* ============================================================================
   SMART CITY — ARCHITECTURE (SC.arch) : toolkit + housing + commerce
   ----------------------------------------------------------------------------
   Contemporary Gulf / Omani architectural language:
     • natural stone and warm render, white plaster, bronze and dark metal
     • deep reveals, shaded entrances, pergolas, courtyards, roof terraces
     • Omani crenellated parapets (merlons), slot and arched windows,
       mashrabiya lattice screens, timber doors, wind towers (barjeel)
     • modern glass and concrete for towers / offices
   Two levels of detail per building:
     LOD1  massing with procedural façades (windows drawn by the shader) —
           the whole city, always resident
     LOD0  architectural detail added near the camera: balconies, frames,
           fins, canopies, parapets, crenellations, rooftop plant, boundary
           walls and gates, gardens, pools, cars, signage
   Facility buildings are in js/city/52-facilities.js (same toolkit).
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,MAT=SC.MAT,PAT=SC.PAT,clamp=SC.clamp,col=SC.col;
const A=SC.arch={kinds:{},lod1kinds:{}};
/* façade parameter vector: pattern, bay (m), floor height (m), window ratio, shop band height (m) */
const FP=A.FP=(pat,bay=3.6,fh=3.4,ratio=.55,gh=0)=>[pat,Math.round(bay*4),Math.round(fh*10),(Math.min(15,Math.round(gh*2))<<4)|Math.min(15,Math.round(ratio/1.6*16))];
const NOF=[0,0,0,0];
A.PAL={stone:[222,206,178],sand:[212,192,160],travertine:[228,216,194],white:[238,234,224],cream:[236,226,204],warm:[232,220,198],grey:[168,168,166],dark:[64,66,70],bronze:[118,90,62],wood:[124,84,54],glassT:[70,110,120],teal:[44,120,124],roof:[196,188,176],roofD:[170,164,156],coping:[240,234,222],metal:[150,154,158],green:[86,150,110],blue:[38,74,140],red:[184,44,40]};
const P=A.PAL;
/* edges of a CCW polygon with outward normals */
A.edges=poly=>{poly=g2.ccw(poly);const n=poly.length,o=[];let u=0;for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;o.push({i,a,b,L,d:[dx/L,dz/L],n:[dz/L,-dx/L],m:[(a[0]+b[0])/2,(a[1]+b[1])/2],u0:u});u+=L}return o};
A.frontEdge=(E,f)=>{let bi=0,bs=-9;E.forEach((e,i)=>{const s=(e.n[0]*f[0]+e.n[1]*f[1])+Math.min(e.L,60)/400;if(s>bs){bs=s;bi=i}});return E[bi]};
/* point on a wall: u along, y up, w outward */
A.on=(e,u,y,w=0)=>[e.a[0]+e.d[0]*u+e.n[0]*w,y,e.a[1]+e.d[1]*u+e.n[1]*w];
/* box attached to a wall (u0..u1 along, y0..y1, w0..w1 out) */
A.wbox=(M,e,u0,u1,y0,y1,w0,w1,c,mat=MAT.matte)=>{const p=(u,w)=>[e.a[0]+e.d[0]*u+e.n[0]*w,e.a[1]+e.d[1]*u+e.n[1]*w];M.P=NOF;M.prism([p(u0,w0),p(u1,w0),p(u1,w1),p(u0,w1)],y0,y1,c,mat)};
/* flat panel on a wall (u0..u1, y0..y1) at offset w (e.g. glass, door, screen) */
A.wpanel=(M,e,u0,u1,y0,y1,w,c,mat=MAT.matte,prm=NOF)=>{M.P=prm;const a=A.on(e,u0,y0,w),b=A.on(e,u1,y0,w),cc=A.on(e,u1,y1,w),d=A.on(e,u0,y1,w);M.quad(a,b,cc,d,c,mat,[[u0,y0],[u1,y0],[u1,y1],[u0,y1]]);M.P=NOF};
/* prism with horizontal façade bands: bands=[{y0,y1,c,mat,prm}] */
A.banded=(M,poly,bands,roof)=>{poly=g2.ccw(poly);for(const b of bands){M.P=b.prm||NOF;M.prism(poly,b.y0,b.y1,b.c,b.mat!=null?b.mat:MAT.facade,{top:false,cont:true})}M.P=NOF;if(roof)M.flat(poly,roof.y,roof.c,roof.mat||MAT.matte)};
/* parapet ring (inner + outer faces + coping) */
A.parapet=(M,poly,y,h=1.1,t=.25,c=P.coping)=>{poly=g2.ccw(poly);const inner=g2.inset(poly,t);M.P=NOF;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=inner[i],ib=inner[(i+1)%poly.length];M.wall(a[0],a[1],b[0],b[1],y,y+h,c,MAT.matte);M.wall(ib[0],ib[1],ia[0],ia[1],y,y+h,col.mul(c,.9),MAT.matte);
    M.quad([a[0],y+h,a[1]],[ia[0],y+h,ia[1]],[ib[0],y+h,ib[1]],[b[0],y+h,b[1]],col.mul(c,1.04),MAT.matte)}};
/* Omani crenellations: stepped merlons along the parapet */
A.crenel=(M,poly,y,c,h=.9,w=.9,gap=.9,t=.35)=>{for(const e of A.edges(poly)){const n=Math.max(1,Math.floor((e.L-.4)/(w+gap)));const st=(e.L-n*(w+gap)+gap)/2;for(let k=0;k<n;k++){const u=st+k*(w+gap);A.wbox(M,e,u,u+w,y,y+h,-t,0,c)}}};
/* rooftop plant: AC units, water tanks (typical Omani roofs), solar panels, stair core */
A.roofKit=(M,poly,y,R,o={})=>{const bb=g2.bbox(poly),c=g2.centroid(poly),ob=g2.obb(poly);const ux=ob.ux,uz=ob.uz;const Lw=ob.u1-ob.u0,Dw=ob.v1-ob.v0;const at=(a,b)=>[c[0]+ux*a-uz*b,c[1]+uz*a+ux*b];
  const ok=(p,r)=>g2.pip(p[0],p[1],poly)&&g2.dPolyEdge(p[0],p[1],poly)>r;
  if(o.core!==false&&Lw>9&&Dw>7){const p=at(-Lw*.15,Dw*.1);if(ok(p,3))M.box(p[0],p[1],2.4,1.8,y,y+2.8,Math.atan2(uz,ux),P.white,MAT.matte)}
  const nAC=o.ac!=null?o.ac:Math.min(8,Math.floor(Lw*Dw/60));for(let k=0;k<nAC;k++){const p=at((R()-.5)*Lw*.7,(R()-.5)*Dw*.7);if(ok(p,1.5)){M.box(p[0],p[1],.6,.45,y,y+.8,Math.atan2(uz,ux),P.metal,MAT.metal)}}
  const nT=o.tanks!=null?o.tanks:(Lw*Dw<500?1+Math.floor(R()*2):0);for(let k=0;k<nT;k++){const p=at((R()-.5)*Lw*.5,(R()-.5)*Dw*.5);if(ok(p,1.4)){M.cyl(p[0],p[1],.75,y+.3,y+1.8,10,[236,236,232],MAT.matte);M.box(p[0],p[1],.9,.9,y,y+.3,0,P.dark,MAT.metal)}}
  if(o.solar){const rows=Math.floor((Dw-4)/2.6);for(let r=0;r<rows;r++){const b0=-Dw/2+2+r*2.6;const p0=at(-Lw/2+2,b0),p1=at(Lw/2-2,b0),p2=at(Lw/2-2,b0+1.7),p3=at(-Lw/2+2,b0+1.7);if(![p0,p1,p2,p3].every(p=>ok(p,.5)))continue;
      M.quad([p0[0],y+.4,p0[1]],[p1[0],y+.4,p1[1]],[p2[0],y+1.2,p2[1]],[p3[0],y+1.2,p3[1]],[40,58,96],MAT.glass)}}};
/* railing along a polyline (glass or metal bars) */
A.rail=(M,pl,y,h,type,c)=>{for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1];if(type==='glass'){M.panel(a[0],a[1],b[0],b[1],y,y+h,[150,190,200],MAT.glass)}else{const L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.floor(L/1.2));for(let k=0;k<=n;k++){const t=k/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;M.box(x,z,.03,.03,y,y+h,0,c||P.dark,MAT.metal)}}
  const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;M.box((a[0]+b[0])/2,(a[1]+b[1])/2,L/2,.04,y+h-.05,y+h+.02,Math.atan2(dz,dx),c||P.dark,MAT.metal)}};
/* arched opening frame on a wall (Islamic pointed arch approximated) */
A.archFrame=(M,e,u,w,y0,h,depth,c)=>{const seg=8,r=w/2,uc=u+w/2,spring=y0+h-r*1.1;A.wbox(M,e,u-.3,u,y0,spring,-.05,depth,c);A.wbox(M,e,u+w,u+w+.3,y0,spring,-.05,depth,c);
  for(let k=0;k<seg;k++){const a0=Math.PI-(k/seg)*Math.PI,a1=Math.PI-((k+1)/seg)*Math.PI;const pt=a=>[uc+Math.cos(a)*(r+.15),spring+Math.sin(a)*(r*1.1+.15)];const p0=pt(a0),p1=pt(a1);const lo=Math.min(p0[1],p1[1]);A.wbox(M,e,Math.min(p0[0],p1[0]),Math.max(p0[0],p1[0])+.05,lo,lo+.35,-.05,depth,c)}};
A.door=(M,e,u,w,h,c,mat=MAT.matte)=>{A.wbox(M,e,u-.25,u+w+.25,0,h+.3,-.02,.25,P.coping);A.wpanel(M,e,u,u+w,.05,h,.27,c,mat)};
/* palm/garden tree markers are handled by the landscape layer */

/* ---------------------------------------------------------- styles ------ */
const STY={
  gulf:{wall:P.travertine,accent:P.dark,roof:P.roof,pat:FP(PAT.punched,4.6,3.6,.62),crenel:0},
  omani:{wall:P.cream,accent:P.wood,roof:P.roof,pat:FP(PAT.slots,2.4,3.6,.5),crenel:1},
  classic:{wall:P.warm,accent:P.coping,roof:P.roof,pat:FP(PAT.punched,3.8,3.6,.5),crenel:0},
  pergola:{wall:P.white,accent:[88,90,96],roof:P.roof,pat:FP(PAT.punched,4.4,3.6,.6),crenel:0},
  luxury:{wall:[242,242,238],accent:[60,62,68],roof:P.roof,pat:FP(PAT.curtain,3.2,3.6,.9),crenel:0},
  midrise:{wall:P.sand,accent:[84,84,88],roof:P.roof,pat:FP(PAT.punched,3.4,3.3,.58),crenel:0},
  tower:{wall:[200,208,212],accent:[60,64,70],roof:P.roofD,pat:FP(PAT.curtain,3,3.6,.9),glass:1},
  glass:{wall:[180,196,204],accent:[70,74,80],roof:P.roofD,pat:FP(PAT.curtain,2.8,3.8,.9),glass:1},
  omani_tower:{wall:P.stone,accent:P.bronze,roof:P.roofD,pat:FP(PAT.lattice,3,3.6,.5),crenel:1},
  civic:{wall:P.white,accent:P.stone,roof:P.roof,pat:FP(PAT.ribbon,3.6,4,.6)},
  shop:{wall:P.white,accent:P.dark,roof:P.roof,pat:FP(PAT.shop,4,4.2,.8,4.2)}};
A.STY=STY;
const jit=(c,R,k=12)=>col.jit(c,R,k);

/* ============================================================ LOD1 ===== */
A.lod1=(M,it,plan)=>{const r=it.r;M.F=r.idx;const f=A.lod1kinds[r.kind]||A.lod1kinds._default;f(M,r,plan);M.F=-1;M.P=NOF;M.layer=0};
A.lod0=(M,it,plan)=>{const r=it.r;M.F=r.idx;const f=A.kinds[r.kind];if(f)f(M,r,plan);M.F=-1;M.P=NOF;M.layer=0};
const R_=r=>SC.rng(r.seed||SC.hash(r.id));
const styleOf=r=>STY[r.style]||STY.midrise;
/* generic massing: walls with the style's pattern, roof, optional ground-floor shop band */
A.lod1kinds._default=(M,r)=>{const R=R_(r),s=styleOf(r);const wc=jit(s.wall,R,10);
  for(const m of r.masses){const y0=m.y0||0,y1=y0+m.h;const fl=m.floors||Math.max(1,Math.round(m.h/3.5));const fh=clamp((m.h-1.2)/Math.max(1,fl),2.8,5.5);
    const pat=m.role==='podium'?FP(PAT.grid,4.2,fh,.8,4.8):m.role==='tower'?(s.glass?FP(PAT.curtain,3,fh,.9):s.pat.slice(0,2).concat(FP(0,0,fh,0).slice(2,3),s.pat[3])):[s.pat[0],s.pat[1],Math.round(fh*10),s.pat[3]];
    M.P=pat;M.prism(m.poly,y0,y1-1,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,y1-1,y1,col.mul(wc,.97),MAT.matte,{topC:s.roof||P.roof,topM:MAT.matte})}};

/* ---------------------------------------------------------- villas ------ */
A.lod1kinds.villa=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.gulf;const wc=jit(s.wall,R,10);
  for(const m of r.masses){const y1=m.h;const fl=m.floors||2;M.P=r.style==='omani'?FP(PAT.slots,2.6,3.8,.45):FP(PAT.punched,m.role==='majlis'?3.2:4.2,3.8,.58);
    M.prism(m.poly,0,y1-1.1,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,y1-1.1,y1,col.mul(wc,.98),MAT.matte,{topC:P.roof})}
  /* penthouse / roof room (most Omani villas have one) */
  if(r.h>r.masses[0].h+1){const m=r.masses[0],c=g2.centroid(m.poly),ob=g2.obb(m.poly);const w=(ob.u1-ob.u0)*.32,d=(ob.v1-ob.v0)*.36;M.box(c[0]+ob.ux*w*.4,c[1]+ob.uz*w*.4,w/2,d/2,m.h,m.h+3,Math.atan2(ob.uz,ob.ux),wc,MAT.facade)}
  /* compound wall around the plot with the gate on the street side (reads strongly from mid-distance) */
  if(r.plot)villaWall(M,r,R,wc,false)};
function villaWall(M,r,R,wc,detail){const poly=g2.ccw(g2.inset(r.plot,.4));const E=A.edges(poly),fe=A.frontEdge(E,r.front);const h=detail?2.1:2.0,wcol=col.mix(wc,[214,200,176],.5);M.P=NOF;
  for(const e of E){if(e===fe){/* gate: pedestrian + car gate with pillars */const gc=e.L/2,g0=gc-3.2,g1=gc+3.2;for(const [u0,u1] of [[0,g0],[g1,e.L]])if(u1-u0>.3){A.wbox(M,e,u0,u1,0,h,-.25,0,wcol)}
      if(detail){A.wbox(M,e,g0-.5,g0,0,h+.6,-.35,.1,P.coping);A.wbox(M,e,g1,g1+.5,0,h+.6,-.35,.1,P.coping);A.wpanel(M,e,g0,g1-2.2,.05,1.9,-.1,r.style==='omani'?P.wood:[70,68,64],MAT.metal);A.wpanel(M,e,g1-2,g1,.05,2,-.1,P.wood,MAT.matte)}}
    else A.wbox(M,e,0,e.L,0,h,-.25,0,wcol);
    if(detail&&r.style==='omani')A.crenel(M,[e.a,e.b,A.on(e,e.L,0,-.3).filter((v,i)=>i!==1),A.on(e,0,0,-.3).filter((v,i)=>i!==1)],h,wcol,.35,.35,.45,.25)}
  return fe}
A.kinds.villa=(M,r,plan)=>{const R=R_(r),s=STY[r.style]||STY.gulf;const wc=jit(s.wall,R,10),ac=s.accent;const m=r.masses[0];const E=A.edges(m.poly),fe=A.frontEdge(E,r.front);const y1=m.h;
  /* parapet / crenellation */if(r.style==='omani')A.crenel(M,m.poly,y1,col.mul(wc,.97));else A.parapet(M,m.poly,y1-.05,.6,.2,P.coping);
  if(r.masses[1]){const mj=r.masses[1];if(r.style==='omani')A.crenel(M,mj.poly,mj.h,col.mul(wc,.97),.7,.7,.7);else A.parapet(M,mj.poly,mj.h-.05,.5,.2,P.coping)}
  /* entrance: recessed portal with timber door + canopy */const du=fe.L*.5-1;
  if(r.style==='omani'){A.archFrame(M,fe,du-.4,2.8,0,3.6,.6,P.coping);A.wpanel(M,fe,du-.2,du+2.2,.05,3,.02,P.wood)}
  else{A.door(M,fe,du,1.8,2.8,P.wood);A.wbox(M,fe,du-1.6,du+3.4,3.4,3.7,0,2.4,r.style==='pergola'?[70,72,78]:P.coping)}
  /* style signature on the front façade */
  if(r.style==='gulf'){/* deep projecting frame around the upper window group (reference villa) */const u0=fe.L*.12,u1=Math.min(fe.L-.8,u0+fe.L*.46);A.wbox(M,fe,u0,u1,3.7,3.95,0,.8,P.coping);A.wbox(M,fe,u0,u1,y1-1.4,y1-1.1,0,.8,P.coping);A.wbox(M,fe,u0,u0+.3,3.7,y1-1.1,0,.8,P.coping);A.wbox(M,fe,u1-.3,u1,3.7,y1-1.1,0,.8,P.coping);
    A.wpanel(M,fe,u0+.35,u1-.35,4,y1-1.5,.05,[60,80,90],MAT.glass);/* timber slat canopy */for(let u=fe.L*.55;u<fe.L-.5;u+=.5)A.wbox(M,fe,u,u+.12,3.45,3.6,0,3,P.dark,MAT.metal)}
  if(r.style==='pergola'){/* dark window panels + white slab overhang with slats */for(const e of E){if(e.L<6)continue;A.wbox(M,e,-.4,e.L+.4,y1-1.1,y1-.75,0,e===fe?1.6:.6,P.white)}for(let u=.5;u<fe.L-.3;u+=.7)A.wbox(M,fe,u,u+.15,y1-.72,y1-.55,0,1.5,[70,72,78])}
  if(r.style==='classic'){for(const e of E){if(e.L<5)continue;A.wbox(M,e,-.25,e.L+.25,3.6,3.95,0,.45,P.coping)}const bu=fe.L*.2;A.wbox(M,fe,bu,bu+fe.L*.3,3.6,3.8,0,1.3,P.coping);A.rail(M,[A.on(fe,bu,0,1.25),A.on(fe,bu+fe.L*.3,0,1.25)].map(p=>[p[0],p[2]]),3.8,1,'bars',P.dark)}
  if(r.style==='luxury'){A.wbox(M,fe,-.3,fe.L+.3,y1-1.2,y1-.4,0,1.8,P.white);A.wbox(M,fe,-.3,0,3.6,y1-.4,0,1.8,P.white);A.wbox(M,fe,fe.L,fe.L+.3,3.6,y1-.4,0,1.8,P.white);A.wpanel(M,fe,fe.L*.6,fe.L-.6,.1,3.4,.03,[44,44,48],MAT.metal)}
  if(r.style==='omani'){/* mashrabiya screen + wind tower */const u0=fe.L*.18;A.wpanel(M,fe,u0,u0+2.4,4.2,y1-1.6,.12,[150,110,70],MAT.facade,FP(PAT.lattice,1,1.2,.5));const c=g2.centroid(m.poly);M.box(c[0],c[1],1.1,1.1,y1,y1+3.4,Math.atan2(fe.d[1],fe.d[0]),wc,MAT.matte);A.crenel(M,[[c[0]-1.1,c[1]-1.1],[c[0]+1.1,c[1]-1.1],[c[0]+1.1,c[1]+1.1],[c[0]-1.1,c[1]+1.1]],y1+3.4,wc,.4,.4,.3,.2)}
  /* window sills & lintels on the street façade (real relief) */for(const e of [fe]){if(e.L<4)continue;const n=Math.floor(e.L/4.2);for(let k=0;k<n;k++){const u=(k+.5)*e.L/n;A.wbox(M,e,u-1.2,u+1.2,1.05,1.15,0,.18,P.coping);A.wbox(M,e,u-1.2,u+1.2,4.85,4.95,0,.18,P.coping)}}
  A.roofKit(M,m.poly,y1-.05,R,{ac:2,tanks:1+Math.floor(R()*2),core:false});
  villaWall(M,r,R,wc,true);
  /* garden: lawn strip, pool, driveway, parked car, shade */
  const pl=g2.ccw(r.plot),pc=g2.centroid(pl),fr=r.front;const gp=g2.frame(pc,-fr[1],fr[0]);
  const dv=[pc[0]+fr[0]*(g2.obb(pl).v1-g2.obb(pl).v0)*.3,pc[1]+fr[1]*6];
  M.layer=4;const E2=A.edges(pl),pf=A.frontEdge(E2,fr);const gc=pf.L/2;const dq=[A.on(pf,gc-1.5,0,-.4),A.on(pf,gc+1.5,0,-.4),A.on(pf,gc+1.5,0,-6),A.on(pf,gc-1.5,0,-6)].map(p=>[p[0],p[2]]);M.flat(g2.ccw(dq),.2,[190,182,170],MAT.paver);
  const lawn=[A.on(pf,1,0,-.8),A.on(pf,gc-2.2,0,-.8),A.on(pf,gc-2.2,0,-5.5),A.on(pf,1,0,-5.5)].map(p=>[p[0],p[2]]);M.flat(g2.ccw(lawn),.21,[98,146,64],MAT.grass);
  if(r.pool){const bk=A.edges(pl).reduce((b,e)=>(e.n[0]*fr[0]+e.n[1]*fr[1])<(b.n[0]*fr[0]+b.n[1]*fr[1])?e:b);const pq=[A.on(bk,bk.L*.25,0,-1.5),A.on(bk,bk.L*.25+7,0,-1.5),A.on(bk,bk.L*.25+7,0,-4.8),A.on(bk,bk.L*.25,0,-4.8)].map(p=>[p[0],p[2]]);
    if(pq.every(p=>!g2.pip(p[0],p[1],m.poly)))M.flat(g2.ccw(pq),.22,[80,180,210],MAT.water)}
  M.layer=0;
  /* car in the driveway */if(R()<.8){const cp=A.on(pf,gc,0,-3.6);SC.props&&SC.props.car(M,cp[0],cp[2],Math.atan2(-pf.n[1],-pf.n[0]),SC.pick(R,SC.props.CARC))}};
A.lod1kinds.masjid=(M,r)=>SC.fac&&SC.fac.lod1(M,r);
/* ---------------------------------------------------------- townhouses -- */
A.lod1kinds.townhouse=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.pergola;const wc=jit(s.wall,R,8);const m=r.masses[0];
  M.P=FP(PAT.punched,m.units?g2.obb(m.poly).u1-g2.obb(m.poly).u0>0?Math.max(3,(g2.obb(m.poly).u1-g2.obb(m.poly).u0)/m.units/2):4:4,3.4,.62);M.prism(m.poly,0,m.h-1,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1,m.h,col.mul(wc,.97),MAT.matte,{topC:P.roof})};
A.kinds.townhouse=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.pergola;const wc=jit(s.wall,R,8);const m=r.masses[0];const E=A.edges(m.poly),fe=A.frontEdge(E,r.front),be=E.find(e=>e.n[0]*fe.n[0]+e.n[1]*fe.n[1]<-.8)||E[(fe.i+2)%E.length];const n=m.units||Math.max(2,Math.round(fe.L/8.4)),uw=fe.L/n;
  for(let k=0;k<n;k++){const u=k*uw;/* party-wall fins, entrance porch, balcony, roof terrace pergola per unit */A.wbox(M,fe,u-.15,u+.15,0,m.h+.3,0,.9,col.mul(wc,.94));
    A.door(M,fe,u+uw*.62,1.2,2.5,k%2?P.wood:[70,70,74]);A.wbox(M,fe,u+uw*.5,u+uw*.95,2.9,3.1,0,1.4,s.accent);
    A.wbox(M,fe,u+.6,u+uw*.45,3.6,3.8,0,1.2,P.coping);A.rail(M,[A.on(fe,u+.6,0,1.2),A.on(fe,u+uw*.45,0,1.2)].map(p=>[p[0],p[2]]),3.8,1,'glass');
    for(let j=0;j<4;j++)A.wbox(M,fe,u+.7+j*(uw-1.4)/4,u+.85+j*(uw-1.4)/4,m.h+.1,m.h+2.5,-3,-2.8,s.accent,MAT.metal)}
  if(r.style==='omani')A.crenel(M,m.poly,m.h,col.mul(wc,.97),.6,.6,.6);else A.parapet(M,m.poly,m.h-.05,.8,.2,P.coping);
  /* front gardens with low walls */const d0=[A.on(fe,0,0,.3),A.on(fe,fe.L,0,.3),A.on(fe,fe.L,0,4.6),A.on(fe,0,0,4.6)].map(p=>[p[0],p[2]]);M.layer=4;M.flat(g2.ccw(d0),.21,[104,146,70],MAT.grass);M.layer=0;
  for(let k=0;k<=n;k++)A.wbox(M,fe,k*uw-.1,k*uw+.1,0,1,.3,4.6,col.mix(wc,[200,190,170],.4));A.wbox(M,fe,0,fe.L,0,.9,4.4,4.6,col.mix(wc,[200,190,170],.4))};
/* ---------------------------------------------------------- apartments -- */
A.lod1kinds.apartment=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.midrise;const wc=jit(s.wall,R,10);const m=r.masses[0];const fh=3.3;
  const E=A.edges(m.poly);M.P=FP(PAT.punched,3.4,fh,.56,4.2);M.prism(m.poly,0,m.h-1.2,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1.2,m.h,col.mul(wc,.96),MAT.matte,{topC:P.roof});
  /* dark vertical core strip on the long sides (reference mid-rise) — visible at distance */const fe=A.frontEdge(E,r.front);if(fe.L>24){const u=fe.L/2-2.2;A.wpanel(M,fe,u,u+4.4,0,m.h+1.2,.12,s.accent||[84,84,88],MAT.facade,FP(PAT.slots,4.4,fh,.3));A.wbox(M,fe,u,u+4.4,m.h-1.2,m.h+1.2,-.1,.12,s.accent||[84,84,88])}};
A.kinds.apartment=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.midrise;const m=r.masses[0];const fh=3.3,fl=m.floors||Math.round(m.h/fh);const E=A.edges(m.poly),fe=A.frontEdge(E,r.front);const ac=s.accent||[84,84,88];
  /* projecting balconies with glass balustrades + soffit lights on the long façades */
  for(const e of E){if(e.L<14)continue;const long=Math.abs(e.n[0]*fe.n[0]+e.n[1]*fe.n[1])>.7;if(!long)continue;const nb=Math.floor(e.L/7.2),bw=e.L/nb;
    /* one continuous balcony slab + glass balustrade per floor, split around the core strip */
    const runs=e===fe&&e.L>24?[[.8,e.L/2-2.6],[e.L/2+2.6,e.L-.8]]:[[.8,e.L-.8]];
    for(let f=1;f<fl;f++){const y=4.2+(f-1)*fh;for(const [u0,u1] of runs){A.wbox(M,e,u0,u1,y-.22,y,0,1.5,ac);A.wpanel(M,e,u0,u1,y,y+1.05,1.46,[150,190,200],MAT.glass);A.wpanel(M,e,u1,u0,y,y+1.05,1.44,[150,190,200],MAT.glass);
        A.wpanel(M,e,u0,u1,y-.23,y-.21,.05,[255,236,190],MAT.emit);for(let u=u0+bw;u<u1-1;u+=bw)A.wbox(M,e,u-.1,u+.1,y,y+fh-.22,1.3,1.5,ac)}}}
  /* entrance canopy + lobby glazing */A.wbox(M,fe,fe.L/2-4,fe.L/2+4,3.9,4.15,0,2.4,ac);A.wpanel(M,fe,fe.L/2-2.2,fe.L/2+2.2,.1,3.7,.05,[70,90,96],MAT.glass);
  if(r.style==='omani')A.crenel(M,m.poly,m.h,col.mul(styleOf(r).wall,.96),.8,.8,.8);else A.parapet(M,m.poly,m.h-.05,1,.25,P.coping);
  A.roofKit(M,m.poly,m.h,R,{solar:R()<.6,tanks:0})};
A.lod1kinds.mixed=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.midrise;const wc=jit(s.wall,R,10);const m=r.masses[0];M.P=FP(PAT.punched,3.4,3.4,.55,4.8);M.prism(m.poly,0,m.h-1.2,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1.2,m.h,col.mul(wc,.96),MAT.matte,{topC:P.roof})};
A.kinds.mixed=(M,r)=>{const R=R_(r);const m=r.masses[0];const E=A.edges(m.poly),fe=A.frontEdge(E,r.front);
  /* continuous shading arcade over the shops + illuminated sign band */A.wbox(M,fe,0,fe.L,4.9,5.3,0,2.6,P.coping);for(let u=0;u<=fe.L;u+=5)A.wbox(M,fe,u-.18,u+.18,0,4.9,2.2,2.56,P.coping);
  for(let u=1.5;u<fe.L-4;u+=9)A.wpanel(M,fe,u,u+6,4.95,5.25,2.62,SC.pick(R,[[230,80,60],[60,150,200],[240,200,80],[90,190,120]]),MAT.emit);
  for(const e of E){if(e.L<12||e===fe)continue;for(let f=1;f<(m.floors||4);f++){const y=5+(f-1)*3.4;for(let u=2;u<e.L-3;u+=6.8){A.wbox(M,e,u,u+3.2,y-.2,y,0,1.2,[90,90,94]);A.rail(M,[A.on(e,u,0,1.15),A.on(e,u+3.2,0,1.15)].map(p=>[p[0],p[2]]),y,1,'bars')}}}
  A.parapet(M,m.poly,m.h-.05,1,.25,P.coping);A.roofKit(M,m.poly,m.h,R,{solar:true})};
/* ---------------------------------------------------------- towers ------ */
A.lod1kinds.tower=(M,r)=>{const R=R_(r),s=STY[r.style]||STY.tower;const wc=jit(s.wall,R,8);
  for(const m of r.masses){if(m.role==='podium'){M.P=FP(PAT.grid,4.4,4.4,.8,5);M.prism(m.poly,0,m.h-1.2,jit(P.stone,R,8),MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1.2,m.h,P.coping,MAT.matte,{topC:[150,160,150]});continue}
    const fh=3.6,crown=Math.min(8,m.h*.06);M.P=r.style==='omani_tower'?FP(PAT.lattice,3,fh,.5):FP(PAT.curtain,3,fh,.9);M.prism(m.poly,0,m.h-crown,wc,MAT.facade,{top:false,cont:true});M.P=NOF;
    /* crown: slightly set back, lighter band + roof */const cr=g2.inset(m.poly,.8);M.P=FP(PAT.vertical,1.6,3,.4);M.prism(cr,m.h-crown,m.h,col.mul(wc,1.06),MAT.facade,{top:false});M.P=NOF;M.flat(cr,m.h,P.roofD,MAT.matte)}
  if(r.landmark){const t=r.masses.find(q=>q.role==='tower');if(t){const c=g2.centroid(t.poly);M.cyl(c[0],c[1],.35,t.h,t.h+18,6,P.metal,MAT.metal);M.box(c[0],c[1],.3,.3,t.h+18,t.h+18.6,0,[255,60,50],MAT.blink)}}};
A.kinds.tower=(M,r)=>{const R=R_(r);const t=r.masses.find(q=>q.role==='tower'),pod=r.masses.find(q=>q.role==='podium');
  if(t){const E=A.edges(t.poly);/* vertical fins every 1.5 m on two faces, spandrel ledges every 4 floors */for(const e of E){const fins=r.style!=='glass'&&(e.i%2===0);for(let u=1.5;u<e.L-.5;u+=fins?1.5:6)A.wbox(M,e,u-.08,u+.08,pod?pod.h:0,t.h-2,0,fins?.45:.25,r.style==='omani_tower'?P.bronze:[210,214,216],MAT.metal);
      for(let y=(pod?pod.h:0)+14.4;y<t.h-4;y+=14.4)A.wbox(M,e,0,e.L,y,y+.4,0,.35,[214,216,218],MAT.metal)}
    A.roofKit(M,g2.inset(t.poly,1),t.h,R,{ac:6,tanks:0});
    if(r.landmark&&t.h>90){const c=g2.centroid(t.poly);M.cyl(c[0],c[1],6,t.h,t.h+.3,24,[230,230,226],MAT.matte);M.layer=5;M.cyl(c[0],c[1],4.5,t.h+.32,t.h+.34,24,[220,190,40],MAT.paint,{top:true});M.layer=0}}
  if(pod){const E=A.edges(pod.poly),fe=A.frontEdge(E,r.front);A.wbox(M,fe,fe.L*.3,fe.L*.7,4.8,5.3,0,5,[60,62,66]);for(let u=fe.L*.3+.5;u<fe.L*.7;u+=3)A.wbox(M,fe,u,u+.2,5.3,5.5,0,5,[200,160,110]);
    A.parapet(M,pod.poly,pod.h-.05,1.1,.25,P.coping);A.roofKit(M,pod.poly,pod.h,R,{solar:true,ac:4,tanks:0});
    /* podium roof garden */const rg=g2.inset(pod.poly,3);if(rg.length>2&&g2.area(rg)>40){M.layer=4;M.flat(rg,pod.h+.05,[104,144,70],MAT.grass);M.layer=0}}};
A.lod1kinds.office=(M,r)=>{const R=R_(r);const m=r.masses[0];const wc=jit(r.style==='civic'?P.white:[214,210,202],R,8);M.P=FP(PAT.ribbon,3,3.8,.8,4.6);M.prism(m.poly,0,m.h-1.2,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1.2,m.h,col.mul(wc,.97),MAT.matte,{topC:P.roofD})};
A.kinds.office=(M,r)=>{const R=R_(r);const m=r.masses[0];const E=A.edges(m.poly),fe=A.frontEdge(E,r.front);const fl=m.floors||6;
  /* horizontal sun-shading louvres on every floor (Gulf office typology) */for(const e of E){for(let f=1;f<=fl;f++){const y=4.6+(f-1)*3.8-.4;A.wbox(M,e,0,e.L,y,y+.18,0,.9,[228,226,220],MAT.metal)}}
  A.wbox(M,fe,fe.L*.35,fe.L*.65,4.4,4.8,0,4.5,[60,62,66]);A.wpanel(M,fe,fe.L*.4,fe.L*.6,.1,4.2,.05,[60,84,96],MAT.glass);
  A.parapet(M,m.poly,m.h-.05,1.2,.25,P.coping);A.roofKit(M,m.poly,m.h,R,{solar:true,ac:5,tanks:0})};
/* ---------------------------------------------------------- shops ------- */
const shopLod1=(M,r)=>{const R=R_(r);const m=r.masses[0];const wc=jit(r.kind==='supermarket'?[230,226,216]:P.white,R,10);M.P=FP(PAT.shop,4,m.h,.8,Math.min(5,m.h-1.2));M.prism(m.poly,0,m.h-1,wc,MAT.facade,{top:false,cont:true});M.P=NOF;M.prism(m.poly,m.h-1,m.h,col.mul(wc,.96),MAT.matte,{topC:P.roof})};
for(const k of ['retail','restaurant','cafe','showroom','supermarket'])A.lod1kinds[k]=shopLod1;
const shopLod0=(M,r)=>{const R=R_(r);const m=r.masses[0];const E=A.edges(m.poly),fe=A.frontEdge(E,r.front);
  /* sign band, canopy / awnings, outdoor seating for cafés & restaurants */const sc=SC.pick(R,[[200,60,50],[40,120,180],[230,170,40],[60,160,110],[120,60,140]]);
  A.wbox(M,fe,.4,fe.L-.4,m.h-2.2,m.h-.9,0,.35,[40,40,44]);A.wpanel(M,fe,1,fe.L-1,m.h-1.95,m.h-1.15,.37,sc,MAT.emit);
  A.wbox(M,fe,0,fe.L,3.4,3.6,0,r.kind==='cafe'||r.kind==='restaurant'?4:2.4,r.kind==='cafe'?[190,150,100]:P.coping);
  if(r.kind==='cafe'||r.kind==='restaurant'){for(let u=2;u<fe.L-2;u+=3.2){const p=A.on(fe,u,0,5.6);SC.props&&SC.props.cafeTable(M,p[0],p[2],R)}}
  A.parapet(M,m.poly,m.h-.05,.8,.2,P.coping);A.roofKit(M,m.poly,m.h,R,{ac:3,tanks:0})};
for(const k of ['retail','restaurant','cafe','showroom','supermarket'])A.kinds[k]=shopLod0;
})(typeof window!=='undefined'?window:globalThis);
