/* ============================================================================
   SMART CITY — PUBLIC FACILITIES ARCHITECTURE (SC.fac)
   ----------------------------------------------------------------------------
   One recognisable architectural identity per facility type, driven by the
   roles in each site plan (js/city/15-sites.js). Landmark silhouettes
   (domes, minarets, stadium bowl, towers, sail roof, clock tower) are part
   of LOD1 so important facilities read from across the city; detail (arches,
   crenellations, canopies, signage, markings, shade structures, vehicles)
   is LOD0.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,MAT=SC.MAT,PAT=SC.PAT,clamp=SC.clamp,col=SC.col,A=SC.arch,FP=A.FP,P=A.PAL;
const NOF=[0,0,0,0];
const F=SC.fac={};
const R_=r=>SC.rng(r.seed||7);
const G=SC.WCOL;
/* palette per facility family */
const FAM={
  mosque:{wall:[240,236,226],trim:[214,196,160],dome:[246,244,238],dome2:[64,150,150],gold:[214,176,80]},
  school:{wall:[232,222,200],accent:[46,130,160],trim:[240,236,226]},kinder:{wall:[246,240,226],accent:[240,150,60]},
  campus:{wall:[214,196,166],accent:[120,84,60],trim:[236,230,218]},
  health:{wall:[244,244,240],accent:[40,150,140],glass:[70,130,140]},
  civic:{wall:[240,236,226],accent:[214,196,160]},police:{wall:[240,240,238],accent:[34,70,140]},
  fire:{wall:[240,238,232],accent:[196,40,36]},mall:{wall:[226,212,188],accent:[80,80,86],glass:[80,120,130]},
  sports:{wall:[236,236,232],accent:[40,110,170]},cultural:{wall:[234,222,200],accent:[160,120,80]},
  museum:{wall:[210,188,150],accent:[120,90,60]},works:{wall:[210,210,206],accent:[120,124,130]},
  hotel:{wall:[222,206,178],accent:[120,90,62]},glass:{wall:[190,206,212],accent:[70,74,80]},souq:{wall:[222,200,160],accent:[124,84,54]},parking:{wall:[206,204,198],accent:[80,80,84]},fuel:{wall:[240,240,238],accent:[40,140,90]},shop:{wall:[240,236,228],accent:[60,60,64]},residential:{wall:[216,198,168],accent:[90,90,94]},tank:{wall:[226,226,222],accent:[120,124,130]}};
const fam=m=>FAM[m.style]||FAM.civic;
const wallsOf=(M,m,c,prm,top,topC)=>{M.P=prm||NOF;M.prism(m.poly,m.y0||0,(m.y0||0)+m.h-(top?1:0),c,prm?MAT.facade:MAT.matte,{top:!top,cont:true,topC:topC||P.roof});M.P=NOF;if(top)M.prism(m.poly,(m.y0||0)+m.h-1,(m.y0||0)+m.h,col.mul(c,.97),MAT.matte,{topC:topC||P.roof})};

/* ---- mosque elements ---- */
function dome(M,c,r,y,h,colr,drum=true,onion=false){if(drum){M.cyl(c[0],c[1],r*1.02,y,y+r*.45,20,[236,230,214],MAT.facade,{top:false});y+=r*.45}
  const prof=onion?(t=>{const s=Math.sin(Math.min(1,t)*Math.PI);return clamp(1.08*Math.sqrt(Math.max(0,1-t*t))+.12*s*(1-t),0,1.2)}):(t=>Math.sqrt(Math.max(0,1-t*t)));M.dome(c[0],c[1],r,y,h,20,8,colr,MAT.metal,prof);return y+h}
function minaret(M,p,base,h,fc,detail){const c=p;const w=base;/* square base → octagonal shaft → balcony → upper shaft → cupola → finial */
  M.box(c[0],c[1],w/2,w/2,0,h*.28,0,fc.wall,MAT.facade);if(detail)A.crenel(M,[[c[0]-w/2,c[1]-w/2],[c[0]+w/2,c[1]-w/2],[c[0]+w/2,c[1]+w/2],[c[0]-w/2,c[1]+w/2]],h*.28,fc.trim,.5,.5,.4,.2);
  M.cyl(c[0],c[1],w*.42,h*.28,h*.66,8,fc.wall,MAT.facade);M.cyl(c[0],c[1],w*.58,h*.66,h*.69,16,fc.trim,MAT.matte);M.cyl(c[0],c[1],w*.62,h*.69,h*.7,16,fc.trim,MAT.matte);
  M.cyl(c[0],c[1],w*.32,h*.7,h*.86,8,fc.wall,MAT.facade);M.cyl(c[0],c[1],w*.44,h*.86,h*.88,12,fc.trim,MAT.matte);
  M.dome(c[0],c[1],w*.34,h*.88,h*.09,12,5,fc.dome2||fc.dome,MAT.metal);M.cyl(c[0],c[1],.1,h*.97,h,6,fc.gold,MAT.metal);
  if(detail)for(let k=0;k<8;k++){const a=k/8*Math.PI*2;M.box(c[0]+Math.cos(a)*w*.52,c[1]+Math.sin(a)*w*.52,.08,.08,h*.7,h*.7+1,0,fc.trim,MAT.matte)}}
/* ---- stadium bowl ---- */
function stadium(M,m,fc,detail){const e=m.ellipse,c=g2.centroid(m.poly),n=64;const fr=m.frame;const ux=fr?fr.s[0]:1,uz=fr?fr.s[1]:0;
  const at=(k,rs,rf,)=>{const a=k/n*Math.PI*2,ls=Math.cos(a)*rs,lf=Math.sin(a)*rf;return[c[0]+ux*ls+(-uz)*lf*-1*-1+0,c[1]+uz*ls+ux*lf]};
  const pt=(k,s)=>{const a=k/n*Math.PI*2,ls=Math.cos(a)*e.rs*s,lf=Math.sin(a)*e.rf*s;return[c[0]+ux*ls-uz*lf,c[1]+uz*ls+ux*lf]};
  const H=m.h;
  for(let k=0;k<n;k++){const a0=pt(k,1),a1=pt(k+1,1),i0=pt(k,.64),i1=pt(k+1,.64),s0=pt(k,.8),s1=pt(k+1,.8);
    /* outer façade: vertical fins over glass */M.P=FP(PAT.vertical,1.4,4,.45);M.wall(a1[0],a1[1],a0[0],a0[1],0,H-8,[236,236,232],MAT.facade,0);M.P=NOF;
    /* seating tiers: lower bowl + upper bowl (two slopes) */const seat=k%8<4?[178,40,48]:[150,150,156];
    M.quad([i0[0],2,i0[1]],[i1[0],2,i1[1]],[s1[0],H*.42,s1[1]],[s0[0],H*.42,s0[1]],seat,MAT.matte);
    M.quad([s0[0],H*.46,s0[1]],[s1[0],H*.46,s1[1]],[a1[0],H-8,a1[1]],[a0[0],H-8,a0[1]],col.mul(seat,.9),MAT.matte);
    M.quad([s0[0],H*.42,s0[1]],[s1[0],H*.42,s1[1]],[s1[0],H*.46,s1[1]],[s0[0],H*.46,s0[1]],[220,220,216],MAT.matte);
    M.wall(i0[0],i0[1],i1[0],i1[1],0,2,[200,200,196],MAT.matte);
    /* roof canopy: cantilevered ring with a light edge */const r0=pt(k,1.02),r1=pt(k+1,1.02),q0=pt(k,.72),q1=pt(k+1,.72);M.quad([r0[0],H,r0[1]],[r1[0],H,r1[1]],[q1[0],H-3,q1[1]],[q0[0],H-3,q0[1]],[244,244,240],MAT.matte);
    M.quad([q0[0],H-3.05,q0[1]],[q1[0],H-3.05,q1[1]],[r1[0],H-.05,r1[1]],[r0[0],H-.05,r0[1]],[190,190,188],MAT.matte);
    if(detail&&k%4===0){M.box(q0[0],q0[1],.4,.4,H-3.4,H-3,0,[255,248,220],MAT.emit)}}
  /* floodlight masts */for(const k of [n/8,3*n/8,5*n/8,7*n/8]){const p=pt(k,1.08);M.cyl(p[0],p[1],.6,0,H+18,8,P.metal,MAT.metal);M.box(p[0],p[1],3,.6,H+16,H+19,Math.atan2(p[1]-c[1],p[0]-c[0])+Math.PI/2,[255,250,230],MAT.emit)}}
/* ---- vaulted hall roof ---- */
function vault(M,m,c1,rise){const ob=g2.obb(m.poly),c=g2.centroid(m.poly);const L=ob.u1-ob.u0,W=ob.v1-ob.v0;let ux=ob.ux,uz=ob.uz,a=L,b=W;if(W>L){[ux,uz]=[-uz,ux];a=W;b=L}
  const n=14,at=(s,t,y)=>[c[0]+ux*s-uz*t,y,c[1]+uz*s+ux*t];for(let k=0;k<n;k++){const t0=-b/2+b*k/n,t1=-b/2+b*(k+1)/n,y0=m.h+rise*(1-(2*t0/b)**2),y1=m.h+rise*(1-(2*t1/b)**2);
    M.quad(at(-a/2,t0,y0),at(a/2,t0,y0),at(a/2,t1,y1),at(-a/2,t1,y1),c1,MAT.metal)}
  for(const s of [-a/2,a/2]){const pts=[];for(let k=0;k<=n;k++){const t=-b/2+b*k/n;pts.push([t,m.h+rise*(1-(2*t/b)**2)])}for(let k=0;k<n;k++){M.quad(at(s,pts[k][0],m.h),at(s,pts[k+1][0],m.h),at(s,pts[k+1][0],pts[k+1][1]),at(s,pts[k][0],pts[k][1]),[210,214,216],MAT.glass)}}}
/* ---- sail roof (cultural centre) ---- */
function sail(M,m){const ob=g2.obb(m.poly),c=g2.centroid(m.poly);const L=ob.u1-ob.u0,W=ob.v1-ob.v0,ux=ob.ux,uz=ob.uz;const nx=16,nz=10;const y=(s,t)=>m.y0+6*Math.sin((s+.5)*Math.PI)*.6+4*Math.sin((t+.5)*Math.PI*1.2)+3*s;
  const at=(s,t)=>{const a=s*L,b=t*W;return[c[0]+ux*a-uz*b,y(s,t),c[1]+uz*a+ux*b]};
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const s0=-.5+i/nx,s1=-.5+(i+1)/nx,t0=-.5+j/nz,t1=-.5+(j+1)/nz;M.quad(at(s0,t0),at(s1,t0),at(s1,t1),at(s0,t1),[248,246,240],MAT.matte);M.quad(at(s0,t1),at(s1,t1),at(s1,t0),at(s0,t0),[214,208,196],MAT.matte)}
  for(const [s,t] of [[-.45,-.4],[-.45,.4],[.45,-.4],[.45,.4],[0,-.45],[0,.45]]){const p=at(s,t);M.cyl(p[0],p[2],.35,0,p[1],8,[230,230,226],MAT.metal)}}

/* =============================================================== LOD1 == */
F.lod1=(M,r)=>{const R=R_(r);
  for(const g of r.ground||[])groundL1(M,g,r);
  for(const m of r.masses){const fc=fam(m);M.P=NOF;
    switch(m.role){
      case'prayerhall':{wallsOf(M,m,fc.wall,FP(PAT.slots,3.2,m.h,.45),true,[232,228,220]);const c=g2.centroid(m.poly);if(m.dome){const top=dome(M,c,m.dome.r,m.h,m.dome.h,r.kind==='mosque_grand'?fc.dome:(R()<.5?fc.dome:fc.dome2),true,r.kind==='mosque_grand');M.cyl(c[0],c[1],.18,top,top+3,6,fc.gold,MAT.metal)}
        if(m.subdomes){const ob=g2.obb(m.poly);for(const [a,b] of [[-.32,-.32],[.32,-.32],[-.32,.32],[.32,.32]]){const u=(ob.u0+ob.u1)/2+a*(ob.u1-ob.u0),v=(ob.v0+ob.v1)/2+b*(ob.v1-ob.v0);const p=[u*ob.ux-v*ob.uz,u*ob.uz+v*ob.ux];dome(M,p,m.dome.r*.3,m.h,m.dome.r*.3,fc.dome,true)}}break}
      case'minaret':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly);minaret(M,c,Math.min(ob.u1-ob.u0,ob.v1-ob.v0),m.h,fc,false);break}
      case'arcade':wallsOf(M,m,fc.wall,FP(PAT.slots,3.6,m.h,.62),false,[232,228,220]);break;
      case'stadium':stadium(M,m,fc,false);break;
      case'hall':case'arena':wallsOf(M,m,fc.wall||P.white,FP(PAT.ribbon,4,m.h,.7),false);if(m.vault||m.role==='arena')vault(M,m,[206,210,214],m.role==='arena'?8:5);break;
      case'tank':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly),rr=(ob.u1-ob.u0)/2;M.cyl(c[0],c[1],rr,0,m.h,28,[228,228,224],MAT.matte,{top:false});M.dome(c[0],c[1],rr,m.h,rr*.18,28,4,[210,210,206],MAT.metal);break}
      case'sailroof':sail(M,m);break;
      case'library':wallsOf(M,m,[176,196,204],FP(PAT.curtain,2.6,m.h/3,.9),false,[220,220,216]);{const ov=g2.inset(m.poly,-4);M.prism(ov,m.h,m.h+.8,[240,238,232],MAT.matte)}break;
      case'canopy':{const ob=g2.obb(m.poly),c=g2.centroid(m.poly);M.prism(m.poly,m.h-.9,m.h,[244,244,240],MAT.matte,{bottom:true});for(const [a,b] of [[-.3,0],[.3,0],[0,0]]){const u=(ob.u0+ob.u1)/2+a*(ob.u1-ob.u0),v=(ob.v0+ob.v1)/2;M.box(u*ob.ux-v*ob.uz,u*ob.uz+v*ob.ux,.35,.35,0,m.h-.9,0,[200,200,200],MAT.metal)}
        M.layer=0;const strip=g2.inset(m.poly,-.02);M.P=NOF;for(const e of A.edges(m.poly))A.wpanel(M,e,0,e.L,m.h-.7,m.h-.2,.03,fc.accent||[40,140,90],MAT.emit);break}
      case'parkdeck':{const fl=m.floors||5;for(let f=0;f<fl;f++){const y=f*3.1;M.prism(m.poly,y,y+.45,[196,194,188],MAT.matte,{top:true,bottom:true});M.P=FP(PAT.bands,8,3.1,.1);M.prism(g2.inset(m.poly,.6),y+.45,y+3.1,[60,62,66],MAT.matte,{top:false});M.P=NOF}
        M.prism(m.poly,fl*3.1,fl*3.1+1.1,[206,204,198],MAT.matte);if(m.solar||true){A.roofKit(M,m.poly,fl*3.1+1.1,R,{solar:true,ac:0,tanks:0,core:false})}break}
      case'clocktower':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly),w=Math.min(ob.u1-ob.u0,ob.v1-ob.v0);M.P=FP(PAT.slots,w/2,4,.35);M.box(c[0],c[1],w/2,w/2,0,m.h-6,Math.atan2(ob.uz,ob.ux),fc.wall,MAT.facade);M.P=NOF;
        M.box(c[0],c[1],w/2+.3,w/2+.3,m.h-6,m.h-2,Math.atan2(ob.uz,ob.ux),fc.accent,MAT.matte);dome(M,c,w*.42,m.h-2,w*.4,[214,176,80],false);break}
      case'drilltower':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly);M.P=FP(PAT.punched,2.4,3.2,.4);M.box(c[0],c[1],(ob.u1-ob.u0)/2,(ob.v1-ob.v0)/2,0,m.h,Math.atan2(ob.uz,ob.ux),[200,50,44],MAT.facade);M.P=NOF;break}
      case'transformer':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly);M.box(c[0],c[1],(ob.u1-ob.u0)/2,(ob.v1-ob.v0)/2,0,m.h,Math.atan2(ob.uz,ob.ux),[150,154,160],MAT.metal);M.cyl(c[0],c[1],.4,m.h,m.h+2.5,8,[120,90,70],MAT.matte);break}
      case'tower':case'podium':{const glassy=m.style==='health'||m.style==='hotel';const pat=m.role==='podium'?FP(PAT.ribbon,3.6,4.2,.7,4.8):m.style==='health'?FP(PAT.grid,3.2,4,.7):m.style==='hotel'?FP(PAT.punched,3.2,3.4,.55):FP(PAT.curtain,3,3.8,.9);
        wallsOf(M,m,fc.wall,pat,true);if(m.helipad){const c=g2.centroid(m.poly);M.cyl(c[0],c[1],9,m.h,m.h+.4,24,[90,94,98],MAT.matte);M.layer=5;M.cyl(c[0],c[1],7.5,m.h+.42,m.h+.44,24,[240,240,236],MAT.paint);M.cyl(c[0],c[1],6.8,m.h+.44,m.h+.46,24,[90,94,98],MAT.paint);M.layer=0;
          const ob=g2.obb(m.poly),yaw=Math.atan2(ob.uz,ob.ux);M.layer=6;for(const [a,b,w,d] of [[-2.2,0,.5,3.2],[2.2,0,.5,3.2],[0,0,2.2,.5]]){M.box(c[0]+Math.cos(yaw)*a-Math.sin(yaw)*b,c[1]+Math.sin(yaw)*a+Math.cos(yaw)*b,w,d,m.h+.46,m.h+.48,yaw,[240,240,236],MAT.paint)}M.layer=0}break}
      case'emergency':wallsOf(M,m,fc.wall,FP(PAT.ribbon,3.6,4.2,.6),true);break;
      case'bays':wallsOf(M,m,fc.wall,FP(PAT.shop,m.h/ (m.doors?1:1)*0+5,m.h,.85,m.h-2),true);break;
      case'mall':wallsOf(M,m,fc.wall,FP(PAT.bands,6,5.2,.2),true,[210,206,198]);{/* skylight spine */const ob=g2.obb(m.poly),c=g2.centroid(m.poly);M.box(c[0],c[1],(ob.u1-ob.u0)*.38,3,m.h,m.h+2.2,Math.atan2(ob.uz,ob.ux),[150,190,200],MAT.glass)}break;
      case'anchor':wallsOf(M,m,col.mul(fc.wall,.95),FP(PAT.bands,6,5,.2),true);break;
      case'shops':wallsOf(M,m,fc.wall,FP(PAT.shop,3.4,3.6,.7,3.2),true);if(m.windtower){const c=g2.centroid(m.poly);M.box(c[0],c[1],1.3,1.3,m.h,m.h+4.5,0,fc.wall,MAT.facade);}break;
      case'dorm':wallsOf(M,m,[222,206,178],FP(PAT.punched,3.2,3.3,.5),true);break;
      case'academic':case'main':case'wing':case'annex':case'gallery':case'aquatics':case'carwash':case'lantern':default:{
        const s=m.style,pat=s==='school'||s==='campus'?FP(PAT.ribbon,3.6,3.8,.62):s==='health'?FP(PAT.ribbon,3.4,4,.6):s==='civic'?FP(PAT.punched,3.4,4.2,.45):s==='mosque'?FP(PAT.slots,3.2,4,.45):s==='museum'?FP(PAT.none,4,4,0):s==='cultural'?FP(PAT.vertical,1.4,4,.4):s==='kinder'?FP(PAT.punched,3,3.4,.6):s==='glass'?FP(PAT.curtain,2.8,3.8,.9):s==='sports'?FP(PAT.ribbon,4,5,.6):s==='fire'?FP(PAT.punched,3,3.4,.5):s==='works'?FP(PAT.bands,6,4,.3):s==='shop'?FP(PAT.shop,4,m.h,.8,m.h-1):FP(PAT.punched,3.4,3.6,.5);
        wallsOf(M,m,fc.wall,pat,true);if(m.role==='lantern'){M.prism(g2.inset(m.poly,-1.5),m.h,m.h+.6,[240,236,226],MAT.matte)}}}}};

/* ground surfaces (LOD1) */
const GC={parking:[70,70,74],field:[74,146,60],track:[178,76,56],court:[58,112,150],plaza:[220,210,190],courtyard:[226,214,190],garden:[100,146,64],lawn:[104,150,66],drop:[86,86,90],apron:[184,182,178],yard:[176,170,158],playground:[210,120,70],pool:[70,172,206],amphitheatre:[210,200,180],ambulance:[86,86,90],park:[104,142,62]};
function groundL1(M,g,r){if(g.kind==='park')return;const c=GC[g.kind]||[200,190,170];const mat=g.kind==='field'||g.kind==='lawn'||g.kind==='garden'?MAT.grass:g.kind==='parking'||g.kind==='drop'||g.kind==='ambulance'?MAT.asphalt:g.kind==='pool'?MAT.water:g.kind==='plaza'||g.kind==='courtyard'?MAT.tile:MAT.sand;
  M.layer=g.kind==='track'?3:g.kind==='field'?4:2;M.flat(g2.ccw(g.poly),g.kind==='pool'?.1:.2,c,mat);M.layer=0}

/* =============================================================== LOD0 == */
F.lod0=(M,r)=>{const R=R_(r);
  for(const g of r.ground||[])groundL0(M,g,r,R);
  for(const m of r.masses){const fc=fam(m);const E=A.edges(m.poly);
    switch(m.role){
      case'prayerhall':{A.crenel(M,m.poly,m.h,fc.trim,.8,.6,.6,.3);const fe=A.frontEdge(E,r.front);/* arched portal (iwan) */const w=Math.min(8,fe.L*.3);A.archFrame(M,fe,fe.L/2-w/2,w,0,Math.min(m.h-2,w*1.6),1.2,fc.trim);A.wpanel(M,fe,fe.L/2-w*.3,fe.L/2+w*.3,.1,Math.min(m.h-4,w*1.2),.05,[124,84,54]);
        for(const e of E){const n=Math.floor(e.L/5);for(let k=0;k<n;k++){const u=(k+.5)*e.L/n;if(e===fe&&Math.abs(u-e.L/2)<w)continue;A.archFrame(M,e,u-1,2,1.5,Math.min(m.h-3,6),.25,fc.trim)}}
        const c=g2.centroid(m.poly);if(m.dome){const top=m.h+m.dome.r*.45+m.dome.h;/* crescent finial */M.cyl(c[0],c[1],.5,top+2.6,top+2.9,10,fc.gold,MAT.metal)}break}
      case'minaret':{const c=g2.centroid(m.poly),ob=g2.obb(m.poly);const w=Math.min(ob.u1-ob.u0,ob.v1-ob.v0);A.crenel(M,[[c[0]-w/2,c[1]-w/2],[c[0]+w/2,c[1]-w/2],[c[0]+w/2,c[1]+w/2],[c[0]-w/2,c[1]+w/2]],m.h*.28,fc.trim,.5,.5,.4,.2);
        /* balcony lights */for(let k=0;k<8;k++){const a=k/8*Math.PI*2;M.box(c[0]+Math.cos(a)*w*.6,c[1]+Math.sin(a)*w*.6,.12,.12,m.h*.7,m.h*.7+.25,0,[255,236,180],MAT.emit)}break}
      case'arcade':{for(const e of E){if(e.L<6)continue;const n=Math.floor(e.L/3.4);for(let k=0;k<n;k++){const u=(k+.5)*e.L/n;A.archFrame(M,e,u-1.2,2.4,0,m.h-1.2,.3,fc.trim)}}A.crenel(M,m.poly,m.h,fc.trim,.6,.5,.5,.25);break}
      case'main':case'wing':case'academic':case'annex':case'emergency':case'dorm':case'gallery':case'hall':{
        const fe=A.frontEdge(E,r.front);if(m.entrance||m.role==='emergency'){const w=Math.min(14,fe.L*.4);A.wbox(M,fe,fe.L/2-w/2,fe.L/2+w/2,3.8,4.2,0,m.role==='emergency'?6:3.6,m.role==='emergency'?[240,240,236]:fc.accent||P.dark);A.wpanel(M,fe,fe.L/2-w*.35,fe.L/2+w*.35,.05,3.6,.04,[70,96,104],MAT.glass);
          const sc=m.role==='emergency'?[220,40,40]:m.style==='health'?[40,160,140]:m.style==='police'||m.style==='civic'&&r.kind.startsWith('police')?[40,80,170]:fc.accent||[60,60,64];A.wpanel(M,fe,fe.L/2-w*.4,fe.L/2+w*.4,4.3,5.1,m.role==='emergency'?6.02:3.62,sc,MAT.emit)}
        /* sun-shading fins for institutional buildings */if(m.style==='school'||m.style==='campus'||m.style==='health'){for(const e of E){for(let u=1.8;u<e.L-.5;u+=1.8)A.wbox(M,e,u-.08,u+.08,.6,m.h-1.2,0,.55,m.style==='school'?fc.accent:[230,228,222],MAT.matte)}}
        if(m.colonnade){for(let u=2;u<fe.L-1;u+=4){const p=A.on(fe,u,0,3.2);M.cyl(p[0],p[2],.45,0,m.h-2,10,P.white,MAT.matte)}A.wbox(M,fe,0,fe.L,m.h-2.4,m.h-1.2,0,3.8,fc.accent||P.stone)}
        if(m.style==='mosque'||m.style==='civic'||m.style==='museum')A.crenel(M,m.poly,m.h,fc.trim||fc.accent||P.coping,.6,.6,.6,.25);else A.parapet(M,m.poly,m.h-.05,.9,.22,P.coping);
        A.roofKit(M,m.poly,m.h,R,{solar:m.style!=='mosque',ac:4,tanks:0});
        if(m.flag){for(let k=-1;k<=1;k++){const p=A.on(fe,fe.L/2+k*4,0,9);M.cyl(p[0],p[2],.08,0,12,6,P.metal,MAT.metal);M.box(p[0]+.7,p[2],.7,.03,10.6,11.9,0,k?[200,40,40]:[40,130,70],MAT.matte)}}
        break}
      case'bays':{const fe=A.frontEdge(E,r.front);const n=m.doors||4,dw=fe.L/n;for(let k=0;k<n;k++){A.wpanel(M,fe,k*dw+.6,(k+1)*dw-.6,.05,m.h-2.6,.04,[196,40,36],MAT.metal);A.wbox(M,fe,k*dw-.2,k*dw+.2,0,m.h,0,.3,P.white)}
        A.wpanel(M,fe,1,fe.L-1,m.h-2.2,m.h-1.4,.06,[220,40,36],MAT.emit);A.parapet(M,m.poly,m.h-.05,.8,.2,P.coping);
        /* engines on the apron */for(let k=0;k<Math.min(3,n);k++){const p=A.on(fe,(k+.5)*dw,0,7);SC.props.truck(M,p[0],p[2],Math.atan2(fe.n[1],fe.n[0]),'fire')}break}
      case'mall':case'anchor':{for(const e of E){if(e.L<30)continue;/* glazed entrance portal on every long side */const w=Math.min(26,e.L*.22);A.wbox(M,e,e.L/2-w/2-1,e.L/2+w/2+1,0,m.h+1.5,0,1.2,[230,222,206]);A.wpanel(M,e,e.L/2-w/2,e.L/2+w/2,.05,m.h-2,1.25,[90,130,140],MAT.glass);A.wbox(M,e,e.L/2-w/2-4,e.L/2+w/2+4,5.2,5.6,1.2,8,[240,238,232]);
          A.wpanel(M,e,e.L/2-w*.4,e.L/2+w*.4,m.h-1.6,m.h+.8,1.26,[240,180,60],MAT.emit)}
        A.parapet(M,m.poly,m.h-.05,1.2,.3,P.coping);A.roofKit(M,m.poly,m.h,R,{solar:true,ac:12,tanks:0,core:false});break}
      case'podium':case'tower':{A.parapet(M,m.poly,m.h-.05,1.2,.25,P.coping);if(!m.helipad)A.roofKit(M,m.poly,m.h,R,{ac:6,tanks:0,solar:m.role==='podium'});
        if(m.style==='health'){for(const e of E)for(let u=1.6;u<e.L-.4;u+=3.2)A.wbox(M,e,u-.1,u+.1,m.role==='podium'?.5:0,m.h-1.2,0,.45,[210,236,232],MAT.matte);if(m.role==='tower'){const fe=A.frontEdge(E,r.front);A.wpanel(M,fe,fe.L/2-3,fe.L/2+3,m.h-5,m.h-1.5,.5,[40,170,150],MAT.emit)}}break}
      case'shops':{const fe=A.frontEdge(E,r.front);A.wbox(M,fe,0,fe.L,3.2,3.45,0,2.2,[150,110,70]);A.crenel(M,m.poly,m.h,[226,206,168],.5,.5,.5,.22);if(m.windtower){const c=g2.centroid(m.poly);for(let k=0;k<4;k++){const a=k*Math.PI/2;M.box(c[0]+Math.cos(a)*1.32,c[1]+Math.sin(a)*1.32,.35,.35,m.h+1.5,m.h+4.2,a,[60,50,40],MAT.matte)}}break}
      case'canopy':{/* pumps + EV chargers under the canopy */const ob=g2.obb(m.poly),c=g2.centroid(m.poly);for(let k=-2;k<=2;k++){const u=(ob.u0+ob.u1)/2+k*(ob.u1-ob.u0)/5.5,v=(ob.v0+ob.v1)/2;const p=[u*ob.ux-v*ob.uz,u*ob.uz+v*ob.ux];M.box(p[0],p[1],.5,.3,0,1.8,Math.atan2(ob.uz,ob.ux),[240,240,238],MAT.matte);M.box(p[0],p[1],.35,.31,1.2,1.7,Math.atan2(ob.uz,ob.ux),[40,150,90],MAT.screen)}break}
      default:A.parapet(M,m.poly,(m.y0||0)+m.h-.05,.8,.2,P.coping)}}
  /* boundary walls / fences with gates */
  for(const w of r.walls||[]){const pl=w.pl;for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);const segs=[[0,L]];
      if(i===w.frontEdge&&w.gates)for(const gt of w.gates){/* gates are defined in site-local s; map from the edge midpoint */const u=L/2-gt.s;for(let k=segs.length-1;k>=0;k--){const [s0,s1]=segs[k];if(u+gt.w/2<=s0||u-gt.w/2>=s1)continue;segs.splice(k,1);if(u-gt.w/2>s0)segs.push([s0,u-gt.w/2]);if(u+gt.w/2<s1)segs.push([u+gt.w/2,s1])}}
      for(const [s0,s1] of segs){const p0=[a[0]+dx/L*s0,a[1]+dz/L*s0],p1=[a[0]+dx/L*s1,a[1]+dz/L*s1];if(w.kind==='fence'){M.panel(p0[0],p0[1],p1[0],p1[1],0,.5,[222,216,204],MAT.matte);M.panel(p0[0],p0[1],p1[0],p1[1],.5,w.h,[70,74,80],MAT.facade);const nP=Math.floor((s1-s0)/3);for(let k=0;k<=nP;k++){const t=k/Math.max(1,nP);M.box(p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t,.06,.06,0,w.h+.1,0,[60,64,70],MAT.metal)}}
        else M.box((p0[0]+p1[0])/2,(p0[1]+p1[1])/2,(s1-s0)/2,.15,0,w.h,Math.atan2(dz,dx),[224,210,184],MAT.matte)}}}
  /* entrances: signage monolith with the facility name colour + bollards */
  for(const en of r.entrances||[]){if(en.kind!=='main')continue;const p=[en.p[0]+en.dir[0]*6,en.p[1]+en.dir[1]*6];const yaw=Math.atan2(en.dir[1],en.dir[0])+Math.PI/2;M.box(p[0]+Math.cos(yaw)*5,p[1]+Math.sin(yaw)*5,1.3,.3,0,2.4,yaw,[240,236,226],MAT.matte);M.box(p[0]+Math.cos(yaw)*5+en.dir[0]*.31,p[1]+Math.sin(yaw)*5+en.dir[1]*.31,1.1,.02,1.6,2.2,yaw,[46,120,160],MAT.screen)}};

function groundL0(M,g,r,R){const q=g.poly,ob=g2.obb(q),c=g2.centroid(q);const L=ob.u1-ob.u0,W=ob.v1-ob.v0;const long=L>=W;const ux=long?ob.ux:-ob.uz,uz=long?ob.uz:ob.ux,a=Math.max(L,W),b=Math.min(L,W);
  const at=(s,t)=>[c[0]+ux*s-uz*t,c[1]+uz*s+ux*t];const line=(s0,t0,s1,t1,w=.12,y=.23)=>{M.layer=6;M.ribbon([at(s0,t0),at(s1,t1)],w,y,[244,244,240],MAT.paint);M.layer=0};
  switch(g.kind){
    case'parking':{/* stall lines, aisles, shade structures / solar carports, EV chargers, parked cars */const rows=Math.max(1,Math.floor(b/16));const cars=g.bus?0:.62;const CAR=SC.props.CARC;
      for(let rr=0;rr<rows;rr++){const t0=-b/2+rr*16;for(const side of [0,1]){const tt=side?t0+16-5.2:t0;const n=Math.floor((a-2)/2.6);for(let k=0;k<=n;k++){const s=-a/2+1+k*2.6;line(s,tt,s,tt+5.2,.1)}
          if(g.shade&&!g.bus){/* fabric sail shades (typical Gulf car parks) on steel posts */for(let s=-a/2+3;s<a/2-6;s+=10.4){const p0=at(s,tt+(side?5.2:0)),yaw=Math.atan2(uz,ux);M.cyl(p0[0],p0[1],.1,0,2.7,6,P.metal,MAT.metal);const m=at(s+5.2,tt+2.6);M.box(m[0],m[1],5.2,2.8,2.6,2.75,yaw,g.ev?[40,58,96]:[240,236,226],g.ev?MAT.glass:MAT.matte)}}
          for(let k=0;k<n;k++){if(R()>cars)continue;const s=-a/2+2.3+k*2.6,p=at(s,tt+2.6);SC.props.car(M,p[0],p[1],Math.atan2(uz,ux)+Math.PI/2,SC.pick(R,CAR),g.police&&R()<.6?'police':null)}}}
      if(g.bus){for(let k=0;k<Math.floor(a/5);k++){const p=at(-a/2+2.5+k*5,0);SC.props.bus(M,p[0],p[1],Math.atan2(uz,ux)+Math.PI/2,true)}}
      if(g.ev){for(let k=0;k<g.ev;k++){const p=at(-a/2+2+k*2.6,-b/2+.4);SC.props.evCharger(M,p[0],p[1],Math.atan2(uz,ux))}}break}
    case'field':{if(g.sport==='football'){line(-a/2+1,-b/2+1,a/2-1,-b/2+1);line(-a/2+1,b/2-1,a/2-1,b/2-1);line(-a/2+1,-b/2+1,-a/2+1,b/2-1);line(a/2-1,-b/2+1,a/2-1,b/2-1);line(0,-b/2+1,0,b/2-1);
        const cc=[];for(let k=0;k<=24;k++){const t=k/24*Math.PI*2;cc.push(at(Math.cos(t)*Math.min(9,b*.2),Math.sin(t)*Math.min(9,b*.2)))}M.layer=6;M.ribbon(cc,.12,.23,[244,244,240],MAT.paint);M.layer=0;
        for(const sd of [-1,1]){const s=sd*(a/2-1);line(s,-b*.2,s-sd*a*.12,-b*.2);line(s-sd*a*.12,-b*.2,s-sd*a*.12,b*.2);line(s-sd*a*.12,b*.2,s,b*.2);SC.props.goal(M,at(s,0),Math.atan2(uz,ux)+(sd>0?Math.PI:0))}}break}
    case'court':{line(-a/2+1,-b/2+1,a/2-1,-b/2+1);line(-a/2+1,b/2-1,a/2-1,b/2-1);line(-a/2+1,-b/2+1,-a/2+1,b/2-1);line(a/2-1,-b/2+1,a/2-1,b/2-1);line(0,-b/2+1,0,b/2-1);
      if(g.sport==='basketball'){for(const sd of [-1,1]){const p=at(sd*(a/2-1.5),0);M.cyl(p[0],p[1],.08,0,3.4,6,P.metal,MAT.metal);M.box(p[0],p[1],.05,.9,3,3.9,Math.atan2(uz,ux),[240,240,240],MAT.matte)}}
      if(g.sport==='tennis'){const p0=at(0,-b/2+1),p1=at(0,b/2-1);M.panel(p0[0],p0[1],p1[0],p1[1],0,1,[240,240,240],MAT.facade)}break}
    case'track':{break}
    case'plaza':case'courtyard':{/* planters, benches, shade, lights, info screen */const n=Math.min(10,Math.floor(g2.absArea(q)/260));for(let k=0;k<n;k++){const p=[c[0]+(R()-.5)*L*.7,c[1]+(R()-.5)*W*.7];if(!g2.pip(p[0],p[1],q))continue;if(k%3===0)SC.props.planter(M,p[0],p[1],R);else if(k%3===1)SC.props.bench(M,p[0],p[1],R()*6.28);else SC.props.lamp(M,p[0],p[1])}
      if(g.flags){for(let k=0;k<g.flags;k++){const p=at((k-(g.flags-1)/2)*4,0);M.cyl(p[0],p[1],.08,0,14,6,P.metal,MAT.metal);M.box(p[0]+.8,p[1],.8,.03,12.4,13.9,0,[[200,30,40],[240,240,240],[40,140,70]][k%3],MAT.matte)}}
      if(g.canopy){for(let s=-a/2+2;s<a/2-2;s+=8){const p=at(s,0);M.cyl(p[0],p[1],.12,0,4,6,P.metal,MAT.metal)}M.prism([at(-a/2+1,-2.5),at(a/2-1,-2.5),at(a/2-1,2.5),at(-a/2+1,2.5)],4,4.2,[236,226,206],MAT.matte,{bottom:true})}
      if(g.seating){for(let k=0;k<6;k++){const p=[c[0]+(R()-.5)*L*.6,c[1]+(R()-.5)*W*.6];if(g2.pip(p[0],p[1],q))SC.props.cafeTable(M,p[0],p[1],R)}}
      SC.props.infoScreen(M,c[0]+ux*L*.3,c[1]+uz*L*.3,Math.atan2(uz,ux));break}
    case'drop':{if(g.canopy){for(const s of [-a/2+2,a/2-2])for(const t of [-b/2+1,b/2-1]){const p=at(s,t);M.cyl(p[0],p[1],.25,0,5,8,[230,230,226],MAT.metal)}M.prism([at(-a/2,-b/2),at(a/2,-b/2),at(a/2,b/2),at(-a/2,b/2)],5,5.5,[244,244,240],MAT.matte,{bottom:true})}
      for(let s=-a/2+3;s<a/2-3;s+=7){if(R()<.5){const p=at(s,0);SC.props.car(M,p[0],p[1],Math.atan2(uz,ux),SC.pick(R,SC.props.CARC),r.kind==='hospital'&&R()<.3?'taxi':null)}}break}
    case'ambulance':{line(-a/2+1,-b/2+1,a/2-1,-b/2+1,.2);for(let s=-a/2+3;s<a/2-3;s+=5){const p=at(s,0);SC.props.ambulance(M,p[0],p[1],Math.atan2(uz,ux)+Math.PI/2)}M.prism([at(-a/2,-b/2),at(a/2,-b/2),at(a/2,b/2),at(-a/2,b/2)],4.5,4.9,[244,244,240],MAT.matte,{bottom:true});break}
    case'playground':SC.props.playground(M,c,Math.min(L,W),R);break;
    case'amphitheatre':{for(let k=0;k<5;k++){const rr=6+k*2.2,pts=[];for(let j=0;j<=18;j++){const t=Math.PI*(.1+.8*j/18);pts.push([c[0]+Math.cos(t)*rr,c[1]+Math.sin(t)*rr])}M.ribbon(pts,2,.25+k*.45,[222,212,192],MAT.matte);}break}
    case'apron':case'yard':break;
    case'garden':case'lawn':break;
    case'pool':{const e=A.edges(q);for(const x of e)A.wbox(M,x,0,x.L,0,.35,0,.6,[236,236,232]);for(let k=0;k<4;k++){const p=[c[0]+(R()-.5)*L,c[1]+(R()-.5)*W];if(!g2.pip(p[0],p[1],q))SC.props.umbrella(M,p[0],p[1])}break}}}
F.lod1Kinds=['mosque_grand','mosque','masjid','school','kindergarten','university','college','hospital','clinic','police_hq','police','fire','mall','souq','hotel','civic','post','fuel','parking','library','cultural','museum','community','stadium','sportshall','substation','reservoir','depot','park','park_central'];
for(const k of F.lod1Kinds){A.lod1kinds[k]=F.lod1;A.kinds[k]=F.lod0}
})(typeof window!=='undefined'?window:globalThis);
