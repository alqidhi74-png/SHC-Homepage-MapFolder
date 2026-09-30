import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  ChevronDown,
  LogOut,
  Map,
  Landmark,
  UserRound,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import CityExplore from './CityExplore'
import { usePageTransition } from './components/PageTransition/PageTransitionProvider'
import { useAdminAuth } from './auth/AdminAuth'
import {
  getSiteProfile,
  isSiteAuthenticated,
  setSiteAuthenticated,
} from './auth/siteAuth'

import city from './assets/city.png'
import accessBackground from './assets/4.jpeg'
import sultanCity from './assets/sultan-city.png'
import cityName from './assets/city-name.png'
import logo from './assets/logo.png'
import footerImage from './assets/footer.png'
import housingLogo from './assets/housing.png'

gsap.registerPlugin(ScrollTrigger)

const SMART_MAP_URL = import.meta.env.DEV ? '/src/Map/map.html' : '/Map/map.html'
const SERVICES_URL = import.meta.env.DEV
  ? '/src/services/services-catalog.html'
  : '/Services/services-catalog.html'
const PROJECTS_URL = import.meta.env.DEV
  ? '/src/projects/al-wadi/UPDATE.html'
  : '/projects/al-wadi/UPDATE.html'

function rememberHomeEntry() {
  try {
    sessionStorage.setItem('shc_referrer_section', '/#direct-access')
  } catch (_) {}
}

function localizedProfileName(name, language) {
  if (language !== 'en') return name
  return {
    'سالم الحارثي': 'Salim Al Harthi',
    'سالم بن سعيد الحارثي': 'Salim bin Saeed Al Harthi',
    'إسراء الوهيبية': 'Esraa Al Wahibiya',
  }[name] || name
}

const services = [
  {
    id: 'map',
    icon: Map,
    title: { ar: 'الخريطة الذكية', en: 'Smart Map' },
    text: { ar: 'الأحياء والمشاريع والمرافق في تجربة مكانية مترابطة.', en: 'Districts, projects, and facilities in one connected spatial experience.' },
    action: { ar: 'افتح الخريطة', en: 'Open the map' },
    href: SMART_MAP_URL,
  },
  {
    id: 'projects',
    icon: Building2,
    title: { ar: 'المشاريع والعقارات', en: 'Projects and Properties' },
    text: { ar: 'اكتشف المشاريع والوحدات واربطها مباشرة بموقعها داخل المدينة.', en: 'Explore projects and units and locate them directly within the city.' },
    action: { ar: 'استكشف المشاريع', en: 'Explore projects' },
    href: PROJECTS_URL,
    requiresAuth: true,
  },
  {
    id: 'services',
    icon: Landmark,
    title: { ar: 'الخدمات الإلكترونية', en: 'Digital Services' },
    text: { ar: 'وصول مباشر للخدمات والطلبات والمعاملات الرقمية.', en: 'Direct access to services, requests, and digital transactions.' },
    action: { ar: 'ابدأ الخدمات', en: 'Start Services' },
    href: SERVICES_URL,
    requiresAuth: true,
  },
]

const homeCopy = {
  ar: {
    pageTitle: 'مدينة السلطان هيثم', scroll: 'مرّر للاستكشاف', headerTools: 'أدوات الحساب واللغة', home: 'الصفحة الرئيسية',
    accountMenu: 'فتح قائمة الحساب', adminAccount: 'حساب إداري', citizenAccount: 'حساب مواطن', logout: 'تسجيل الخروج', login: 'تسجيل الدخول',
    language: 'اختيار اللغة', city: 'مدينة السلطان هيثم', cityView: 'مشهد جوي لمدينة السلطان هيثم',
    legacyStart: 'رؤيةٌ تتحول', legacyEnd: 'إلى مدينة.', accessStart: 'دخول مباشر', accessEnd: 'إلى ما تحتاجه.', digitalGates: 'بوابات المدينة الرقمية',
    footerView: 'إطلالة مدينة السلطان هيثم وقت الغروب', contact: 'تواصل معنا', contactUs: 'اتصل بنا', faq: 'الأسئلة الشائعة', location: 'الموقع', social: 'حسابات التواصل الاجتماعي',
    services: 'الخدمات', eServices: 'الخدمات الإلكترونية', properties: 'العقارات', facilities: 'المرافق والخدمات',
    explore: 'استكشف', about: 'عن المدينة', interactiveMap: 'الخريطة التفاعلية', projects: 'المشاريع', districts: 'الأحياء السكنية', green: 'المساحات الخضراء',
    identity: <>وجهة عمرانية متكاملة<br />تضع الإنسان وجودة الحياة<br />في قلب المدينة.</>, legal: 'الروابط القانونية', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', accessibility: 'إمكانية الوصول',
    copyright: '© 2026 مدينة السلطان هيثم. جميع الحقوق محفوظة.', ministry: 'موقع وزارة الإسكان والتخطيط العمراني',
  },
  en: {
    pageTitle: 'Sultan Haitham City', scroll: 'Scroll to explore', headerTools: 'Account and language tools', home: 'Home',
    accountMenu: 'Open account menu', adminAccount: 'Administrator account', citizenAccount: 'Citizen account', logout: 'Sign out', login: 'Sign in',
    language: 'Choose language', city: 'Sultan Haitham City', cityView: 'Aerial view of Sultan Haitham City',
    legacyStart: 'A vision transformed', legacyEnd: 'into a city.', accessStart: 'Direct access', accessEnd: 'to what you need.', digitalGates: 'Digital city gateways',
    footerView: 'Sultan Haitham City at sunset', contact: 'Contact us', contactUs: 'Get in touch', faq: 'Frequently asked questions', location: 'Location', social: 'Social media accounts',
    services: 'Services', eServices: 'Digital services', properties: 'Properties', facilities: 'Facilities and services',
    explore: 'Explore', about: 'About the city', interactiveMap: 'Interactive map', projects: 'Projects', districts: 'Residential districts', green: 'Green spaces',
    identity: <>An integrated urban destination<br />placing people and quality of life<br />at the heart of the city.</>, legal: 'Legal links', privacy: 'Privacy policy', terms: 'Terms of use', accessibility: 'Accessibility',
    copyright: '© 2026 Sultan Haitham City. All rights reserved.', ministry: 'Ministry of Housing and Urban Planning website',
  },
}

export default function App() {
  const root = useRef(null)
  const accountRef = useRef(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [siteProfile, setSiteProfile] = useState(() => getSiteProfile())
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('sh_lang') === 'en' ? 'en' : 'ar' } catch (_) { return 'ar' }
  })
  const { signOut } = useAdminAuth()
  const { navigateWithTransition, isTransitioning } = usePageTransition()
  const copy = homeCopy[language]
  const isArabic = language === 'ar'
  const profileName = siteProfile ? localizedProfileName(siteProfile.name, language) : ''

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    document.title = copy.pageTitle
    try { localStorage.setItem('sh_lang', language) } catch (_) {}
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [copy.pageTitle, isArabic, language])

  const protectFooterLink = (event, href) => {
    rememberHomeEntry()
    if (isSiteAuthenticated()) return
    event.preventDefault()
    navigateWithTransition(`/login?returnTo=${encodeURIComponent(href)}`, { direction: 'forward' })
  }

  useEffect(() => {
    const syncAccount = () => {
      setSiteProfile(getSiteProfile())
      setAccountOpen(false)
    }

    window.addEventListener('storage', syncAccount)
    window.addEventListener('focus', syncAccount)

    return () => {
      window.removeEventListener('storage', syncAccount)
      window.removeEventListener('focus', syncAccount)
    }
  }, [])

  useEffect(() => {
    if (!accountOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountOpen])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)

    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    const ctx = gsap.context((context) => {
      gsap.set('.topbar', { autoAlpha: 0, y: -14 })
      gsap.set('.header-brand', { autoAlpha: 0 })

      const introReveal = gsap.timeline({ defaults: { ease: 'power3.out' } })
      introReveal
        .fromTo('.intro-bg', { scale: 1.035 }, { scale: 1, duration: 2.2, ease: 'power2.out' })
        .fromTo('.intro-glow', { opacity: 0, scale: 0.35 }, { opacity: 0.95, scale: 1, duration: 1.05 }, 0.35)
        .fromTo('.intro-lockup', { opacity: 0, scale: 0.82, filter: 'blur(18px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.35 }, 0.55)
        .fromTo('.intro-name', { opacity: 0, y: 18, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05 }, 0.82)
        .to('.intro-glow', { opacity: 0.58, scale: 1.2, duration: 1.1 }, 1.35)

      const introScroll = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.intro-scroll-space',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.42,
          invalidateOnRefresh: true,
        },
      })

      introScroll
        .to('.intro-brand', {
          y: () => -(window.innerHeight / 2 - (window.innerWidth <= 640 ? 38 : 42)),
          scale: () => window.innerWidth <= 640 ? 0.31 : 0.23,
          duration: 1,
        }, 0)
        .to('.intro-bg', { scale: 1.06, filter: 'brightness(.72)', duration: 1 }, 0)
        .to('.intro-glow', { opacity: 0, scale: 0.7, duration: 0.55 }, 0.12)
        .to('.intro-scroll-cue', { opacity: 0, y: -12, duration: 0.16 }, 0.02)
        .to('.topbar', { autoAlpha: 1, y: 0, duration: 0.28 }, 0.63)
        .to('.intro-brand', { autoAlpha: 0, duration: 0.08 }, 0.91)
        .to('.header-brand', { autoAlpha: 1, duration: 0.08 }, 0.91)
        .to('.intro', { autoAlpha: 0, duration: 0.09 }, 0.94)

      const story = gsap.timeline({
        scrollTrigger: {
          trigger: '.story',
          start: 'top top',
          end: '+=5700',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      story
        // 01 — الإرث
        .fromTo('.city-base', { scale: 1.01, yPercent: 0 }, { scale: 1.08, yPercent: 1, duration: 1.2 }, 0)
        .fromTo('.legacy-frame', { opacity: 0, scale: 0.94, yPercent: 6, filter: 'blur(8px)' }, { opacity: 1, scale: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.05 }, 0.18)
        .fromTo('.legacy-copy', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7 }, 0.42)
        .fromTo('.sultan-glow', { opacity: 0, scale: 0.45 }, { opacity: 0.72, scale: 1, duration: 0.8 }, 0.3)
        .to('.legacy-copy', { opacity: 0, y: -18, duration: 0.45 }, 1.18)
        .to('.legacy-frame', { opacity: 0, scale: 1.018, filter: 'blur(2px)', duration: 0.72 }, 1.28)
        .to('.sultan-glow', { opacity: 0, scale: 1.55, duration: 0.65 }, 1.28)

        // 02 — الدخول إلى المدينة
        .to('.city-base', { scale: 1.27, yPercent: 5, duration: 1.02, ease: 'power1.inOut' }, 1.22)
        .fromTo('.portal-glow', { opacity: 0, scale: 0.3 }, { opacity: 0.86, scale: 1.8, duration: 0.65 }, 1.68)
        .to('.portal-glow', { opacity: 0, scale: 4.2, duration: 0.65 }, 2.08)
        .fromTo('.masterplan-stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.86)
        .to('.topbar', { autoAlpha: 0, y: -10, duration: 0.22 }, 1.86)
        .fromTo('.masterplan-header', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.45 }, 1.98)
        .fromTo('.masterplan-marker', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.045, duration: 0.35 }, 2.04)
        .fromTo('.masterplan-footer', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, 2.12)
        .to('.masterplan-stage', { autoAlpha: 0, duration: 0.38 }, 2.94)
        .to('.topbar', { autoAlpha: 1, y: 0, duration: 0.24 }, 2.98)

        // 03 — بوابات المدينة
        .fromTo('.access-stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 3.02)
        .fromTo('.access-head', { opacity: 0, x: () => document.documentElement.dir === 'rtl' ? 24 : -24 }, { opacity: 1, x: 0, duration: 0.45 }, 3.1)
        .fromTo('.access-link', { opacity: 0, y: 24, filter: 'blur(5px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.1, duration: 0.5 }, 3.2)
        .to('.access-stage', { autoAlpha: 0, y: -16, duration: 0.5 }, 4.5)

        // 04 — انتقال الهوية من الهيدر إلى الفوتر
        .fromTo('.footer-stage', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.48 }, 4.7)
        .fromTo('.footer-hero-lockup', {
          y: () => -(window.innerHeight * 0.045),
          scale: () => window.innerWidth <= 640 ? 0.34 : 0.24,
          transformOrigin: '50% 0%',
        }, { y: 0, scale: 1, duration: 0.78, ease: 'power1.inOut' }, 4.7)
        .to('.topbar', { autoAlpha: 0, y: -10, duration: 0.18 }, 4.72)
        .fromTo('.footer-panel', { opacity: 0, yPercent: 35 }, { opacity: 1, yPercent: 0, duration: 0.66, ease: 'power2.out' }, 4.88)
        .fromTo('.footer-reveal', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.055, duration: 0.38 }, 5.02)

      if (window.location.hash === '#direct-access') {
        const showDirectAccess = () => {
          ScrollTrigger.refresh()
          const trigger = story.scrollTrigger
          const accessProgress = Math.min(0.99, 3.8 / story.duration())
          const destination = trigger.start + (trigger.end - trigger.start) * accessProgress
          lenis.scrollTo(destination, { immediate: true })
          window.scrollTo(0, destination)
          ScrollTrigger.update()
        }
        requestAnimationFrame(() => requestAnimationFrame(showDirectAccess))
        window.setTimeout(showDirectAccess, 180)
      }

      const statNumbers = gsap.utils.toArray('.masterplan-stat-number')
      statNumbers.forEach((node, index) => {
        const target = Number(node.dataset.count)
        const decimals = Number(node.dataset.decimals || 0)
        const suffix = node.dataset.suffix || ''
        const counter = { value: 0 }

        node.textContent = `${decimals ? '0.0' : '0'}${suffix}`
        story.fromTo(
          counter,
          { value: 0 },
          {
            value: target,
            duration: 0.58,
            ease: 'power2.out',
            onUpdate: () => {
              const value = decimals
                ? counter.value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                : Math.round(counter.value).toLocaleString('en-US')
              node.textContent = `${value}${suffix}`
            },
          },
          2.02 + index * 0.04,
        )
      })
    }, root)

    // ============================================================
// Access links — mouse width interaction
// Same technique as hover-1.mp4 reference:
// requestAnimationFrame + interpolation speed 0.15
// ============================================================

const accessRail = root.current?.querySelector('.access-rail')

let accessHoverFrame = null

let accessTarget = [1, 1, 1]
let accessCurrent = [1, 1, 1]

const accessSpeed = 0.15

const animateAccessWidths = () => {
  if (!accessRail) return

  let stillMoving = false

  accessCurrent = accessCurrent.map((value, index) => {
    const delta = accessTarget[index] - value

    if (Math.abs(delta) > 0.001) {
      stillMoving = true
    }

    return value + delta * accessSpeed
  })

  accessRail.style.gridTemplateColumns = accessCurrent
    .map((value) => `${value.toFixed(4)}fr`)
    .join(' ')

  if (stillMoving) {
    accessHoverFrame = requestAnimationFrame(animateAccessWidths)
  } else {
    accessHoverFrame = null
  }
}

const startAccessAnimation = () => {
  if (!accessHoverFrame) {
    accessHoverFrame = requestAnimationFrame(animateAccessWidths)
  }
}

const handleAccessMouseMove = (event) => {
  if (!accessRail) return

  const rect = accessRail.getBoundingClientRect()

  let mouseX =
    (event.clientX - rect.left) /
    rect.width

  mouseX = Math.max(0, Math.min(1, mouseX))

  // الموقع عربي RTL
  if (getComputedStyle(accessRail).direction === 'rtl') {
    mouseX = 1 - mouseX
  }

  // مراكز العناصر الثلاثة
  const centers = [
    1 / 6,
    1 / 2,
    5 / 6,
  ]

  const widths = centers.map((center) => {
    const distance = Math.abs(mouseX - center)

    const influence = Math.max(
      0,
      1 - distance / (1 / 3)
    )

    return 1 + influence * 2
  })

  // إبقاء العرض الإجمالي ثابت
  const total = widths.reduce(
    (sum, value) => sum + value,
    0
  )

  accessTarget = widths.map(
    (value) => (value / total) * 3
  )

  startAccessAnimation()
}

const handleAccessMouseLeave = () => {
  accessTarget = [1, 1, 1]

  startAccessAnimation()
}

const supportsAccessHover =
  window.matchMedia(
    '(hover: hover) and (pointer: fine) and (min-width: 641px)'
  ).matches

if (supportsAccessHover && accessRail) {
  accessRail.addEventListener(
    'pointermove',
    handleAccessMouseMove
  )

  accessRail.addEventListener(
    'pointerleave',
    handleAccessMouseLeave
  )
}

   return () => {
  cancelAnimationFrame(rafId)

  if (accessHoverFrame) {
    cancelAnimationFrame(accessHoverFrame)
  }

  if (accessRail) {
    accessRail.removeEventListener(
      'pointermove',
      handleAccessMouseMove
    )

    accessRail.removeEventListener(
      'pointerleave',
      handleAccessMouseLeave
    )

    accessRail.style.removeProperty(
      'grid-template-columns'
    )
  }

  ctx.revert()
  lenis.destroy()
}
  }, [])

  return (
    <main ref={root} className="site-shell" lang={language} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="intro" aria-hidden="true">
        <img src={city} className="intro-bg" alt="" />
        <div className="intro-shade" />
        <div className="intro-glow" />
        <div className="intro-brand">
          <img src={logo} className="intro-lockup" alt="" />
          <img src={cityName} className="intro-name" alt="مدينة السلطان هيثم — Sultan Haitham City" />
        </div>
        <div className="intro-scroll-cue"><span />{copy.scroll}</div>
      </div>
      <div className="intro-scroll-space" aria-hidden="true" />

      <header className="topbar" aria-label={copy.headerTools}>
        <div className="site-account-actions">
          {siteProfile ? (
            <div className="site-account" ref={accountRef}>
            <button
              className="site-account-trigger"
              type="button"
              aria-label={copy.accountMenu}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <UserRound aria-hidden="true" />
              <ChevronDown className="site-account-chevron" aria-hidden="true" />
            </button>

            {accountOpen && (
              <div className="site-account-menu" role="menu">
                <div className="site-account-identity">
                  <span className="site-account-avatar" aria-hidden="true">
                    {profileName.trim().charAt(0)}
                  </span>
                  <span>
                    <strong>{profileName}</strong>
                    <small>{siteProfile.role === 'admin' ? copy.adminAccount : copy.citizenAccount}</small>
                  </span>
                </div>
                <button
                  className="site-account-logout"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    signOut()
                    setSiteAuthenticated(false)
                    setSiteProfile(null)
                    setAccountOpen(false)
                  }}
                >
                  <LogOut aria-hidden="true" />
                  {copy.logout}
                </button>
              </div>
            )}
            </div>
          ) : (
            <a
              id="login"
              className="login-link"
              href="/login"
              aria-disabled={isTransitioning}
              onClick={(event) => {
                event.preventDefault()
                rememberHomeEntry()
                navigateWithTransition('/login', { direction: 'forward' })
              }}
            >
              {copy.login}
            </a>
          )}
        </div>
        <div className="header-brand" aria-label={copy.city}>
          <img src={logo} alt="" />
          <img src={cityName} alt={copy.city} />
        </div>
        <button className="lang" type="button" aria-label={copy.language} onClick={() => setLanguage(isArabic ? 'en' : 'ar')}>
          <strong className={isArabic ? 'is-active' : ''}>Ar</strong><span>/</span><strong className={!isArabic ? 'is-active' : ''}>En</strong>
        </button>
      </header>

      <section id="experience" className="story">
        <img src={city} className="city-base" alt={copy.cityView} />
        <div className="cinematic-grade" />

        <div className="legacy-frame" aria-hidden="true">
          <img src={sultanCity} className="legacy-figure" alt="" />
        </div>
        <div className="sultan-glow" />

        <div className="legacy-copy">
          <h2>{copy.legacyStart}<br /><em>{copy.legacyEnd}</em></h2>
        </div>

        <div className="portal-glow" />

        <CityExplore mapUrl={SMART_MAP_URL} language={language} />

        <div
          id="direct-access"
          className="access-stage story-stage"
          style={{ '--access-background': `url(${accessBackground})` }}
        >
          <div className="access-head">
            <h2>{copy.accessStart}<br /><em>{copy.accessEnd}</em></h2>
          </div>

          <nav className="access-rail" aria-label={copy.digitalGates}>
            {services.map(({ id, icon: Icon, title, text, action, href, requiresAuth }) => (
              <button
                className="access-link"
                key={id}
                type="button"
                onClick={() => {
                  if (!href) return

                  /* حفظ موضع الدخول الحالي لزر الرجوع في الصفحة التالية. */
                  rememberHomeEntry()

                  if (requiresAuth && !isSiteAuthenticated()) {
                    navigateWithTransition(`/login?returnTo=${encodeURIComponent(href)}`, { direction: 'forward' })
                    return
                  }

                  window.location.assign(href)
                }}
              >
                <span className="access-orbit"><Icon size={22} /></span>
                <span className="access-copy">
                  <strong>{title[language]}</strong>
                  <span>{text[language]}</span>
                </span>
                <span className="access-action">{action[language]}</span>
                <span className="access-pulse" aria-hidden="true" />
              </button>
            ))}
          </nav>
        </div>

        <div id="contact" className="footer-stage story-stage">
          <img className="footer-stage-bg" src={footerImage} alt={copy.footerView} />
          <div className="footer-stage-shade" aria-hidden="true" />

          <div className="footer-hero-lockup">
            <img className="footer-hero-mark" src={logo} alt="" />
            <img className="footer-hero-name" src={cityName} alt={copy.city} />
          </div>

          <div className="footer-panel">
            <div className="footer-grid">
              <section className="footer-column footer-reveal">
                <h3>{copy.contact}</h3>
                <i aria-hidden="true" />
                <a href={`https://mohup.gov.om/${language}/contact-us`} target="_blank" rel="noreferrer">{copy.contactUs}</a>
                <a href={`https://mohup.gov.om/${language}/contact-us`} target="_blank" rel="noreferrer">{copy.faq}</a>
                <a href={SMART_MAP_URL} onClick={rememberHomeEntry}>{copy.location}</a>
                <div className="footer-socials" aria-label={copy.social}>
                  <a href="https://www.instagram.com/housingoman/" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="footer-social-dot" cx="17.4" cy="6.7" r="1" /></svg>
                  </a>
                  <a className="footer-x" href="https://x.com/housingoman?lang=ar" target="_blank" rel="noreferrer" aria-label="X">X</a>
                  <a href="https://www.linkedin.com/company/ministry-of-housing-urban-planing" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 8.2H3.2V21h3.2V8.2ZM4.8 3A1.9 1.9 0 1 0 4.8 6.8 1.9 1.9 0 0 0 4.8 3ZM21 13.65c0-3.85-2.05-5.64-4.8-5.64-2.2 0-3.2 1.22-3.76 2.07V8.2H9.25V21h3.2v-6.34c0-1.67.31-3.28 2.38-3.28 2.04 0 2.07 1.91 2.07 3.39V21H21v-7.35Z" /></svg>
                  </a>
                </div>
              </section>

              <section className="footer-column footer-reveal">
                <h3>{copy.services}</h3>
                <i aria-hidden="true" />
                <a href={SERVICES_URL} onClick={(event) => protectFooterLink(event, SERVICES_URL)}>{copy.eServices}</a>
                <a href={PROJECTS_URL} onClick={(event) => protectFooterLink(event, PROJECTS_URL)}>{copy.properties}</a>
                <a href={`${SMART_MAP_URL}?layer=facilities`} onClick={rememberHomeEntry}>{copy.facilities}</a>
                <a href="/login" onClick={(event) => {
                  event.preventDefault()
                  rememberHomeEntry()
                  navigateWithTransition('/login', { direction: 'forward' })
                }}>{copy.login}</a>
              </section>

              <section className="footer-column footer-reveal">
                <h3>{copy.explore}</h3>
                <i aria-hidden="true" />
                <a href="#experience">{copy.about}</a>
                <a href={SMART_MAP_URL} onClick={rememberHomeEntry}>{copy.interactiveMap}</a>
                <a href={PROJECTS_URL} onClick={(event) => protectFooterLink(event, PROJECTS_URL)}>{copy.projects}</a>
                <a href={`${SMART_MAP_URL}?layer=districts`} onClick={rememberHomeEntry}>{copy.districts}</a>
                <a href={`${SMART_MAP_URL}?layer=green`} onClick={rememberHomeEntry}>{copy.green}</a>
              </section>

              <section className="footer-identity footer-reveal">
                <div className="footer-identity-brand">
                  <img src={logo} alt="" />
                  <img src={cityName} alt={copy.city} />
                </div>
                <p>{copy.identity}</p>
              </section>
            </div>

            <div className="footer-bottom footer-reveal">
              <div className="footer-legal">
                <button className="footer-language" type="button" aria-label={copy.language} onClick={() => setLanguage(isArabic ? 'en' : 'ar')}><strong className={isArabic ? 'is-active' : ''}>Ar</strong><span>/</span><strong className={!isArabic ? 'is-active' : ''}>En</strong></button>
                <nav aria-label={copy.legal}>
                  <a href={`https://mohup.gov.om/${language}/privacy-policy`} target="_blank" rel="noreferrer">{copy.privacy}</a>
                  <a href={`https://mohup.gov.om/${language}/terms-of-use`} target="_blank" rel="noreferrer">{copy.terms}</a>
                  <a href={`https://mohup.gov.om/${language}/terms-of-use`} target="_blank" rel="noreferrer">{copy.accessibility}</a>
                </nav>
              </div>
              <p>{copy.copyright}</p>
              <div className="footer-ministry-link" aria-label={copy.ministry}>
                <img
                  className="footer-ministry-image"
                  src={housingLogo}
                  alt="وزارة الإسكان والتخطيط العمراني — Ministry of Housing and Urban Planning"
                />
              </div>
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
