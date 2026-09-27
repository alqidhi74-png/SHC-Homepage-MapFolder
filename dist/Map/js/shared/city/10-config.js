/* ============================================================================
   SMART CITY — master-plan configuration (SC.CFG)
   ----------------------------------------------------------------------------
   Everything that DEFINES the city lives here as data, so districts, road
   classes, facilities and architectural palettes can be changed or extended
   without touching the generators:
     frame      – orientation / origin of the planning grid
     boundary   – city limit (the ring boulevard follows it)
     wadi, lake – the blue-green spine (planned water + linear park)
     roads      – road classes with full cross-sections
     districts  – the six named neighbourhoods, their seeds and zoning mix
     program    – the public-facility programme (what must exist, where,
                  on which kind of road, minimum site size, names)
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC;
const CFG=SC.CFG={seed:2026};

/* ---- planning grid: arterials every 1250 m, collectors half-way (625 m),
        rotated to the site's natural ENE–SSE axis --------------------------- */
CFG.frame={o:[3000,4250],ang:-0.36,sb:1250};

/* ---- city limit (drawn clockwise on the map); smoothed by the planner ---- */
CFG.boundary=[[900,650],[2350,520],[3700,950],[5200,1400],[6450,1800],[6380,2450],[5950,3350],[6250,4350],[6000,5300],[5350,6450],[4750,6700],[4450,7400],[4550,8500],[4150,9150],[3450,8850],[2850,8350],[2600,7450],[2800,6600],[2350,5750],[1850,5250],[1250,4750],[750,4600],[700,3300],[900,2300],[1050,1550],[750,1050]];

/* ---- the wadi: natural drainage kept as a linear park with a canal,
        retention ponds, trails and bridges; it feeds the central lake -------- */
CFG.wadi={path:[[1150,760],[1450,1450],[1820,2250],[2300,3120],[2760,3850],[3000,4250],[3230,4880],[3430,5780],[3480,6660],[3640,7580],[3880,8520],[4020,9050]],width:170,channel:22,ponds:[.18,.46,.78]};
CFG.lake={c:[3000,4250],rx:300,rz:175,rot:-0.36,seed:7};

/* ---- road classes (metres). ROW = 2·(sw+cyc+park) + 2·lanes·laneW + median */
CFG.roads={
  ring:{name:['طريق الحزام','Ring Boulevard'],lanes:3,laneW:3.5,median:7,sw:5,cyc:2.2,park:0,speed:22,trees:'palm',light:40},
  art:{name:['شارع رئيسي','Arterial'],lanes:3,laneW:3.5,median:6,sw:5,cyc:2.2,park:0,speed:20,trees:'palm',light:38},
  col:{name:['شارع ثانوي','Collector'],lanes:2,laneW:3.4,median:2.4,sw:4,cyc:0,park:0,speed:15,trees:'ghaf',light:34},
  loc:{name:['شارع محلي','Local street'],lanes:1,laneW:3.3,median:0,sw:3,cyc:0,park:2.4,speed:9,trees:'street',light:30},
  drv:{name:['طريق الوادي','Wadi drive'],lanes:1,laneW:3.3,median:0,sw:3.5,cyc:0,park:2.4,speed:10,trees:'street',light:30}};
for(const k in CFG.roads){const r=CFG.roads[k];r.cw=2*(r.lanes*r.laneW+r.park)+r.median;r.row=r.cw+2*(r.sw+r.cyc);r.k=k}
CFG.rank={ring:4,art:3,col:2,drv:1,loc:1};
CFG.junction={roundR:{'art/art':36,'art/ring':36,'ring/ring':36,'col/col':20}};

/* ---- districts (ids kept from the original portal: nb1 … nb6) ---------- */
CFG.districts=[
  {id:'nb2',seed:[3000,4250],w:1000,infra:2014,role:'core',   ar:'المركز الذكي',en:'Smart Center'},
  {id:'nb3',seed:[1750,1650],w:0,  infra:2016,role:'wadi',    ar:'ضفاف الوادي',en:'Wadi Banks'},
  {id:'nb1',seed:[1350,3650],w:0,  infra:2018,role:'oasis',   ar:'الواحة الخضراء',en:'Green Oasis'},
  {id:'nb4',seed:[3450,7250],w:0,  infra:2019,role:'villas',  ar:'حدائق النخيل',en:'Palm Gardens'},
  {id:'nb5',seed:[4800,2450],w:0,  infra:2021,role:'hills',   ar:'تلال الياسمين',en:'Jasmine Hills'},
  {id:'nb6',seed:[5150,4950],w:150,infra:2022,role:'front',   ar:'واجهة الأفق',en:'Ufuq Front'}];

/* ---- zoning of each 625 m neighbourhood unit, by district role.
        Units touching an arterial get a commercial frontage automatically. */
CFG.zoning={
  core:  {near:'cbd',far:'apartments'},
  wadi:  {near:'apartments',far:'villas'},
  oasis: {near:'villas',far:'villas'},
  villas:{near:'villas',far:'townhouses'},
  hills: {near:'townhouses',far:'villas'},
  front: {near:'business',far:'apartments'}};
/* local-street spacing per zone (along u / along v, metres) */
CFG.streets={villas:[92,250],townhouses:[86,215],apartments:[150,165],cbd:[128,128],business:[160,160],mixed:[140,150]};

/* ---- public-facility programme ----------------------------------------
   site:'unit' reserves a whole neighbourhood unit (no local streets inside),
   site:'block' takes one block. near: district ids or role keywords.
   fac: id used by the portal's facility list (js/03-data.js FAC).       */
CFG.program=[
  {kind:'park_central',site:'central',name:['حديقة المدينة الذكية','Smart City Park'],fac:'f14',t:'park'},
  {kind:'mosque_grand',site:'block',district:'nb2',front:'art',minA:26000,name:['جامع السلطان هيثم','Sultan Haitham Grand Mosque'],fac:'f9',t:'mosque',landmark:1},
  {kind:'library',site:'block',district:'nb2',nearLake:1,minA:9000,name:['مكتبة المدينة العامة','City Public Library'],t:'culture'},
  {kind:'cultural',site:'block',district:'nb2',nearLake:1,minA:12000,name:['مركز السلطان هيثم الثقافي','Sultan Haitham Cultural Centre'],t:'culture',landmark:1},
  {kind:'museum',site:'block',district:'nb2',nearLake:1,minA:9000,name:['متحف الوادي والذاكرة','Wadi Heritage Museum'],t:'culture'},
  {kind:'civic',site:'block',district:'nb2',front:'art',minA:12000,name:['مبنى البلدية ومركز الخدمات','Municipality & Citizen Services Hall'],t:'govt'},
  {kind:'police_hq',site:'block',district:'nb2',front:'art',minA:10000,name:['مركز شرطة المدينة','City Police Headquarters'],t:'govt'},
  {kind:'mall',site:'unitpart',district:'nb2',front:'art',minA:70000,name:['مول الأفق','Ufuq Mall'],t:'shopping',landmark:1},
  {kind:'hospital',site:'unitpart',district:'nb6',front:'art',minA:60000,name:['مستشفى الياسمين التخصصي','Yasmin Specialist Hospital'],fac:'f7',t:'health',landmark:1},
  {kind:'university',site:'unit',district:'nb3',front:'art',minA:180000,name:['جامعة السلطان هيثم','Sultan Haitham University'],t:'school',landmark:1},
  {kind:'college',site:'unitpart',district:'nb6',front:'col',minA:45000,name:['كلية التقنية الذكية','Smart Technology College'],t:'school'},
  {kind:'stadium',site:'unit',district:'nb5',front:'art',minA:200000,name:['مدينة الياسمين الرياضية','Jasmine Sports City'],t:'sports',landmark:1},
  {kind:'fire',site:'block',district:'nb6',front:'art',minA:7000,name:['مركز الدفاع المدني والإسعاف','Civil Defence & Ambulance Centre'],t:'govt'},
  {kind:'fire',site:'block',district:'nb3',front:'art',minA:7000,name:['محطة الدفاع المدني – الوادي','Wadi Civil Defence Station'],t:'govt'},
  {kind:'police',site:'block',district:'nb4',front:'art',minA:6000,name:['مركز شرطة حدائق النخيل','Palm Gardens Police Station'],t:'govt'},
  {kind:'police',site:'block',district:'nb5',front:'art',minA:6000,name:['مركز شرطة تلال الياسمين','Jasmine Hills Police Station'],t:'govt'},
  {kind:'clinic',site:'block',district:'nb2',front:'col',minA:6000,name:['مركز السلطان الصحي','Sultan Health Centre'],fac:'f5',t:'health'},
  {kind:'clinic',site:'block',district:'nb3',front:'col',minA:6000,name:['عيادة الضفاف','Dafaf Clinic'],fac:'f6',t:'health'},
  {kind:'clinic',site:'block',district:'nb4',front:'col',minA:6000,name:['مجمع حدائق النخيل الصحي','Palm Gardens Health Centre'],t:'health'},
  {kind:'sportshall',site:'block',district:'nb1',front:'col',minA:12000,name:['صالة الواحة الرياضية','Oasis Indoor Sports Hall'],t:'sports'},
  {kind:'fuel',site:'block',district:'nb4',front:'art',minA:3500,name:['محطة وقود ذكية – الجنوب','Smart Fuel & EV Station South'],t:'petrol'},
  {kind:'fuel',site:'block',district:'nb5',front:'art',minA:3500,name:['محطة وقود ذكية – الشمال','Smart Fuel & EV Station North'],t:'petrol'},
  {kind:'fuel',site:'block',district:'nb1',front:'art',minA:3500,name:['محطة وقود ذكية – الغرب','Smart Fuel & EV Station West'],t:'petrol'},
  {kind:'post',site:'block',district:'nb2',front:'col',minA:3000,name:['مكتب بريد المركز','Central Post Office'],t:'post'},
  {kind:'post',site:'block',district:'nb4',front:'col',minA:3000,name:['مكتب بريد النخيل','Palm Gardens Post Office'],t:'post'},
  {kind:'substation',site:'block',district:'nb6',edge:1,minA:9000,name:['محطة الكهرباء الفرعية الذكية','Smart Grid Substation'],t:'utility'},
  {kind:'reservoir',site:'block',district:'nb5',edge:1,minA:9000,name:['خزانات المياه والمراقبة الذكية','Water Reservoir & Smart Monitoring'],t:'utility'},
  {kind:'depot',site:'block',district:'nb6',edge:1,minA:14000,name:['مجمع الحافلات الكهربائية','Electric Bus Depot'],t:'utility'},
  {kind:'hotel',site:'block',district:'nb2',nearLake:1,minA:9000,name:['فندق بحيرة المدينة','City Lake Hotel'],t:'hospitality'},
  {kind:'souq',site:'block',district:'nb2',front:'col',minA:10000,name:['سوق المدينة','City Souq'],t:'shopping'},
  {kind:'parking',site:'block',district:'nb2',front:'col',minA:5000,name:['مواقف ذكية متعددة الطوابق','Smart Multi-storey Car Park'],t:'utility'}];

/* one neighbourhood centre (mosque + school + kindergarten + park + shops +
   community hall) per residential superblock; names cycle through these: */
CFG.centreNames={
  mosque:[['جامع الواحة','Al Waha Mosque','f8'],['مسجد الوادي','Al Wadi Mosque','f10'],['مسجد النخيل','Al Nakheel Mosque','f11'],['مسجد الياسمين','Yasmin Mosque','f12'],['مسجد الأفق','Al Ufuq Mosque'],['مسجد السلام','As-Salam Mosque'],['مسجد النور','An-Noor Mosque'],['مسجد الرحمة','Ar-Rahma Mosque'],['مسجد الفرقان','Al Furqan Mosque'],['مسجد التقوى','At-Taqwa Mosque'],['مسجد الهدى','Al Huda Mosque'],['مسجد البركة','Al Baraka Mosque']],
  school:[['مدرسة الواحة الأساسية','Al Waha Primary School','f1'],['مدرسة المركز الدولية','Centre International School','f2'],['مدرسة النخيل للبنات','Al Nakheel Girls’ School','f3'],['مدرسة الأفق الثانوية','Ufuq Secondary School','f4'],['مدرسة الياسمين للتعليم الأساسي','Yasmin Basic Education School'],['مدرسة الوادي الثانوية','Wadi Secondary School'],['مدرسة المستقبل','Al Mustaqbal School'],['مدرسة الريادة','Al Riyada School'],['مدرسة المعرفة','Al Ma’rifa School'],['مدرسة الإبداع','Al Ibda’ School']],
  park:[['حديقة الواحة المركزية','Oasis Central Park','f13'],['منتزه ضفاف الوادي','Wadi Banks Promenade','f15'],['حدائق النخيل العامة','Palm Gardens Park','f16'],['حديقة الأفق','Ufuq Green','f17'],['حديقة الياسمين','Jasmine Park'],['حديقة الحي','Neighbourhood Park'],['حديقة الأطفال','Children’s Garden'],['حديقة الريحان','Rayhan Park']],
  kg:[['روضة البراعم','Al Bara’im Kindergarten'],['روضة الزهور','Az-Zuhur Kindergarten'],['روضة النجوم','An-Nujum Kindergarten'],['روضة الأمل','Al Amal Kindergarten'],['روضة الفراشات','Butterflies Kindergarten'],['روضة الغد','Al Ghad Kindergarten']],
  community:[['المركز المجتمعي','Community Centre']]};

/* ---- facility categories (legend type, label, colour of the data view) -- */
CFG.cats={
  residential:{bt:'res',ar:'سكني',en:'Residential'},
  commercial:{bt:'com',ar:'تجاري',en:'Commercial'},
  office:{bt:'com',ar:'مكاتب وأعمال',en:'Offices & business'},
  shopping:{bt:'com',ar:'تسوق',en:'Shopping'},
  hospitality:{bt:'com',ar:'ضيافة',en:'Hospitality'},
  education:{bt:'svc',ar:'تعليم',en:'Education'},
  health:{bt:'svc',ar:'رعاية صحية',en:'Healthcare'},
  religious:{bt:'svc',ar:'ديني',en:'Religious'},
  culture:{bt:'svc',ar:'ثقافة',en:'Culture'},
  sports:{bt:'svc',ar:'رياضة',en:'Sports'},
  security:{bt:'gov',ar:'أمن وطوارئ',en:'Security & emergency'},
  civic:{bt:'gov',ar:'خدمات حكومية',en:'Government services'},
  utility:{bt:'gov',ar:'بنية تحتية',en:'Infrastructure'},
  transport:{bt:'gov',ar:'نقل',en:'Transport'}};
})(typeof window!=='undefined'?window:globalThis);
