/* ============================================================================
   SMART CITY — core library (namespace SC)
   ----------------------------------------------------------------------------
   Shared, dependency-free helpers used by every city module:
     SC.rng            deterministic PRNG (mulberry32)
     SC.m4 / SC.v3     small matrix / vector maths for the WebGL engine
     SC.g2             2D planar geometry (polygons, segments, offsets,
                       clipping, triangulation, simplification)
     SC.Grid           uniform spatial hash for fast neighbour queries
   All city coordinates are metres: x → east, z → south (map "y"), y → up.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC=root.SC||{};

/* ------------------------------------------------------------ random ---- */
SC.rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
SC.hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
SC.pick=(R,a)=>a[Math.floor(R()*a.length)%a.length];
SC.clamp=(v,a,b)=>v<a?a:v>b?b:v;
SC.lerp=(a,b,t)=>a+(b-a)*t;
SC.smooth=(a,b,x)=>{const t=SC.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};

/* ------------------------------------------------------------ vectors --- */
const v3=SC.v3={
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  scale:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]),norm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}};

/* ------------------------------------------------ 4x4 matrices (col-major) */
const m4=SC.m4={
  ident:()=>{const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m},
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o},
  persp(fovy,asp,n,f){const t=1/Math.tan(fovy/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o},
  ortho(l,r,b,t,n,f){const o=new Float32Array(16);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o},
  lookAt(e,c,up){const z=v3.norm(v3.sub(e,c)),x=v3.norm(v3.cross(up,z)),y=v3.cross(z,x),o=new Float32Array(16);
    o[0]=x[0];o[4]=x[1];o[8]=x[2];o[1]=y[0];o[5]=y[1];o[9]=y[2];o[2]=z[0];o[6]=z[1];o[10]=z[2];o[12]=-v3.dot(x,e);o[13]=-v3.dot(y,e);o[14]=-v3.dot(z,e);o[15]=1;return o},
  invert(m){const a=m,o=new Float32Array(16);
    const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
      b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
    let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;if(!det)return null;det=1/det;
    o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*det;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*det;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*det;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*det;
    o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*det;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*det;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*det;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*det;
    o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*det;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*det;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*det;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*det;
    o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*det;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*det;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*det;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*det;return o},
  xform(m,p){const x=p[0],y=p[1],z=p[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];return[(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w,w]}};

/* ------------------------------------------------------ 2D geometry ----- */
const g2=SC.g2={};
g2.area=p=>{let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=(p[j][0]-p[i][0])*(p[j][1]+p[i][1]);return a/2};  /* >0 : CCW in x-right/z-down screen sense */
g2.absArea=p=>Math.abs(g2.area(p));
g2.ccw=p=>g2.area(p)<0?p.slice().reverse():p;       /* normalised winding used by the whole library */
g2.centroid=p=>{let A=0,cx=0,cz=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],c=a[0]*b[1]-b[0]*a[1];A+=c;cx+=(a[0]+b[0])*c;cz+=(a[1]+b[1])*c}if(Math.abs(A)<1e-9){let x=0,z=0;for(const q of p){x+=q[0];z+=q[1]}return[x/p.length,z/p.length]}return[cx/(3*A),cz/(3*A)]};
g2.bbox=p=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of p){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<z0)z0=q[1];if(q[1]>z1)z1=q[1]}return[x0,z0,x1,z1]};
g2.pip=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
g2.perim=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=Math.hypot(b[0]-a[0],b[1]-a[1])}return s};
g2.dSeg=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1e-9,t=SC.clamp(((x-a[0])*dx+(z-a[1])*dz)/l2,0,1);return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};
g2.dPolyEdge=(x,z,p)=>{let m=1e9;for(let i=0;i<p.length;i++){const d=g2.dSeg(x,z,p[i],p[(i+1)%p.length]);if(d<m)m=d}return m};
g2.dPoly=(x,z,p)=>g2.pip(x,z,p)?0:g2.dPolyEdge(x,z,p);
g2.dPolyline=(x,z,pl)=>{let m=1e9;for(let i=0;i<pl.length-1;i++){const d=g2.dSeg(x,z,pl[i],pl[i+1]);if(d<m)m=d}return m};
/* segment intersection → [t,u] parameters or null */
g2.segX=(a,b,c,d)=>{const r0=b[0]-a[0],r1=b[1]-a[1],s0=d[0]-c[0],s1=d[1]-c[1],den=r0*s1-r1*s0;if(Math.abs(den)<1e-12)return null;const t=((c[0]-a[0])*s1-(c[1]-a[1])*s0)/den,u=((c[0]-a[0])*r1-(c[1]-a[1])*r0)/den;return[t,u]};
g2.segHit=(a,b,c,d)=>{const r=g2.segX(a,b,c,d);return r&&r[0]>1e-9&&r[0]<1-1e-9&&r[1]>1e-9&&r[1]<1-1e-9};
g2.overlap=(A,B)=>{for(let i=0;i<A.length;i++)for(let j=0;j<B.length;j++)if(g2.segHit(A[i],A[(i+1)%A.length],B[j],B[(j+1)%B.length]))return true;
  return g2.pip(A[0][0],A[0][1],B)||g2.pip(B[0][0],B[0][1],A)};
/* Sutherland–Hodgman: keep the side where (q-o)·n >= 0 */
g2.clipHalf=(poly,ox,oz,nx,nz)=>{const out=[],n=poly.length;for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],da=(a[0]-ox)*nx+(a[1]-oz)*nz,db=(b[0]-ox)*nx+(b[1]-oz)*nz;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return out};
g2.clipConvex=(poly,K)=>{const kc=g2.centroid(K);let r=poly;for(let i=0;i<K.length&&r.length>=3;i++){const a=K[i],b=K[(i+1)%K.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1e-9)continue;let nx=-dz/l,nz=dx/l;if((kc[0]-a[0])*nx+(kc[1]-a[1])*nz<0){nx=-nx;nz=-nz}r=g2.clipHalf(r,a[0],a[1],nx,nz)}return r};
/* polygon minus convex polygon → outside pieces */
g2.subConvex=(poly,K)=>{const kc=g2.centroid(K);let rest=poly;const out=[];for(let i=0;i<K.length&&rest.length>=3;i++){const a=K[i],b=K[(i+1)%K.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1e-9)continue;let nx=-dz/l,nz=dx/l;if((kc[0]-a[0])*nx+(kc[1]-a[1])*nz<0){nx=-nx;nz=-nz}
    const o=g2.clipHalf(rest,a[0],a[1],-nx,-nz);if(o.length>=3&&g2.absArea(o)>.5)out.push(o);rest=g2.clipHalf(rest,a[0],a[1],nx,nz)}return out};
/* inset (negative = outset) a CCW polygon by a per-edge distance; convex-safe,
   concave polygons are handled when the offset is small relative to features */
g2.inset=(p,d)=>{p=g2.ccw(p);const n=p.length,L=[];for(let i=0;i<n;i++){const a=p[i],b=p[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,di=typeof d==='function'?d(i):d;
    /* inward normal for positive-area winding */const nx=dz/l*-1,nz=dx/l;L.push({a:[a[0]+nx*-di*-1,a[1]+nz*-di*-1],u:[dx/l,dz/l]})}
  /* L[i] line through edge i shifted inward */
  const out=[];for(let i=0;i<n;i++){const A=L[(i+n-1)%n],B=L[i];const den=A.u[0]*B.u[1]-A.u[1]*B.u[0];if(Math.abs(den)<1e-6){out.push(B.a.slice());continue}
    const t=((B.a[0]-A.a[0])*B.u[1]-(B.a[1]-A.a[1])*B.u[0])/den;out.push([A.a[0]+A.u[0]*t,A.a[1]+A.u[1]*t])}
  return out};
g2.insetOK=(p,d)=>{const q=g2.inset(p,d);if(q.length<3||g2.area(q)<=0)return null;
  /* reject self-intersections */for(let i=0;i<q.length;i++)for(let j=i+2;j<q.length;j++){if(i===0&&j===q.length-1)continue;if(g2.segHit(q[i],q[(i+1)%q.length],q[j],q[(j+1)%q.length]))return null}
  const A=g2.absArea(p);if(g2.absArea(q)>A)return null;return q};
g2.hull=pts=>{const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[];for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}const up=[];for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}lo.pop();up.pop();return lo.concat(up)};
g2.obb=p=>{const h=g2.hull(p);let best=null;for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1e-6)continue;const ux=dx/l,uz=dz/l;let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const q of h){const u=q[0]*ux+q[1]*uz,v=-q[0]*uz+q[1]*ux;if(u<u0)u0=u;if(u>u1)u1=u;if(v<v0)v0=v;if(v>v1)v1=v}const A=(u1-u0)*(v1-v0);if(!best||A<best.A)best={A,ux,uz,u0,u1,v0,v1}}return best};
g2.simplify=(p,tol,closed=true)=>{if(p.length<4)return p;const dp=(a,b)=>{let md=0,mi=-1;for(let i=a+1;i<b;i++){const d=g2.dSeg(p[i][0],p[i][1],p[a],p[b]);if(d>md){md=d;mi=i}}return md>tol?[...dp(a,mi).slice(0,-1),...dp(mi,b)]:[p[a],p[b]]};
  if(!closed)return dp(0,p.length-1);let far=0,fd=0;for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1]);if(d>fd){fd=d;far=i}}const r=[...dp(0,far).slice(0,-1),...dp(far,p.length-1)];return r.length>=3?r:p};
/* Chaikin smoothing for organic shorelines / paths */
g2.chaikin=(p,iter=2,closed=true)=>{let q=p;for(let k=0;k<iter;k++){const o=[];const n=q.length;if(!closed)o.push(q[0]);for(let i=0;i<(closed?n:n-1);i++){const a=q[i],b=q[(i+1)%n];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}if(!closed)o.push(q[n-1]);q=o}return q};
g2.plLen=pl=>{let s=0;for(let i=1;i<pl.length;i++)s+=Math.hypot(pl[i][0]-pl[i-1][0],pl[i][1]-pl[i-1][1]);return s};
/* point + tangent at arc-length s along a polyline */
g2.plAt=(pl,s)=>{for(let i=1;i<pl.length;i++){const a=pl[i-1],b=pl[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(s<=l||i===pl.length-1){const t=l?SC.clamp(s/l,0,1):0;return{p:[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],d:l?[(b[0]-a[0])/l,(b[1]-a[1])/l]:[1,0]}}s-=l}return{p:pl[pl.length-1],d:[1,0]}};
/* offset an open polyline sideways (positive = left of travel in x/z-down) */
g2.plOffset=(pl,o)=>{const n=pl.length,out=[];for(let i=0;i<n;i++){const a=pl[Math.max(0,i-1)],b=pl[Math.min(n-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;let m=1;
    if(i>0&&i<n-1){const d1=[pl[i][0]-pl[i-1][0],pl[i][1]-pl[i-1][1]],d2=[pl[i+1][0]-pl[i][0],pl[i+1][1]-pl[i][1]],l1=Math.hypot(...d1)||1,l2=Math.hypot(...d2)||1,c=(d1[0]*d2[0]+d1[1]*d2[1])/l1/l2;m=1/Math.max(.35,Math.sqrt((1+c)/2))}
    out.push([pl[i][0]+dz*o*m,pl[i][1]-dx*o*m])}return out};
g2.resample=(pl,step)=>{const L=g2.plLen(pl),n=Math.max(1,Math.round(L/step)),o=[];for(let k=0;k<=n;k++)o.push(g2.plAt(pl,L*k/n).p);return o};
/* ear-clipping triangulation of a simple polygon (no holes) → index triples */
g2.triangulate=p=>{const n=p.length;if(n<3)return[];const idx=[];for(let i=0;i<n;i++)idx.push(i);if(g2.area(p)<0)idx.reverse();const tris=[];let guard=0;
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  while(idx.length>3&&guard++<n*n){let ear=false;for(let i=0;i<idx.length;i++){const i0=idx[(i+idx.length-1)%idx.length],i1=idx[i],i2=idx[(i+1)%idx.length],a=p[i0],b=p[i1],c=p[i2];
      if(cross(a,b,c)<=1e-12)continue;let inside=false;for(const j of idx){if(j===i0||j===i1||j===i2)continue;const q=p[j];if(cross(a,b,q)>=0&&cross(b,c,q)>=0&&cross(c,a,q)>=0){inside=true;break}}
      if(inside)continue;tris.push(i0,i1,i2);idx.splice(i,1);ear=true;break}if(!ear)break}
  if(idx.length===3)tris.push(idx[0],idx[1],idx[2]);return tris};
/* rectangle helper in a local frame (origin, unit axis u, perpendicular v) */
g2.frame=(o,ux,uz)=>{const P=(u,v)=>[o[0]+ux*u-uz*v,o[1]+uz*u+ux*v];return{P,rect:(u0,u1,v0,v1)=>[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)],toLocal:(x,z)=>[(x-o[0])*ux+(z-o[1])*uz,-(x-o[0])*uz+(z-o[1])*ux]}};

/* ------------------------------------------------------ spatial hash ---- */
SC.Grid=function(cs){const m=new Map(),k=(i,j)=>i*262147+j;return{
  add(b,it){for(let i=Math.floor(b[0]/cs);i<=Math.floor(b[2]/cs);i++)for(let j=Math.floor(b[1]/cs);j<=Math.floor(b[3]/cs);j++){const kk=k(i,j);let l=m.get(kk);if(!l)m.set(kk,l=[]);l.push(it)}},
  q(b){const i0=Math.floor(b[0]/cs),i1=Math.floor(b[2]/cs),j0=Math.floor(b[1]/cs),j1=Math.floor(b[3]/cs);if(i0===i1&&j0===j1)return m.get(k(i0,j0))||[];const s=new Set();for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const l=m.get(k(i,j));if(l)for(const it of l)s.add(it)}return[...s]},
  qp(x,z,r){return this.q([x-r,z-r,x+r,z+r])}}};
})(typeof window!=='undefined'?window:globalThis);
