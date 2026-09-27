import { useEffect, useRef, useState } from 'react'
import { GraduationCap, HeartPulse, Home, Landmark, Leaf, MapPin, ShoppingBag, Trees, Users } from 'lucide-react'
import cityView from './assets/3D.png'
import './cityExplore.css'

function MosqueIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18M5 21V8m-1 0h2L5 3 4 8Zm5 13v-8h10v8M9 13c0-4 5-4 5-7 0 3 5 3 5 7M14 6V3m0 0a2 2 0 0 0 2-2M12 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  )
}

const places = [
  { id: 'homes', icon: Home, label: 'الأحياء السكنية', pinLabel: 'الأحياء السكنية', x: 76, y: 65, crop: '82% 75%', description: 'أحياء تتكامل فيها الحياة والخدمات.' },
  { id: 'parks', icon: Trees, label: 'المساحات الخضراء', pinLabel: 'المساحات الخضراء', x: 28, y: 34, crop: '43% 40%', description: 'مساحات خضراء ممتدة في قلب المدينة.' },
  { id: 'services', icon: Landmark, label: 'المرافق والخدمات', pinLabel: 'المرافق والخدمات', x: 39, y: 57, crop: '39% 61%', description: 'مرافق وخدمات متصلة بمختلف أحياء المدينة.' },
  { id: 'shopping', icon: ShoppingBag, label: 'المراكز التجارية', pinLabel: 'المراكز التجارية', x: 12, y: 47, crop: '13% 46%', description: 'وجهات للتسوق واللقاء بالقرب من الأحياء.' },
  { id: 'education', icon: GraduationCap, label: 'التعليم', pinLabel: 'التعليم', x: 43, y: 26, crop: '49% 27%', description: 'مرافق تعليمية ضمن نسيج المدينة.' },
  { id: 'health', icon: HeartPulse, label: 'الصحة', pinLabel: 'الصحة', x: 76, y: 45, crop: '79% 47%', description: 'مرافق صحية قريبة من المجتمع.' },
  { id: 'mosques', icon: MosqueIcon, label: 'المساجد', pinLabel: 'المساجد', x: 55, y: 40, crop: '57% 40%', description: 'مساجد تتوسط الأحياء وتجمع سكانها.' },
]

const overview = [
  { icon: Leaf, value: '40%', count: 40, suffix: '%', label: 'مساحات خضراء' },
  { icon: Home, value: '12,000+', count: 12000, suffix: '+', label: 'وحدة سكنية' },
  { icon: Users, value: '60,000+', count: 60000, suffix: '+', label: 'من السكان المتوقع' },
  { icon: MapPin, value: '14.8', count: 14.8, decimals: 1, unit: 'كم²', label: 'المساحة الإجمالية' },
]

export default function CityExplore() {
  const [selected, setSelected] = useState('homes')
  const viewport = useRef(null)
  const canvas = useRef(null)
  const selectedPlace = useRef(places[0])
  const active = places.find(place => place.id === selected)

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

  return (
    <section id="city-map" className="masterplan-stage" aria-labelledby="masterplan-title" style={{ '--masterplan-image': `url("${cityView}")` }}>
      <div className="masterplan-viewport" ref={viewport} data-lenis-prevent-touch>
        <div className="masterplan-canvas" ref={canvas}>
          <button className="masterplan-image-button" type="button" onClick={illuminateMap} aria-label="إضاءة مخطط مدينة السلطان هيثم">
            <img className="masterplan-image" src={cityView} alt="تصور جوي لمدينة السلطان هيثم عند الغروب، تتوسطها الحدائق والممرات المائية" />
          </button>
          <div className="masterplan-shade" aria-hidden="true" />
          {places.map(place => {
            const Icon = place.icon
            return (
              <div className={`masterplan-marker${selected === place.id ? ' is-selected' : ''}`} key={place.id} style={{ left: `${place.x}%`, top: `${place.y}%` }}>
                <button className="masterplan-pin" type="button" aria-pressed={selected === place.id} onClick={() => selectPlace(place)}>
                  <span className="masterplan-pin-icon"><Icon size={25} aria-hidden="true" /></span>
                  <span className="masterplan-pin-label" dir="rtl">{place.pinLabel}</span>
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
          <h2 id="masterplan-title">مدينة السلطان هيثم</h2>
        </div>
        <dl className="masterplan-stats">
          {overview.map(({ icon: Icon, value, count, decimals = 0, suffix = '', unit, label }) => (
            <div className="masterplan-stat" key={label}>
              <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
              <dt>{label}</dt>
              <dd><b className="masterplan-stat-number" dir="ltr" data-count={count} data-decimals={decimals} data-suffix={suffix}>{value}</b>{unit && <span>{unit}</span>}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="masterplan-compass" aria-label="الشمال"><span />N</div>

      <footer className="masterplan-footer">
        <div className="masterplan-caption">
          <p aria-live="polite"><strong>{active.label}</strong><span>{active.description}</span></p>
          <span className="masterplan-hint"><MapPin size={13} aria-hidden="true" />اختر وجهتك واكتشف المدينة</span>
        </div>
        <nav className="masterplan-categories" aria-label="استكشف مرافق المدينة" data-lenis-prevent-touch>
          {places.map(place => (
            <button key={place.id} className={`masterplan-card${selected === place.id ? ' is-selected' : ''}`} type="button" aria-pressed={selected === place.id} onClick={() => selectPlace(place)}>
              <span className="masterplan-card-image" style={{ backgroundPosition: place.crop }} aria-hidden="true" />
              <span className="masterplan-card-label">{place.label}</span>
            </button>
          ))}
        </nav>
      </footer>
    </section>
  )
}
