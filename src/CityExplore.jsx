import { useEffect, useRef, useState } from 'react'
import { GraduationCap, HeartPulse, Home, Landmark, Leaf, MapPin, ShoppingBag, Trees, Users } from 'lucide-react'
import cityView from './assets/3D.png'
import generalImage from './assets/general.jpeg'
import greenImage from './assets/green.jpeg'
import hospitalImage from './assets/hospital.jpeg'
import housingImage from './assets/Housing.jpeg'
import mosqueImage from './assets/mosque.jpeg'
import schoolImage from './assets/school.jpeg'
import shopsImage from './assets/shops.jpeg'
import './cityExplore.css'

function MosqueIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18M5 21V8m-1 0h2L5 3 4 8Zm5 13v-8h10v8M9 13c0-4 5-4 5-7 0 3 5 3 5 7M14 6V3m0 0a2 2 0 0 0 2-2M12 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  )
}

const places = [
  { id: 'parks', icon: Trees, label: { ar: 'المساحات الخضراء', en: 'Green spaces' }, mapLayer: 'park', x: 28, y: 34, crop: '43% 40%', image: greenImage, description: { ar: 'مساحات خضراء ممتدة في قلب المدينة.', en: 'Expansive green spaces at the heart of the city.' } },
  { id: 'homes', icon: Home, label: { ar: 'الأحياء السكنية', en: 'Residential districts' }, mapLayer: 'districts', x: 76, y: 65, crop: '82% 75%', image: housingImage, description: { ar: 'أحياء تتكامل فيها الحياة والخدمات.', en: 'Districts where daily life and services come together.' } },
  { id: 'services', icon: Landmark, label: { ar: 'المرافق والخدمات', en: 'Facilities and services' }, mapLayer: 'facilities', x: 39, y: 57, crop: '39% 61%', image: generalImage, description: { ar: 'مرافق وخدمات متصلة بمختلف أحياء المدينة.', en: 'Connected facilities and services across the city.' } },
  { id: 'shopping', icon: ShoppingBag, label: { ar: 'المراكز التجارية', en: 'Shopping centers' }, mapLayer: 'shopping', x: 12, y: 47, crop: '13% 46%', image: shopsImage, description: { ar: 'وجهات للتسوق واللقاء بالقرب من الأحياء.', en: 'Places to shop and meet close to every district.' } },
  { id: 'education', icon: GraduationCap, label: { ar: 'التعليم', en: 'Education' }, mapLayer: 'school', x: 43, y: 26, crop: '49% 27%', image: schoolImage, description: { ar: 'مرافق تعليمية ضمن نسيج المدينة.', en: 'Educational facilities woven into the city.' } },
  { id: 'health', icon: HeartPulse, label: { ar: 'الصحة', en: 'Healthcare' }, mapLayer: 'health', x: 76, y: 45, crop: '79% 47%', image: hospitalImage, description: { ar: 'مرافق صحية قريبة من المجتمع.', en: 'Healthcare facilities close to the community.' } },
  { id: 'mosques', icon: MosqueIcon, label: { ar: 'المساجد', en: 'Mosques' }, mapLayer: 'mosque', x: 55, y: 40, crop: '57% 40%', image: mosqueImage, description: { ar: 'مساجد تتوسط الأحياء وتجمع سكانها.', en: 'Mosques at the center of neighborhoods and community life.' } },
]

const overview = [
  { id: 'green', icon: Leaf, value: '40%', count: 40, suffix: '%', label: { ar: 'مساحات خضراء', en: 'Green spaces' } },
  { id: 'homes', icon: Home, value: '12,000+', count: 12000, suffix: '+', label: { ar: 'وحدة سكنية', en: 'Residential units' } },
  { id: 'people', icon: Users, value: '60,000+', count: 60000, suffix: '+', label: { ar: 'من السكان المتوقع', en: 'Expected residents' } },
  { id: 'area', icon: MapPin, value: '14.8', count: 14.8, decimals: 1, unit: { ar: 'كم²', en: 'km²' }, label: { ar: 'المساحة الإجمالية', en: 'Total area' } },
]

const exploreCopy = {
  ar: { light: 'إضاءة مخطط مدينة السلطان هيثم', image: 'تصور جوي لمدينة السلطان هيثم عند الغروب، تتوسطها الحدائق والممرات المائية', show: 'عرض', on2d: 'على الخريطة ثنائية الأبعاد', north: 'الشمال', hint: 'اختر وجهتك واكتشف المدينة', nav: 'استكشف مرافق المدينة' },
  en: { light: 'Illuminate the Sultan Haitham City plan', image: 'Aerial visualization of Sultan Haitham City at sunset with gardens and waterways', show: 'Show', on2d: 'on the 2D map', north: 'North', hint: 'Choose a destination and explore the city', nav: 'Explore city facilities' },
}

export default function CityExplore({ mapUrl, language = 'ar' }) {
  const [selected, setSelected] = useState('parks')
  const viewport = useRef(null)
  const canvas = useRef(null)
  const selectedPlace = useRef(places[0])
  const active = places.find(place => place.id === selected)
  const copy = exploreCopy[language]

  useEffect(() => {
    const field = viewport.current
    const observer = new ResizeObserver(() => {
      if (window.matchMedia('(max-width: 700px)').matches) {
        field.scrollLeft = canvas.current.offsetWidth * selectedPlace.current.x / 100 - field.clientWidth / 2
      } else {
        field.scrollLeft = 0
      }
    })
    observer.observe(field)
    return () => observer.disconnect()
  }, [])

  function selectPlace(place) {
    selectedPlace.current = place
    setSelected(place.id)
    illuminateMap()
    const field = viewport.current
    if (field && canvas.current && window.matchMedia('(max-width: 700px)').matches) {
      field.scrollTo({
        left: canvas.current.offsetWidth * place.x / 100 - field.clientWidth / 2,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })
    }
  }

  function illuminateMap() {
    const image = canvas.current?.querySelector('.masterplan-image')
    if (!image) return
    image.classList.remove('is-illuminated')
    void image.offsetWidth
    image.classList.add('is-illuminated')
  }

  function open2DMap(place) {
    try {
      sessionStorage.setItem('shc_referrer_section', '/#direct-access')
    } catch (_) {}
    window.location.assign(`${mapUrl}?layer=${encodeURIComponent(place.mapLayer)}`)
  }

  return (
    <section id="city-map" className="masterplan-stage" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} aria-labelledby="masterplan-title" style={{ '--masterplan-image': `url("${cityView}")` }}>
      <div className="masterplan-viewport" ref={viewport} data-lenis-prevent-touch>
        <div className="masterplan-canvas" ref={canvas}>
          <button className="masterplan-image-button" type="button" onClick={illuminateMap} aria-label={copy.light}>
            <img className="masterplan-image" src={cityView} alt={copy.image} />
          </button>
          <div className="masterplan-shade" aria-hidden="true" />
          {places.map(place => {
            const Icon = place.icon
            return (
              <div className={`masterplan-marker${selected === place.id ? ' is-selected' : ''}`} key={place.id} style={{ left: `${place.x}%`, top: `${place.y}%` }}>
                <button
                  className="masterplan-pin"
                  type="button"
                  aria-label={`${copy.show} ${place.label[language]} ${copy.on2d}`}
                  onClick={() => open2DMap(place)}
                >
                  <span className="masterplan-pin-icon"><Icon size={25} aria-hidden="true" /></span>
                  <span className="masterplan-pin-label" dir={language === 'ar' ? 'rtl' : 'ltr'}>{place.label[language]}</span>
                </button>
                <span className="masterplan-stem" aria-hidden="true" />
                <span className="masterplan-point" aria-hidden="true" />
              </div>
            )
          })}
        </div>
      </div>

      <header className="masterplan-header">
        <div className="masterplan-brand">
        </div>
        <dl className="masterplan-stats">
          {overview.map(({ id, icon: Icon, value, count, decimals = 0, suffix = '', unit, label }) => (
            <div className="masterplan-stat" key={id}>
              <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
              <dt>{label[language]}</dt>
              <dd><b className="masterplan-stat-number" dir="ltr" data-count={count} data-decimals={decimals} data-suffix={suffix}>{value}</b>{unit && <span>{unit[language]}</span>}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="masterplan-compass" aria-label={copy.north}><span />N</div>

      <footer className="masterplan-footer">
        <div className="masterplan-caption">
          <p aria-live="polite"><strong>{active.label[language]}</strong><span>{active.description[language]}</span></p>
          <span className="masterplan-hint"><MapPin size={13} aria-hidden="true" />{copy.hint}</span>
        </div>
        <nav className="masterplan-categories" aria-label={copy.nav} data-lenis-prevent-touch>
          {places.map(place => (
            <button key={place.id} className={`masterplan-card${selected === place.id ? ' is-selected' : ''}`} type="button" aria-pressed={selected === place.id} onClick={() => selectPlace(place)}>
              <span
                className="masterplan-card-image"
                style={{
                  backgroundImage: place.image ? `url("${place.image}")` : undefined,
                  backgroundPosition: place.image ? 'center' : place.crop,
                  backgroundSize: place.image ? 'cover' : undefined,
                }}
                aria-hidden="true"
              />
              <span className="masterplan-card-label">{place.label[language]}</span>
            </button>
          ))}
        </nav>
      </footer>
    </section>
  )
}
