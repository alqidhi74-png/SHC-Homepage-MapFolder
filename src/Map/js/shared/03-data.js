/* ---------- demo data ---------- */
const NBINFO=[
{id:'nb1',ar:'الواحة الخضراء',en:'Green Oasis',kind:'canopy',seed:3,col:'#5B7330',tag:{ar:'حديقة في كل خطوة',en:'A garden at every step'}},
{id:'nb2',ar:'المركز الذكي',en:'Smart Center',kind:'commercial',seed:5,col:'#49111D',tag:{ar:'قلب المدينة النابض',en:'The beating heart of the city'}},
{id:'nb3',ar:'ضفاف الوادي',en:'Wadi Banks',kind:'wadi',seed:7,col:'#1F5150',tag:{ar:'حيث يلتقي الماء بالنخيل',en:'Where water meets the palms'}},
{id:'nb4',ar:'حدائق النخيل',en:'Palm Gardens',kind:'villa',seed:2,col:'#CB957C',tag:{ar:'سكينة تحيط بها الحدائق',en:'Stillness, wrapped in gardens'}},
{id:'nb5',ar:'تلال الياسمين',en:'Jasmine Hills',kind:'townhouse',seed:4,col:'#AC6492',tag:{ar:'إطلالات على الأفق',en:'Horizons within reach'}},
{id:'nb6',ar:'واجهة الأفق',en:'Ufuq Front',kind:'tower',seed:9,col:'#F8633E',tag:{ar:'الأعمال والحياة في مكان واحد',en:'Business and life, one address'}}];
/* City geometry (district outlines, project / facility positions) comes from
   the procedural master plan (js/city/20-plan.js), which is generated on
   first use. Until then these fields are lazy getters that trigger it. */
const lazyCity=(obj,keys)=>keys.forEach(k=>Object.defineProperty(obj,k,{configurable:true,enumerable:true,get(){SC.ensurePlan();const d=Object.getOwnPropertyDescriptor(obj,k);return d&&'value' in d?d.value:undefined},set(v){Object.defineProperty(obj,k,{value:v,writable:true,configurable:true,enumerable:true})}}));
const NBS=NBINFO.map(n=>{const o={...n,infra:(SC.CFG.districts.find(d=>d.id===n.id)||{}).infra||2020};lazyCity(o,['poly','c']);return o});
const NB=Object.fromEntries(NBS.map(n=>[n.id,n]));
const DEVS=[
{id:'d1',ar:'الأفق للتطوير العمراني',en:'Ufuq Urban Development',n:7,since:2009,kind:'tower'},
{id:'d2',ar:'مسار للتطوير العقاري',en:'Masar Real Estate',n:5,since:2014,kind:'commercial'},
{id:'d3',ar:'دار الوادي',en:'Dar Al Wadi',n:4,since:2011,kind:'wadi'},
{id:'d4',ar:'لؤلؤة الخليج للعقارات',en:'Luluat Al Khaleej',n:6,since:2007,kind:'villa'}];
const DEV=Object.fromEntries(DEVS.map(d=>[d.id,d]));
const PROJECTS=[
{id:'pr1',ar:'أفياء الواحة',en:'Afyaa Al Waha',nb:'nb1',dev:'d1',x:205,y:215,kind:'garden',mood:'dawn',seed:11,units:320,plot:'PL-A-102'},
{id:'pr2',ar:'مركز السلطان',en:'Sultan Centre Residences',nb:'nb2',dev:'d2',x:455,y:225,kind:'tower',mood:'dusk',seed:12,units:410,plot:'PL-B-041'},
{id:'pr3',ar:'ضفاف الوادي',en:'Dafaf Al Wadi',nb:'nb3',dev:'d3',x:705,y:250,kind:'wadi',mood:'dusk',seed:13,units:180,plot:'PL-C-077'},
{id:'pr4',ar:'سكون النخيل',en:'Sakoon Al Nakheel',nb:'nb4',dev:'d1',x:180,y:440,kind:'villa',mood:'day',seed:14,units:140,plot:'PL-D-015'},
{id:'pr5',ar:'تلال الياسمين',en:'Yasmin Heights',nb:'nb5',dev:'d4',x:385,y:480,kind:'townhouse',mood:'wine',seed:15,units:260,plot:'PL-E-058'},
{id:'pr6',ar:'واجهة الأفق',en:'Ufuq Front',nb:'nb6',dev:'d2',x:625,y:470,kind:'commercial',mood:'night',seed:16,units:220,plot:'PL-F-009'}];
PROJECTS.forEach(p=>lazyCity(p,['x','y','bi','plot']));
const PR=Object.fromEntries(PROJECTS.map(p=>[p.id,p]));
const TYPES={apartment:{ar:'شقة',en:'Apartment',kind:'tower'},villa:{ar:'فيلا',en:'Villa',kind:'villa'},townhouse:{ar:'تاون هاوس',en:'Townhouse',kind:'townhouse'},land:{ar:'أرض',en:'Land plot',kind:'land'},commercial:{ar:'تجاري',en:'Commercial',kind:'commercial'}};
const STATUS={available:{ar:'متاح',en:'Available',c:'em'},reserved:{ar:'محجوز',en:'Reserved',c:'or'},construction:{ar:'تحت الإنشاء',en:'Under construction',c:'gold'}};
const AMEN=[
{k:'pool',ar:'مسبح',en:'Swimming pool',d:{ar:'مسبح مشترك بإطلالة على الحدائق.',en:'Shared pool overlooking the gardens.'}},
{k:'gym',ar:'نادٍ رياضي',en:'Fitness club',d:{ar:'صالة مجهزة ومفتوحة على مدار الساعة.',en:'Fully equipped, open around the clock.'}},
{k:'tree',ar:'حديقة',en:'Garden',d:{ar:'مساحات خضراء ومسارات للمشي.',en:'Green courtyards and walking paths.'}},
{k:'shield',ar:'أمن',en:'24/7 security',d:{ar:'مراقبة ذكية وحراسة على مدار الساعة.',en:'Smart surveillance and round-the-clock guards.'}},
{k:'mosque',ar:'مسجد',en:'Mosque',d:{ar:'مسجد ضمن مسافة سير قصيرة.',en:'A mosque within a short walk.'}},
{k:'kid',ar:'ملعب أطفال',en:'Playground',d:{ar:'منطقة ألعاب آمنة للأطفال.',en:'Safe play area for children.'}},
{k:'car',ar:'مواقف مغطاة',en:'Covered parking',d:{ar:'مواقف مظللة مع نقاط شحن كهربائي.',en:'Shaded bays with EV charging points.'}},
{k:'wifi',ar:'ألياف ضوئية',en:'Fibre internet',d:{ar:'إنترنت فائق السرعة في كل وحدة.',en:'Ultra-fast internet in every unit.'}},
{k:'elev',ar:'مصاعد',en:'Elevators',d:{ar:'مصاعد ذكية موفّرة للطاقة.',en:'Smart, energy-saving elevators.'}}];
const PROPS=(()=>{
  const plan=[['apartment','villa','townhouse'],['apartment','commercial','apartment'],['villa','townhouse','land'],['townhouse','villa','land'],['apartment','apartment','villa'],['commercial','land','apartment']];
  const sts=['available','available','reserved','construction','available','available','reserved','available','construction'];
  const R=rng(42),out=[];let i=0;
  PROJECTS.forEach((pr,pi)=>plan[pi].forEach((ty,k)=>{const idx=i++,code=String.fromCharCode(65+pi)+'-'+(101+idx*7);
    const area={apartment:[95,165],villa:[290,460],townhouse:[190,260],land:[600,900],commercial:[120,340]}[ty],a=Math.round(area[0]+R()*(area[1]-area[0]));
    const rate={apartment:1050,villa:850,townhouse:900,land:210,commercial:1450}[ty],price=Math.round(a*rate*(.9+R()*.25)/1000)*1000;
    const rooms=ty==='apartment'?1+Math.floor(R()*3):ty==='villa'?4+Math.floor(R()*2):ty==='townhouse'?3+Math.floor(R()*2):0;
    out.push({id:'p'+(idx+1),code,type:ty,pr:pr.id,nb:pr.nb,dev:pr.dev,rooms,baths:ty==='land'?0:ty==='commercial'?2:Math.max(2,rooms-(ty==='apartment'?0:1)),area:a,price,
      status:sts[(idx*4+k)%sts.length],year:2026+(idx%3),floor:ty==='apartment'?2+Math.floor(R()*14):ty==='commercial'?1+Math.floor(R()*3):0,park:ty==='land'?0:ty==='apartment'?1+Math.floor(R()*2):2+Math.floor(R()*2),
      seed:idx+20,order:idx,mood:['dusk','day','wine','dawn'][idx%4],ox:(R()-.5)*260,oy:(R()-.5)*260});
    /* position relative to its project (resolved when the city plan exists) */const o=out[out.length-1];Object.defineProperty(o,'x',{get(){return pr.x+o.ox},enumerable:true});Object.defineProperty(o,'y',{get(){return pr.y+o.oy},enumerable:true})}));
  return out})();
const PP=Object.fromEntries(PROPS.map(p=>[p.id,p]));
const pName=p=>{const t=TYPES[p.type];return p.type==='apartment'?_(`شقة ${p.code}`,`Apartment ${p.code}`):p.type==='villa'?_(`فيلا ${p.code}`,`Villa ${p.code}`):p.type==='townhouse'?_(`تاون هاوس ${p.code}`,`Townhouse ${p.code}`):p.type==='land'?_(`أرض رقم ${p.code}`,`Plot ${p.code}`):_(`وحدة تجارية ${p.code}`,`Retail unit ${p.code}`)};
const projFrom=id=>Math.min(...PROPS.filter(p=>p.pr===id).map(p=>p.price));
const FAC=[
{id:'f1',t:'school',x:250,y:190,ar:'مدرسة الواحة الأساسية',en:'Al Waha Primary School',plot:'SC-001'},
{id:'f2',t:'school',x:520,y:260,ar:'مدرسة المركز الدولية',en:'Centre International School',plot:'SC-002'},
{id:'f3',t:'school',x:210,y:520,ar:'مدرسة النخيل للبنات',en:'Al Nakheel Girls’ School',plot:'SC-003'},
{id:'f4',t:'school',x:690,y:470,ar:'مدرسة الأفق الثانوية',en:'Ufuq Secondary School',plot:'SC-004'},
{id:'f5',t:'health',x:420,y:170,ar:'مركز السلطان الصحي',en:'Sultan Health Centre',plot:'HC-001'},
{id:'f6',t:'health',x:650,y:330,ar:'عيادة الضفاف',en:'Dafaf Clinic',plot:'HC-002'},
{id:'f7',t:'health',x:330,y:400,ar:'مستشفى الياسمين',en:'Yasmin Hospital',plot:'HC-003'},
{id:'f8',t:'mosque',x:290,y:250,ar:'جامع الواحة',en:'Al Waha Mosque',plot:'MS-001'},
{id:'f9',t:'mosque',x:500,y:200,ar:'جامع السلطان هيثم',en:'Sultan Haitham Mosque',plot:'MS-002'},
{id:'f10',t:'mosque',x:760,y:250,ar:'مسجد الوادي',en:'Al Wadi Mosque',plot:'MS-003'},
{id:'f11',t:'mosque',x:150,y:500,ar:'مسجد النخيل',en:'Al Nakheel Mosque',plot:'MS-004'},
{id:'f12',t:'mosque',x:450,y:560,ar:'مسجد الياسمين',en:'Yasmin Mosque',plot:'MS-005'},
{id:'f13',t:'park',x:130,y:200,ar:'حديقة الواحة المركزية',en:'Oasis Central Park',plot:'PK-001',r:44},
{id:'f14',t:'park',x:560,y:330,ar:'حديقة المدينة الذكية',en:'Smart City Park',plot:'PK-002',r:36},
{id:'f15',t:'park',x:770,y:340,ar:'منتزه ضفاف الوادي',en:'Wadi Banks Promenade',plot:'PK-003',r:40},
{id:'f16',t:'park',x:260,y:430,ar:'حدائق النخيل العامة',en:'Palm Gardens Park',plot:'PK-004',r:34},
{id:'f17',t:'park',x:560,y:590,ar:'حديقة الأفق',en:'Ufuq Green',plot:'PK-005',r:38}];
FAC.forEach(f=>lazyCity(f,['x','y','bi']));
const LOTS=[];
/* called once by the master plan after it is generated */
function cityLink(){const C=CITYD;
  NBS.forEach(n=>{const c=C.nbs.find(x=>x.id===n.id),p=[];for(let i=0;i<c.p.length;i+=2)p.push([c.p[i],c.p[i+1]]);n.poly=p;n.c=c.c});
  PROJECTS.forEach((p,i)=>{const q=C.prjs[i];p.x=q.x;p.y=q.y;p.bi=q.bi;p.plot='PL-'+p.nb.slice(2)+'-'+String(100+q.bi%900).slice(-3)});
  FAC.forEach(f=>{const q=C.facs.find(x=>x.id===f.id);if(q){f.x=q.x;f.y=q.y;f.bi=q.bi}else{f.x=0;f.y=0;f.bi=-1}});
  /* public facilities added by the new master plan (police, civil defence, library, mall, stadium …) */
  for(const q of C.facsExtra)if(!FAC.some(f=>f.id===q.id))FAC.push({id:q.id,t:q.t,x:q.x,y:q.y,bi:q.bi,ar:q.ar,en:q.en,plot:q.plot||''});
  LOTS.length=0;C.lots.forEach(l=>LOTS.push({id:'lot'+l.id,t:'lot',x:l.x,y:l.y,bi:l.bi,ar:'القطعة '+l.id,en:'Lot '+l.id,plot:'LOT-'+l.id}));
  if(typeof cityLinkBuildings==='function')cityLinkBuildings()}
const SERV=[
{id:'s1',cat:'permits',ic:'building',ar:'تصريح بناء',en:'Building permit',da:'تصريح لبناء وحدة سكنية أو تجارية ضمن المدينة.',de:'Permission to build a residential or commercial unit.',days:10,fee:45,docs:[['ملكية الأرض','Land ownership'],['المخططات المعمارية','Architectural drawings'],['الهوية الوطنية','National ID']]},
{id:'s2',cat:'permits',ic:'ruler',ar:'تصريح تسوير وحفريات',en:'Fencing & excavation permit',da:'إذن أعمال التسوير والحفر داخل حدود القسيمة.',de:'Approval for fencing and excavation within a plot.',days:5,fee:15,docs:[['ملكية الأرض','Land ownership'],['الهوية الوطنية','National ID']]},
{id:'s3',cat:'permits',ic:'calendar',ar:'تصريح فعالية مؤقتة',en:'Temporary event permit',da:'ترخيص فعاليات في الساحات العامة والحدائق.',de:'Licence for events in public squares and parks.',days:3,fee:20,docs:[['خطة الفعالية','Event plan'],['الهوية الوطنية','National ID']]},
{id:'s4',cat:'realestate',ic:'idcard',ar:'نقل ملكية عقار',en:'Property ownership transfer',da:'نقل الملكية بين البائع والمشتري إلكترونيًا.',de:'Transfer ownership between seller and buyer, online.',days:7,fee:30,docs:[['عقد البيع','Sale contract'],['هوية الطرفين','Both parties’ IDs'],['شهادة الملكية','Ownership certificate']]},
{id:'s5',cat:'realestate',ic:'file',ar:'شهادة ملكية',en:'Ownership certificate',da:'إصدار شهادة رسمية بملكية العقار.',de:'Issue an official certificate of ownership.',days:1,fee:5,docs:[['الهوية الوطنية','National ID']]},
{id:'s6',cat:'realestate',ic:'apply',ar:'تسجيل عقد إيجار',en:'Lease registration',da:'توثيق عقود الإيجار السكنية والتجارية.',de:'Register residential and commercial leases.',days:2,fee:10,docs:[['عقد الإيجار','Lease agreement'],['الهوية الوطنية','National ID']]},
{id:'s7',cat:'business',ic:'store',ar:'ترخيص نشاط تجاري',en:'Business licence',da:'ترخيص افتتاح نشاط تجاري داخل المدينة.',de:'Licence to open a business in the city.',days:6,fee:60,docs:[['السجل التجاري','Commercial registration'],['عقد الموقع','Site lease'],['الهوية الوطنية','National ID']]},
{id:'s8',cat:'business',ic:'rot',ar:'تجديد ترخيص',en:'Licence renewal',da:'تجديد الترخيص التجاري السنوي.',de:'Renew your annual business licence.',days:2,fee:25,docs:[['الترخيص الحالي','Current licence']]},
{id:'s9',cat:'business',ic:'image',ar:'تصريح لوحة إعلانية',en:'Signage permit',da:'تصريح تركيب اللوحات والإعلانات.',de:'Permit to install signs and advertising.',days:4,fee:18,docs:[['تصميم اللوحة','Sign design'],['الترخيص التجاري','Business licence']]},
{id:'s10',cat:'planning',ic:'map',ar:'اعتماد مخطط تفصيلي',en:'Detailed plan approval',da:'اعتماد المخططات التفصيلية للمشاريع.',de:'Approval of detailed project plans.',days:15,fee:120,docs:[['المخطط التفصيلي','Detailed plan'],['دراسة الأثر البيئي','Environmental study'],['الهوية الوطنية','National ID']]},
{id:'s11',cat:'planning',ic:'layers',ar:'تعديل استخدام أرض',en:'Land-use change',da:'طلب تعديل تصنيف استخدام القسيمة.',de:'Request to change a plot’s land-use class.',days:20,fee:150,docs:[['ملكية الأرض','Land ownership'],['مبررات التعديل','Justification']]},
{id:'s12',cat:'planning',ic:'pin',ar:'إفادة موقع',en:'Site statement',da:'وثيقة تحدد اشتراطات القسيمة والارتدادات.',de:'Document setting out plot rules and setbacks.',days:2,fee:8,docs:[['رقم القسيمة','Plot number']]}];
const SV=Object.fromEntries(SERV.map(s=>[s.id,s]));
const CATS=[['all','الكل','All'],['permits','التصاريح','Permits'],['realestate','المعاملات العقارية','Property transactions'],['business','تراخيص الأعمال','Business licences'],['planning','الموافقات التخطيطية','Planning approvals']];
const STEPS=[['received','تم الاستلام','Received'],['review','قيد المراجعة','Under review'],['docs','مطلوب استكمال','Completion required'],['final','تمت الموافقة','Approved']];
const REQ_BASE=[
{id:'SR-2026-0031',sv:'s1',plot:'PL-E-058',date:[3,9],status:'review',notes:['تم استلام الطلب وتسجيله في النظام.','المخططات قيد المراجعة لدى قسم الهندسة.'],dates:[[3,9],[5,9]]},
{id:'SR-2026-0027',sv:'s4',plot:'PL-D-015',date:[25,8],status:'docs',notes:['تم استلام الطلب.','اكتملت مراجعة البيانات الأولية.','عقد البيع غير مقروء، يرجى رفع نسخة أوضح.'],dates:[[25,8],[28,8],[2,9]]},
{id:'SR-2026-0019',sv:'s5',plot:'PL-B-041',date:[2,8],status:'approved',notes:['تم استلام الطلب.','راجع الموظف البيانات.','لا يوجد نقص في المستندات.','تمت الموافقة، الشهادة متاحة للتحميل.'],dates:[[2,8],[3,8],[3,8],[4,8]]},
{id:'SR-2026-0012',sv:'s9',plot:'PL-F-009',date:[14,7],status:'rejected',notes:['تم استلام الطلب.','قيد المراجعة.','لا يوجد نقص.','رُفض الطلب لعدم مطابقة أبعاد اللوحة.'],dates:[[14,7],[16,7],[18,7],[21,7]]}];
S.requests=REQ_BASE.map(r=>({...r}));
const NOTIFS=[
{ic:'warn',ar:'الطلب SR-2026-0027 يحتاج إلى مستند إضافي.',en:'Request SR-2026-0027 needs an additional document.',t:[2,9],req:'SR-2026-0027'},
{ic:'check',ar:'تمت الموافقة على الطلب SR-2026-0019.',en:'Request SR-2026-0019 has been approved.',t:[4,8],req:'SR-2026-0019'},
{ic:'bell',ar:'بدأت مراجعة الطلب SR-2026-0031.',en:'Review has started on SR-2026-0031.',t:[5,9],req:'SR-2026-0031'},
{ic:'bell',ar:'سعر جديد لوحدة محفوظة لديك.',en:'A saved property has a new price.',t:[10,9],req:null}];
const NEWS=[
{k:'solar',s:31,m:'day',d:[12,9],ar:'إطلاق أكبر محطة طاقة شمسية بالمدينة',en:'City’s largest solar plant goes live',ta:'تغطي المحطة الجديدة 30% من احتياج الأحياء الشمالية.',te:'The new plant covers 30% of northern district demand.'},
{k:'garden',s:32,m:'dawn',d:[28,8],ar:'افتتاح حديقة الواحة المركزية',en:'Oasis Central Park opens to the public',ta:'خمسة هكتارات من المسارات والمسطحات الخضراء.',te:'Five hectares of paths and lawns.'},
{k:'tower',s:33,m:'wine',d:[15,8],ar:'توقيع اتفاقية مطوري الأفق الجديدة',en:'New Ufuq developer agreements signed',ta:'مشاريع سكنية وتجارية جديدة بقيمة 240 مليون ر.ع.',te:'New residential and commercial schemes worth OMR 240M.'}];
const USERS={
citizen:{role:'citizen',ar:'سالم الهنائي',en:'Salim Al Hinai',civil:'12345678',phone:'+968 9123 4567',email:'salim@example.om'},
developer:{role:'developer',ar:'شركة الأفق العمرانية',en:'Ufuq Urban Development',civil:'CR-1029384',phone:'+968 2400 1122',email:'sales@ufuq.example.om',dev:'d1'},
employee:{role:'employee',ar:'مريم الكندي',en:'Maryam Al Kindi',civil:'MIN-4471',phone:'+968 2400 0000',email:'m.kindi@ministry.example.om'}};
const ROLE_T={citizen:['مواطن','Citizen'],developer:['مطوّر','Developer'],employee:['موظف الوزارة','Ministry employee']};
const MONTHS12=()=>S.lang==='ar'?MON_AR.slice():MON_EN.slice();
