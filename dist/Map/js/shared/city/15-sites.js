/* ============================================================================
   SMART CITY — SITE PLANS (SC.sites)
   ----------------------------------------------------------------------------
   For every facility / building type this module decides HOW a site is laid
   out, in a local frame whose +f axis points to the site's main street:
     masses    building volumes {poly,h,y0,role,floors,style}
     ground    open-space surfaces {poly,kind}: parking, field, track, court,
               plaza, garden, lawn, courtyard, pool, playground, apron, drop
     entrances {p,dir,kind}: main / emergency / service / vehicle
     walls     boundary walls & fences {pl,h,kind,gate}
   Roles tell the 3D architecture module what to build (dome, minaret,
   stands, canopy, tower …). Everything stays inside the site polygon.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2;

/* site context: local frame (s along the front street, f towards it) */
SC.siteCtx=function(poly,frontDir,R){
  const c=g2.centroid(poly),fx=frontDir[0],fz=frontDir[1],sx=-fz,sz=fx;
  let s0=1e9,s1=-1e9,f0=1e9,f1=-1e9;for(const p of poly){const s=(p[0]-c[0])*sx+(p[1]-c[1])*sz,f=(p[0]-c[0])*fx+(p[1]-c[1])*fz;s0=Math.min(s0,s);s1=Math.max(s1,s);f0=Math.min(f0,f);f1=Math.max(f1,f)}
  const W=s1-s0,D=f1-f0,cs=(s0+s1)/2,cf=(f0+f1)/2;
  const P=(s,f)=>[c[0]+sx*(cs+s)+fx*(cf+f),c[1]+sz*(cs+s)+fz*(cf+f)];   /* s∈[-W/2,W/2], f∈[-D/2,D/2] (front = +D/2) */
  const ctx={poly,c,W,D,R,f:[fx,fz],s:[sx,sz],P,masses:[],ground:[],entrances:[],walls:[],paths:[],
    rect:(a0,a1,b0,b1)=>[P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1)],
    circle:(s,f,r,n=24)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push(P(s+Math.cos(a)*r,f+Math.sin(a)*r))}return o},
    ellipse:(s,f,rs,rf,n=40)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push(P(s+Math.cos(a)*rs,f+Math.sin(a)*rf))}return o},
    mass(poly,h,role,o){const m=Object.assign({poly:g2.ccw(poly),h,y0:0,role:role||'main'},o||{});ctx.masses.push(m);return m},
    box(a0,a1,b0,b1,h,role,o){return ctx.mass(ctx.rect(a0,a1,b0,b1),h,role,Object.assign({frame:{s:[sx,sz],f:[fx,fz]}},o||{}))},
    gr(poly,kind,o){ctx.ground.push(Object.assign({poly:g2.ccw(poly),kind},o||{}));return ctx},
    grR(a0,a1,b0,b1,kind,o){return ctx.gr(ctx.rect(a0,a1,b0,b1),kind,Object.assign({dir:[sx,sz]},o||{}))},
    ent(s,f,kind='main'){ctx.entrances.push({p:P(s,f),dir:[fx,fz],kind});return ctx},
    wall(h=2,kind='wall',gates=[]){/* perimeter wall inset 0.6 m with gate gaps (in s along the front) */const q=[P(-W/2+.6,-D/2+.6),P(W/2-.6,-D/2+.6),P(W/2-.6,D/2-.6),P(-W/2+.6,D/2-.6)];ctx.walls.push({pl:q.concat([q[0]]),h,kind,gates:gates.map(g=>({s:g[0],w:g[1]})),frontEdge:2});return ctx},
    path(pl,w=3,kind='walk'){ctx.paths.push({pl,w,kind});return ctx}};
  return ctx};
const F=(n)=>Math.max(1,Math.round(n));
const H=(fl,g=4.2,t=3.6)=>g+(fl-1)*t+1.2;  /* height from floors (+parapet) */

/* parking lot with stalls perpendicular to aisles, oriented along s */
function parking(ctx,a0,a1,b0,b1,o={}){if(a1-a0<12||b1-b0<14)return;ctx.grR(a0,a1,b0,b1,'parking',Object.assign({shade:o.shade!=null?o.shade:ctx.R()<.55,ev:o.ev||0,rows:Math.max(1,Math.floor((b1-b0)/16))},o))}

const S=SC.sites={};
/* ------------------------------------------------------------ RELIGIOUS -- */
S.mosque_grand=ctx=>{const {W,D,R}=ctx,hall=Math.min(W*.46,D*.42,70),sahnD=Math.min(D*.28,hall*.8),fb=-D/2+10;
  /* prayer hall at the back (qibla side), courtyard with arcades in front, two minarets */
  const hb0=fb,hb1=fb+hall;ctx.box(-hall/2,hall/2,hb0,hb1,16,'prayerhall',{floors:1,dome:{r:hall*.3,h:hall*.34},subdomes:4,style:'mosque'});
  const c0=hb1,c1=hb1+sahnD;ctx.grR(-hall/2,hall/2,c0,c1,'courtyard');
  for(const s of [-1,1])ctx.box(s>0?hall/2-7:-hall/2,s>0?hall/2:-hall/2+7,c0,c1,7.5,'arcade',{style:'mosque'});
  ctx.box(-hall/2,hall/2,c1-7,c1,7.5,'arcade',{style:'mosque',gate:1});
  for(const s of [-1,1]){const x=s*(hall/2+5);ctx.box(x-4,x+4,c1-8,c1,58,'minaret',{style:'mosque'})}
  ctx.grR(-hall/2-10,hall/2+10,c1,D/2-2,'plaza');ctx.ent(0,c1,'main');
  /* ablution & library annex, gardens, parking on both flanks */
  ctx.box(hall/2+14,hall/2+34,hb0,hb0+22,6,'annex',{style:'mosque'});
  if(W/2-hall/2>40){parking(ctx,-W/2+4,-hall/2-14,-D/2+6,D/2-8,{shade:true});parking(ctx,hall/2+38,W/2-4,-D/2+6,D/2-8,{shade:true})}
  ctx.grR(-hall/2-12,hall/2+12,hb0-8,hb0,'garden')};
S.mosque=ctx=>{const {W,D,R}=ctx,hall=Math.min(28,W*.45,D*.5),fb=-D/2+8;
  ctx.box(-hall/2,hall/2,fb,fb+hall,9,'prayerhall',{dome:{r:hall*.3,h:hall*.3},style:'mosque'});
  const cy=fb+hall;ctx.grR(-hall/2,hall/2,cy,cy+Math.min(14,D*.2),'courtyard');ctx.box(hall/2+2,hall/2+8,cy,cy+6,32,'minaret',{style:'mosque'});
  ctx.box(-hall/2-12,-hall/2-2,fb,fb+10,4.5,'annex',{style:'mosque'});ctx.ent(0,cy+10,'main');
  parking(ctx,-W/2+3,W/2-3,cy+16,D/2-3,{shade:true});if(W>hall+60)parking(ctx,hall/2+14,W/2-3,-D/2+4,cy,{shade:true});ctx.grR(-W/2+3,-hall/2-16,-D/2+4,cy,'garden')};
S.masjid=ctx=>{const {W,D}=ctx,h=Math.min(16,W*.6,D*.55);ctx.box(-h/2,h/2,-D/2+3,-D/2+3+h,7,'prayerhall',{dome:{r:h*.28,h:h*.25},style:'mosque'});ctx.box(h/2+1,h/2+4.5,-D/2+3,-D/2+6.5,22,'minaret',{style:'mosque'});
  ctx.grR(-W/2+1,W/2-1,-D/2+4+h,D/2-1,'plaza');ctx.ent(0,-D/2+3+h,'main')};

/* ------------------------------------------------------------ EDUCATION -- */
S.school=ctx=>{const {W,D,R}=ctx,fl=R()<.5?2:3,h=H(fl,4,3.8),wd=13;
  /* U-shaped classroom wings around a courtyard, entrance block to the street, pitch at the back */
  const bD=Math.min(D*.52,78),bW=Math.min(W-16,92),f1=D/2-16,f0=f1-bD;
  ctx.box(-bW/2,bW/2,f1-wd,f1,h+2,'main',{floors:fl,style:'school',entrance:1});
  ctx.box(-bW/2,-bW/2+wd,f0,f1-wd,h,'wing',{floors:fl,style:'school'});ctx.box(bW/2-wd,bW/2,f0,f1-wd,h,'wing',{floors:fl,style:'school'});
  ctx.box(-bW/2+wd,bW/2-wd,f0,f0+wd,h,'wing',{floors:fl,style:'school'});
  ctx.grR(-bW/2+wd,bW/2-wd,f0+wd,f1-wd,'courtyard',{shade:true});
  const pb=-D/2+4,pt=f0-8;if(pt-pb>36){const pw=Math.min(W-16,68),pd=Math.min(pt-pb,42);ctx.grR(-pw/2,pw/2,pb,pb+pd,'field',{sport:'football'});
    if(W>pw+44)ctx.grR(pw/2+6,Math.min(W/2-4,pw/2+34),pb,pb+18,'court',{sport:'basketball'})}
  ctx.grR(-W/2+3,W/2-3,f1+2,D/2-1,'drop');ctx.ent(0,f1,'main');ctx.wall(2.2,'fence',[[0,10],[-W/2+14,7]]);
  parking(ctx,bW/2+4,W/2-3,f0,f1,{shade:true})};
S.kindergarten=ctx=>{const {W,D}=ctx,w=Math.min(W-10,44),d=Math.min(D*.45,24);ctx.box(-w/2,w/2,D/2-10-d,D/2-10,5.5,'main',{floors:1,style:'kinder',entrance:1});
  ctx.grR(-w/2,w/2,-D/2+4,D/2-14-d,'playground');ctx.grR(-W/2+2,W/2-2,D/2-8,D/2-1,'drop');ctx.ent(0,D/2-10,'main');ctx.wall(1.8,'fence',[[0,6]])};
S.university=ctx=>{const {W,D,R}=ctx;const q=Math.min(W,D)*.3;
  /* central quad; library as the landmark on the axis; academic blocks around; sports & parking on the edges */
  ctx.grR(-q/2,q/2,-q/2,q/2,'lawn',{quad:1});ctx.path([ctx.P(0,D/2-6),ctx.P(0,-q/2)],8,'promenade');ctx.path([ctx.P(-q/2,0),ctx.P(q/2,0)],6,'promenade');
  ctx.box(-24,24,-q/2-44,-q/2-6,H(5,5,4.2),'library',{floors:5,style:'glass',landmark:1});
  const blocks=[[-q/2-60,-q/2-8,-q/2,-q/2+70],[q/2+8,q/2+60,-q/2,-q/2+70],[-q/2-60,-q/2-8,q/2-70,q/2],[q/2+8,q/2+60,q/2-70,q/2],[-q/2,q/2,q/2+10,q/2+34],[-q/2-60,-q/2-8,-q/2-80,-q/2-10],[q/2+8,q/2+60,-q/2-80,-q/2-10]];
  blocks.forEach((b,i)=>ctx.box(b[0],b[1],b[2],b[3],H(3+(i%3),4.5,4),i===4?'main':'academic',{floors:3+(i%3),style:'campus',entrance:i===4}));
  ctx.ent(0,q/2+34,'main');ctx.grR(-q/2,q/2,q/2+36,D/2-4,'plaza');
  /* sports: track + field, courts */const tx=W/2-80;if(tx>q/2+70){ctx.gr(ctx.ellipse(tx,-D/2+70,62,38),'track');ctx.gr(ctx.ellipse(tx,-D/2+70,48,26),'field',{sport:'football'})}
  ctx.box(-W/2+10,-W/2+70,-D/2+12,-D/2+52,12,'hall',{floors:2,style:'sports'});
  /* student housing */for(let k=0;k<3;k++)ctx.box(-W/2+12+k*34,-W/2+36+k*34,D/2-110,D/2-60,H(5),'dorm',{floors:5,style:'residential'});
  parking(ctx,q/2+70,W/2-6,D/2-60,D/2-6,{shade:true,ev:8});parking(ctx,-W/2+6,-q/2-70,D/2-56,D/2-10,{shade:true})};
S.college=ctx=>{const {W,D}=ctx;ctx.box(-W/2+10,W/2*.2,D/2-50,D/2-14,H(4,4.5,4),'main',{floors:4,style:'campus',entrance:1});ctx.box(W*.2+6,W/2-10,D/2-60,D/2-14,H(3,4.5,4),'academic',{floors:3,style:'campus'});
  ctx.box(-W/2+10,-W/2+70,-D/2+10,-D/2+50,10,'hall',{floors:1,style:'works'});ctx.grR(-W/2+80,W/2-10,-D/2+10,D/2-72,'lawn');ctx.ent(-W/2*.4,D/2-14,'main');parking(ctx,-W/2+80,W/2-10,-D/2+8,-D/2+60,{shade:true,ev:6})};

/* ------------------------------------------------------------ HEALTH ----- */
S.hospital=ctx=>{const {W,D}=ctx;const pw=Math.min(W*.5,130),pd=Math.min(D*.34,70),f1=D/2-40;
  ctx.box(-pw/2,pw/2,f1-pd,f1,14,'podium',{floors:3,style:'health'});
  ctx.box(-pw/2+10,pw/2-10,f1-pd+14,f1-pd+36,H(9,4.5,4),'tower',{floors:9,style:'health',helipad:1,landmark:1});
  ctx.box(-W/2+14,-pw/2-6,f1-pd,f1-20,H(3,4.5,4),'wing',{floors:3,style:'health'});
  /* emergency department on the side street with its own ambulance bay */
  const ex=pw/2+8;ctx.box(ex,ex+36,f1-pd,f1-24,8.5,'emergency',{floors:2,style:'health'});ctx.grR(ex,ex+36,f1-24,f1-6,'ambulance');ctx.ent(ex+18,f1-24,'emergency');
  ctx.grR(-24,24,f1,f1+22,'drop',{canopy:1});ctx.ent(0,f1,'main');ctx.grR(-pw/2,-28,f1,D/2-4,'garden');
  parking(ctx,-W/2+6,W/2-6,-D/2+6,f1-pd-10,{shade:true,ev:10});ctx.box(W/2-70,W/2-10,f1-pd,f1-pd+40,15,'parkdeck',{floors:5,style:'parking'})};
S.clinic=ctx=>{const {W,D}=ctx,w=Math.min(W-20,56),d=Math.min(D*.4,26);ctx.box(-w/2,w/2,D/2-14-d,D/2-14,H(2,4.5,4),'main',{floors:2,style:'health',entrance:1});
  ctx.box(w/2-14,w/2,D/2-14-d-14,D/2-14-d,6,'emergency',{floors:1,style:'health'});ctx.grR(w/2-14,w/2+10,D/2-14-d-14,D/2-14-d,'ambulance');ctx.ent(0,D/2-14,'main');ctx.grR(-12,12,D/2-14,D/2-2,'drop',{canopy:1});
  parking(ctx,-W/2+4,W/2-4,-D/2+4,D/2-20-d-16,{shade:true,ev:2})};

/* -------------------------------------------------- SECURITY & EMERGENCY -- */
S.police_hq=ctx=>{const {W,D}=ctx,w=Math.min(W-30,90),d=Math.min(D*.35,34),f1=D/2-26;
  ctx.box(-w/2,w/2,f1-d,f1,H(5,5,4),'main',{floors:5,style:'civic',flag:1,entrance:1});ctx.box(-w/2,-w/2+22,f1-d-30,f1-d,H(3),'wing',{floors:3,style:'civic'});
  ctx.grR(-w/2,w/2,f1,D/2-3,'plaza',{flags:3});ctx.ent(0,f1,'main');ctx.wall(2.6,'fence',[[0,14],[W/2-16,8]]);ctx.grR(w/2+6,W/2-4,-D/2+4,D/2-8,'parking',{police:1,rows:3});
  parking(ctx,-W/2+4,w/2,-D/2+4,f1-d-36,{shade:true})};
S.police=ctx=>{const {W,D}=ctx,w=Math.min(W-24,40),d=Math.min(D*.4,22);ctx.box(-w/2,w/2,D/2-18-d,D/2-18,H(2,4.5,4),'main',{floors:2,style:'civic',flag:1,entrance:1});
  ctx.grR(-w/2,w/2,D/2-18,D/2-2,'plaza',{flags:1});ctx.ent(0,D/2-18,'main');ctx.wall(2.4,'fence',[[0,10],[W/2-10,7]]);ctx.grR(-W/2+4,W/2-4,-D/2+4,D/2-22-d,'parking',{police:1,rows:2})};
S.fire=ctx=>{const {W,D}=ctx,w=Math.min(W-16,60),d=22,f1=D/2-24;
  ctx.box(-w/2,w/2,f1-d,f1,9.5,'bays',{floors:1,doors:Math.max(3,Math.floor(w/11)),style:'fire'});ctx.box(-w/2-16,-w/2,f1-d,f1-4,H(3),'main',{floors:3,style:'fire'});ctx.box(w/2+2,w/2+9,f1-d,f1-d+7,24,'drilltower',{style:'fire'});
  ctx.grR(-w/2,w/2,f1,D/2-1,'apron');ctx.ent(0,f1,'vehicle');ctx.ent(-w/2-8,f1-4,'main');ctx.grR(-W/2+4,W/2-4,-D/2+4,f1-d-6,'yard');ctx.wall(2.2,'fence',[[0,w+4]])};

/* ----------------------------------------------------------- COMMERCIAL -- */
S.mall=ctx=>{const {W,D}=ctx;const w=Math.min(W*.6,260),d=Math.min(D*.5,140),f1=D/2-70;
  ctx.box(-w/2,w/2,f1-d,f1,22,'mall',{floors:3,style:'mall',skylights:1,landmark:1});
  ctx.box(-w/2-26,-w/2,f1-d+20,f1-20,17,'anchor',{floors:2,style:'mall'});ctx.box(w/2,w/2+26,f1-d+20,f1-20,17,'anchor',{floors:2,style:'mall'});
  ctx.grR(-30,30,f1,f1+22,'drop',{canopy:1});ctx.ent(0,f1,'main');ctx.ent(-w/2-26,f1-d/2,'main');ctx.ent(w/2+26,f1-d/2,'main');ctx.ent(0,f1-d,'service');
  parking(ctx,-W/2+6,W/2-6,f1+24,D/2-6,{shade:true,ev:16});parking(ctx,-W/2+6,-w/2-32,-D/2+6,f1-10,{shade:true});parking(ctx,w/2+32,W/2-6,-D/2+6,f1-10,{shade:true});
  ctx.box(-w/2,-w/2+70,-D/2+8,f1-d-12,16,'parkdeck',{floors:4,style:'parking'})};
S.souq=ctx=>{const {W,D,R}=ctx;/* clusters of 2-storey shop houses along shaded lanes */const nx=Math.max(2,Math.floor((W-20)/34)),ny=Math.max(2,Math.floor((D-20)/30));
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a0=-W/2+10+i*(W-20)/nx,b0=-D/2+10+j*(D-20)/ny;ctx.box(a0+3,a0+(W-20)/nx-3,b0+3,b0+(D-20)/ny-3,7+R()*2.5,'shops',{floors:2,style:'souq',windtower:R()<.35})}
  ctx.grR(-W/2+2,W/2-2,-3,3,'plaza',{canopy:1});ctx.ent(0,D/2-2,'main')};
S.hotel=ctx=>{const {W,D}=ctx;const w=Math.min(W-20,70);ctx.box(-w/2,w/2,-D/2+14,D/2-30,12,'podium',{floors:2,style:'hotel'});ctx.box(-w/2+6,w/2-6,-D/2+22,-D/2+42,H(16,5,3.4),'tower',{floors:16,style:'hotel',landmark:1});
  ctx.grR(-18,18,D/2-30,D/2-10,'drop',{canopy:1});ctx.ent(0,D/2-30,'main');ctx.grR(-w/2,w/2,-D/2+44,D/2-34,'pool')};
S.civic=ctx=>{const {W,D}=ctx,w=Math.min(W-30,96),d=Math.min(D-50,70),f1=D/2-30;
  ctx.box(-w/2,w/2,f1-14,f1,H(4,5,4.2),'main',{floors:4,style:'civic',colonnade:1,entrance:1});ctx.box(-w/2,-w/2+14,f1-d,f1-14,H(3,5,4.2),'wing',{floors:3,style:'civic'});ctx.box(w/2-14,w/2,f1-d,f1-14,H(3,5,4.2),'wing',{floors:3,style:'civic'});ctx.box(-w/2+14,w/2-14,f1-d,f1-d+14,H(3,5,4.2),'wing',{floors:3,style:'civic'});
  ctx.grR(-w/2+14,w/2-14,f1-d+14,f1-14,'courtyard');ctx.box(-5,5,f1-6,f1+4,34,'clocktower',{style:'civic'});ctx.grR(-w/2,w/2,f1,D/2-3,'plaza',{flags:3});ctx.ent(0,f1,'main');parking(ctx,-W/2+4,W/2-4,-D/2+4,f1-d-8,{shade:true,ev:6})};
S.post=ctx=>{const {W,D}=ctx,w=Math.min(W-12,32);ctx.box(-w/2,w/2,D/2-30,D/2-12,7,'main',{floors:1,style:'civic',entrance:1});ctx.ent(0,D/2-12,'main');parking(ctx,-W/2+3,W/2-3,-D/2+3,D/2-34,{})};
S.fuel=ctx=>{const {W,D}=ctx;const cw=Math.min(W*.55,40);ctx.box(-cw/2,cw/2,-6,12,6.5,'canopy',{style:'fuel',open:1});ctx.box(-W/2+6,-W/2+26,-D/2+6,-D/2+22,4.8,'main',{floors:1,style:'shop',entrance:1});
  ctx.box(W/2-24,W/2-6,-D/2+6,-D/2+18,5,'carwash',{style:'works'});ctx.grR(-W/2+2,W/2-2,-D/2+2,D/2-2,'apron');ctx.gr(ctx.rect(cw/2+4,W/2-4,-4,10),'parking',{ev:6,rows:1});ctx.ent(0,D/2-2,'vehicle')};
S.parking=ctx=>{const {W,D}=ctx;ctx.box(-W/2+4,W/2-4,-D/2+4,D/2-6,19,'parkdeck',{floors:6,style:'parking',solar:1});ctx.ent(-W/2+10,D/2-6,'vehicle')};

/* -------------------------------------------------------------- CULTURE -- */
S.library=ctx=>{const {W,D}=ctx,w=Math.min(W-24,74),d=Math.min(D*.5,46);ctx.box(-w/2,w/2,-D/2+16,-D/2+16+d,19,'library',{floors:3,style:'glass',canopy:1,landmark:1});
  ctx.grR(-w/2,w/2,-D/2+18+d,D/2-2,'plaza',{seating:1});ctx.ent(0,-D/2+16+d,'main')};
S.cultural=ctx=>{const {W,D}=ctx,w=Math.min(W-20,110),d=Math.min(D*.55,60);
  ctx.box(-w/2,-w/2+w*.42,-D/2+14,-D/2+14+d,20,'hall',{floors:3,style:'cultural'});ctx.box(-w/2+w*.46,w/2,-D/2+14,-D/2+14+d*.7,14,'gallery',{floors:2,style:'cultural'});
  ctx.mass(ctx.rect(-w/2-6,w/2+6,-D/2+8,-D/2+20+d),1,'sailroof',{y0:22,style:'cultural',landmark:1});
  ctx.gr(ctx.circle(w*.25,D/2-30,18),'amphitheatre');ctx.grR(-W/2+2,W/2-2,-D/2+22+d,D/2-2,'plaza',{seating:1});ctx.ent(0,-D/2+14+d,'main')};
S.museum=ctx=>{const {W,D}=ctx,w=Math.min(W-24,70);ctx.box(-w/2,w/2,-D/2+14,-D/2+48,11,'main',{floors:2,style:'museum',entrance:1});ctx.box(-w/2,-w/2+18,-D/2+48,-D/2+80,9,'wing',{floors:1,style:'museum'});ctx.box(w/2-18,w/2,-D/2+48,-D/2+80,9,'wing',{floors:1,style:'museum'});
  ctx.grR(-w/2+18,w/2-18,-D/2+48,-D/2+80,'courtyard');ctx.box(-8,8,-D/2+44,-D/2+54,17,'lantern',{style:'museum'});ctx.grR(-W/2+2,W/2-2,-D/2+82,D/2-2,'plaza');ctx.ent(0,-D/2+48,'main')};
S.community=ctx=>{const {W,D}=ctx,w=Math.min(W-10,34);ctx.box(-w/2,w/2,D/2-28,D/2-10,7,'main',{floors:1,style:'civic',entrance:1});ctx.ent(0,D/2-10,'main');ctx.grR(-W/2+2,W/2-2,-D/2+2,D/2-32,'court',{sport:'multi'})};

/* --------------------------------------------------------------- SPORTS -- */
S.stadium=ctx=>{const {W,D}=ctx;const rs=Math.min(W,D)*.19,rf=rs*.8;
  ctx.mass(ctx.ellipse(0,0,rs,rf,48),32,'stadium',{inner:ctx.ellipse(0,0,rs*.62,rf*.58,48),style:'stadium',landmark:1,ellipse:{rs,rf}});
  ctx.gr(ctx.ellipse(0,0,rs*.6,rf*.56,40),'track');ctx.gr(ctx.ellipse(0,0,rs*.46,rf*.38,40),'field',{sport:'football'});
  ctx.gr(ctx.ellipse(0,0,rs+30,rf+30,48),'plaza');ctx.ent(0,rf,'main');ctx.ent(0,-rf,'main');ctx.ent(rs,0,'main');ctx.ent(-rs,0,'main');
  /* indoor arena and aquatic centre, training pitches */
  ctx.box(rs+60,rs+150,-60,40,24,'arena',{floors:2,style:'sports',landmark:1});ctx.box(-rs-150,-rs-60,-60,30,16,'aquatics',{floors:1,style:'sports'});
  for(const k of [0,1])ctx.grR(-rs-160+k*80,-rs-90+k*80,50,100,'field',{sport:'football'});
  ctx.grR(rs+60,rs+150,60,110,'court',{sport:'tennis'});
  parking(ctx,-W/2+8,W/2-8,-D/2+8,-rf-50,{shade:true,ev:20});parking(ctx,-W/2+8,W/2-8,rf+50,D/2-8,{shade:true,ev:12})};
S.sportshall=ctx=>{const {W,D}=ctx,w=Math.min(W-20,64),d=Math.min(D*.5,40);ctx.box(-w/2,w/2,D/2-16-d,D/2-16,13,'hall',{floors:1,style:'sports',vault:1});ctx.ent(0,D/2-16,'main');
  ctx.grR(-W/2+4,-4,-D/2+4,D/2-22-d,'court',{sport:'basketball'});ctx.grR(4,W/2-4,-D/2+4,D/2-22-d,'court',{sport:'tennis'});parking(ctx,-W/2+3,W/2-3,D/2-14,D/2-2,{})};

/* ------------------------------------------------------- INFRASTRUCTURE -- */
S.substation=ctx=>{const {W,D,R}=ctx;ctx.box(-W/2+8,-W/2+30,D/2-26,D/2-8,6,'main',{floors:1,style:'works'});for(let i=0;i<4;i++)for(let j=0;j<2;j++)ctx.box(-W/2+40+i*16,-W/2+48+i*16,-D/2+14+j*22,-D/2+24+j*22,5,'transformer',{style:'works'});
  ctx.grR(-W/2+2,W/2-2,-D/2+2,D/2-2,'yard');ctx.wall(2.8,'fence',[[W/2-12,8]])};
S.reservoir=ctx=>{const {W,D}=ctx;const r=Math.min(W,D)*.18;for(const s of [-1,1])ctx.mass(ctx.circle(s*r*1.2,-D*.1,r,32),12,'tank',{style:'tank'});ctx.box(-12,12,D/2-24,D/2-10,6,'main',{floors:1,style:'works'});ctx.grR(-W/2+2,W/2-2,-D/2+2,D/2-2,'yard');ctx.wall(2.8,'fence',[[0,8]])};
S.depot=ctx=>{const {W,D}=ctx;ctx.box(-W/2+8,-W/2+68,-D/2+8,-D/2+48,11,'hall',{floors:1,style:'works'});ctx.grR(-W/2+74,W/2-6,-D/2+6,D/2-10,'parking',{bus:1,shade:true,rows:4});ctx.box(-W/2+8,-W/2+30,D/2-30,D/2-8,H(2),'main',{floors:2,style:'civic'});ctx.wall(2.4,'fence',[[W/2-20,14]])};

/* -------------------------------------------------------------- PARKS ---- */
S.park=ctx=>{/* layout (paths, playground, trees) is generated with the landscape */ctx.gr(ctx.poly,'park')};
})(typeof window!=='undefined'?window:globalThis);
