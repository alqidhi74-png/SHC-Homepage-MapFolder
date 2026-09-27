'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const store={get(k,d){try{const v=localStorage.getItem('chs_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('chs_'+k,JSON.stringify(v))}catch(e){}}};
const S={lang:store.get('lang','ar'),user:store.get('user',null),favs:new Set(store.get('favs',['p3','p9'])),force:null,range:'month',dashSec:'overview',view:'grid',requests:[],saved:new Set()};
const _=(a,e)=>S.lang==='ar'?a:e;
const N=n=>Number(n).toLocaleString('en-US');
const OMR=n=>N(Math.round(n))+' '+_('ر.ع','OMR');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const L=o=>o&&typeof o==='object'?(o[S.lang]||o.ar):o;
const MON_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],MON_EN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DT=(d,m,y=2026)=>d+' '+(S.lang==='ar'?MON_AR:MON_EN)[m-1]+' '+y;
const go=p=>{location.hash='#'+p};
const ACT={};

/* ---------- icons ---------- */
const IC={
home:'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
building:'M4 21V5l8-3v19M12 8h8v13M4 21h16M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2',
map:'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
cube:'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
apply:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M12 12v6M9 15h6',
track:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5M11 8v3l2 1.5',
invest:'M3 17l6-6 4 4 8-8M15 7h6v6',
bus:'M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 11h16M7 21v-3M17 21v-3M8 15h.01M16 15h.01',
sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
leaf:'M20 4c-9 0-15 4-15 11 0 2 1 4 3 4 7 0 12-6 12-15zM4 21c2-6 6-9 11-11',
wifi:'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
heart:'M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z',
bed:'M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M6.5 11.5h.01',
bath:'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2',
area:'M3 3h18v18H3zM3 9h6V3',
car:'M5 16l1.5-6A2 2 0 0 1 8.4 8.5h7.2a2 2 0 0 1 1.9 1.5L19 16M3 16h18v3H3zM7 19v1M17 19v1M7.5 13h.01M16.5 13h.01',
pool:'M2 18c2 0 2-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5M2 21c2 0 2-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0M8 9h8',
gym:'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
mosque:'M12 2v3M6 21v-8a6 6 0 0 1 12 0v8M3 21h18M10 21v-3a2 2 0 0 1 4 0v3M3 9v12M21 9v12',
school:'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6',
clinic:'M4 4h16v16H4zM12 8v8M8 12h8',
tree:'M12 22v-6M12 16c-4 0-6-2.5-6-5.5 0-2 1.2-3.2 2.5-3.7C8.7 4.7 10.2 3 12 3s3.3 1.7 3.5 3.8c1.3.5 2.5 1.7 2.5 3.7 0 3-2 5.5-6 5.5z',
arrow:'M5 12h14M13 6l6 6-6 6',
down:'M12 5v14M6 13l6 6 6-6',
chevL:'M15 6l-6 6 6 6',chevR:'M9 6l6 6-6 6',chevD:'M6 9l6 6 6-6',chevU:'M6 15l6-6 6 6',
close:'M6 6l12 12M18 6L6 18',
menu:'M4 7h16M4 12h16M4 17h10',
user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6',
bell:'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0',
chart:'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
sliders:'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
file:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
download:'M12 4v11M7 11l5 5 5-5M5 20h14',
upload:'M12 16V5M7 9l5-5 5 5M5 20h14',
check:'M5 12.5l4.5 4.5L19 7',
star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
share:'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
bookmark:'M6 3h12v18l-6-4-6 4z',
phone:'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
mail:'M3 5h18v14H3zM3 7l9 6 9-6',
pin:'M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
send:'M21 3L10 14M21 3l-7 18-4-7-7-4z',
layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
ruler:'M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2',
height:'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4',
eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
calendar:'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
play:'M7 4l13 8-13 8z',pause:'M7 4v16M17 4v16',
lock:'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
locate:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3',
plus:'M12 5v14M5 12h14',minus:'M5 12h14',
filter:'M3 5h18l-7 8v6l-4 2v-8z',
grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
logout:'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M10 12h10',
drop:'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
cloud:'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z',
warn:'M12 3l10 18H2zM12 10v5M12 18h.01',
trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
edit:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
idcard:'M3 5h18v14H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 16a3 3 0 0 1 6 0M14 9h4M14 13h4',
image:'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01',
rot:'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
store:'M3 9l2-5h14l2 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 14v7h14v-7',
road:'M8 3L5 21M16 3l3 18M12 4v3M12 11v3M12 17v3',
trend:'M3 17l6-6 4 4 8-8',
search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5',
info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
dollar:'M12 3v18M16 7.5c-1-1.3-2.4-2-4-2-2.4 0-4 1.2-4 3s1.6 2.6 4 3 4 1.2 4 3-1.6 3-4 3c-1.8 0-3.2-.8-4.2-2',
wallet:'M4 7h15a1 1 0 0 1 1 1v11H5a1 1 0 0 1-1-1zM4 7l12-3v3M16 13h2',
sofa:'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3zM6 17v2M18 17v2',
elev:'M5 3h14v18H5zM9 10l3-3 3 3M9 14l3 3 3-3',
kid:'M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 21v-5l-2-3M17 21v-5l2-3M8 13h8',
};
const ic=(n,s=20,c='')=>`<svg class="ic ${c}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${n==='play'?'currentColor':'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]||''}"/></svg>`;
const arrow=(c='')=>ic('arrow',18,'dirx '+c);
const logo=(sz=44)=>`<img class="logo-mark" src="${ASSET.mark}" alt="" height="${sz}" width="${Math.round(sz*ASSET.markAR)}" decoding="async">`;
const lockup=(h=200,cls='')=>`<img class="logo-lock ${cls}" src="${ASSET.lockup}" alt="${_('مدينة السلطان هيثم','Sultan Haitham City')}" height="${h}" width="${Math.round(h*ASSET.lockupAR)}" decoding="async">`;
const seal=(sz=40,col='currentColor')=>`<svg width="${sz}" height="${sz}" viewBox="0 0 64 64" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="30"/><circle cx="32" cy="32" r="25" opacity=".5"/><path d="M18 34l14-12 14 12M22 32v13h20V32M28 45v-7h8v7"/><path d="M14 40c2 8 8 13 18 14M50 40c-2 8-8 13-18 14" opacity=".7"/></svg>`;
const PATTERN=(()=>{const s='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#DBC47D" stroke-width="1" opacity=".55"><path d="M32 4l6 14 14-6-6 14 14 6-14 6 6 14-14-6-6 14-6-14-14 6 6-14-14-6 14-6-6-14 14 6z"/><circle cx="32" cy="32" r="5"/><path d="M0 0l8 8M64 0l-8 8M0 64l8-8M64 64l-8-8"/></svg>';return"url('data:image/svg+xml;utf8,"+encodeURIComponent(s).replace(/'/g,'%27')+"')"})();

/* ---------- art generator (procedural imagery, no remote assets) ---------- */
const PAL={dusk:['#2E0A12','#49111D','#F8633E','#F1BB4D'],night:['#0B2120','#143534','#2E0A12','#AC6492'],day:['#4F8785','#9CC3BF','#F4E2A3','#F4E2A3'],dawn:['#0B2120','#3D4E1E','#F1BB4D','#F4E2A3'],wine:['#2E0A12','#49111D','#AC6492','#F1BB4D']};
const ARTC={};
function art(kind,seed=1,mood='dusk'){
  const key=kind+seed+mood;if(ARTC[key])return ARTC[key];
  const R=rng(seed*7919+kind.length*131+mood.length*17),W=800,H=520,P=PAL[mood]||PAL.dusk,night=mood==='night'||mood==='wine';
  let o=`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset=".45" stop-color="${P[1]}"/><stop offset=".8" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="#F4E2A3" stop-opacity=".95"/><stop offset=".25" stop-color="${P[3]}" stop-opacity=".55"/><stop offset="1" stop-color="${P[2]}" stop-opacity="0"/></radialGradient><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mood==='day'?'#5B7330':'#143534'}"/><stop offset="1" stop-color="${mood==='day'?'#5B7330':'#0B2120'}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#s)"/>`;
  const sx=150+R()*500,sy=250+R()*40;
  if(night)for(let i=0;i<70;i++)o+=`<circle cx="${R()*W}" cy="${R()*250}" r="${.4+R()*1.1}" fill="#fff" opacity="${.3+R()*.6}"/>`;
  o+=`<circle cx="${sx}" cy="${sy}" r="150" fill="url(#g)"/><circle cx="${sx}" cy="${sy}" r="${night?20:28}" fill="${night?'#F4EADC':'#F4E2A3'}" opacity=".95"/>`;
  const ridge=(y,amp,col,op=1,st=36)=>{let d=`M0 ${H}L0 ${y}`;for(let x=0;x<=W+st;x+=st)d+=`L${x} ${y-amp*(.25+R()*.75)}`;return `<path d="${d}L${W} ${H}Z" fill="${col}" opacity="${op}"/>`};
  const tree=(x,y,r,c1='#143534',c2='#1F5150')=>`<ellipse cx="${x}" cy="${y+r*1.1}" rx="${r*.8}" ry="${r*.18}" fill="#000" opacity=".25"/><rect x="${x-r*.07}" y="${y}" width="${r*.14}" height="${r*1.1}" fill="#49111D"/><circle cx="${x}" cy="${y-r*.1}" r="${r}" fill="${c1}"/><circle cx="${x-r*.3}" cy="${y-r*.3}" r="${r*.62}" fill="${c2}"/><circle cx="${x+r*.35}" cy="${y-r*.05}" r="${r*.5}" fill="${c2}" opacity=".85"/>`;
  const palm=(x,y,s,c='#143534')=>{let t=`<path d="M${x} ${y}q${6*s} ${-40*s} ${2*s} ${-95*s}" stroke="#49111D" stroke-width="${4*s}" fill="none" stroke-linecap="round"/>`,tx=x+2*s,ty=y-95*s;for(let a=-80;a<=80;a+=32){const rad=a*Math.PI/180;t+=`<path d="M${tx} ${ty}q${Math.sin(rad)*30*s} ${-18*s+Math.abs(a)/6*s} ${Math.sin(rad)*58*s} ${8*s+Math.abs(a)/3*s}" stroke="${c}" stroke-width="${3.2*s}" fill="none" stroke-linecap="round"/>`}return t};
  const arch=(x,y,w,h,c)=>`<path d="M${x} ${y}v${-h}a${w/2} ${w/2} 0 0 1 ${w} 0v${h}z" fill="${c}"/>`;
  const tower=(x,y,w,h,c1,c2,lit=.35)=>{let s=`<rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="${c1}"/><rect x="${x+w}" y="${y-h}" width="${w*.26}" height="${h}" fill="${c2}"/>`;for(let yy=y-h+8;yy<y-8;yy+=12)for(let xx=x+5;xx<x+w-6;xx+=10)if(R()<lit)s+=`<rect x="${xx}" y="${yy}" width="5" height="6" fill="#D9C79C" opacity=".9"/>`;return s};
  const ground=y=>`<rect y="${y}" width="${W}" height="${H-y}" fill="url(#gr)"/>`;
  const gc=night?'#D9C79C':'#F4E2A3';
  switch(kind){
  case 'city':{o+=ridge(300,110,'#2E0A12',.9)+ridge(330,70,'#2A0E14',1);
    for(let r=0;r<4;r++){const by=360+r*42,sc=.55+r*.28,col=['#2E0A12','#2A1518','#2A1518','#49111D'][r];for(let x=-20;x<W;x+=(20+R()*26)*sc){const w=(20+R()*28)*sc,hh=(40+R()*130)*sc;o+=tower(x,by,w,hh,col,'#0B2120',.4)}}
    o+=`<rect y="470" width="${W}" height="50" fill="#0B2120"/>`;for(let i=0;i<9;i++)o+=`<path d="M${400+(i-4)*12} 465L${400+(i-4)*110} 520" stroke="#DBC47D" stroke-width="1.2" opacity=".5"/>`;break}
  case 'villa':{o+=ridge(330,70,'#49111D',.7)+ground(380);o+=`<path d="M0 470Q400 430 800 480V520H0Z" fill="#DBC47D" opacity=".55"/>`;
    o+=`<rect x="210" y="300" width="330" height="110" fill="#EFE3C8"/><rect x="540" y="325" width="110" height="85" fill="#D9C79C"/><rect x="200" y="292" width="350" height="12" fill="#F8F2E7"/><rect x="540" y="318" width="110" height="9" fill="#F8F2E7"/>`;
    for(let i=0;i<4;i++)o+=arch(235+i*72,410,46,70,'#49111D')+`<rect x="${242+i*72}" y="${345}" width="32" height="${52}" fill="${gc}" opacity=".8"/>`;
    o+=`<rect x="210" y="410" width="330" height="8" fill="#8A6F3F"/>`+palm(150,420,1.1)+palm(690,430,.9)+palm(590,420,.7)+tree(120,405,26)+tree(730,415,22);break}
  case 'tower':{o+=ridge(340,70,'#49111D',.6)+ground(400);
    const xs=[170,340,520],hs=[280,340,240];for(let i=0;i<3;i++){const x=xs[i],h=hs[i],w=110;o+=tower(x,430,w,h,'#F2EADB','#DBC47D',.45);for(let y=430-h+20;y<420;y+=30)o+=`<rect x="${x-4}" y="${y}" width="${w+8}" height="4" fill="#8A6F3F"/>`+(R()<.8?`<circle cx="${x+10+R()*90}" cy="${y-3}" r="4" fill="#1F5150"/>`:'')}
    o+=tree(90,440,30)+tree(300,450,26)+tree(480,455,30)+tree(690,445,34)+`<rect y="452" width="${W}" height="10" fill="#49111D" opacity=".5"/>`;break}
  case 'townhouse':{o+=ridge(340,60,'#49111D',.6)+ground(390);const cols=['#EFE3C8','#6B1C2C','#DBC47D','#143534','#EFE3C8'];
    for(let i=0;i<5;i++){const x=60+i*140,h=140+R()*40;o+=`<rect x="${x}" y="${430-h}" width="136" height="${h}" fill="${cols[i]}"/><rect x="${x-3}" y="${424-h}" width="142" height="9" fill="#F8F2E7" opacity=".9"/>`+arch(x+46,430,44,64,'#49111D')+`<rect x="${x+16}" y="${430-h+30}" width="26" height="36" fill="${gc}" opacity=".85"/><rect x="${x+94}" y="${430-h+30}" width="26" height="36" fill="${gc}" opacity=".85"/>`}
    o+=palm(30,440,.9)+palm(770,445,1)+`<rect y="440" width="${W}" height="80" fill="#49111D" opacity=".55"/>`;break}
  case 'land':{o+=ridge(320,100,'#49111D',.6)+`<rect y="330" width="${W}" height="190" fill="#DBC47D"/><path d="M0 400Q200 350 400 395T800 380V520H0Z" fill="#DBC47D"/><path d="M0 470Q260 420 520 465T800 450V520H0Z" fill="#AF9056"/>`;
    o+=`<path d="M170 480L330 400L640 410L700 490Z" fill="#DBC47D" opacity=".55" stroke="#D9C79C" stroke-width="2.5" stroke-dasharray="10 8"/>`;for(const[x,y] of[[170,480],[330,400],[640,410],[700,490]])o+=`<rect x="${x-1.5}" y="${y-38}" width="3" height="38" fill="#49111D"/><path d="M${x} ${y-38}l22 7-22 7z" fill="#F8633E"/>`;
    o+=ridge(345,22,'#49111D',.55,20)+palm(90,470,1.1);break}
  case 'commercial':{o+=ridge(330,60,'#49111D',.6)+ground(410);
    o+=`<rect x="230" y="120" width="340" height="300" fill="#143534"/><rect x="230" y="120" width="340" height="300" fill="url(#s)" opacity=".55"/>`;for(let x=230;x<=570;x+=34)o+=`<rect x="${x}" y="120" width="3.5" height="300" fill="#DBC47D"/>`;for(let y=150;y<420;y+=38)o+=`<rect x="230" y="${y}" width="340" height="2" fill="#0B2120" opacity=".6"/>`;
    o+=`<rect x="170" y="330" width="90" height="90" fill="#F4E2A3"/><rect x="540" y="350" width="100" height="70" fill="#F4E2A3"/>`+arch(370,420,60,70,'#0B2120')+`<rect y="420" width="${W}" height="100" fill="#49111D"/>`;for(let i=0;i<14;i++)o+=`<circle cx="${140+R()*520}" cy="${440+R()*40}" r="4" fill="${R()<.5?'#D9C79C':'#F8633E'}"/>`;o+=tree(110,430,26)+tree(700,430,28);break}
  case 'canopy':{o+=ridge(300,60,'#143534',.8);for(let i=0;i<5;i++)o+=`<polygon points="${sx-30},${sy} ${sx+30},${sy} ${sx+240-i*90+R()*60},${H} ${sx-220+i*110},${H}" fill="#F4E2A3" opacity=".045"/>`;
    for(let r=0;r<5;r++){const y=340+r*36,rad=26+r*11;for(let x=-20+R()*40;x<W+40;x+=rad*1.5)o+=tree(x,y+R()*10,rad*(.85+R()*.4),['#143534','#143534','#143534','#1F5150','#1F5150'][r],['#143534','#1F5150','#1F5150','#5B7330','#89A356'][r])}
    break}
  case 'wadi':{o+=ridge(240,150,'#49111D',.8)+ridge(290,100,'#49111D',.9)+ground(340);
    o+=`<path d="M300 340C360 400 250 440 380 480S330 520 340 520H520C500 480 540 440 470 400S480 360 440 340Z" fill="#4F8785" opacity=".85"/><path d="M330 350C380 405 290 445 400 480" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>`;
    for(let i=0;i<7;i++)o+=palm(80+i*34+R()*10,430+R()*40,.7+R()*.4);for(let i=0;i<6;i++)o+=palm(560+i*38,420+R()*40,.7+R()*.4);break}
  case 'garden':{o+=ridge(330,50,'#49111D',.5)+`<rect y="350" width="${W}" height="170" fill="#5B7330"/><path d="M340 520Q400 430 470 350L500 350Q460 440 520 520Z" fill="#D9C79C"/>`;
    o+=`<ellipse cx="400" cy="440" rx="70" ry="16" fill="#4F8785"/><path d="M400 440q-20-50 0-60 20 10 0 60" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`;for(let i=0;i<9;i++)o+=tree(40+R()*720,370+R()*90,20+R()*22,'#1F5150','#89A356');break}
  case 'interior':{o=`<rect width="${W}" height="${H}" fill="#F4E2A3"/><rect y="380" width="${W}" height="140" fill="#AF9056"/>`;for(let x=0;x<W;x+=90)o+=`<path d="M${x} 380L${x-40} 520" stroke="#8A6F3F" stroke-width="1.5" opacity=".5"/>`;
    o+=`<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[1]}"/><stop offset=".7" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[3]}"/></linearGradient></defs><rect x="420" y="70" width="300" height="280" fill="url(#w)" stroke="#49111D" stroke-width="10"/><path d="M570 70v280M420 210h300" stroke="#49111D" stroke-width="5"/><circle cx="640" cy="230" r="24" fill="#F4E2A3" opacity=".9"/>`;
    o+=arch(90,380,200,220,'#DBC47D')+`<rect x="120" y="420" width="140" height="44" rx="10" fill="#49111D"/><rect x="130" y="392" width="120" height="40" rx="12" fill="#6B1C2C"/><rect x="100" y="430" width="30" height="50" rx="8" fill="#49111D"/><rect x="250" y="430" width="30" height="50" rx="8" fill="#49111D"/>`+`<circle cx="330" cy="330" r="34" fill="#D9C79C" opacity=".9"/><rect x="326" y="360" width="8" height="90" fill="#8A6F3F"/><ellipse cx="500" cy="470" rx="150" ry="22" fill="#143534" opacity=".85"/>`+tree(760,380,26,'#143534','#1F5150');break}
  case 'solar':{o+=ridge(320,70,'#49111D',.7)+`<rect y="340" width="${W}" height="180" fill="#DBC47D"/>`;for(let r=0;r<5;r++)for(let c=0;c<9;c++){const y=380+r*28,x=60+c*80-r*6;o+=`<path d="M${x} ${y}l64 0 10 22h-84z" fill="#143534"/><path d="M${x+21} ${y}l-7 22M${x+42} ${y}l-3 22" stroke="#4F8785" stroke-width="1" opacity=".6"/>`}
    for(const x of[130,400,680]){o+=`<path d="M${x} 340V190" stroke="#F2EADB" stroke-width="5"/><g stroke="#F2EADB" stroke-width="4" stroke-linecap="round"><path d="M${x} 190l0-80M${x} 190l-68 40M${x} 190l68 40"/></g>`}break}
  case 'mosque':{o+=ridge(340,60,'#49111D',.5)+ground(400)+`<rect x="250" y="300" width="300" height="130" fill="#EFE3C8"/><path d="M290 300a110 110 0 0 1 220 0z" fill="#D9C79C"/><path d="M340 300a60 60 0 0 1 120 0z" fill="#143534"/><rect x="398" y="200" width="4" height="30" fill="#DBC47D"/>`+`<rect x="180" y="190" width="34" height="240" fill="#F2EADB"/><path d="M175 190l22-42 22 42z" fill="#143534"/><rect x="586" y="190" width="34" height="240" fill="#F2EADB"/><path d="M581 190l22-42 22 42z" fill="#143534"/>`;for(let i=0;i<5;i++)o+=arch(275+i*52,430,34,60,'#49111D');o+=palm(100,440,1)+palm(720,440,1);break}
  case 'plaza':{o+=ridge(320,60,'#2E0A12',.55)+ground(400);o+=`<rect y="410" width="${W}" height="110" fill="#2A1518"/><path d="M0 470Q400 440 800 470" stroke="#DBC47D" stroke-width="2" fill="none" opacity=".5"/>`;
    for(let i=0;i<6;i++){const x=30+i*140+R()*30,h=110+R()*90;o+=tower(x,410,80+R()*40,h,'#6B1C2C','#2E0A12',.4)}
    for(let i=0;i<9;i++){const x=60+i*85+R()*30,y=440+R()*55,sc=.9+R()*.6,c=['#F8633E','#F1BB4D','#4F8785','#AC6492','#EFE3C8','#5B7330'][Math.floor(R()*6)];o+=`<ellipse cx="${x}" cy="${y+26*sc}" rx="${10*sc}" ry="${3*sc}" fill="#000" opacity=".3"/><rect x="${x-6*sc}" y="${y-2*sc}" width="${12*sc}" height="${26*sc}" rx="${5*sc}" fill="${c}"/><circle cx="${x}" cy="${y-9*sc}" r="${6*sc}" fill="#E6D2B4"/>`}
    for(let i=0;i<7;i++){const x=40+i*120;o+=`<rect x="${x}" y="360" width="3" height="60" fill="#AF9056"/><circle cx="${x+1.5}" cy="358" r="7" fill="#F4E2A3"/><circle cx="${x+1.5}" cy="358" r="22" fill="#F1BB4D" opacity=".18"/>`}
    o+=palm(70,430,.9)+palm(740,430,.9);break}
  case 'future':{o=`<rect width="${W}" height="${H}" fill="#0B2120"/><defs><linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F1BB4D" stop-opacity=".55"/><stop offset="1" stop-color="#143534" stop-opacity="0"/></linearGradient><radialGradient id="fr"><stop offset="0" stop-color="#F1BB4D" stop-opacity=".45"/><stop offset="1" stop-color="#F1BB4D" stop-opacity="0"/></radialGradient></defs><ellipse cx="400" cy="470" rx="420" ry="90" fill="url(#fr)"/>`;
    for(let i=0;i<40;i++)o+=`<circle cx="${R()*W}" cy="${R()*300}" r="${.4+R()*1.2}" fill="#F4E2A3" opacity="${.2+R()*.6}"/>`;
    for(let i=-9;i<=9;i++)o+=`<path d="M${400+i*34} 400L${400+i*120} 520" stroke="#DBC47D" stroke-width="1" opacity=".35"/>`;for(let j=0;j<5;j++)o+=`<path d="M0 ${410+j*24}H${W}" stroke="#DBC47D" stroke-width="1" opacity="${.35-j*.05}"/>`;
    const tw=[[120,150,60],[210,230,70],[310,300,80],[420,360,90],[540,280,80],[650,210,70],[730,140,55]];
    tw.forEach(([x,h,w],i)=>{const solid=i===3||i===1;o+=`<rect x="${x-w/2}" y="${420-h}" width="${w}" height="${h}" fill="${solid?(i===3?'#F8633E':'#49111D'):'url(#fg)'}" fill-opacity="${solid?.55:.9}" stroke="#F4E2A3" stroke-width="1.4" stroke-opacity=".8"/>`;for(let y=420-h+14;y<410;y+=16)o+=`<path d="M${x-w/2} ${y}H${x+w/2}" stroke="#F4E2A3" stroke-width=".7" opacity=".35"/>`});
    o+=`<path d="M60 250Q400 20 740 250" stroke="#F1BB4D" stroke-width="1.6" fill="none" stroke-dasharray="4 8" opacity=".7"/><path d="M120 300Q400 90 690 300" stroke="#AC6492" stroke-width="1.4" fill="none" stroke-dasharray="3 9" opacity=".7"/>`;for(const[x,y] of[[400,105],[241,164],[561,164],[95,260]])o+=`<circle cx="${x}" cy="${y}" r="6" fill="#F1BB4D"/><circle cx="${x}" cy="${y}" r="16" fill="url(#fr)"/>`;break}
  default:o+=ground(380)}
  o+=`<rect width="${W}" height="${H}" fill="url(#v)" opacity="0"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${o}</svg>`;
  return ARTC[key]='data:image/svg+xml;utf8,'+encodeURIComponent(svg).replace(/'/g,'%27');
}
const bg=(k,s,m)=>`style="background-image:url('${art(k,s,m)}')"`;

/* ---------- night city renderer (hero / video) ---------- */
function NightCity(canvas,opt={}){
  const ctx=canvas.getContext('2d'),sc=opt.scale||.75;let W,H,t0=performance.now(),raf,paused=false,pAt=0,mx=0,my=0,tmx=0,tmy=0,stars=[];
  const hash=(a,b)=>{let h=a*374761393+b*668265263;h=(h^h>>>13)*1274126177;return((h^h>>>16)>>>0)/4294967296};
  const size=()=>{const r=canvas.getBoundingClientRect();W=canvas.width=Math.max(320,r.width*sc|0);H=canvas.height=Math.max(240,r.height*sc|0);stars=[];const R=rng(5);for(let i=0;i<110;i++)stars.push([R()*W,R()*H*.5,.4+R()*1.2,R()*6])};
  const frame=now=>{const t=(now-t0)/1000+(opt.t0||0);mx+=(tmx-mx)*.04;my+=(tmy-my)*.04;
    const hz=H*(.4+my*.02),f=W*.95,cy=hz;
    let g=ctx.createLinearGradient(0,0,0,hz);g.addColorStop(0,'#0B2120');g.addColorStop(.55,'#49111D');g.addColorStop(.9,'#6B1C2C');g.addColorStop(1,'#F8633E');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.globalAlpha=.35+.4*Math.sin(t*1.4+s[3]);ctx.fillStyle='#fff';ctx.fillRect(s[0]+mx*6,s[1],s[2],s[2])}ctx.globalAlpha=1;
    ctx.fillStyle='#2E0A12';ctx.beginPath();ctx.moveTo(0,hz);for(let x=0;x<=W;x+=W/28)ctx.lineTo(x-mx*14,hz-(20+hash(x|0,3)*90+Math.sin(x/90)*24)*H/700);ctx.lineTo(W,hz);ctx.fill();
    ctx.fillStyle='#2A0E14';ctx.fillRect(0,hz,W,H-hz);
    const camH=7.5,zoff=(t*(opt.speed||.35)),GS=4,ZS=3.2,rows=[];
    for(let zi=30;zi>=1;zi--){const z0=zi*ZS-(zoff%ZS);if(z0<5)continue;const zi2=Math.floor(zoff/ZS)+zi;
      const yg=hz+camH*f/z0/1.0,k=f/z0;
      ctx.strokeStyle=`rgba(217,184,106,${clamp(.5-z0/90,0,.5)})`;ctx.lineWidth=Math.max(.5,k*.03);ctx.beginPath();ctx.moveTo(0,yg);ctx.lineTo(W,yg);ctx.stroke();
      for(let xi=-11;xi<=11;xi++){const X=xi*GS+mx*4;const hh=hash(xi+50,zi2)*hash(xi*3+9,zi2+7);const bh=(hash(xi,zi2)<.12?0:.4+hh*6.5*(1-Math.abs(xi)/16));if(bh<.2)continue;
        const bw=GS*.6,x1=cx(X-bw/2,z0),x2=cx(X+bw/2,z0),yb=hz+camH*f/z0,yt=hz+(camH-bh)*f/z0,zf=z0+ZS*.55,yb2=hz+camH*f/zf,yt2=hz+(camH-bh)*f/zf;
        const dark=clamp(1-z0/85,.08,1),c=hash(xi,zi2+40);const base=c<.4?[107,28,44]:c<.78?[31,81,80]:[126,90,23];
        ctx.fillStyle=`rgb(${base[0]*dark*.55|0},${base[1]*dark*.55|0},${base[2]*dark*.55|0})`;ctx.fillRect(x1,yt,x2-x1,yb-yt);
        ctx.fillStyle=`rgb(${base[0]*dark*.9|0},${base[1]*dark*.9|0},${base[2]*dark*.9|0})`;ctx.beginPath();ctx.moveTo(x1,yt);ctx.lineTo(x2,yt);ctx.lineTo(cx(X+bw/2,zf),yt2);ctx.lineTo(cx(X-bw/2,zf),yt2);ctx.fill();
        if(k>9){const cols=Math.max(2,(x2-x1)/(k*.28)|0),rws=Math.min(14,Math.max(2,(yb-yt)/(k*.42)|0));ctx.fillStyle=`rgba(255,217,138,${.5+.4*dark})`;for(let a=0;a<cols;a++)for(let b=0;b<rws;b++)if(hash(a+xi*7,b+zi2*3)<.42)ctx.fillRect(x1+(a+.3)*(x2-x1)/cols,yt+(b+.3)*(yb-yt)/rws,(x2-x1)/cols*.42,(yb-yt)/rws*.4)}}}
    function cx(X,z){return W/2+X*f/z}
    ctx.globalCompositeOperation='lighter';for(let i=0;i<46;i++){const zz=((i*5.3+t*(opt.speed||.35)*7)%80)+2,xx=(i%2?-1:1)*(GS*(.5+(i*7)%9)),y=hz+camH*f/zz+1,x=W/2+xx*f/zz+mx*4*f/zz;const a=clamp(1-zz/80,0,1);ctx.fillStyle=i%3?`rgba(255,200,120,${a})`:`rgba(255,80,60,${a})`;ctx.beginPath();ctx.arc(x,y,Math.max(.8,f/zz*.05),0,7);ctx.fill()}
    const gl=ctx.createLinearGradient(0,hz-10,0,hz+60);gl.addColorStop(0,'rgba(248,99,62,.35)');gl.addColorStop(1,'rgba(248,99,62,0)');ctx.fillStyle=gl;ctx.fillRect(0,hz-10,W,70);ctx.globalCompositeOperation='source-over';
    const vg=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(22,10,14,.65)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
    opt.onFrame&&opt.onFrame(t);if(!paused)raf=requestAnimationFrame(frame)};
  const mm=e=>{tmx=(e.clientX/innerWidth-.5)*2;tmy=(e.clientY/innerHeight-.5)*2};
  const ro=new ResizeObserver(size);ro.observe(canvas);size();
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('mousemove',mm);
  raf=requestAnimationFrame(frame);
  return{stop(){paused=true;cancelAnimationFrame(raf);ro.disconnect();removeEventListener('mousemove',mm)},pause(){if(paused)return;paused=true;pAt=performance.now();cancelAnimationFrame(raf)},resume(){if(!paused)return;paused=false;t0+=performance.now()-pAt;raf=requestAnimationFrame(frame)}};
}

/* ---------- UI infrastructure ---------- */
const MODALS=[];
function openModal(html,{cls='',onMount,onClose}={}){
  const ov=document.createElement('div');ov.className='mdl-ov';
  ov.innerHTML=`<div class="mdl ${cls}" role="dialog" aria-modal="true"><button class="mdl-x" data-act="close" aria-label="${_('إغلاق','Close')}">${ic('close',20)}</button>${html}</div>`;
  ov.addEventListener('mousedown',e=>{if(e.target===ov)closeModal(ov)});
  $('#ovl').appendChild(ov);requestAnimationFrame(()=>ov.classList.add('on'));ov._c=onClose;MODALS.push(ov);
  const m=$('.mdl',ov);onMount&&onMount(m,ov);const f=$('input,textarea,select,button:not(.mdl-x)',m);f&&f.focus({preventScroll:true});return ov;
}
function closeModal(ov){ov=ov||MODALS[MODALS.length-1];if(!ov)return;const i=MODALS.indexOf(ov);if(i<0)return;MODALS.splice(i,1);ov.classList.remove('on');setTimeout(()=>{ov._c&&ov._c();ov.remove()},260)}
ACT.close=el=>closeModal(el.closest('.mdl-ov'));
addEventListener('keydown',e=>{if(e.key==='Escape'){if(MODALS.length)closeModal();else{const m=$('.mobmenu.on');m&&toggleMenu(false)}}});
function toast(msg,icon='check'){const t=document.createElement('div');t.className='toast';t.innerHTML=`<span class="toast-i">${ic(icon,16)}</span>${msg}`;$('#toasts').appendChild(t);requestAnimationFrame(()=>t.classList.add('on'));setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),300)},2800)}
const sk=(c='',s='')=>`<div class="sk ${c}" style="${s}"></div>`;
const skCards=(n=6,c='')=>`<div class="grid3 ${c}">${Array.from({length:n},()=>`<div class="sk-card">${sk('sk-img')}${sk('sk-l w60')}${sk('sk-l w40')}${sk('sk-l w80')}</div>`).join('')}</div>`;
const pageSk=(hero=true)=>`${hero?sk('sk-hero'):''}<div class="wrap" style="padding-block:32px">${sk('sk-l w30 h28')}${sk('sk-l w50')}<div style="height:24px"></div>${skCards(6)}</div>`;
function stateBlock(kind,{title,text,cta,go:to,act}={}){
  const cfg={empty:{i:'search',t:_('لا توجد نتائج','Nothing here yet'),x:_('جرّب تعديل عوامل التصفية أو ابدأ من الصفحة الرئيسية.','Adjust your filters or start from the homepage.')},error:{i:'warn',t:_('تعذّر تحميل المحتوى','We couldn’t load this page'),x:_('حدث خطأ أثناء الاتصال بالخادم. تحقق من اتصالك ثم أعد المحاولة.','Something went wrong reaching the server. Check your connection and try again.')}}[kind];
  return `<div class="state ${kind}"><div class="state-ic">${ic(cfg.i,34)}</div><h3>${title||cfg.t}</h3><p>${text||cfg.x}</p>${act?`<button class="btn btn-bur" data-act="${act}">${cta||_('إعادة المحاولة','Try again')}</button>`:`<button class="btn btn-bur" ${to?`data-go="${to}"`:'data-act="retry"'}>${cta||(kind==='error'?_('إعادة المحاولة','Try again'):_('العودة إلى الرئيسية','Back to home'))}</button>`}</div>`}

/* tooltips */
(()=>{let tip;const mk=()=>{tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip)};
  document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-tip]');if(!t)return;if(!tip)mk();tip.innerHTML=t.dataset.tip;tip.classList.add('on')});
  document.addEventListener('mousemove',e=>{if(!tip||!tip.classList.contains('on'))return;const w=tip.offsetWidth;tip.style.left=clamp(e.clientX-w/2,8,innerWidth-w-8)+'px';tip.style.top=Math.max(8,e.clientY-tip.offsetHeight-14)+'px'});
  document.addEventListener('mouseout',e=>{if(tip&&e.target.closest('[data-tip]'))tip.classList.remove('on')});})();

/* reveal + counters */
let IO;
function observe(root=document){
  if(!IO)IO=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;const el=en.target;IO.unobserve(el);el.classList.add('in');if(el.dataset.count!=null)countUp(el)}),{threshold:.18});
  $$('.rv,[data-count]',root).forEach(e=>{if(!e.classList.contains('in')&&!e._o){e._o=1;IO.observe(e)}});
}
function countUp(el){const to=parseFloat(el.dataset.count),dec=+(el.dataset.dec||0),suf=el.dataset.suf||'',t0=performance.now(),d=1700;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=to.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;return}
  const f=n=>{const p=clamp((n-t0)/d,0,1),e=1-Math.pow(1-p,3);el.textContent=(to*e).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)}

/* ---------- charts (inline SVG) ---------- */
let CID=0;
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v||1))),f=v/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p};
const smooth=pts=>{if(pts.length<2)return'';let d=`M${pts[0][0]} ${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;d+=`C${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6} ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6} ${p2[0]} ${p2[1]}`}return d};
const CH={
  line(o){const id=++CID,W=460,H=o.h||230,p={l:40,r:12,t:14,b:26},max=nice(Math.max(...o.series.flatMap(s=>s.data))*1.08),n=o.labels.length,X=i=>p.l+i*(W-p.l-p.r)/(n-1),Y=v=>H-p.b-v/max*(H-p.t-p.b);
    let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'chart')}"><defs>${o.series.map((q,i)=>`<linearGradient id="a${id}${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${q.color}" stop-opacity=".35"/><stop offset="1" stop-color="${q.color}" stop-opacity="0"/></linearGradient>`).join('')}</defs>`;
    for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);s+=`<line x1="${p.l}" x2="${W-p.r}" y1="${y}" y2="${y}" class="ch-g"/><text x="${p.l-6}" y="${y+4}" text-anchor="end" class="ch-t">${o.fmt?o.fmt(v):N(Math.round(v*10)/10)}</text>`}
    const step=Math.ceil(n/(o.xs||6));o.labels.forEach((l,i)=>{if(i%step===0)s+=`<text x="${X(i)}" y="${H-6}" text-anchor="middle" class="ch-t">${l}</text>`});
    o.series.forEach((q,i)=>{const pts=q.data.map((v,j)=>[X(j),Y(v)]),d=smooth(pts);if(o.area!==false)s+=`<path d="${d}L${X(n-1)} ${Y(0)}L${X(0)} ${Y(0)}Z" fill="url(#a${id}${i})" class="ch-area"/>`;s+=`<path d="${d}" fill="none" stroke="${q.color}" stroke-width="2.4" stroke-linecap="round" pathLength="1" class="ch-line"/>`;
      pts.forEach((pt,j)=>s+=`<circle cx="${pt[0]}" cy="${pt[1]}" r="10" fill="transparent" data-tip="<b>${esc(q.name||'')}</b> ${o.labels[j]}: ${o.fmt?o.fmt(q.data[j]):N(q.data[j])}"/><circle cx="${pt[0]}" cy="${pt[1]}" r="3" fill="var(--surf)" stroke="${q.color}" stroke-width="1.6" class="ch-dot" style="pointer-events:none"/>`)});
    return s+'</svg>'},
  bar(o){const id=++CID,W=460,H=o.h||230,p={l:40,r:10,t:14,b:28},max=nice(Math.max(...o.data)*1.08),n=o.data.length,bw=(W-p.l-p.r)/n,Y=v=>H-p.b-v/max*(H-p.t-p.b);
    let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'chart')}"><defs><linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}"/><stop offset="1" stop-color="${o.color2||o.color}" stop-opacity=".55"/></linearGradient></defs>`;
    for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);s+=`<line x1="${p.l}" x2="${W-p.r}" y1="${y}" y2="${y}" class="ch-g"/><text x="${p.l-6}" y="${y+4}" text-anchor="end" class="ch-t">${o.fmt?o.fmt(v):N(Math.round(v))}</text>`}
    o.data.forEach((v,i)=>{const x=p.l+i*bw+bw*.2,w=bw*.6;s+=`<rect x="${x}" y="${Y(v)}" width="${w}" height="${H-p.b-Y(v)}" rx="4" fill="url(#b${id})" class="ch-bar" style="animation-delay:${i*45}ms" data-tip="<b>${o.labels[i]}</b>: ${o.fmt?o.fmt(v):N(v)}"/><text x="${x+w/2}" y="${H-9}" text-anchor="middle" class="ch-t">${o.labels[i]}</text>`});return s+'</svg>'},
  donut(o){const tot=o.items.reduce((a,b)=>a+b.value,0),R=70,r=46;let a0=-Math.PI/2,s=`<svg class="chart donut" viewBox="0 0 200 200" role="img" aria-label="${esc(o.title||'chart')}">`;
    o.items.forEach((it,i)=>{const a1=a0+it.value/tot*Math.PI*2-.02,lg=a1-a0>Math.PI?1:0,p=(rr,a)=>[100+rr*Math.cos(a),100+rr*Math.sin(a)];const A=p(R,a0),B=p(R,a1),C=p(r,a1),D=p(r,a0);
      s+=`<path d="M${A}A${R} ${R} 0 ${lg} 1 ${B}L${C}A${r} ${r} 0 ${lg} 0 ${D}Z" fill="${it.color}" class="dn-seg" style="animation-delay:${i*80}ms" data-tip="<b>${esc(it.label)}</b>: ${N(it.value)} (${Math.round(it.value/tot*100)}%)"/>`;a0+=it.value/tot*Math.PI*2});
    return s+`<text x="100" y="100" text-anchor="middle" class="dn-n">${o.center!=null?o.center:N(tot)}</text><text x="100" y="118" text-anchor="middle" class="ch-t">${o.sub||''}</text></svg>`},
  gauge(o){const r=44,c=2*Math.PI*r,pct=clamp(o.value/o.max,0,1);return `<div class="gauge"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" class="gg-bg"/><circle cx="60" cy="60" r="${r}" class="gg-fg" stroke="${o.color}" stroke-dasharray="${c}" style="--c:${c};--o:${c*(1-pct)}" transform="rotate(-90 60 60)"/></svg><div class="gg-v"><b class="num">${o.value}</b><small>${o.unit||''}</small></div><span class="gg-l">${o.label}</span></div>`},
  spark(d,color){const W=90,H=30,mx=Math.max(...d),mn=Math.min(...d),pts=d.map((v,i)=>[i*W/(d.length-1),H-3-(v-mn)/(mx-mn||1)*(H-6)]);return `<svg class="spark" viewBox="0 0 ${W} ${H}"><path d="${smooth(pts)}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" pathLength="1" class="ch-line"/></svg>`},
  heat(){const R=rng(11),cols=18,rows=10;let s=`<svg class="chart heat" viewBox="0 0 360 200"><defs><radialGradient id="hm"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient></defs>`;
    const hot=[[5,3,1],[9,5,.9],[13,4,.8],[7,7,.7],[12,7,.6]];
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const dx=(i-8.5)/9,dy=(j-4.5)/5;if(dx*dx+dy*dy>1)continue;let v=0;hot.forEach(h=>v+=h[2]*Math.exp(-((i-h[0])**2+(j-h[1])**2)/9));v=clamp(v+R()*.15,0,1);const c=v<.33?'#5B7330':v<.55?'#F1BB4D':v<.75?'#F8633E':'#49111D';s+=`<rect x="${i*20}" y="${j*20}" width="18" height="18" rx="4" fill="${c}" opacity="${.35+v*.65}" class="hm-c ${v>.86?'hot':''}" style="animation-delay:${(i+j)*22}ms" data-tip="${_('الكثافة السكانية','Density')}: ${N(Math.round(v*12000))} ${_('نسمة/كم²','/km²')}"/>`}
    return s+'</svg>'}
};
