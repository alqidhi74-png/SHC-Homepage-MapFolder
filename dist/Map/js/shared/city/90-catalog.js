/* ============================================================================
   SMART CITY — BUILDING & FACILITY CATALOG (SC.catalog)
   ----------------------------------------------------------------------------
   One entry per building kind produced by the master plan. Each entry gives
     label        type name (ar / en)
     bt           portal category  res | gov | com | svc   (legend colours)
     t2           land-use class used by the map's "colour by use" layer
     icon         portal icon name (js/02-core.js IC)
     desc         one-line description
     services     what the building offers
     smart        smart-city systems installed
     metrics(r,R) key figures (beds, students, capacity …) — deterministic
                  per building, seeded from its id
     live(r,t)    simulated real-time readings (occupancy, energy, queue …)
   To add a new facility type: add a site plan (15-sites.js), a builder
   (52-facilities.js) and an entry here — nothing else needs to change.
   ============================================================================ */
(function(root){
'use strict';
const SC=root.SC;
const n=(x)=>Math.round(x).toLocaleString('en-US');
const pct=x=>Math.round(x)+'%';
const wave=(t,p,ph)=>.5+.5*Math.sin(t/p*6.283+ph);
/* shared smart features */
const SM={
  bms:['نظام إدارة المبنى الذكي','Smart building management (BMS)'],solar:['ألواح شمسية على السطح','Rooftop solar PV'],ev:['شواحن سيارات كهربائية','EV charging points'],
  park:['مواقف ذكية بحساسات إشغال','Smart parking with occupancy sensors'],cctv:['كاميرات مراقبة ذكية','AI-assisted CCTV'],wifi:['واي فاي عام مجاني','Free public Wi-Fi'],
  meter:['عدادات ذكية للكهرباء والمياه','Smart electricity & water meters'],bins:['حاويات نفايات ذكية','Smart waste bins'],air:['حساسات جودة الهواء','Air-quality sensors'],
  irr:['ري ذكي بالمياه المعالجة','Smart irrigation with recycled water'],light:['إنارة LED متكيفة','Adaptive LED lighting'],access:['دخول ذكي بالهوية الرقمية','Digital-ID smart access'],
  queue:['نظام انتظار إلكتروني','E-queue system'],screen:['شاشات معلومات رقمية','Digital information screens'],cool:['تبريد مركزي موفر للطاقة','Efficient district cooling'],
  emr:['ربط بالطوارئ ومركز العمليات','Linked to the city operations centre'],iot:['حساسات إنترنت الأشياء','IoT sensor network'],water:['إعادة تدوير المياه الرمادية','Grey-water recycling']};
const K={};
const def=(kinds,o)=>{for(const k of kinds.split(' '))K[k]=o};
/* ------------------------------------------------------------- housing -- */
def('villa',{label:['فيلا','Villa'],bt:'res',t2:'villa',icon:'home',
  desc:['فيلا عائلية مستقلة ضمن سور خاص مع حديقة ومواقف.','Detached family villa in a walled garden plot with parking.'],
  services:[['حديقة خاصة','Private garden'],['مجلس ضيوف','Majlis'],['موقف مظلل لسيارتين','Shaded parking for two cars']],smart:[SM.meter,SM.solar,SM.access],
  metrics:(r,R)=>[[['غرف النوم','Bedrooms'],String(4+Math.floor(R()*3))],[['مساحة الأرض','Plot area'],n(r.plotA)+' m²'],[['مساحة البناء','Built area'],n(r.gfa)+' m²']],
  live:(r,t,R)=>[[['الاستهلاك الآن','Power now'],(2+R()*3*wave(t,90,r.idx)).toFixed(1)+' kW'],[['إنتاج شمسي','Solar output'],(3*(.6+.4*wave(t,300,1))).toFixed(1)+' kW']]});
def('townhouse',{label:['تاون هاوس','Townhouse'],bt:'res',t2:'res_med',icon:'home',
  desc:['صف منازل متلاصقة بواجهات متناسقة وأفنية خلفية.','Terrace of family townhouses with front gardens and rear courtyards.'],
  services:[['فناء خاص','Private courtyard'],['سطح قابل للاستخدام','Usable roof terrace'],['مواقف أمامية','Front parking']],smart:[SM.meter,SM.solar],
  metrics:(r,R)=>[[['الوحدات','Units'],String(r.units||4)],[['الطوابق','Floors'],String(r.floors)],[['المساحة الإجمالية','Gross area'],n(r.gfa)+' m²']]});
def('apartment',{label:['عمارة سكنية','Apartment building'],bt:'res',t2:'apartment',icon:'building',
  desc:['مبنى شقق متوسط الارتفاع حول فناء مظلل مع محلات في الطابق الأرضي.','Mid-rise apartment building around a shaded courtyard, shops at street level.'],
  services:[['شقق 1–3 غرف','1–3 bedroom apartments'],['مواقف سفلية','Basement parking'],['نادي رياضي','Residents’ gym'],['ملعب أطفال','Children’s play area']],smart:[SM.bms,SM.meter,SM.park,SM.access,SM.bins],
  metrics:(r,R)=>[[['الشقق','Apartments'],n(r.gfa/110)],[['السكان (تقديري)','Residents (est.)'],n(r.gfa/110*3.6)],[['الطوابق','Floors'],String(r.floors)]],
  live:(r,t,R)=>[[['الإشغال','Occupancy'],pct(82+R()*14)],[['المواقف المتاحة','Parking free'],String(Math.round(4+R()*20*wave(t,200,r.idx)))]]});
def('tower',{label:['برج','Tower'],bt:'res',t2:'apartment',icon:'building',
  desc:['برج متعدد الاستخدامات بواجهة زجاجية وتظليل عماني معاصر.','High-rise with a glazed skin and contemporary Omani shading screens.'],
  services:[['ردهة استقبال','Lobby & concierge'],['مواقف متعددة الطوابق','Multi-level parking'],['حوض سباحة على السطح','Rooftop pool'],['مطاعم في المنصة','Podium dining']],smart:[SM.bms,SM.cool,SM.park,SM.ev,SM.access,SM.cctv],
  metrics:(r,R)=>[[['الطوابق','Floors'],String(r.floors)],[['الارتفاع','Height'],Math.round(r.h)+' m'],[['المساحة الإجمالية','Gross area'],n(r.gfa)+' m²']],
  live:(r,t,R)=>[[['الإشغال','Occupancy'],pct(70+R()*25)],[['المصاعد العاملة','Lifts in service'],(4+Math.floor(R()*3))+'/'+(6+Math.floor(R()*2))],[['الطاقة','Power'],n(400+R()*900*wave(t,120,r.idx))+' kW']]});
def('office',{label:['مبنى مكاتب','Office building'],bt:'com',t2:'office',icon:'building',
  desc:['مبنى مكاتب من الفئة الأولى بواجهة مظللة ومساحات مرنة.','Grade-A office building with a shaded façade and flexible floors.'],
  services:[['مساحات عمل مرنة','Flexible workspace'],['قاعات اجتماعات','Meeting rooms'],['مقهى','Café'],['مواقف','Parking']],smart:[SM.bms,SM.cool,SM.park,SM.access,SM.ev],
  metrics:(r,R)=>[[['الموظفون (تقديري)','Workers (est.)'],n(r.gfa/14)],[['الطوابق','Floors'],String(r.floors)],[['المساحة المكتبية','Office area'],n(r.gfa*.82)+' m²']],
  live:(r,t,R)=>[[['الإشغال الآن','Occupancy now'],pct(40+50*wave(t,400,r.idx))],[['المواقف المتاحة','Parking free'],String(Math.round(10+R()*60))]]});
def('mixed',{label:['مبنى متعدد الاستخدامات','Mixed-use building'],bt:'com',t2:'retail',icon:'store',
  desc:['محلات ومقاهٍ في الطابق الأرضي وشقق ومكاتب فوقها.','Shops and cafés at ground level with apartments and offices above.'],
  services:[['محلات تجزئة','Retail units'],['مقاهٍ بجلسات خارجية','Cafés with outdoor seating'],['شقق','Apartments']],smart:[SM.meter,SM.bins,SM.wifi],
  metrics:(r,R)=>[[['المحلات','Shop units'],String(4+Math.floor(r.gfa/900))],[['الشقق','Apartments'],n(r.gfa*.6/100)],[['الطوابق','Floors'],String(r.floors)]]});
/* ------------------------------------------------------------ commerce --- */
const shop=(label,desc,services,extra={})=>Object.assign({label,bt:'com',t2:'retail',icon:'store',desc,services,smart:[SM.meter,SM.park,SM.bins,SM.ev],
  metrics:(r,R)=>[[['المساحة','Floor area'],n(r.gfa)+' m²'],[['المواقف','Parking bays'],String(10+Math.floor(R()*30))],[['ساعات العمل','Opening hours'],'8:00 – 23:00']],
  live:(r,t,R)=>[[['الزوار الآن','Visitors now'],String(Math.round(10+120*wave(t,300,r.idx)*R()))],[['المواقف المتاحة','Parking free'],String(Math.round(2+R()*18))]]},extra);
K.retail=shop(['محلات تجارية','Retail parade'],['صف محلات بواجهات زجاجية ومظلات على الشارع التجاري.','Row of shopfronts with canopies on the local high street.'],[['محلات يومية','Everyday shops'],['صيدلية','Pharmacy'],['صراف آلي','ATM']]);
K.supermarket=shop(['سوبرماركت','Supermarket'],['متجر أغذية للحي مع مواقف أمامية.','Neighbourhood food store with forecourt parking.'],[['أغذية طازجة','Fresh food'],['مخبز','Bakery'],['توصيل منزلي','Home delivery']]);
K.restaurant=shop(['مطعم','Restaurant'],['مطعم بجلسات داخلية وخارجية مظللة.','Restaurant with indoor and shaded outdoor dining.'],[['مأكولات عمانية','Omani cuisine'],['جلسات عائلية','Family seating'],['طلبات خارجية','Takeaway']]);
K.cafe=shop(['مقهى','Café'],['مقهى على الرصيف بطاولات خارجية تحت المظلات.','Street café with tables under parasols.'],[['قهوة عمانية','Omani coffee'],['حلويات','Sweets'],['جلسات خارجية','Outdoor seating']],{smart:[SM.wifi,SM.meter,SM.bins]});
K.showroom=shop(['صالة عرض','Showroom'],['صالة عرض بواجهة زجاجية على الطريق الشرياني.','Glass-fronted showroom on the arterial road.'],[['صالة عرض','Display hall'],['خدمة عملاء','Customer service']]);
K.fuel=shop(['محطة وقود وشحن','Fuel & EV station'],['محطة وقود بمظلة كبيرة وشواحن سريعة للسيارات الكهربائية ومتجر.','Fuel station with a large canopy, fast EV chargers and a convenience store.'],[['وقود 91/95/ديزل','Fuel 91 / 95 / diesel'],['شحن سريع','Rapid EV charging'],['متجر','Convenience store'],['غسيل سيارات','Car wash']],{t2:'transport',icon:'drop',smart:[SM.ev,SM.cctv,SM.solar,SM.meter],
  live:(r,t,R)=>[[['مضخات مشغولة','Pumps busy'],Math.round(8*wave(t,120,r.idx))+'/8'],[['شواحن متاحة','Chargers free'],Math.round(1+5*R())+'/6']]});
K.mall={label:['مركز تسوق','Shopping mall'],bt:'com',t2:'retail',icon:'store',
  desc:['مركز تسوق إقليمي بمحلات ومطاعم وسينما ومواقف متعددة الطوابق.','Regional mall with shops, food court, cinema and multi-storey parking.'],
  services:[['أكثر من 180 متجرًا','180+ stores'],['ردهة مطاعم','Food court'],['سينما','Cinema'],['منطقة ألعاب','Family entertainment'],['مصلى','Prayer rooms']],smart:[SM.bms,SM.park,SM.ev,SM.screen,SM.cctv,SM.cool,SM.wifi],
  metrics:(r,R)=>[[['المتاجر','Stores'],'184'],[['المواقف','Parking bays'],'2,400'],[['المساحة التأجيرية','Leasable area'],'96,000 m²']],
  live:(r,t,R)=>[[['الزوار الآن','Visitors now'],n(2500+6500*wave(t,600,1))],[['المواقف المتاحة','Parking free'],n(300+900*wave(t,600,3))],[['الطاقة','Power'],n(3200+900*wave(t,300,2))+' kW']]};
K.souq={label:['السوق التقليدي','Traditional souq'],bt:'com',t2:'retail',icon:'store',
  desc:['سوق مغطى بأزقة مظللة ومحلات حرفية حول ساحة.','Covered souq of shaded lanes and craft shops around a square.'],
  services:[['حرف يدوية','Handicrafts'],['عطور وبخور','Perfume & frankincense'],['مقاهٍ تقليدية','Traditional cafés']],smart:[SM.wifi,SM.screen,SM.bins,SM.cctv],
  metrics:(r,R)=>[[['المحلات','Shops'],'120'],[['الساحات','Squares'],'2']],live:(r,t)=>[[['الزوار الآن','Visitors now'],n(300+900*wave(t,500,2))]]};
K.hotel={label:['فندق','Hotel'],bt:'com',t2:'hospitality',icon:'bed',
  desc:['فندق على ضفاف البحيرة بمركز مؤتمرات ومطاعم.','Lakeside hotel with conference centre and restaurants.'],
  services:[['غرف وأجنحة','Rooms & suites'],['قاعة مؤتمرات','Conference hall'],['مسبح ونادٍ صحي','Pool & spa'],['مطاعم','Restaurants']],smart:[SM.bms,SM.access,SM.cool,SM.ev],
  metrics:(r,R)=>[[['الغرف','Rooms'],'260'],[['قاعات الاجتماعات','Meeting rooms'],'12'],[['التصنيف','Rating'],'★★★★★']],
  live:(r,t,R)=>[[['نسبة الإشغال','Occupancy'],pct(68+R()*24)],[['الغرف المتاحة','Rooms available'],String(Math.round(20+R()*60))]]};
/* ----------------------------------------------------------- religious --- */
def('mosque masjid',{label:['مسجد','Mosque'],bt:'svc',t2:'religious',icon:'mosque',
  desc:['مسجد بصحن وقبة ومئذنة ومصلى للنساء وميضأة ومواقف.','Mosque with courtyard (sahn), dome, minaret, ladies’ hall, ablutions and parking.'],
  services:[['الصلوات الخمس والجمعة','Daily & Friday prayers'],['مصلى للنساء','Ladies’ prayer hall'],['حلقات تحفيظ','Qur’an classes'],['ميضأة','Ablution area']],smart:[SM.cool,SM.solar,SM.light,SM.water],
  metrics:(r,R)=>[[['السعة','Capacity'],n(r.kind==='masjid'?350:900+R()*600)+' '],[['المواقف','Parking'],String(r.kind==='masjid'?20:60+Math.floor(R()*40))]],
  live:(r,t)=>[[['الصلاة القادمة','Next prayer'],['الظهر 12:04','Dhuhr 12:04']]]});
K.mosque_grand={label:['الجامع الكبير','Grand mosque'],bt:'svc',t2:'religious',icon:'mosque',
  desc:['جامع المدينة الكبير بصحن واسع ومئذنتين وأروقة ومكتبة إسلامية.','The city’s grand mosque: vast sahn, two 58 m minarets, riwaqs and an Islamic library.'],
  services:[['صلاة الجمعة والأعياد','Friday & Eid prayers'],['مكتبة إسلامية','Islamic library'],['مركز تعليمي','Education centre'],['جولات للزوار','Visitor tours']],smart:[SM.cool,SM.solar,SM.light,SM.park,SM.screen,SM.water],
  metrics:()=>[[['السعة','Capacity'],'8,000'],[['المآذن','Minarets'],'2'],[['المواقف','Parking bays'],'650']],live:(r,t)=>[[['الصلاة القادمة','Next prayer'],['العصر 15:28','Asr 15:28']],[['المواقف المتاحة','Parking free'],n(120+400*wave(t,700,1))]]};
/* ----------------------------------------------------------- education --- */
K.school={label:['مدرسة','School'],bt:'svc',t2:'edu',icon:'school',
  desc:['مدرسة بمبانٍ حول فناء مظلل وملاعب ومسار حافلات آمن.','School of classroom wings around shaded courtyards, sports fields and a safe bus drop-off.'],
  services:[['فصول ذكية','Smart classrooms'],['مختبرات العلوم','Science labs'],['ملعب وصالة رياضية','Sports field & hall'],['مكتبة','Library'],['حافلات مدرسية','School buses']],smart:[SM.bms,SM.solar,SM.access,SM.air,SM.wifi],
  metrics:(r,R)=>[[['الطلاب','Students'],n(600+R()*600)],[['الفصول','Classrooms'],String(24+Math.floor(R()*16))],[['المعلمون','Teachers'],String(45+Math.floor(R()*30))]],
  live:(r,t,R)=>[[['الحضور اليوم','Attendance today'],pct(92+R()*6)],[['جودة الهواء','Indoor air (CO₂)'],n(520+300*wave(t,240,r.idx))+' ppm']]};
K.kindergarten={label:['روضة أطفال','Kindergarten'],bt:'svc',t2:'edu',icon:'kid',
  desc:['روضة بفصول ملونة وملعب مظلل وحديقة آمنة.','Kindergarten with bright classrooms, a shaded playground and a safe garden.'],
  services:[['مرحلة التمهيدي','Pre-school years'],['ملعب مظلل','Shaded playground'],['نقل آمن','Safe transport']],smart:[SM.access,SM.cctv,SM.air],
  metrics:(r,R)=>[[['الأطفال','Children'],String(120+Math.floor(R()*100))],[['الفصول','Classes'],String(6+Math.floor(R()*4))]]};
K.university={label:['جامعة','University'],bt:'svc',t2:'edu',icon:'school',
  desc:['حرم جامعي بكليات ومكتبة مركزية ومختبرات وسكن طلابي ومرافق رياضية.','University campus: faculties, central library, research labs, student housing and sports.'],
  services:[['كليات الهندسة والطب والأعمال','Engineering, medicine & business faculties'],['مكتبة مركزية','Central library'],['مراكز بحثية','Research centres'],['سكن طلابي','Student housing']],smart:[SM.bms,SM.solar,SM.park,SM.ev,SM.access,SM.wifi,SM.iot],
  metrics:()=>[[['الطلاب','Students'],'12,400'],[['أعضاء هيئة التدريس','Faculty'],'860'],[['الكليات','Faculties'],'7'],[['البرامج','Programmes'],'64']],
  live:(r,t)=>[[['في الحرم الآن','On campus now'],n(3000+6000*wave(t,800,1))],[['المواقف المتاحة','Parking free'],n(200+700*wave(t,800,2))]]};
K.college={label:['كلية التقنية','Technology college'],bt:'svc',t2:'edu',icon:'school',
  desc:['كلية تطبيقية للتقنيات الذكية والذكاء الاصطناعي والطاقة المتجددة.','Applied college for smart technologies, AI and renewable energy.'],
  services:[['مختبرات الذكاء الاصطناعي','AI labs'],['حاضنة أعمال','Business incubator'],['تدريب مهني','Vocational training']],smart:[SM.bms,SM.solar,SM.iot,SM.wifi],
  metrics:()=>[[['الطلاب','Students'],'3,200'],[['المختبرات','Labs'],'28']]};
/* -------------------------------------------------------------- health --- */
K.hospital={label:['مستشفى','Hospital'],bt:'svc',t2:'healthcare',icon:'clinic',
  desc:['مستشفى تخصصي بقسم طوارئ مستقل ومهبط مروحية ومواقف إسعاف.','Specialist hospital with a dedicated emergency department, helipad and ambulance bays.'],
  services:[['طوارئ 24 ساعة','24/7 emergency'],['العناية المركزة','Intensive care'],['جراحة','Surgery'],['أمومة وطفولة','Maternity & paediatrics'],['أشعة ومختبرات','Radiology & labs']],smart:[SM.bms,SM.emr,SM.queue,SM.park,SM.cool,SM.access],
  metrics:()=>[[['الأسرّة','Beds'],'420'],[['أسرّة العناية المركزة','ICU beds'],'36'],[['غرف العمليات','Operating theatres'],'14'],[['سيارات الإسعاف','Ambulances'],'12']],
  live:(r,t,R)=>{const occ=.74+.18*wave(t,900,1);return[[['الأسرّة المتاحة','Beds available'],String(Math.round(420*(1-occ)))+' / 420'],[['انتظار الطوارئ','ER wait'],Math.round(8+22*wave(t,300,2))+' min'],[['إسعاف في الخدمة','Ambulances out'],Math.round(2+6*wave(t,200,3))+' / 12']]}};
K.clinic={label:['مركز صحي','Health centre'],bt:'svc',t2:'healthcare',icon:'clinic',
  desc:['مركز رعاية صحية أولية للحي مع صيدلية ومختبر.','Primary health-care centre for the district with pharmacy and lab.'],
  services:[['طب الأسرة','Family medicine'],['تطعيمات','Vaccinations'],['صيدلية','Pharmacy'],['مختبر','Laboratory']],smart:[SM.queue,SM.emr,SM.bms],
  metrics:(r,R)=>[[['العيادات','Clinics'],String(10+Math.floor(R()*8))],[['المراجعون يوميًا','Daily visits'],n(300+R()*250)]],
  live:(r,t)=>[[['وقت الانتظار','Waiting time'],Math.round(6+20*wave(t,300,r.idx))+' min']]};
/* ------------------------------------------------------ security / civic */
K.police_hq={label:['القيادة العامة للشرطة','Police headquarters'],bt:'gov',t2:'civic',icon:'shield',
  desc:['مقر شرطة المدينة ومركز القيادة والتحكم المرتبط بكاميرات المرور.','City police HQ and command-and-control centre linked to traffic cameras.'],
  services:[['خدمات الجوازات والمرور','Traffic & passports'],['مركز العمليات','Operations centre'],['بلاغات','Reporting desk']],smart:[SM.emr,SM.cctv,SM.access,SM.bms],
  metrics:()=>[[['الدوريات','Patrol units'],'38'],[['كاميرات مرتبطة','Linked cameras'],'1,240']],live:(r,t)=>[[['دوريات في الخدمة','Patrols on duty'],String(Math.round(18+14*wave(t,400,1)))],[['متوسط الاستجابة','Avg. response'],(5+2*wave(t,300,2)).toFixed(1)+' min']]};
K.police={label:['مركز شرطة','Police station'],bt:'gov',t2:'civic',icon:'shield',
  desc:['مركز شرطة للحي بمواقف للدوريات.','District police station with patrol-car bays.'],
  services:[['بلاغات','Reports'],['خدمات المرور','Traffic services']],smart:[SM.emr,SM.cctv,SM.access],
  metrics:()=>[[['الدوريات','Patrol units'],'8']],live:(r,t)=>[[['دوريات في الخدمة','Patrols on duty'],String(Math.round(3+4*wave(t,300,r.idx)))]]};
K.fire={label:['الدفاع المدني والإسعاف','Civil defence & ambulance'],bt:'gov',t2:'civic',icon:'shield',
  desc:['محطة دفاع مدني بمرائب للإطفاء والإسعاف وبرج تدريب.','Civil-defence station with fire and ambulance bays and a drill tower.'],
  services:[['إطفاء وإنقاذ','Fire & rescue'],['إسعاف','Ambulance'],['سلامة المباني','Building safety']],smart:[SM.emr,SM.iot,SM.cctv],
  metrics:()=>[[['سيارات الإطفاء','Fire engines'],'6'],[['سيارات الإسعاف','Ambulances'],'4']],live:(r,t)=>[[['الجاهزية','Readiness'],'100%'],[['زمن الوصول المستهدف','Target response'],'< 8 min']]};
K.civic={label:['قاعة الخدمات البلدية','Municipal services hall'],bt:'gov',t2:'civic',icon:'building',
  desc:['مبنى البلدية ومركز خدمات المواطنين الموحد ومركز عمليات المدينة الذكية.','Municipality, one-stop citizen services and the smart-city operations centre.'],
  services:[['خدمات المواطنين','Citizen services'],['تراخيص البناء','Building permits'],['مركز عمليات المدينة','City operations centre']],smart:[SM.queue,SM.bms,SM.screen,SM.solar,SM.iot],
  metrics:()=>[[['نوافذ الخدمة','Service counters'],'42'],[['الخدمات الإلكترونية','E-services'],'120+']],live:(r,t)=>[[['تذاكر الانتظار','Queue tickets'],String(Math.round(5+40*wave(t,500,1)))],[['حساسات متصلة','Sensors online'],'18,420']]};
K.post={label:['مكتب بريد','Post office'],bt:'gov',t2:'civic',icon:'mail',desc:['مكتب بريد وخزائن طرود ذكية.','Post office with smart parcel lockers.'],services:[['بريد وطرود','Mail & parcels'],['خزائن ذكية','Smart lockers']],smart:[SM.queue,SM.access],metrics:()=>[[['الخزائن','Lockers'],'240']]};
/* ------------------------------------------------------ sports / culture */
K.stadium={label:['المدينة الرياضية','Sports city'],bt:'svc',t2:'sports',icon:'gym',
  desc:['استاد بمدرجات مظللة ومضمار ألعاب قوى وملاعب تدريب وصالات.','Stadium with shaded stands, athletics track, training pitches and halls.'],
  services:[['كرة القدم','Football'],['ألعاب القوى','Athletics'],['ملاعب تدريب','Training pitches'],['فعاليات','Events']],smart:[SM.park,SM.cctv,SM.screen,SM.light,SM.solar,SM.wifi],
  metrics:()=>[[['السعة','Capacity'],'28,000'],[['ملاعب التدريب','Training pitches'],'3'],[['المواقف','Parking bays'],'3,500']],live:(r,t)=>[[['الفعالية القادمة','Next event'],['الجمعة 19:30','Fri 19:30']],[['المواقف المتاحة','Parking free'],n(2800+600*wave(t,900,1))]]};
K.sportshall={label:['صالة رياضية','Indoor sports hall'],bt:'svc',t2:'sports',icon:'gym',desc:['صالة متعددة الأغراض لكرة السلة والطائرة واليد.','Multi-sport hall for basketball, volleyball and handball.'],services:[['ملاعب داخلية','Indoor courts'],['نادٍ رياضي','Gym']],smart:[SM.bms,SM.access],metrics:()=>[[['المقاعد','Seats'],'1,800']]};
K.library={label:['المكتبة العامة','Public library'],bt:'svc',t2:'culture',icon:'file',desc:['مكتبة عامة بقاعات قراءة ومساحات رقمية للأطفال والباحثين.','Public library with reading halls, a children’s wing and digital labs.'],services:[['إعارة','Lending'],['مختبر رقمي','Digital lab'],['قاعة أطفال','Children’s wing']],smart:[SM.bms,SM.wifi,SM.access],
  metrics:()=>[[['الكتب','Volumes'],'240,000'],[['مقاعد القراءة','Reading seats'],'600']],live:(r,t)=>[[['الزوار الآن','Visitors now'],String(Math.round(40+220*wave(t,500,1)))]]};
K.cultural={label:['المركز الثقافي','Cultural centre'],bt:'svc',t2:'culture',icon:'image',desc:['مسرح وقاعات عرض وورش فنية على الساحة المركزية.','Theatre, galleries and art workshops on the central square.'],services:[['مسرح','Theatre'],['معارض','Exhibitions'],['ورش','Workshops']],smart:[SM.bms,SM.screen],metrics:()=>[[['مقاعد المسرح','Theatre seats'],'1,100']]};
K.museum={label:['متحف','Museum'],bt:'svc',t2:'culture',icon:'image',desc:['متحف تراث الوادي وتاريخ الأفلاج.','Museum of wadi heritage and the aflaj irrigation system.'],services:[['معارض دائمة','Permanent galleries'],['جولات','Guided tours']],smart:[SM.bms,SM.air,SM.screen],metrics:()=>[[['القاعات','Galleries'],'9']]};
/* -------------------------------------------------- parks and utilities */
def('park park_central',{label:['حديقة عامة','Public park'],bt:'svc',t2:'sports',icon:'tree',
  desc:['حديقة بممرات مظللة ومسطحات خضراء وملعب أطفال وأجهزة رياضية.','Park with shaded paths, lawns, a playground and outdoor fitness.'],
  services:[['ممرات مشي','Walking paths'],['ملعب أطفال','Playground'],['رياضة خارجية','Outdoor fitness'],['جلسات عائلية','Family seating']],smart:[SM.irr,SM.light,SM.wifi,SM.bins,SM.air],
  metrics:(r,R)=>[[['المساحة','Area'],(r.area/10000).toFixed(1)+' ha'],[['الأشجار','Trees'],n(r.area/140)]],live:(r,t)=>[[['رطوبة التربة','Soil moisture'],pct(34+18*wave(t,700,1))],[['الزوار الآن','Visitors now'],String(Math.round(20+200*wave(t,400,r.idx)))]]});
K.substation={label:['محطة كهرباء فرعية','Smart-grid substation'],bt:'gov',t2:'utilities',icon:'bolt',desc:['محطة تحويل ذكية مع تخزين طاقة بالبطاريات.','Smart substation with battery energy storage.'],services:[['توزيع الكهرباء','Power distribution'],['تخزين الطاقة','Battery storage']],smart:[SM.iot,SM.cctv],
  metrics:()=>[[['القدرة','Capacity'],'132/11 kV · 120 MVA'],[['التخزين','Storage'],'40 MWh']],live:(r,t)=>[[['الحمل الحالي','Load now'],pct(46+30*wave(t,900,1))],[['شحن البطاريات','Battery charge'],pct(55+35*wave(t,1200,2))]]};
K.reservoir={label:['خزان المياه','Water reservoir'],bt:'gov',t2:'utilities',icon:'drop',desc:['خزانات مياه مع مراقبة ذكية للتسربات وجودة المياه.','Water tanks with smart leak and quality monitoring.'],services:[['تخزين المياه','Water storage'],['ضخ','Pumping']],smart:[SM.iot,SM.meter],
  metrics:()=>[[['السعة','Capacity'],'60,000 m³']],live:(r,t)=>[[['مستوى الخزان','Tank level'],pct(62+25*wave(t,1500,1))],[['جودة المياه','Water quality'],['ممتازة','Excellent']]]};
K._default={label:['مبنى','Building'],bt:'svc',t2:'civic',icon:'building',desc:['مبنى ضمن المخطط العام.','Building in the master plan.'],services:[],smart:[SM.meter],metrics:()=>[]};

const DNAME={};
SC.catalog={K,SM,
  of:r=>K[r.kind]||K._default,
  /* display name for any building */
  name(r){if(r.name)return r.name;const k=K[r.kind]||K._default;return [k.label[0]+' '+(r.plotNo||''),k.label[1]+' '+(r.plotNo||'')]},
  metrics(r){const k=K[r.kind]||K._default;const R=SC.rng(1000+r.idx*7);return k.metrics?k.metrics(r,R):[]},
  live(r,t){const k=K[r.kind]||K._default;if(!k.live)return[];const R=SC.rng(5000+r.idx*13);return k.live(r,t,R)},
  /* derive areas once */
  prep(r){if(r.gfa)return;const g2=SC.g2;let fp=0,gfa=0;for(const m of r.masses||[]){if(m.role==='sailroof')continue;const a=g2.absArea(m.poly);if(!(m.y0>0))fp+=a;gfa+=a*Math.max(1,Math.round(m.h/(r.kind==='villa'||r.kind==='townhouse'?3.6:3.5)))}r.fp=Math.round(fp);r.gfa=Math.round(gfa*.9);r.plotA=Math.round(r.plot?g2.absArea(r.plot):fp);r.area=Math.round(r.plot?g2.absArea(r.plot):fp);if(r.kind==='townhouse')r.units=Math.max(2,Math.round((r.masses[0]?g2.absArea(r.masses[0].poly):200)/140))}};
})(typeof window!=='undefined'?window:globalThis);
