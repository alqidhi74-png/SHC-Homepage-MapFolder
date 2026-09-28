/* ============================================================================
   SMART CITY — PROPS, VEGETATION, VEHICLES, PEOPLE (SC.props)
   ----------------------------------------------------------------------------
   Low-poly but carefully proportioned models. Every function writes into a
   Mesh at a world position (static detail, LOD0) and the same functions
   produce the local-space models used by the instanced layers (moving
   traffic, pedestrians, distant trees).
   Smart-city furniture: smart light poles (LED head, sensor pod, Wi-Fi /
   camera modules), connected traffic signals, smart bus shelters with
   real-time screens, EV chargers, smart bins, environmental sensors,
   digital information kiosks, solar carports.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,MAT=SC.MAT,PAT=SC.PAT,col=SC.col;
const PR=SC.props={};
PR.CARC=[[240,240,238],[236,236,234],[200,202,206],[170,172,176],[40,42,46],[26,28,32],[120,124,130],[214,202,176],[150,30,34],[30,60,110],[60,72,60],[240,240,238]];
const box=(M,x,z,yaw,a0,a1,b0,b1,y0,y1,c,mat=MAT.matte)=>{const cs=Math.cos(yaw),sn=Math.sin(yaw);const P=(a,b)=>[x+cs*a-sn*b,z+sn*a+cs*b];M.P=[0,0,0,0];M.prism([P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1)],y0,y1,c,mat)};
/* tapered cabin: bottom rectangle at y0, top rectangle (inset) at y1 */
const cabin=(M,x,z,yaw,a0,a1,b,ta0,ta1,tb,y0,y1,c,mat)=>{const cs=Math.cos(yaw),sn=Math.sin(yaw);const P=(a,bb,y)=>[x+cs*a-sn*bb,y,z+sn*a+cs*bb];
  const B=[P(a0,-b,y0),P(a1,-b,y0),P(a1,b,y0),P(a0,b,y0)],T=[P(ta0,-tb,y1),P(ta1,-tb,y1),P(ta1,tb,y1),P(ta0,tb,y1)];
  for(let i=0;i<4;i++){const j=(i+1)%4;M.quad(B[j],B[i],T[i],T[j],c,mat)}M.quad(T[0],T[1],T[2],T[3],[40,42,46],MAT.metal)};

/* ------------------------------------------------------------ vehicles -- */
PR.car=(M,x,z,yaw,c,kind)=>{const L=2.25,W=.9;const body=kind==='police'?[244,244,244]:kind==='taxi'?[240,240,236]:c;
  box(M,x,z,yaw,-L,L,-W,W,.28,.95,body,MAT.metal);cabin(M,x,z,yaw,-1.3,1.05,W-.04,-1,.55,W-.2,.95,1.5,[40,56,66],MAT.glass);
  for(const a of [-1.4,1.4])for(const b of [-W,W])box(M,x,z,yaw,a-.33,a+.33,b-.12,b+.12,0,.62,[24,24,26]);
  box(M,x,z,yaw,L-.05,L+.02,-W+.15,-W+.45,.62,.8,[255,244,210],MAT.emit);box(M,x,z,yaw,L-.05,L+.02,W-.45,W-.15,.62,.8,[255,244,210],MAT.emit);
  box(M,x,z,yaw,-L-.02,-L+.05,-W+.1,-W+.4,.65,.8,[220,30,30],MAT.emit);box(M,x,z,yaw,-L-.02,-L+.05,W-.4,W-.1,.65,.8,[220,30,30],MAT.emit);
  if(kind==='police'){box(M,x,z,yaw,-L,L,-W-.01,W+.01,.55,.72,[30,70,150]);box(M,x,z,yaw,-.2,.2,-.5,-.05,1.5,1.66,[30,90,255],MAT.blink);box(M,x,z,yaw,-.2,.2,.05,.5,1.5,1.66,[255,40,40],MAT.blink)}
  if(kind==='taxi'){box(M,x,z,yaw,-L,L,-W-.01,W+.01,.5,.62,[230,120,30]);box(M,x,z,yaw,-.3,.3,-.25,.25,1.5,1.7,[240,200,60],MAT.emit)}};
PR.truck=(M,x,z,yaw,kind)=>{const red=[200,32,30];box(M,x,z,yaw,-4.2,4.2,-1.25,1.25,.5,3.1,red,MAT.metal);box(M,x,z,yaw,2.2,4.2,-1.26,1.26,1.6,3,[50,60,70],MAT.glass);box(M,x,z,yaw,-4,1.8,-1.27,1.27,1.6,1.75,[240,240,236]);
  for(const a of [-3,-1.6,2.8])for(const b of [-1.2,1.2])box(M,x,z,yaw,a-.5,a+.5,b-.18,b+.18,0,1,[24,24,26]);box(M,x,z,yaw,1.6,2.8,-.9,.9,3.1,3.3,[40,120,255],MAT.blink);box(M,x,z,yaw,-3.8,1.2,-.4,.4,3.1,3.35,[190,190,192],MAT.metal)};
PR.ambulance=(M,x,z,yaw)=>{box(M,x,z,yaw,-3,3,-1.1,1.1,.4,2.8,[248,248,246],MAT.metal);box(M,x,z,yaw,1.6,3,-1.11,1.11,1.4,2.3,[50,60,70],MAT.glass);box(M,x,z,yaw,-3,3,-1.12,1.12,1.1,1.4,[220,40,40]);box(M,x,z,yaw,-2.9,1.5,-1.13,1.13,1.6,1.8,[60,150,90]);
  for(const a of [-2,2])for(const b of [-1,1])box(M,x,z,yaw,a-.4,a+.4,b-.15,b+.15,0,.8,[24,24,26]);box(M,x,z,yaw,1.2,1.8,-.8,.8,2.8,3,[255,50,50],MAT.blink)};
PR.bus=(M,x,z,yaw,parked)=>{const L=6,W=1.28;box(M,x,z,yaw,-L,L,-W,W,.35,3.2,[236,238,240],MAT.metal);box(M,x,z,yaw,-L+.4,L-.3,-W-.01,W+.01,1.3,2.6,[40,56,70],MAT.glass);box(M,x,z,yaw,-L,L,-W-.02,W+.02,.6,.9,[40,140,120]);
  box(M,x,z,yaw,L-.02,L+.01,-W+.2,W-.2,1,2.9,[40,56,70],MAT.glass);box(M,x,z,yaw,-L*.6,L*.4,-W*.8,W*.8,3.2,3.5,[40,58,96],MAT.glass);for(const a of [-L+1.6,L-1.8])for(const b of [-W,W])box(M,x,z,yaw,a-.5,a+.5,b-.16,b+.16,0,1,[24,24,26]);
  box(M,x,z,yaw,L-.05,L+.02,-.9,.9,3,3.15,[255,190,60],MAT.emit)};
/* ------------------------------------------------------------ vegetation */
PR.palm=(M,x,z,h,R,sc=1)=>{const tr=[118,96,72],lf=[76,112,50],lf2=[98,130,56];const r0=.32*sc,r1=.2*sc;M.P=[0,0,0,0];M.cyl(x,z,r0,0,h,8,tr,MAT.matte,{r1,top:false});
  /* bark rings */for(let y=.8;y<h-.8;y+=.9)M.cyl(x,z,r0*(1-y/h*.35)+.04,y,y+.14,8,col.mul(tr,.82),MAT.matte,{top:false});
  const n=14+Math.floor(R()*5);for(let k=0;k<n;k++){const a=k/n*Math.PI*2+R()*.3,up=k%3===0?.9:k%3===1?.35:-.1,L=(3.4+R()*1.2)*sc;const dx=Math.cos(a),dz=Math.sin(a);const seg=5;let prev=null;
    for(let s=0;s<=seg;s++){const t=s/seg,px=x+dx*L*t,pz=z+dz*L*t,py=h+.2+up*L*.55*t-L*.55*t*t*(1.3-up*.5);const w=(.55*(1-t)+.12)*sc;const lx=-dz*w,lz=dx*w;const cur=[[px+lx,py,pz+lz],[px-lx,py-.05,pz-lz]];
      if(prev){const c=(s+k)%2?lf:lf2;M.quad(prev[0],prev[1],cur[1],cur[0],c,MAT.leaf);M.quad(prev[1],prev[0],cur[0],cur[1],c,MAT.leaf)}prev=cur}}
  M.dome(x,z,.5*sc,h-.3,.8*sc,6,2,[150,110,60],MAT.matte)};
/* icosphere blob for canopies */
const ICO=(()=>{const t=(1+Math.sqrt(5))/2;let v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(a=>a/l)});
  const f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];return{v,f}})();
PR.blob=(M,x,y,z,rx,ry,rz,c,R,mat=MAT.leaf)=>{const base=M.count;const jit=R?(()=>.85+R()*.3):(()=>1);for(const p of ICO.v){const k=jit();M.v(x+p[0]*rx*k,y+p[1]*ry*k,z+p[2]*rz*k,p[0],p[1],p[2],c,mat,0,0)}for(const f of ICO.f)M.tri(base+f[0],base+f[2],base+f[1])};
PR.ghaf=(M,x,z,h,R,sc=1)=>{const tr=[104,84,66];M.P=[0,0,0,0];M.cyl(x,z,.28*sc,0,h*.45,6,tr,MAT.matte,{r1:.2*sc,top:false});
  for(let k=0;k<3;k++){const a=k*2.1+R();const bx=x+Math.cos(a)*1.4*sc,bz=z+Math.sin(a)*1.4*sc;M.quad([x,h*.4,z],[x,h*.45,z],[bx,h*.72,bz],[bx,h*.68,bz],tr,MAT.matte)}
  const c=[[110,128,84],[98,120,76],[122,138,90]];for(let k=0;k<5;k++){const a=k*1.3+R(),d=k?1.8*sc:0;PR.blob(M,x+Math.cos(a)*d,h*.78+R()*.5,z+Math.sin(a)*d,2.6*sc,1.1*sc,2.6*sc,c[k%3],R)}};
PR.tree=(M,x,z,h,R,sc=1,c)=>{const tr=[96,74,56];M.P=[0,0,0,0];M.cyl(x,z,.2*sc,0,h*.5,6,tr,MAT.matte,{r1:.14*sc,top:false});const cc=c||[74,112,46];
  for(let k=0;k<4;k++){const a=k*1.7+R(),d=k?1*sc:0;PR.blob(M,x+Math.cos(a)*d,h*.66+k*.35*sc,z+Math.sin(a)*d,1.9*sc,1.7*sc,1.9*sc,col.mul(cc,.85+k*.08),R)}};
PR.shrub=(M,x,z,R,c)=>PR.blob(M,x,.55,z,.9,.6,.9,c||[80,118,52],R);
PR.flowerbed=(M,poly,R)=>{M.P=[0,0,0,0];M.prism(poly,0,.45,[220,210,190],MAT.matte,{topC:SC.pick(R,[[200,60,90],[230,150,40],[180,60,160],[240,200,60]]),topM:MAT.leaf})};
/* ------------------------------------------------------------ furniture - */
PR.smartPole=(M,x,z,yaw,h=9,arm=1.8,o={})=>{const c=[70,74,80];M.P=[0,0,0,0];M.cyl(x,z,.14,0,h,8,c,MAT.metal,{r1:.09});M.cyl(x,z,.22,0,.9,8,c,MAT.metal);
  const hx=x+Math.cos(yaw)*arm,hz=z+Math.sin(yaw)*arm;box(M,(x+hx)/2,(z+hz)/2,yaw,-arm/2,arm/2,-.05,.05,h-.12,h,c,MAT.metal);box(M,hx,hz,yaw,-.45,.35,-.16,.16,h-.22,h-.02,c,MAT.metal);box(M,hx,hz,yaw,-.4,.3,-.13,.13,h-.26,h-.21,[255,244,214],MAT.emit);
  /* sensor pod (air quality / noise / occupancy) + optional Wi-Fi & camera modules */box(M,x,z,yaw,-.12,.12,-.12,.12,h*.62,h*.62+.35,[228,230,232],MAT.matte);box(M,x,z,yaw,.12,.14,-.06,.06,h*.62+.1,h*.62+.25,[60,200,140],MAT.emit);
  if(o.wifi)box(M,x,z,yaw,-.08,.08,-.08,.08,h+.02,h+.5,[236,236,236],MAT.matte);if(o.cam){box(M,x,z,yaw,.14,.5,-.08,.08,h*.8,h*.8+.16,[40,40,44],MAT.metal)}if(o.ev){box(M,x,z,yaw+Math.PI/2,-.2,.2,-.18,.02,.2,1.4,[240,240,238],MAT.matte);box(M,x,z,yaw+Math.PI/2,-.15,.15,-.19,-.17,.9,1.2,[40,170,120],MAT.screen)}};
PR.lamp=(M,x,z)=>{M.P=[0,0,0,0];M.cyl(x,z,.07,0,3.6,6,[70,74,80],MAT.metal);M.cyl(x,z,.22,3.6,3.95,8,[255,240,200],MAT.emit)};
PR.signal=(M,x,z,face,reach)=>{const c=[60,64,70];M.P=[0,0,0,0];M.cyl(x,z,.14,0,6.2,8,c,MAT.metal);const yaw=Math.atan2(face[1],face[0])+Math.PI/2;const ex=x+Math.cos(yaw)*reach,ez=z+Math.sin(yaw)*reach;
  box(M,(x+ex)/2,(z+ez)/2,yaw,-reach/2,reach/2,-.06,.06,5.8,5.95,c,MAT.metal);
  for(const t of [.45,.95]){const hx=x+Math.cos(yaw)*reach*t,hz=z+Math.sin(yaw)*reach*t;box(M,hx,hz,yaw,-.2,.2,-.18,.18,4.7,5.8,[30,30,32],MAT.metal);const fx=hx-face[0]*.19,fz=hz-face[1]*.19;
    box(M,fx,fz,yaw,-.12,.12,-.01,.01,5.4,5.62,[230,40,30],MAT.emit);box(M,fx,fz,yaw,-.12,.12,-.01,.01,4.8,5.02,[40,40,40],MAT.matte)}
  box(M,x,z,yaw,-.15,.15,-.15,.15,2.2,2.9,[30,30,32],MAT.metal);box(M,x-face[0]*.16,z-face[1]*.16,yaw,-.08,.08,-.01,.01,2.6,2.75,[255,90,60],MAT.emit);
  /* traffic camera */box(M,x,z,yaw,-.1,.35,-.08,.08,6.3,6.45,[236,236,236],MAT.matte)};
PR.sign=(M,x,z,face,kind)=>{M.P=[0,0,0,0];M.cyl(x,z,.05,0,2.4,6,[150,154,158],MAT.metal);const yaw=Math.atan2(face[1],face[0])+Math.PI/2;
  if(kind==='stop'){const n=8,y=2.5,r=.38,base=M.count;M.v(x-face[0]*.06,y,z-face[1]*.06,-face[0],0,-face[1],[200,30,30],MAT.matte,0,0);for(let i=0;i<=n;i++){const a=i/n*Math.PI*2+Math.PI/8;M.v(x-face[0]*.06+Math.cos(yaw)*Math.cos(a)*r,y+Math.sin(a)*r,z-face[1]*.06+Math.sin(yaw)*Math.cos(a)*r,-face[0],0,-face[1],[200,30,30],MAT.matte,0,0)}for(let i=0;i<n;i++){M.tri(base,base+1+i,base+2+i);M.tri(base,base+2+i,base+1+i)}}
  else{const y=2.2,base=M.count;const pts=[[0,.5],[-.45,-.28],[.45,-.28]];for(const p of pts)M.v(x-face[0]*.06+Math.cos(yaw)*p[0],y+p[1]*-1+.2,z-face[1]*.06+Math.sin(yaw)*p[0],-face[0],0,-face[1],[240,240,240],MAT.matte,0,0);M.tri(base,base+1,base+2);M.tri(base,base+2,base+1)}};
PR.busShelter=(M,x,z,yaw)=>{const c=[70,74,80];for(const a of [-2.3,2.3])box(M,x,z,yaw,a-.06,a+.06,-.7,-.58,0,2.6,c,MAT.metal);box(M,x,z,yaw,-2.6,2.6,-1,1,2.6,2.75,[210,214,216],MAT.matte);
  box(M,x,z,yaw,-2.5,2.5,-.72,-.68,.2,2.4,[160,200,210],MAT.glass);box(M,x,z,yaw,-2.2,.6,-.55,-.1,.45,.5,[150,110,70]);
  /* real-time arrivals screen + solar roof */box(M,x,z,yaw,1.2,2.2,-.66,-.6,1.2,1.9,[30,120,200],MAT.screen);box(M,x,z,yaw,-2.5,2.5,-.9,.9,2.76,2.8,[40,58,96],MAT.glass);box(M,x,z,yaw,2.7,2.8,-.05,.05,0,2.9,c,MAT.metal);box(M,x,z,yaw,2.62,2.88,-.3,.3,2.4,2.9,[40,140,120],MAT.emit)};
PR.bench=(M,x,z,yaw)=>{box(M,x,z,yaw,-.9,.9,-.25,.25,.42,.5,[150,110,70]);box(M,x,z,yaw,-.9,.9,.2,.26,.5,.9,[150,110,70]);for(const a of [-.75,.75])box(M,x,z,yaw,a-.05,a+.05,-.22,.22,0,.42,[70,74,80],MAT.metal)};
PR.bin=(M,x,z)=>{M.P=[0,0,0,0];M.cyl(x,z,.28,0,1.05,8,[70,110,90],MAT.metal);M.cyl(x,z,.3,1.05,1.12,8,[60,64,70],MAT.metal);box(M,x,z,0,.27,.3,-.06,.06,.8,.95,[60,200,140],MAT.emit)};
PR.sensor=(M,x,z)=>{M.P=[0,0,0,0];M.cyl(x,z,.06,0,3.2,6,[150,154,158],MAT.metal);box(M,x,z,0,-.18,.18,-.12,.12,3.2,3.6,[236,236,236]);M.cyl(x,z,.2,3.6,3.65,8,[40,58,96],MAT.glass)};
PR.infoScreen=(M,x,z,yaw)=>{box(M,x,z,yaw,-.55,.55,-.18,.18,0,2.3,[60,64,70],MAT.metal);box(M,x,z,yaw,-.46,.46,-.19,-.17,.8,2.1,[40,130,190],MAT.screen);box(M,x,z,yaw,-.46,.46,.17,.19,.8,2.1,[40,130,190],MAT.screen)};
PR.evCharger=(M,x,z,yaw)=>{box(M,x,z,yaw,-.25,.25,-.15,.15,0,1.5,[240,240,238]);box(M,x,z,yaw,-.18,.18,-.16,-.15,.9,1.3,[40,170,120],MAT.screen)};
PR.planter=(M,x,z,R)=>{M.P=[0,0,0,0];M.cyl(x,z,.9,0,.6,10,[214,204,184],MAT.matte,{topC:[84,62,44]});PR.blob(M,x,1.1,z,.8,.7,.8,[86,124,56],R)};
PR.cafeTable=(M,x,z,R)=>{M.P=[0,0,0,0];M.cyl(x,z,.4,.72,.76,10,[236,236,232],MAT.matte);M.cyl(x,z,.05,0,.72,6,[60,64,70],MAT.metal);for(let k=0;k<3;k++){const a=k*2.1+R();box(M,x+Math.cos(a)*.75,z+Math.sin(a)*.75,a,-.2,.2,-.2,.2,0,.45,[150,110,70])}
  M.cyl(x,z,.04,.76,2.4,6,[200,200,200],MAT.metal);M.cyl(x,z,1.3,2.3,2.45,8,SC.pick(R,[[236,226,206],[200,70,60],[46,120,160]]),MAT.matte,{r1:.05})};
PR.umbrella=(M,x,z)=>{M.P=[0,0,0,0];M.cyl(x,z,.04,0,2.3,6,[200,200,200],MAT.metal);M.cyl(x,z,1.4,2.2,2.5,8,[240,236,226],MAT.matte,{r1:.05});box(M,x+1,z,0,-.9,.9,-.3,.3,.3,.4,[240,240,236])};
PR.goal=(M,p,yaw)=>{const w=3.66,h=2.44;for(const b of [-w,w])box(M,p[0],p[1],yaw,-.06,.06,b-.06,b+.06,0,h,[250,250,250]);box(M,p[0],p[1],yaw,-.06,.06,-w,w,h-.06,h+.06,[250,250,250]);box(M,p[0],p[1],yaw,-1.8,-.06,-w,w,.02,h,[230,230,230],MAT.glass)};
PR.playground=(M,c,size,R)=>{/* slide tower, swings, climbing dome, shade sail */const s=Math.max(8,size*.35);M.P=[0,0,0,0];box(M,c[0],c[1],0,-1.2,1.2,-1.2,1.2,1.6,1.8,[240,160,40]);for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]])box(M,c[0],c[1],0,a*1.1-.08,a*1.1+.08,b*1.1-.08,b*1.1+.08,0,3.2,[40,130,190]);
  box(M,c[0],c[1],0,-1.3,1.3,-1.3,1.3,3.2,3.5,[220,60,60]);M.quad([c[0]+1.2,1.8,c[1]-.5],[c[0]+1.2,1.8,c[1]+.5],[c[0]+4.2,.1,c[1]+.5],[c[0]+4.2,.1,c[1]-.5],[240,200,60],MAT.metal);
  for(const a of [-s*.4,-s*.4+2.6])box(M,c[0],c[1]+s*.3,0,a-.06,a+.06,-.06,.06,0,2.6,[60,64,70],MAT.metal);box(M,c[0],c[1]+s*.3,0,-s*.4-.1,-s*.4+2.7,-.06,.06,2.5,2.6,[60,64,70],MAT.metal);
  M.dome(c[0]-s*.3,c[1]-s*.25,1.8,0,1.8,8,3,[80,160,90],MAT.metal);
  for(const [a,b] of [[-s*.5,-s*.5],[s*.5,-s*.5],[s*.5,s*.5],[-s*.5,s*.5]])M.cyl(c[0]+a,c[1]+b,.1,0,4.2,6,[200,200,200],MAT.metal);
  M.quad([c[0]-s*.5,4.2,c[1]-s*.5],[c[0]+s*.5,3.4,c[1]-s*.5],[c[0]+s*.5,4.2,c[1]+s*.5],[c[0]-s*.5,3.4,c[1]+s*.5],[244,240,230],MAT.matte);M.quad([c[0]-s*.5,3.4,c[1]+s*.5],[c[0]+s*.5,4.2,c[1]+s*.5],[c[0]+s*.5,3.4,c[1]-s*.5],[c[0]-s*.5,4.2,c[1]-s*.5],[244,240,230],MAT.matte)};
PR.fountain=(M,c,r)=>{M.P=[0,0,0,0];M.cyl(c[0],c[1],r,0,.55,24,[226,216,196],MAT.matte,{topC:[60,150,170],topM:MAT.water});M.cyl(c[0],c[1],r*.25,.55,1.5,12,[226,216,196],MAT.matte);M.cyl(c[0],c[1],r*.1,1.5,2.6,8,[210,236,246],MAT.glass)};
PR.monument=(M,c,R,kind)=>{/* Omani roundabout sculptures: coffee pot (dallah) or incense burner (mabkhara) — stylised */M.P=[0,0,0,0];const gold=[210,170,80];
  if(kind===0){M.cyl(c[0],c[1],2.2,0,1,12,[230,220,200],MAT.matte);M.dome(c[0],c[1],2,1,3.2,14,5,gold,MAT.metal,t=>.6+.4*Math.cos(t*2.2));M.cyl(c[0],c[1],.8,4.2,5.4,10,gold,MAT.metal,{r1:.5});M.dome(c[0],c[1],.9,5.4,1.2,10,3,gold,MAT.metal);M.quad([c[0]+1.8,3,c[1]],[c[0]+1.8,3.4,c[1]],[c[0]+3.6,5.4,c[1]],[c[0]+3.6,5.2,c[1]],gold,MAT.metal)}
  else{M.cyl(c[0],c[1],2.6,0,1.2,4,[230,220,200],MAT.matte);M.cyl(c[0],c[1],2,1.2,4.6,4,[196,160,110],MAT.matte,{r1:2.4});M.dome(c[0],c[1],1.6,4.6,1.6,4,2,gold,MAT.metal);M.cyl(c[0],c[1],.3,6.2,7.2,6,gold,MAT.metal)}};

/* --------------------------------------------------- instanced models ---- */
/* local frame: forward +x, up +y; limb codes in prm[0] drive the walk cycle */
PR.models={};
PR.buildModels=()=>{const mk=f=>{const M=SC.Mesh(512);M.F=-1;f(M);return M.finish()};const R=SC.rng(5);
  PR.models.car=mk(M=>PR.car(M,0,0,0,[255,255,255]));
  PR.models.taxi=mk(M=>PR.car(M,0,0,0,[240,240,236],'taxi'));
  PR.models.police=mk(M=>PR.car(M,0,0,0,[255,255,255],'police'));
  PR.models.bus=mk(M=>PR.bus(M,0,0,0));PR.models.ambulance=mk(M=>PR.ambulance(M,0,0,0));PR.models.fire=mk(M=>PR.truck(M,0,0,0,'fire'));
  PR.models.person=mk(M=>{const lim=(code,a0,a1,b0,b1,y0,y1,c)=>{M.P=[code,0,0,0];box(M,0,0,0,a0,a1,b0,b1,y0,y1,c)};
    lim(1,-.08,.08,-.18,-.04,0,.92,[255,255,255]);lim(2,-.08,.08,.04,.18,0,.92,[255,255,255]);lim(0,-.12,.12,-.21,.21,.9,1.46,[255,255,255]);
    lim(3,-.06,.06,-.3,-.22,.84,1.42,[255,255,255]);lim(4,-.06,.06,.22,.3,.84,1.42,[255,255,255]);M.P=[0,0,0,0];PR.blob(M,0,1.6,0,.11,.13,.11,[196,150,120],null,MAT.matte);M.P=[0,0,0,0]});
  /* far models are unit-height and scaled by the tree height per instance */
  PR.models.farPalm=mk(M=>{M.P=[0,0,0,0];M.cyl(0,0,.032,0,.96,5,[118,96,72],MAT.matte,{r1:.022,top:false});const lf=[80,116,52];
    for(let k=0;k<9;k++){const a=k/9*Math.PI*2+(k%2)*.2,dx=Math.cos(a),dz=Math.sin(a),L=.36+(k%3)*.04,w=.07;const b=M.count;
      M.v(0,1,0,0,1,0,lf,MAT.leaf,0,0);M.v(dx*L*.5-dz*w,1.02,dz*L*.5+dx*w,0,1,0,lf,MAT.leaf,0,0);M.v(dx*L,.84-(k%2)*.06,dz*L,0,1,0,lf,MAT.leaf,0,0);M.v(dx*L*.5+dz*w,1.02,dz*L*.5-dx*w,0,1,0,lf,MAT.leaf,0,0);
      M.tri(b,b+1,b+2);M.tri(b,b+2,b+1);M.tri(b,b+2,b+3);M.tri(b,b+3,b+2)}});
  PR.models.farTree=mk(M=>{M.cyl(0,0,.035,0,.5,5,[96,74,56],MAT.matte,{top:false});PR.blob(M,0,.68,0,.42,.3,.42,[255,255,255],null)});
};
})(typeof window!=='undefined'?window:globalThis);
