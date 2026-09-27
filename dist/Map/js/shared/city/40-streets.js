/* ============================================================================
   SMART CITY — STREET ENGINEERING (SC.streets)
   ----------------------------------------------------------------------------
   Turns the plan's road graph into engineered street geometry data:
     • per-junction trims so no sidewalk / lane marking enters a crossing
     • curb returns (Bezier fillets) sized by road class and junction angle
     • junction surfaces, roundabouts (circulating carriageway + landscaped
       island), cul-de-sac turning circles
     • per-edge cross-section offsets: lanes, parking bays, cycle track,
       tree verge, footpath; lane centre lines for traffic (right-hand)
     • zebra crossings, stop / yield lines, turn arrows, signal & sign sites
     • pedestrian network (footpath centre lines + crossings)
   All positions obey:  building → setback → footpath → verge/lights/trees →
   cycle track → curb → parking/lanes → markings.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2,clamp=SC.clamp;
const RADIUS={ring:14,art:12,col:9,drv:7,loc:6};
function subPl(pl,s0,s1){const out=[];const L=g2.plLen(pl);s0=clamp(s0,0,L);s1=clamp(s1,0,L);if(s1-s0<.5)return null;out.push(g2.plAt(pl,s0).p);let s=0;for(let i=1;i<pl.length;i++){s+=Math.hypot(pl[i][0]-pl[i-1][0],pl[i][1]-pl[i-1][1]);if(s>s0+.01&&s<s1-.01)out.push(pl[i])}out.push(g2.plAt(pl,s1).p);return out}
const bez=(a,c,b,n=8)=>{const o=[];for(let k=0;k<=n;k++){const t=k/n,u=1-t;o.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]])}return o};
const lineX=(p,d,q,e)=>{const den=d[0]*e[1]-d[1]*e[0];if(Math.abs(den)<1e-4)return null;const t=((q[0]-p[0])*e[1]-(q[1]-p[1])*e[0])/den;return[p[0]+d[0]*t,p[1]+d[1]*t]};
const P=(d)=>[-d[1],d[0]];   /* right-hand side of travel (x east, z south) */

SC.streets={build(plan){
  const E=plan.edges,N=plan.nodes;
  /* ---- outgoing directions at every node ---- */
  for(const e of E){e.L=g2.plLen(e.pl);e.trimA=0;e.trimB=0}
  const outDir=(e,n)=>{const pl=e.a===n?e.pl:e.pl.slice().reverse();const q=g2.plAt(pl,Math.min(12,e.L*.3)).p;const dx=q[0]-n.x,dz=q[1]-n.z,l=Math.hypot(dx,dz)||1;return[dx/l,dz/l]};
  for(const n of N){n.arms=n.e.map(e=>({e,d:outDir(e,n),atA:e.a===n})).map(a=>Object.assign(a,{ang:Math.atan2(a.d[1],a.d[0]),cw:a.e.R.cw/2,row:a.e.R.row/2,p:P(a.d)})).sort((x,y)=>x.ang-y.ang);
    /* a two-arm node that is not a straight continuation is an engineered corner */
    if(n.ctrl==='bend'&&n.arms.length===2){const d=n.arms[0].d[0]*n.arms[1].d[0]+n.arms[0].d[1]*n.arms[1].d[1];if(d>-.94)n.ctrl='corner'}}
  /* ---- trims & corners ---- */
  for(const n of N){const A=n.arms,k=A.length;n.corners=[];
    if(n.ctrl==='roundabout'){n.R=n.rr;n.ri=Math.max(6,n.rr-(n.top==='col'?7.5:10));for(const a of A){a.trim=n.R+2}}
    else if(n.ctrl==='culdesac'){for(const a of A)a.trim=Math.max(0,n.rr-2)}
    else if(k<=1){for(const a of A)a.trim=0}
    else if(n.ctrl==='bend'){/* same road continuing: meet at the node */for(const a of A)a.trim=0;
      /* sharp bends of different widths still get a small corner */}
    else{for(let i=0;i<k;i++){const a=A[i];let t=0;for(const j of [(i+1)%k,(i-1+k)%k]){if(j===i)continue;const b=A[j];const side=j===(i+1)%k?1:-1;if(a.d[0]*b.d[0]+a.d[1]*b.d[1]<-.88)continue;/* straight-through partner: no conflict */
          /* where a's curb on the side facing b meets b's curb facing a */const pa=[n.x+a.p[0]*a.cw*side,n.z+a.p[1]*a.cw*side],pb=[n.x-b.p[0]*b.cw*side,n.z-b.p[1]*b.cw*side];const X=lineX(pa,a.d,pb,b.d);
          if(X){const s=(X[0]-pa[0])*a.d[0]+(X[1]-pa[1])*a.d[1];t=Math.max(t,s)}
          /* also clear b's carriageway entirely */const cosang=a.d[0]*b.d[0]+a.d[1]*b.d[1];const sinang=Math.sqrt(Math.max(1e-3,1-cosang*cosang));t=Math.max(t,b.cw/sinang+a.cw*Math.abs(cosang)/sinang*.0)}
        a.trim=clamp(t+RADIUS[a.e.cls]*.8,4,Math.max(4,a.e.L*.42))}
      for(let i=0;i<k;i++){const a=A[i],b=A[(i+1)%k];
        const La=[n.x+a.d[0]*a.trim+a.p[0]*a.cw,n.z+a.d[1]*a.trim+a.p[1]*a.cw],Rb=[n.x+b.d[0]*b.trim-b.p[0]*b.cw,n.z+b.d[1]*b.trim-b.p[1]*b.cw];
        const C=lineX(La,a.d,Rb,b.d)||[(La[0]+Rb[0])/2,(La[1]+Rb[1])/2];const curb=bez(La,C,Rb,10);
        const Lo=[n.x+a.d[0]*a.trim+a.p[0]*a.row,n.z+a.d[1]*a.trim+a.p[1]*a.row],Ro=[n.x+b.d[0]*b.trim-b.p[0]*b.row,n.z+b.d[1]*b.trim-b.p[1]*b.row];
        const Co=lineX(Lo,a.d,Ro,b.d)||[(Lo[0]+Ro[0])/2,(Lo[1]+Ro[1])/2];const outer=bez(Lo,Co,Ro,10);
        /* reflex corner (>180°) → no fillet into the block, straight chord */
        const turn=(a.d[0]*b.d[1]-a.d[1]*b.d[0]);n.corners.push({a,b,curb,outer,reflex:false})}
      /* junction surface: mouths + curb returns */
      const poly=[];for(let i=0;i<k;i++){const a=A[i];poly.push([n.x+a.d[0]*a.trim-a.p[0]*a.cw,n.z+a.d[1]*a.trim-a.p[1]*a.cw]);const c=n.corners.find(q=>q.a===a);if(c)poly.push(...c.curb.slice(0,-1));else poly.push([n.x+a.d[0]*a.trim+a.p[0]*a.cw,n.z+a.d[1]*a.trim+a.p[1]*a.cw])}
      n.surface=poly}
    for(const a of A){if(a.atA)a.e.trimA=a.trim;else a.e.trimB=a.trim}}
  /* ---- per-edge cross-section ---- */
  for(const e of E){const R=e.R;e.core=subPl(e.pl,e.trimA,e.L-e.trimB);e.full=e.pl;
    /* offsets from the centre line (positive = right of a→b) */
    e.x={cw:R.cw/2,median:R.median/2,cyc0:R.cw/2,cyc1:R.cw/2+R.cyc,verge0:R.cw/2+R.cyc,verge1:R.cw/2+R.cyc+Math.min(1.6,R.sw*.35),foot:R.cw/2+R.cyc+R.sw*.62,row:R.row/2,park:R.park};
    /* lane centre lines per direction (right-hand traffic) */
    e.lanes=[];for(const dir of [1,-1])for(let k=0;k<R.lanes;k++){const off=R.median/2+R.park*0+R.laneW*(k+.5)+(R.park&&false?R.park:0);e.lanes.push({dir,k,off:dir*(off)})}
    if(R.park)for(const l of e.lanes)l.off=l.dir*(R.median/2+R.laneW*(l.k+.5));
    /* crossings at each end that meets a real junction */
    e.xings=[];for(const end of ['a','b']){const n=e[end];if(!n||n.ctrl==='bend'||n.ctrl==='corner'||n.ctrl==='culdesac')continue;const tr=end==='a'?e.trimA:e.trimB;if(e.L-e.trimA-e.trimB<14)continue;
      const s=end==='a'?tr+(n.ctrl==='roundabout'?4:1.2):e.L-tr-(n.ctrl==='roundabout'?4:1.2),w=4;e.xings.push({end,s0:end==='a'?s:s-w,s1:end==='a'?s+w:s,ctrl:n.ctrl,n})}}
  /* ---- signal heads / signs / camera sites ---- */
  const SIG=[],SIGN=[];
  for(const n of N){if(!['signals','priority','roundabout'].includes(n.ctrl))continue;for(const a of n.arms){const e=a.e;if(e.L<30)continue;const s=a.trim+(n.ctrl==='roundabout'?2:0);
      /* approach lanes are on the -p side of the outgoing direction; pole on that curb */const pos=[n.x+a.d[0]*(s-1)-a.p[0]*(a.cw+1.2),n.z+a.d[1]*(s-1)-a.p[1]*(a.cw+1.2)];
      const face=[-a.d[0],-a.d[1]];
      if(n.ctrl==='signals')SIG.push({x:pos[0],z:pos[1],face,n,arm:a,reach:Math.min(a.cw*.9,e.R.lanes*e.R.laneW+1)});
      else{const top=a.e.cls===n.top;if(n.ctrl==='roundabout')SIGN.push({x:pos[0],z:pos[1],face,kind:'yield'});else if(!top&&!(n.second&&a.e.cls===n.second&&n.top===n.second))SIGN.push({x:pos[0],z:pos[1],face,kind:'stop'})}}}
  plan.signals=SIG;plan.signs=SIGN;
  /* ---- pedestrian network: footpath lines on both sides + crossings ---- */
  const WALK=[];for(const e of E){if(!e.core||e.bridge&&e.R.sw<3)continue;for(const sd of [1,-1]){const pl=g2.plOffset(e.core,sd*e.x.foot);WALK.push({pl,e,side:sd,L:g2.plLen(pl)})}}
  plan.walks=WALK;
  return plan}};
SC.streets.subPl=subPl;SC.streets.P=P;
})(typeof window!=='undefined'?window:globalThis);
