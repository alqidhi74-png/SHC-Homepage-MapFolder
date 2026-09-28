/* ============================================================================
   SMART CITY — MESH BUILDER (SC.Mesh) + material codes (SC.MAT)
   ----------------------------------------------------------------------------
   Collects indexed triangles into growable typed arrays in the exact vertex
   layout the WebGL engine uploads (36 bytes / vertex):
     pos  3×f32   world position (x, y up, z)
     nrm  4×i8    normal
     col  4×u8    rgb + material code (SC.MAT)
     uv   2×f32   wall-local metres (u along wall, v height) — drives the
                  procedural façade / paver / grass shaders
     prm  4×u8    material parameters (façade pattern, bay, floor h, ratio)
                  — for flat surfaces prm[3] is a depth layer (decals)
     fid  1×f32   feature id → per-feature state (timeline, highlight …)
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,g2=SC.g2;
const MAT=SC.MAT={matte:0,facade:1,glass:2,emit:3,water:4,grass:5,asphalt:6,paver:7,leaf:8,metal:9,paint:10,sand:11,tile:12,screen:13,blink:14,sky:15};
/* façade patterns (prm[0]) */
const PAT=SC.PAT={none:0,punched:1,ribbon:2,curtain:3,slots:4,shop:5,lattice:6,bands:7,vertical:8,grid:9};

SC.Mesh=function(capV=4096){
  let n=0,ni=0,cv=capV,ci=capV*2;
  let pos=new Float32Array(cv*3),nrm=new Int8Array(cv*4),col=new Uint8Array(cv*4),uv=new Float32Array(cv*2),prm=new Uint8Array(cv*4),fid=new Float32Array(cv),idx=new Uint32Array(ci);
  const growV=()=>{cv*=2;const a=new Float32Array(cv*3);a.set(pos);pos=a;const b=new Int8Array(cv*4);b.set(nrm);nrm=b;const c=new Uint8Array(cv*4);c.set(col);col=c;const d=new Float32Array(cv*2);d.set(uv);uv=d;const e=new Uint8Array(cv*4);e.set(prm);prm=e;const f=new Float32Array(cv);f.set(fid);fid=f};
  const growI=()=>{ci*=2;const a=new Uint32Array(ci);a.set(idx);idx=a};
  const M={F:-1,layer:0,P:[0,0,0,0],
    get count(){return n},get icount(){return ni},
    v(x,y,z,nx,ny,nz,c,mat,u,w){if(n>=cv)growV();const i=n++;pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;nrm[i*4]=nx*127;nrm[i*4+1]=ny*127;nrm[i*4+2]=nz*127;
      col[i*4]=c[0];col[i*4+1]=c[1];col[i*4+2]=c[2];col[i*4+3]=mat||0;uv[i*2]=u||0;uv[i*2+1]=w||0;const p=M.P;prm[i*4]=p[0];prm[i*4+1]=p[1];prm[i*4+2]=p[2];prm[i*4+3]=M.layer||p[3];fid[i]=M.F;return i},
    tri(a,b,c){if(ni+3>ci)growI();idx[ni++]=a;idx[ni++]=b;idx[ni++]=c},
    /* planar quad from 4 points (counter-clockwise seen from outside) */
    quad(p0,p1,p2,p3,c,mat,uvs){/* normal from the diagonals: robust for degenerate (triangular) quads */let n_=SC.v3.cross(SC.v3.sub(p2,p0),SC.v3.sub(p3,p1));const nl=Math.hypot(n_[0],n_[1],n_[2]);n_=nl>1e-9?[n_[0]/nl,n_[1]/nl,n_[2]/nl]:[0,1,0];const u=uvs||[[0,0],[1,0],[1,1],[0,1]];
      const a=M.v(p0[0],p0[1],p0[2],n_[0],n_[1],n_[2],c,mat,u[0][0],u[0][1]),b=M.v(p1[0],p1[1],p1[2],n_[0],n_[1],n_[2],c,mat,u[1][0],u[1][1]),cc=M.v(p2[0],p2[1],p2[2],n_[0],n_[1],n_[2],c,mat,u[2][0],u[2][1]),d=M.v(p3[0],p3[1],p3[2],n_[0],n_[1],n_[2],c,mat,u[3][0],u[3][1]);M.tri(a,b,cc);M.tri(a,cc,d)},
    /* vertical wall from (x0,z0)→(x1,z1), y0..y1, outward normal on the right of travel in x/z-down space
       uOff: running wall length for continuous façade patterns */
    wall(x0,z0,x1,z1,y0,y1,c,mat,uOff=0){const dx=x1-x0,dz=z1-z0,L=Math.hypot(dx,dz)||1,nx=dz/L,nz=-dx/L;
      const a=M.v(x0,y0,z0,nx,0,nz,c,mat,uOff,y0),b=M.v(x1,y0,z1,nx,0,nz,c,mat,uOff+L,y0),cc=M.v(x1,y1,z1,nx,0,nz,c,mat,uOff+L,y1),d=M.v(x0,y1,z0,nx,0,nz,c,mat,uOff,y1);M.tri(a,cc,b);M.tri(a,d,cc)},
    /* flat polygon at height y facing up (or down) */
    flat(poly,y,c,mat,down){const t=g2.triangulate(poly);if(!t.length)return;const base=n,ny=down?-1:1;for(const p of poly)M.v(p[0],y,p[1],0,ny,0,c,mat,p[0],p[1]);
      for(let i=0;i<t.length;i+=3){/* triangulate() returns CCW in math sense = clockwise seen from +y in x/z-down → flip for up-facing */if(down)M.tri(base+t[i],base+t[i+1],base+t[i+2]);else M.tri(base+t[i],base+t[i+2],base+t[i+1])}},
    /* extruded prism: walls + optional cap; wallFn(i) may override colour/material/prm per edge */
    prism(poly,y0,y1,c,mat,o={}){poly=g2.ccw(poly);let u=0;const n_=poly.length;
      for(let i=0;i<n_;i++){const a=poly[i],b=poly[(i+1)%n_];
        /* ccw (positive area) polygons have the outside on the right of travel when z points down → wall() normal is outward */
        if(o.wallP)M.P=o.wallP(i,a,b)||M.P;M.wall(a[0],a[1],b[0],b[1],y0,y1,o.wallC?o.wallC(i):c,o.wallM!=null?o.wallM:mat,o.cont?u:0);u+=Math.hypot(b[0]-a[0],b[1]-a[1])}
      if(o.prmTop)M.P=o.prmTop;if(o.top!==false)M.flat(poly,y1,o.topC||c,o.topM!=null?o.topM:(mat===MAT.facade?MAT.matte:mat));if(o.bottom)M.flat(poly,y0,c,mat,true)},
    /* oriented box: centre (cx,cz), half extents, yaw about y */
    box(cx,cz,hw,hd,y0,y1,yaw,c,mat,o={}){const cs=Math.cos(yaw),sn=Math.sin(yaw);const P=(a,b)=>[cx+cs*a-sn*b,cz+sn*a+cs*b];M.prism([P(-hw,-hd),P(hw,-hd),P(hw,hd),P(-hw,hd)],y0,y1,c,mat,o)},
    /* axis box in a local frame {o,u:[ux,uz]} with a,b along/across */
    fbox(fr,a0,a1,b0,b1,y0,y1,c,mat,o){const P=(a,b)=>[fr.o[0]+fr.u[0]*a-fr.u[1]*b,fr.o[1]+fr.u[1]*a+fr.u[0]*b];M.prism([P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1)],y0,y1,c,mat,o)},
    cyl(cx,cz,r,y0,y1,seg,c,mat,o={}){const top=o.top!==false;let u=0;const r1=o.r1!=null?o.r1:r;for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;
        const x0=cx+Math.cos(a0)*r,z0=cz+Math.sin(a0)*r,x1=cx+Math.cos(a1)*r,z1=cz+Math.sin(a1)*r,X0=cx+Math.cos(a0)*r1,Z0=cz+Math.sin(a0)*r1,X1=cx+Math.cos(a1)*r1,Z1=cz+Math.sin(a1)*r1;
        const am=(a0+a1)/2,nx=Math.cos(am),nz=Math.sin(am),L=Math.hypot(x1-x0,z1-z0);
        const A=M.v(x0,y0,z0,nx,0,nz,c,mat,u,y0),B=M.v(x1,y0,z1,nx,0,nz,c,mat,u+L,y0),C=M.v(X1,y1,Z1,nx,0,nz,c,mat,u+L,y1),D=M.v(X0,y1,Z0,nx,0,nz,c,mat,u,y1);M.tri(A,B,C);M.tri(A,C,D);u+=L}
      if(top){const b=n;M.v(cx,y1,cz,0,1,0,o.topC||c,o.topM!=null?o.topM:mat,0,0);for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;M.v(cx+Math.cos(a)*r1,y1,cz+Math.sin(a)*r1,0,1,0,o.topC||c,o.topM!=null?o.topM:mat,0,0)}for(let i=0;i<seg;i++)M.tri(b,b+2+i,b+1+i)}},
    /* dome / onion / hemisphere: profile(t) returns radius factor for t∈[0,1] of height */
    dome(cx,cz,r,y0,h,seg,rings,c,mat,profile){const P=profile||(t=>Math.sqrt(Math.max(0,1-t*t)));const rows=[];
      for(let j=0;j<=rings;j++){const t=j/rings,rr=r*P(t),y=y0+h*t,t2=Math.min(1,t+.02),t1=Math.max(0,t-.02),dP=(P(t2)-P(t1))/(t2-t1)*r;
        /* profile tangent (dρ,dy)=(dP,h) → outward normal (h,-dP) */let nr=h,ny=-dP;const l=Math.hypot(nr,ny)||1;nr/=l;ny/=l;if(j===rings){nr=0;ny=1}const row=[];
        for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);row.push(M.v(cx+ca*rr,y,cz+sa*rr,ca*nr,ny,sa*nr,c,mat,a*r,y))}rows.push(row)}
      for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const a=rows[j][i],b=rows[j][i+1],cc=rows[j+1][i+1],d=rows[j+1][i];M.tri(a,cc,b);M.tri(a,d,cc)}},
    /* flat ribbon along a polyline at height y (roads, markings, paths) */
    ribbon(pl,w,y,c,mat,o={}){const L=pl.length;if(L<2)return;const off0=o.off||0;const left=g2.plOffset(pl,w/2+off0),right=g2.plOffset(pl,-w/2+off0);let s=0;
      for(let i=0;i<L-1;i++){const sl=Math.hypot(pl[i+1][0]-pl[i][0],pl[i+1][1]-pl[i][1]);
        const a=M.v(left[i][0],y,left[i][1],0,1,0,c,mat,s,0),b=M.v(right[i][0],y,right[i][1],0,1,0,c,mat,s,w),cc=M.v(right[i+1][0],y,right[i+1][1],0,1,0,c,mat,s+sl,w),d=M.v(left[i+1][0],y,left[i+1][1],0,1,0,c,mat,s+sl,0);
        /* keep the up-facing winding whatever the polyline direction */M.tri(a,cc,b);M.tri(a,d,cc);s+=sl}},
    /* dashed ribbon (lane lines) */
    dashes(pl,w,y,c,on,off,s0=0,s1=null){const L=g2.plLen(pl),end=s1==null?L:s1;for(let s=s0;s+on<=end;s+=on+off){const a=g2.plAt(pl,s),b=g2.plAt(pl,s+on);M.ribbon([a.p,b.p],w,y,c,MAT.paint)}},
    /* double-sided vertical quad (fences, glass rails, signs) */
    panel(x0,z0,x1,z1,y0,y1,c,mat){M.wall(x0,z0,x1,z1,y0,y1,c,mat);M.wall(x1,z1,x0,z0,y0,y1,c,mat)},
    finish(){return{n,ni,pos:pos.subarray(0,n*3),nrm:nrm.subarray(0,n*4),col:col.subarray(0,n*4),uv:uv.subarray(0,n*2),prm:prm.subarray(0,n*4),fid:fid.subarray(0,n),idx:idx.subarray(0,ni)}},
    reset(){n=0;ni=0}};
  return M};
/* colour helpers */
SC.col={mix:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],mul:(a,k)=>[Math.min(255,a[0]*k),Math.min(255,a[1]*k),Math.min(255,a[2]*k)],
  jit:(a,R,k)=>a.map(v=>Math.max(0,Math.min(255,v+(R()-.5)*k)))};
})(typeof window!=='undefined'?window:globalThis);
