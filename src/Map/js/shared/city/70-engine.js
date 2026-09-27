/* ============================================================================
   SMART CITY — WEBGL2 ENGINE (SC.Engine)
   ----------------------------------------------------------------------------
   A compact renderer written for this project (no external libraries):
     • physically-motivated lighting: low golden-hour sun + sky hemisphere,
       linear-space shading, filmic tone curve, distance haze
     • 2048² sun shadow map fitted around the camera target (PCF)
     • procedural façade shader: windows / curtain walls / ribbon glazing /
       mashrabiya lattice / shopfronts drawn per pixel from wall-local
       metres, anti-aliased, with lit interiors and sky reflections
     • water, grass, paving, asphalt, glass, metal and emissive materials
     • static city geometry in chunks: LOD1 (always) + LOD0 detail meshes
       built on demand and cross-faded with screen-door dithering
     • instanced layers (trees, vehicles, people, street furniture) with
       per-instance transform, tint and walk / blink animation
     • per-feature state texture: construction progress (timeline),
       Future-Vision ghosts, hover / selection highlight, filter dimming,
       data-view tint — so thousands of buildings share one draw call
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC,m4=SC.m4,v3=SC.v3,clamp=SC.clamp;

const COMMON=`
uniform mat4 uVP;uniform mat4 uSVP;uniform vec3 uEye;uniform float uTime;uniform vec3 uSun;uniform sampler2D uState;uniform int uStateW;uniform float uDetail;uniform int uPass;uniform float uNight;
vec4 stateOf(float fid,int k){if(fid<0.)return k==0?vec4(1.,0.,0.,0.):vec4(0.);int i=int(fid+.5)*2+k;return texelFetch(uState,ivec2(i%uStateW,i/uStateW),0);}
`;
const VS=`#version 300 es
precision highp float;precision highp int;
${'__COMMON__'}
layout(location=0)in vec3 aPos;layout(location=1)in vec4 aNrm;layout(location=2)in vec4 aCol;layout(location=3)in vec2 aUV;layout(location=4)in vec4 aPrm;layout(location=5)in float aFid;
#ifdef INST
layout(location=6)in vec4 iA;layout(location=7)in vec4 iB;layout(location=8)in vec4 iC;
#endif
out vec3 vW;out vec3 vN;out vec4 vC;out vec2 vUV;out vec4 vP;out vec4 vS;out vec4 vSt;out vec4 vTint;out float vFid;
void main(){vec3 p=aPos;vec3 n=aNrm.xyz;vec4 st=stateOf(aFid,0);vec4 tn=stateOf(aFid,1);
#ifdef INST
  float limb=floor(aPrm.x*255.+.5);
  if(limb>0.5&&limb<4.5&&iC.w>0.){float piv=limb<2.5?.92:1.42;float sgn=(limb==1.||limb==4.)?1.:-1.;float a=sin(uTime*iC.w*7.+iB.w)*.55*sgn*(limb>2.5?.7:1.);
    float y=p.y-piv;p=vec3(p.x*cos(a)-y*sin(a),piv+p.x*sin(a)+y*cos(a),p.z);}
  p*=iB.xyz;float cy=cos(iA.w),sy=sin(iA.w);p=vec3(p.x*cy-p.z*sy,p.y,p.x*sy+p.z*cy)+iA.xyz;n=vec3(n.x*cy-n.z*sy,n.y,n.x*sy+n.z*cy);
  if(iC.w>0.)p.y+=abs(sin(uTime*iC.w*7.+iB.w))*.035;
#else
  /* buildings rise with construction progress (timeline) */ if(aFid>=0.){p.y*=uPass==1?1.:max(st.r,0.);}
#endif
  vW=p;vN=n;vC=aCol;vUV=aUV;vP=aPrm;vSt=st;vTint=tn;vFid=aFid;
#ifdef INST
  vC.rgb*=iC.rgb;
#endif
  vec4 cp=uVP*vec4(p,1.);float layer=floor(aPrm.w*255.+.5);float m=floor(aCol.a*255.+.5);
  if(m!=1.&&layer>0.)cp.z-=layer*6e-6*cp.w;
  gl_Position=cp;vS=uSVP*vec4(p+n*.15,1.);}
`;
const FS=`#version 300 es
precision highp float;precision highp int;precision highp sampler2DShadow;
${'__COMMON__'}
uniform sampler2DShadow uShadow;uniform float uShadowOn;uniform vec3 uFogC;uniform float uFogD;uniform vec3 uSkyTop;uniform vec3 uSkyHor;uniform vec3 uSunC;uniform float uExpo;uniform float uData;
in vec3 vW;in vec3 vN;in vec4 vC;in vec2 vUV;in vec4 vP;in vec4 vS;in vec4 vSt;in vec4 vTint;in float vFid;
out vec4 oC;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
vec3 lin(vec3 c){return pow(c,vec3(2.2));}
vec3 sky(vec3 d){float t=clamp(d.y,0.,1.);vec3 c=mix(uSkyHor,uSkyTop,pow(t,.55));float s=max(dot(d,uSun),0.);c+=uSunC*pow(s,90.)*2.+uSunC*pow(s,6.)*.22;return c;}
float shadowAt(){if(uShadowOn<.5)return 1.;vec3 s=vS.xyz/vS.w*.5+.5;if(s.x<0.||s.y<0.||s.x>1.||s.y>1.||s.z>1.)return 1.;float b=.0012;float r=0.;vec2 px=vec2(1./2048.);
  r+=texture(uShadow,vec3(s.xy,s.z-b));r+=texture(uShadow,vec3(s.xy+vec2(px.x,0),s.z-b));r+=texture(uShadow,vec3(s.xy+vec2(0,px.y),s.z-b));r+=texture(uShadow,vec3(s.xy-px,s.z-b));return r*.25;}
float aaStep(float e0,float e1,float x){float w=fwidth(x)*.75+1e-4;return smoothstep(e0-w,e0+w,x)-smoothstep(e1-w,e1+w,x);}
void main(){
  vec4 st=vSt;float m=floor(vC.a*255.+.5);
  /* passes: 0 opaque, 1 ghost (Future Vision), 2 shadow */
  float ghost=st.g;if(uPass==0&&ghost>.01&&st.r<.999)discard;if(uPass==1&&ghost<.01)discard;if(vFid>=0.&&st.r<=.001&&uPass!=1)discard;
  /* LOD cross-fade (screen-door): prm.z bit 64 = far-only, bit 128 = near-only */
  float fl=floor(vP.z*255.+.5);float dth=h21(gl_FragCoord.xy*.73+fract(uTime*.0));
  if(fl>=128.){if(dth>uDetail)discard;}else if(fl>=64.){if(dth<uDetail)discard;}
  if(uPass==2){oC=vec4(1);return;}
  vec3 N=dot(vN,vN)>1e-8?normalize(vN):vec3(0.,1.,0.);vec3 V=normalize(uEye-vW);float dist=length(uEye-vW);
  vec3 base=lin(vC.rgb);float spec=0.;float emit=0.;vec3 emitC=vec3(0.);float refl=0.;float rough=.8;
  if(m==1.){/* ---------- procedural façade ---------- */
    int pat=int(vP.x*255.+.5);float bay=max(vP.y*255.*.25,.6),fh=max(vP.z*255.*.1,2.4);float rw=clamp(fract(vP.w*255./16.)*1.6,.15,.95);float ghH=floor(vP.w*255./16.)*.5;
    vec2 q=vec2(vUV.x/bay,vUV.y/fh);vec2 cell=floor(q),f=fract(q);float win=0.,frame=0.;
    float lod=clamp(max(fwidth(q.x),fwidth(q.y))*2.2-.2,0.,1.);
    if(pat==1){win=aaStep(.5-rw*.5,.5+rw*.5,f.x)*aaStep(.26,.84,f.y);frame=win*(1.-aaStep(.5-rw*.5+.05,.5+rw*.5-.05,f.x)*aaStep(.3,.8,f.y));}
    else if(pat==2){win=aaStep(.3,.88,f.y);frame=win*(1.-aaStep(.03,.97,f.x));}
    else if(pat==3){win=1.-aaStep(.9,1.01,f.y)*.9;float mx=fract(vUV.x/(bay*.5));frame=1.-aaStep(.035,.965,mx);frame=max(frame,1.-aaStep(.0,.9,f.y));}
    else if(pat==4){win=aaStep(.5-rw*.25,.5+rw*.25,f.x)*aaStep(.1,.92,f.y);}
    else if(pat==5){float g=vUV.y<ghH?1.:0.;win=g*aaStep(.02,.98,f.x)*aaStep(.03,.92,vUV.y/max(ghH,.1));frame=g*(1.-aaStep(.04,.96,f.x));}
    else if(pat==6){vec2 l=vec2(vUV.x,vUV.y)/.9;vec2 fl2=abs(fract(l+vec2(.5*floor(mod(l.y,2.)),0.))-.5);float dia=aaStep(0.,.33,fl2.x+fl2.y);win=aaStep(.2,.88,f.y)*dia*.75;}
    else if(pat==7){win=0.;frame=1.-aaStep(.04,.99,f.y);}
    else if(pat==8){win=aaStep(.5-rw*.5,.5+rw*.5,f.x)*aaStep(.06,.94,f.y);frame=0.;}
    else if(pat==9){win=aaStep(.08,.92,f.x)*aaStep(.12,.88,f.y);frame=win*(1.-aaStep(.14,.86,f.x)*aaStep(.18,.82,f.y));}
    /* ground-floor shopfront band for mixed patterns */
    if(pat!=5&&ghH>0.&&vUV.y<ghH){float gf=fract(vUV.x/max(bay,3.));win=aaStep(.04,.96,gf)*aaStep(.05,.9,vUV.y/ghH);frame=(1.-aaStep(.06,.94,gf))*step(vUV.y,ghH*.92);}
    float rnd=h21(cell+vec2(vFid*.37,vFid*.11));float lit=step(rnd,mix(.08,.55,uNight))*step(.2,f.y);
    vec3 R=reflect(-V,N);vec3 glass=mix(lin(vec3(.10,.13,.16)),sky(R)*.9,.35+.45*pow(1.-max(dot(N,V),0.),3.));glass*=mix(1.,.72,smoothstep(.62,.84,f.y)*step(.5,float(pat==1||pat==4)));
    vec3 inside=lin(vec3(1.,.78,.5))*1.3*(.7+.3*rnd);
    vec3 wc=mix(glass,inside,lit*.9);
    float cov=win*(1.-lod)+lod*(pat==3?.85:pat==2?.5:pat==5?(vUV.y<ghH?.8:0.):pat==6?.4:pat==7?0.:rw*.55);
    base=mix(base,wc,clamp(cov,0.,1.));base*=1.-frame*.45*(1.-lod);
    spec=.35*cov;emit=lit*win*(1.-lod)*.9;emitC=inside;
    /* stone coursing on plain walls */base*=.96+.05*aaStep(.0,.93,fract(vUV.y/.6));
  }else if(m==2.){vec3 R=reflect(-V,N);float fr=.25+.65*pow(1.-max(dot(N,V),0.),3.);base=mix(lin(vC.rgb)*.35,sky(R),fr);spec=1.;float mx=fract(vUV.x/1.6),my=fract(vUV.y/3.8);base*=1.-.35*(1.-aaStep(.03,.97,mx)*aaStep(.04,.96,my));}
  else if(m==3.){emit=1.;emitC=base*2.2;}
  else if(m==14.){float b=step(.5,fract(uTime*2.+vW.x*.01));emit=1.;emitC=base*(1.+2.5*b);}
  else if(m==13.){/* LED screen */float sc=.7+.3*sin(uTime*1.2+vW.x*.3);emit=.9;emitC=base*1.6*sc;}
  else if(m==4.){/* water: animated normal, sky reflection, sun glint */vec2 w=vW.xz;float t=uTime*.7;
    vec3 nn=normalize(vec3(sin(w.x*.21+t)*.05+sin(w.y*.37-t*1.3)*.04+sin((w.x+w.y)*.9+t*2.)*.02,1.,cos(w.y*.23+t*.8)*.05+cos(w.x*.41-t)*.03));
    vec3 R=reflect(-V,nn);float fr=.06+.6*pow(1.-max(dot(nn,V),0.),4.);base=mix(lin(vec3(.06,.30,.34)),sky(R)*vec3(.8,.95,1.05),fr);spec=2.;N=nn;rough=.05;}
  else if(m==5.){float g=n2(vW.xz*.18)*.6+n2(vW.xz*1.3)*.4;base*=.82+.32*g;base*=.94+.06*step(.5,fract(vW.x*.12+vW.z*.04));}
  else if(m==6.){float g=n2(vW.xz*.7)*.5+n2(vW.xz*3.1)*.5;base*=.9+.16*g;}
  else if(m==7.){vec2 t=fract(vW.xz/.6);float j=(1.-aaStep(.04,.96,t.x))+(1.-aaStep(.04,.96,t.y));base*=1.-.18*clamp(j,0.,1.);base*=.94+.1*h21(floor(vW.xz/.6));}
  else if(m==8.){float g=n2(vW.xz*2.1+vW.y)*.6+n2(vW.xz*6.)*.4;base*=.7+.55*g;}
  else if(m==9.){vec3 R=reflect(-V,N);base=mix(base,sky(R)*.6,.25);spec=.8;}
  else if(m==11.){float g=n2(vW.xz*.04)*.6+n2(vW.xz*.4)*.4;base*=.86+.2*g;}
  else if(m==12.){vec2 t=fract(vW.xz/1.2);float j=(1.-aaStep(.02,.98,t.x))+(1.-aaStep(.02,.98,t.y));base*=1.-.12*clamp(j,0.,1.);}
  /* lighting */
  float sh=shadowAt();float nd=max(dot(N,uSun),0.);
  vec3 amb=mix(lin(vec3(.36,.30,.28)),lin(uSkyTop)*1.35+lin(vec3(.25,.22,.26)),N.y*.5+.5);
  float ao=N.y<.5?mix(.66,1.,smoothstep(0.,5.,vW.y)):1.;
  vec3 col=base*(amb*.95*ao+uSunC*nd*sh*1.6);
  vec3 H=normalize(uSun+V);col+=uSunC*pow(max(dot(N,H),0.),mix(18.,160.,1.-rough))*spec*sh*.9;
  col+=emitC*emit;
  /* data view: far away, roofs show the land-use colour; filter dimming; highlight */
  if(vTint.a>0.&&N.y>.7)col=mix(col,lin(vTint.rgb)*(amb+uSunC*nd*sh)*1.1,vTint.a*uData);
  if(st.a>.01){float l=dot(col,vec3(.3,.59,.11));col=mix(col,vec3(l)*.6+lin(vec3(.35,.3,.3))*.4,st.a*.85);}
  if(st.b>.01){col=mix(col,col*1.25+lin(vec3(.9,.72,.3))*.35,st.b);}
  if(st.r<.999&&st.r>0.&&uPass==0){col=mix(col,lin(vec3(.62,.55,.47)),.35);}
  /* haze */
  float fog=1.-exp(-pow(dist*uFogD,1.6));col=mix(col,uFogC,clamp(fog,0.,.92));
  /* tone map + gamma */
  col*=uExpo;col=col/(1.+col*.18);col=pow(col,vec3(1./2.2));
  if(uPass==1){oC=vec4(mix(col,vec3(.96,.85,.55),.45),.38*ghost);return;}
  oC=vec4(col,1.);}
`;
const SKY_VS=`#version 300 es
layout(location=0)in vec2 aP;out vec2 vP;void main(){vP=aP;gl_Position=vec4(aP,.9999,1.);}`;
const SKY_FS=`#version 300 es
precision highp float;uniform mat4 uIVP;uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uSkyTop;uniform vec3 uSkyHor;uniform vec3 uSunC;uniform vec3 uFogC;uniform float uExpo;in vec2 vP;out vec4 oC;
void main(){vec4 a=uIVP*vec4(vP,-1.,1.),b=uIVP*vec4(vP,1.,1.);vec3 d=normalize(b.xyz/b.w-a.xyz/a.w);float t=clamp(d.y,0.,1.);
  vec3 c=mix(uSkyHor,uSkyTop,pow(t,.5));float s=max(dot(d,uSun),0.);c+=uSunC*(pow(s,800.)*20.+pow(s,40.)*.35+pow(s,4.)*.12);
  c=mix(uFogC,c,smoothstep(-.02,.12,d.y));if(d.y<0.)c=uFogC;
  c*=uExpo;c=c/(1.+c*.18);oC=vec4(pow(c,vec3(1./2.2)),1.);}`;

SC.Engine=function(canvas,opts={}){
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:!!opts.preserve});
  if(!gl)return null;
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);console.error(log,src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n').slice(0,4000));throw new Error('shader: '+log)}return s};
  const prog=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const inf=gl.getActiveUniform(p,i);u[inf.name]=gl.getUniformLocation(p,inf.name)}return{p,u}};
  const vsS=VS.replace('__COMMON__',COMMON),fsS=FS.replace('__COMMON__',COMMON);
  const P={main:prog(vsS,fsS),inst:prog(vsS.replace('precision highp int;','precision highp int;\n#define INST'),fsS),sky:prog(SKY_VS,SKY_FS)};

  /* ---------------------------------------------------------- state tex */
  const SW=512;let stateN=0,stateData=null,stateTex=gl.createTexture(),stateDirty=true;
  const allocState=n=>{stateN=n;const rows=Math.ceil(n*2/SW)||1;stateData=new Uint8Array(SW*rows*4);for(let i=0;i<n;i++)stateData[i*8]=255;gl.bindTexture(gl.TEXTURE_2D,stateTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,SW,rows,0,gl.RGBA,gl.UNSIGNED_BYTE,stateData);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);stateDirty=false};
  allocState(opts.features||1);

  /* ---------------------------------------------------------- shadow map */
  const SMS=2048,shadowTex=gl.createTexture(),shadowFB=gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,SMS,SMS);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFB);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);

  /* ---------------------------------------------------------- geometry */
  const upload=(md,inst)=>{const vao=gl.createVertexArray();gl.bindVertexArray(vao);const bufs=[];
    const attr=(loc,data,size,type,norm)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,type,norm,0,0);bufs.push(b)};
    attr(0,md.pos,3,gl.FLOAT,false);attr(1,md.nrm,4,gl.BYTE,true);attr(2,md.col,4,gl.UNSIGNED_BYTE,true);attr(3,md.uv,2,gl.FLOAT,false);attr(4,md.prm,4,gl.UNSIGNED_BYTE,true);attr(5,md.fid,1,gl.FLOAT,false);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,md.idx,gl.STATIC_DRAW);bufs.push(ib);
    let ibuf=null;if(inst){ibuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ibuf);gl.bufferData(gl.ARRAY_BUFFER,inst*48,gl.DYNAMIC_DRAW);
      for(let k=0;k<3;k++){gl.enableVertexAttribArray(6+k);gl.vertexAttribPointer(6+k,4,gl.FLOAT,false,48,k*16);gl.vertexAttribDivisor(6+k,1)}bufs.push(ibuf)}
    gl.bindVertexArray(null);return{vao,count:md.ni,bufs,ibuf,bytes:md.n*36+md.ni*4}};
  const free=g=>{if(!g)return;gl.deleteVertexArray(g.vao);g.bufs.forEach(b=>gl.deleteBuffer(b))};
  const chunks=new Map();   /* key → {bb:[x0,z0,x1,z1], hmax, lod1, lod0, detail, want, build} */
  const layers=[];          /* instanced: {g, count, data, cap, maxDist, shadow} */
  let skyVAO=null;{skyVAO=gl.createVertexArray();gl.bindVertexArray(skyVAO);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null)}

  /* ---------------------------------------------------------- lighting */
  const L={sun:v3.norm([-.52,.42,.74]),sunC:[1.0,.84,.64],skyTop:[.33,.44,.66],skyHor:[.96,.80,.64],fog:[.86,.74,.66],fogD:1/15000,expo:1.05,night:.18};
  const lin=c=>c.map(v=>Math.pow(v,2.2));
  let W=1,H=1,VP=m4.ident(),IVP=m4.ident(),SVP=m4.ident(),eye=[0,500,0],target=[0,0,0],fov=.9,near=1,far=20000,frustum=null;
  const setCamera=(e,t,fv)=>{eye=e;target=t;if(fv)fov=fv};
  const planes=vp=>{const m=vp,p=[];const r=(a,b,c,d)=>{const l=Math.hypot(a,b,c);p.push([a/l,b/l,c/l,d/l])};
    r(m[3]+m[0],m[7]+m[4],m[11]+m[8],m[15]+m[12]);r(m[3]-m[0],m[7]-m[4],m[11]-m[8],m[15]-m[12]);r(m[3]+m[1],m[7]+m[5],m[11]+m[9],m[15]+m[13]);r(m[3]-m[1],m[7]-m[5],m[11]-m[9],m[15]-m[13]);r(m[3]+m[2],m[7]+m[6],m[11]+m[10],m[15]+m[14]);r(m[3]-m[2],m[7]-m[6],m[11]-m[10],m[15]-m[14]);return p};
  const boxVisible=(pl,x0,y0,z0,x1,y1,z1)=>{for(const p of pl){const x=p[0]>0?x1:x0,y=p[1]>0?y1:y0,z=p[2]>0?z1:z0;if(p[0]*x+p[1]*y+p[2]*z+p[3]<0)return false}return true};

  const uni=(pr)=>{const u=pr.u;gl.useProgram(pr.p);gl.uniformMatrix4fv(u.uVP,false,VP);if(u.uSVP)gl.uniformMatrix4fv(u.uSVP,false,SVP);gl.uniform3fv(u.uEye,eye);gl.uniform1f(u.uTime,time);gl.uniform3fv(u.uSun,L.sun);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,stateTex);gl.uniform1i(u.uState,0);gl.uniform1i(u.uStateW,SW);gl.uniform1f(u.uNight,L.night);
    if(u.uShadow){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,inShadowPass?null:shadowTex);gl.uniform1i(u.uShadow,1)}
    if(u.uFogC){gl.uniform3fv(u.uFogC,lin(L.fog));gl.uniform1f(u.uFogD,L.fogD);gl.uniform3fv(u.uSkyTop,lin(L.skyTop));gl.uniform3fv(u.uSkyHor,lin(L.skyHor));gl.uniform3fv(u.uSunC,lin(L.sunC));gl.uniform1f(u.uExpo,L.expo);gl.uniform1f(u.uData,dataView)}};
  let inShadowPass=false,time=0,dataView=0,shadowOn=1,stats={draws:0,tris:0,chunks:0,lod0:0};

  /* ---------------------------------------------------------- frame */
  function render(t,o={}){time=t;dataView=o.dataView||0;
    const r=canvas.getBoundingClientRect(),dpr=Math.min(root.devicePixelRatio||1,o.dprCap||1.5);const w=Math.max(2,Math.round(r.width*dpr)),h=Math.max(2,Math.round(r.height*dpr));if(w!==W||h!==H){W=canvas.width=w;H=canvas.height=h}
    const dist=v3.len(v3.sub(eye,target));near=clamp(dist*.004,.35,25);far=Math.max(9000,dist*8);
    const P_=m4.persp(fov,W/H,near,far),V_=m4.lookAt(eye,target,[0,1,0]);VP=m4.mul(P_,V_);IVP=m4.invert(VP);frustum=planes(VP);
    if(stateDirty){gl.bindTexture(gl.TEXTURE_2D,stateTex);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,SW,stateData.length/(SW*4),gl.RGBA,gl.UNSIGNED_BYTE,stateData);stateDirty=false}
    stats={draws:0,tris:0,chunks:0,lod0:0};
    /* ---- shadow pass (orthographic, fitted around the target, texel-snapped) */
    const ext=clamp(dist*1.15,90,2600);shadowOn=o.shadows===false?0:1;
    if(shadowOn){const c=[target[0],0,target[2]],up=Math.abs(L.sun[1])>.99?[1,0,0]:[0,1,0];const le=v3.add(c,v3.scale(L.sun,4000));let LV=m4.lookAt(le,c,up);
      const tp=m4.xform(LV,c);const tx=ext*2/SMS;const sx=Math.round(tp[0]/tx)*tx-tp[0],sy=Math.round(tp[1]/tx)*tx-tp[1];
      const LP=m4.ortho(-ext+sx,ext+sx,-ext+sy,ext+sy,3000,5600);SVP=m4.mul(LP,LV);
      gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFB);gl.viewport(0,0,SMS,SMS);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.colorMask(false,false,false,false);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.6,2.5);
      const saveVP=VP;VP=SVP;const spl=planes(SVP);inShadowPass=true;drawScene(spl,2,dist,true);inShadowPass=false;VP=saveVP;
      gl.disable(gl.POLYGON_OFFSET_FILL);gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
    /* ---- main pass */
    gl.viewport(0,0,W,H);gl.clearColor(...L.fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);gl.useProgram(P.sky.p);const su=P.sky.u;gl.uniformMatrix4fv(su.uIVP,false,IVP);gl.uniform3fv(su.uEye,eye);gl.uniform3fv(su.uSun,L.sun);gl.uniform3fv(su.uSkyTop,lin(L.skyTop));gl.uniform3fv(su.uSkyHor,lin(L.skyHor));gl.uniform3fv(su.uSunC,lin(L.sunC));gl.uniform3fv(su.uFogC,lin(L.fog));gl.uniform1f(su.uExpo,L.expo);
    gl.bindVertexArray(skyVAO);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);
    drawScene(frustum,0,dist,false);
    if(o.ghosts){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);drawScene(frustum,1,dist,false,true);gl.depthMask(true);gl.disable(gl.BLEND)}
    if(o.overlay)o.overlay(gl,VP);
    gl.bindVertexArray(null);return stats}
  function drawScene(pl,pass,dist,isShadow,ghostOnly){
    const pr=P.main;uni(pr);gl.uniform1i(pr.u.uPass,pass);gl.uniform1f(pr.u.uShadowOn,isShadow?0:shadowOn);
    for(const c of chunks.values()){const b=c.bb;if(!boxVisible(pl,b[0],-2,b[1],b[2],c.hmax+2,b[3]))continue;if(isShadow&&c.noShadow)continue;stats.chunks++;
      const cx=(b[0]+b[2])/2,cz=(b[1]+b[3])/2,d=Math.hypot(cx-eye[0],cz-eye[2]);if(!isShadow&&c.maxDist&&d>c.maxDist)continue;
      gl.uniform1f(pr.u.uDetail,c.lod0?c.detail:0);
      if(c.lod1){gl.bindVertexArray(c.lod1.vao);gl.drawElements(gl.TRIANGLES,c.lod1.count,gl.UNSIGNED_INT,0);stats.draws++;stats.tris+=c.lod1.count/3}
      if(c.lod0&&c.detail>.01&&(!isShadow||c.detail>.5)){gl.bindVertexArray(c.lod0.vao);gl.drawElements(gl.TRIANGLES,c.lod0.count,gl.UNSIGNED_INT,0);stats.draws++;stats.lod0++;stats.tris+=c.lod0.count/3}}
    if(ghostOnly)return;
    const pi=P.inst;uni(pi);gl.uniform1i(pi.u.uPass,pass);gl.uniform1f(pi.u.uShadowOn,isShadow?0:shadowOn);gl.uniform1f(pi.u.uDetail,1);
    for(const l of layers){if(!l.count||(isShadow&&!l.shadow))continue;gl.bindVertexArray(l.g.vao);gl.drawElementsInstanced(gl.TRIANGLES,l.g.count,gl.UNSIGNED_INT,0,l.count);stats.draws++;stats.tris+=l.g.count/3*l.count}}

  /* ---------------------------------------------------------- API */
  return{gl,L,
    get W(){return W},get H(){return H},get VP(){return VP},get eye(){return eye},
    setCamera,render,
    setChunk(key,o){const old=chunks.get(key);if(old){free(old.lod1);free(old.lod0)}const c={bb:o.bb,hmax:o.hmax||10,lod1:o.lod1?upload(o.lod1):null,lod0:null,detail:0,maxDist:o.maxDist||0,noShadow:!!o.noShadow};chunks.set(key,c);return c},
    setChunkLod0(key,md){const c=chunks.get(key);if(!c)return;free(c.lod0);c.lod0=md?upload(md):null;if(!md)c.detail=0},
    chunks,
    layer(md,cap,o={}){const l={g:upload(md,cap),cap,count:0,data:new Float32Array(cap*12),shadow:!!o.shadow};layers.push(l);return l},
    setLayer(l,count){l.count=Math.min(count,l.cap);gl.bindBuffer(gl.ARRAY_BUFFER,l.g.ibuf);gl.bufferSubData(gl.ARRAY_BUFFER,0,l.data,0,l.count*12)},
    allocState,
    state(id,k,r,g,b,a){const i=(id*2+k)*4;if(!stateData||i+3>=stateData.length)return;stateData[i]=r;stateData[i+1]=g;stateData[i+2]=b;stateData[i+3]=a;stateDirty=true},
    stateArr:()=>stateData,markState(){stateDirty=true},
    project(p){const q=m4.xform(VP,p);if(q[3]<=0)return null;return[(q[0]*.5+.5)*W,(1-(q[1]*.5+.5))*H,q[3]]},
    ray(px,py){const x=px/W*2-1,y=1-py/H*2;const a=m4.xform(IVP,[x,y,-1]),b=m4.xform(IVP,[x,y,1]);return{o:a.slice(0,3),d:v3.norm(v3.sub(b.slice(0,3),a.slice(0,3)))}},
    dispose(){for(const c of chunks.values()){free(c.lod1);free(c.lod0)}chunks.clear();for(const l of layers)free(l.g);layers.length=0;const ext=gl.getExtension('WEBGL_lose_context');ext&&ext.loseContext()}}};
})(typeof window!=='undefined'?window:globalThis);
