/* ============================================================================
   SMART CITY — LIFE SIMULATION (SC.Sim)
   ----------------------------------------------------------------------------
   Vehicles
     • drive on real lane centre lines (right-hand traffic), per class speed
     • car-following: keep a speed-dependent gap to the vehicle ahead
     • signalised junctions cycle two phase groups (green / amber / red);
       vehicles stop at the stop line on red
     • roundabouts: vehicles circulate counter-clockwise on the ring lane
     • turns follow smooth Bézier connectors through the junction
     • buses serve the smart bus stops (dwell), police & ambulances patrol
   People
     • walk the footpaths (both sides of every street), park paths, the wadi
       promenade; gather at entrances, plazas, parks, bus stops and cafés
   Everything is written into instanced layers each frame, only near the
   camera, so thousands of agents cost a handful of draw calls.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,clamp=SC.clamp;
const side=(pl,o)=>g2.plOffset(pl,-o);
SC.Sim=function(plan,opts={}){
  const R=SC.rng(31337);const T=()=>(root.performance?performance.now():Date.now())/1000;
  /* ---------------- lanes ---------------- */
  const lanes=new Map();   /* key e.id|dir|k → {pl,L,cum,e,dir,k,end:node,start:node} */
  const lane=(e,dir,k)=>{const key=e.id+'|'+dir+'|'+k;let l=lanes.get(key);if(l)return l;const core=e.core;if(!core)return null;const T_=dir>0?core:core.slice().reverse();const off=e.R.median/2+e.R.laneW*(k+.5);const pl=side(T_,off);const cum=[0];for(let i=1;i<pl.length;i++)cum.push(cum[i-1]+Math.hypot(pl[i][0]-pl[i-1][0],pl[i][1]-pl[i-1][1]));
    l={key,pl,cum,L:cum[cum.length-1],e,dir,k,end:dir>0?e.b:e.a,start:dir>0?e.a:e.b,cars:[]};lanes.set(key,l);return l};
  const at=(l,s)=>{const c=l.cum;let i=1;while(i<c.length-1&&c[i]<s)i++;const a=l.pl[i-1],b=l.pl[i],t=clamp((s-c[i-1])/((c[i]-c[i-1])||1),0,1);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[1]-a[1],b[0]-a[0])]};
  /* ---------------- signals ---------------- */
  for(const n of plan.nodes){if(n.ctrl!=='signals')continue;const ref=n.arms[0].d;n.arms.forEach(a=>a.grp=Math.abs(a.d[0]*ref[0]+a.d[1]*ref[1])>.6?0:1);n.phase=R()*40}
  const green=(n,arm,t)=>{if(n.ctrl!=='signals')return true;const cyc=(t+n.phase)%40;const g=cyc<18?0:cyc<20?-1:cyc<38?1:-1;return g===arm.grp};
  /* ---------------- vehicles ---------------- */
  const V=[];const drivable=plan.edges.filter(e=>e.core&&g2.plLen(e.core)>12);const byCls={};for(const e of drivable)(byCls[e.cls]=byCls[e.cls]||[]).push(e);
  const pickEdge=()=>{const r=R();const c=r<.34?'art':r<.55?'ring':r<.78?'col':r<.86?'drv':'loc';const L=byCls[c]&&byCls[c].length?byCls[c]:drivable;return L[Math.floor(R()*L.length)]};
  const spawn=(type)=>{const e=pickEdge(),dir=R()<.5?1:-1,k=Math.floor(R()*e.R.lanes);const l=lane(e,dir,k);if(!l)return;const v={type,l,s:R()*l.L,v:0,vmax:e.R.speed*(.8+R()*.3),conn:null,cs:0,dwell:0,col:SC.pick(R,SC.props.CARC),id:V.length};l.cars.push(v);V.push(v)};
  const nCars=opts.cars||900;for(let i=0;i<nCars;i++)spawn(i%40===0?'taxi':'car');for(let i=0;i<34;i++)spawn('bus');for(let i=0;i<6;i++)spawn('ambulance');for(let i=0;i<10;i++)spawn('police');
  /* choose the next lane at the end node */
  function nextLane(v){const n=v.l.end,inE=v.l.e;const arms=n.arms||[];let opts2=arms.filter(a=>a.e!==inE&&a.e.core&&g2.plLen(a.e.core)>12);if(!opts2.length)opts2=arms.filter(a=>a.e.core);if(!opts2.length)return null;
    const inArm=arms.find(a=>a.e===inE)||{d:[0,0]};const w=opts2.map(a=>{const straight=-(a.d[0]*inArm.d[0]+a.d[1]*inArm.d[1]);let s=1+Math.max(0,straight)*2+(a.e.cls===inE.cls?1:0)+(v.type==='bus'&&a.e.cls!=='loc'?3:0)+(v.type==='bus'&&a.e.cls==='loc'?-.8:0);return Math.max(.1,s)});
    let r=R()*w.reduce((x,y)=>x+y,0),pick=opts2[0];for(let i=0;i<opts2.length;i++){r-=w[i];if(r<=0){pick=opts2[i];break}}
    const dir=pick.atA?1:-1;const k=Math.min(pick.e.R.lanes-1,v.l.k);return{arm:pick,l:lane(pick.e,dir,k)}}
  function connector(v,nl){const a=v.l.pl[v.l.pl.length-1],b=nl.l.pl[0],n=v.l.end;let pts;
    if(n.ctrl==='roundabout'){const rr=(n.ri+n.R)/2;const a0=Math.atan2(a[1]-n.z,a[0]-n.x),a1=Math.atan2(b[1]-n.z,b[0]-n.x);let d=a1-a0;while(d>=0)d-=Math.PI*2;if(d>-.3)d-=Math.PI*2;
      /* counter-clockwise on the map = decreasing angle with z pointing south */const k=Math.max(6,Math.ceil(-d/.2));pts=[a];for(let i=1;i<k;i++){const t=a0+d*i/k;pts.push([n.x+Math.cos(t)*rr,n.z+Math.sin(t)*rr])}pts.push(b)}
    else{const da=v.l.pl.length>1?(()=>{const p=v.l.pl[v.l.pl.length-2];return[a[0]-p[0],a[1]-p[1]]})():[0,0];const db=nl.l.pl.length>1?[nl.l.pl[1][0]-b[0],nl.l.pl[1][1]-b[1]]:[0,0];
      const den=da[0]*db[1]-da[1]*db[0];let c=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(Math.abs(den)>1e-3){const t=((b[0]-a[0])*db[1]-(b[1]-a[1])*db[0])/den;if(t>0&&t<80)c=[a[0]+da[0]*t,a[1]+da[1]*t]}
      pts=[];for(let i=0;i<=10;i++){const t=i/10,u=1-t;pts.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]])}}
    const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{pl:pts,cum,L:cum[cum.length-1],next:nl}}
  const stops=new Map();for(const s of plan.busStops||[]){const key=s.e.id+'|'+(s.side>0?1:-1);(stops.get(key)||stops.set(key,[]).get(key)).push(s)}
  function stepVehicles(dt,t){for(const l of lanes.values())if(l.cars.length>1)l.cars.sort((a,b)=>a.s-b.s);
    for(const v of V){if(v.conn){v.cs+=Math.max(4,v.v*.8)*dt;if(v.cs>=v.conn.L){const nl=v.conn.next;v.conn=null;v.l.cars.splice(v.l.cars.indexOf(v),1);v.l=nl.l;v.s=0;v.l.cars.push(v)}continue}
      if(v.dwell>0){v.dwell-=dt;v.v=0;continue}
      /* leader in the same lane */const cars=v.l.cars;const i=cars.indexOf(v);const lead=cars[i+1];let target=v.vmax;
      if(lead){const gap=lead.s-v.s-5.5;target=Math.min(target,Math.max(0,(gap-2)/1.4))}
      /* signal / junction ahead */const toEnd=v.l.L-v.s;const n=v.l.end,arm=(n.arms||[]).find(a=>a.e===v.l.e);
      if(n.ctrl==='signals'&&arm&&!green(n,arm,t)&&toEnd<45)target=Math.min(target,Math.max(0,(toEnd-6.5)/1.6));
      if((n.ctrl==='priority'||n.ctrl==='roundabout')&&toEnd<25)target=Math.min(target,Math.max(4,toEnd*.5));
      if(v.type==='bus'){const bs=stops.get(v.l.e.id+'|'+v.l.dir);if(bs)for(const st of bs){const ss=v.l.dir>0?st.s:v.l.L-st.s;if(v.s<ss&&ss-v.s<2.5&&!v.served){v.dwell=7+R()*6;v.served=st;break}}}
      v.v+=clamp(target-v.v,-6*dt,2.2*dt);v.s+=v.v*dt;
      if(v.s>=v.l.L-.2){const nl=nextLane(v);if(!nl||!nl.l){v.s=v.l.L-.2;v.v=0;const back=lane(v.l.e,-v.l.dir,0);if(back){v.l.cars.splice(v.l.cars.indexOf(v),1);v.l=back;v.s=0;back.cars.push(v)}continue}v.served=null;v.conn=connector(v,nl);v.cs=0}}}
  /* ---------------- people ---------------- */
  const P=[];const walkLines=(plan.walks||[]).filter(w=>w.L>20).concat((plan.paths||[]).map(p=>({pl:p.pl,L:g2.plLen(p.pl),park:1})));
  const CLOTH=[[244,244,240],[240,240,236],[236,236,232],[30,30,34],[24,24,28],[38,36,40],[70,110,160],[160,60,60],[90,130,90],[200,170,120],[120,90,140],[230,230,226]];
  const nW=opts.walkers||2600;const wsum=walkLines.reduce((s,w)=>s+w.L*(w.park?2.2:1),0);
  for(let i=0;i<nW&&walkLines.length;i++){let r=R()*wsum,w=walkLines[0];for(const q of walkLines){r-=q.L*(q.park?2.2:1);if(r<=0){w=q;break}}const cum=[0];for(let k=1;k<w.pl.length;k++)cum.push(cum[k-1]+Math.hypot(w.pl[k][0]-w.pl[k-1][0],w.pl[k][1]-w.pl[k-1][1]));
    P.push({w,cum,s:R()*w.L,dir:R()<.5?1:-1,sp:1.05+R()*.45,off:(R()-.5)*1.4,col:SC.pick(R,CLOTH),sc:R()<.12?.62:.94+R()*.12,ph:R()*6})}
  for(const sp of plan.spots||[]){for(let k=0;k<sp.n;k++){const a=R()*Math.PI*2,d=Math.sqrt(R())*sp.r;const x=sp.x+Math.cos(a)*d,z=sp.z+Math.sin(a)*d;P.push({spot:sp,x,z,yaw:R()*6.28,col:SC.pick(R,CLOTH),sc:R()<.15?.62:.94+R()*.12,ph:R()*6,sit:sp.kind==='sit',idle:R()*4,wx:x,wz:z})}}
  function stepPeople(dt){for(const p of P){if(p.w){p.s+=p.dir*p.sp*dt;if(p.s<0||p.s>p.w.L){p.dir*=-1;p.s=clamp(p.s,0,p.w.L)}}
      else if(!p.sit){p.idle-=dt;if(p.idle<0){p.idle=3+R()*8;const a=R()*6.28,d=R()*p.spot.r;p.tx=p.spot.x+Math.cos(a)*d;p.tz=p.spot.z+Math.sin(a)*d}
        if(p.tx!=null){const dx=p.tx-p.x,dz=p.tz-p.z,l=Math.hypot(dx,dz);if(l>.3){p.x+=dx/l*1.1*dt;p.z+=dz/l*1.1*dt;p.yaw=Math.atan2(dz,dx);p.moving=true}else p.moving=false}}}}
  /* ---------------- instanced output ---------------- */
  const MODELS={car:'car',taxi:'taxi',bus:'bus',ambulance:'ambulance',police:'police'};
  const out={V,P,lanes,hidden:null,
    step(dt){const t=T();stepVehicles(Math.min(dt,.1),t);stepPeople(Math.min(dt,.1))},
    /* write visible agents into the engine layers; returns counts */
    emit(E,Ls,eye,radiusV=1500,radiusP=520){const cnt={};for(const k in Ls)cnt[k]=0;const push=(k,x,y,z,yaw,sx,sy,sz,ph,r,g,b,anim)=>{const l=Ls[k];if(!l||cnt[k]>=l.cap)return;const o=cnt[k]*12,d=l.data;d[o]=x;d[o+1]=y;d[o+2]=z;d[o+3]=yaw;d[o+4]=sx;d[o+5]=sy;d[o+6]=sz;d[o+7]=ph;d[o+8]=r;d[o+9]=g;d[o+10]=b;d[o+11]=anim;cnt[k]++};
      const ex=eye[0],ez=eye[2];
      for(const v of V){let x,z,yaw;if(v.conn){const c=v.conn;let i=1;while(i<c.cum.length-1&&c.cum[i]<v.cs)i++;const a=c.pl[i-1],b=c.pl[i],t=clamp((v.cs-c.cum[i-1])/((c.cum[i]-c.cum[i-1])||1),0,1);x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t;yaw=Math.atan2(b[1]-a[1],b[0]-a[0])}else{[x,z,yaw]=at(v.l,v.s)}
        if(Math.abs(x-ex)>radiusV||Math.abs(z-ez)>radiusV)continue;const k=MODELS[v.type]||'car';const c=k==='car'?v.col:[255,255,255];push(k,x,0,z,yaw,1,1,1,0,c[0]/255,c[1]/255,c[2]/255,0)}
      for(const p of P){let x,z,yaw,moving=true;if(p.w){const c=p.cum;let i=1;while(i<c.length-1&&c[i]<p.s)i++;const a=p.w.pl[i-1],b=p.w.pl[i];const t=clamp((p.s-c[i-1])/((c[i]-c[i-1])||1),0,1);const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;x=a[0]+dx*t-dz/l*p.off;z=a[1]+dz*t+dx/l*p.off;yaw=Math.atan2(dz,dx)+(p.dir<0?Math.PI:0)}
        else{if(p.spot.bi!=null&&out.hidden&&out.hidden(p.spot.bi))continue;x=p.x;z=p.z;yaw=p.yaw;moving=!!p.moving}
        if(Math.abs(x-ex)>radiusP||Math.abs(z-ez)>radiusP)continue;push('person',x,p.sit?-.35:.2,z,yaw,p.sc,p.sit?.75*p.sc:p.sc,p.sc,p.ph,p.col[0]/255,p.col[1]/255,p.col[2]/255,moving&&!p.sit?(p.w?p.sp:1.1):0)}
      for(const k in Ls)if(Ls[k])E.setLayer(Ls[k],cnt[k]);return cnt}};return out};
})(typeof window!=='undefined'?window:globalThis);
