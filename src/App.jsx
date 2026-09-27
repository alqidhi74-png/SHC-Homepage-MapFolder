import { useEffect, useRef } from 'react'
import {
  ArrowUpLeft,
  Building2,
  Map,
  Landmark,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import CityExplore from './CityExplore'
import { usePageTransition } from './components/PageTransition/PageTransitionProvider'

import city from './assets/city.png'
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

const services = [
  {
    icon: Map,
    title: 'الخريطة الذكية',
    text: 'الأحياء والمشاريع والمرافق في تجربة مكانية مترابطة.',
    action: 'افتح الخريطة',
    href: SMART_MAP_URL,
  },
  {
    icon: Building2,
    title: 'المشاريع والعقارات',
    text: 'اكتشف المشاريع والوحدات واربطها مباشرة بموقعها داخل المدينة.',
    action: 'استكشف المشاريع',
  },
  {
    icon: Landmark,
    title: 'الخدمات الإلكترونية',
    text: 'وصول مباشر للخدمات والطلبات والمعاملات الرقمية.',
    action: 'ابدأ الخدمة',
    href: SERVICES_URL,
  },
]

export default function App() {
  const root = useRef(null)
  const { navigateWithTransition, isTransitioning } = usePageTransition()

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
        .fromTo('.access-head', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.45 }, 3.1)
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

    return () => {
      cancelAnimationFrame(rafId)
      ctx.revert()
      lenis.destroy()
    }
  }, [])

  return (
    <main ref={root} className="site-shell">
      <div className="intro" aria-hidden="true">
        <img src={city} className="intro-bg" alt="" />
        <div className="intro-shade" />
        <div className="intro-glow" />
        <div className="intro-brand">
          <img src={logo} className="intro-lockup" alt="" />
          <img src={cityName} className="intro-name" alt="مدينة السلطان هيثم — Sultan Haitham City" />
        </div>
        <div className="intro-scroll-cue"><span />مرّر للاستكشاف</div>
      </div>
      <div className="intro-scroll-space" aria-hidden="true" />

      <header className="topbar" aria-label="أدوات الحساب واللغة">
        <a
          id="login"
          className="login-link"
          href="/login"
          aria-disabled={isTransitioning}
          onClick={(event) => {
            event.preventDefault()
            navigateWithTransition('/login', { direction: 'forward' })
          }}
        >
          تسجيل الدخول
        </a>
        <a className="header-brand" href="#experience" aria-label="مدينة السلطان هيثم">
          <img src={logo} alt="" />
          <img src={cityName} alt="مدينة السلطان هيثم" />
        </a>
        <div className="lang" aria-label="اختيار اللغة">العربية <span>/</span> English</div>
      </header>

      <section id="experience" className="story">
        <img src={city} className="city-base" alt="مشهد جوي لمدينة السلطان هيثم" />
        <div className="cinematic-grade" />

        <div className="legacy-frame" aria-hidden="true">
          <img src={sultanCity} className="legacy-figure" alt="" />
        </div>
        <div className="sultan-glow" />

        <div className="legacy-copy">
          <h2>رؤيةٌ تتحول<br /><em>إلى مدينة.</em></h2>
        </div>

        <div className="portal-glow" />

        <CityExplore />

        <div id="services" className="access-stage story-stage">
          <div className="access-head">
            <h2>دخول مباشر<br /><em>إلى ما تحتاجه.</em></h2>
          </div>

          <nav className="access-rail" aria-label="بوابات المدينة الرقمية">
            {services.map(({ icon: Icon, title, text, action, href }) => (
              <button
                className="access-link"
                key={title}
                type="button"
                onClick={() => {
                  if (href) window.location.assign(href)
                }}
              >
                <span className="access-orbit"><Icon size={22} /></span>
                <span className="access-copy">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
                <span className="access-action">{action} <ArrowUpLeft size={17} /></span>
                <span className="access-pulse" aria-hidden="true" />
              </button>
            ))}
          </nav>
        </div>

        <div id="contact" className="footer-stage story-stage">
          <img className="footer-stage-bg" src={footerImage} alt="إطلالة مدينة السلطان هيثم وقت الغروب" />
          <div className="footer-stage-shade" aria-hidden="true" />

          <div className="footer-hero-lockup">
            <img className="footer-hero-mark" src={logo} alt="" />
            <img className="footer-hero-name" src={cityName} alt="مدينة السلطان هيثم" />
            <div className="footer-hero-slogan"><span />زاهية بناسها<span /></div>
            <p>مدينة تُبنى للإنسان، وتزدهر بناسها.</p>
          </div>

          <div className="footer-panel">
            <div className="footer-grid">
              <section className="footer-column footer-reveal">
                <h3>تواصل معنا</h3>
                <i aria-hidden="true" />
                <a href="https://mohup.gov.om/ar/contact-us" target="_blank" rel="noreferrer">اتصل بنا</a>
                <a href="https://mohup.gov.om/ar/contact-us" target="_blank" rel="noreferrer">الأسئلة الشائعة</a>
                <a href="https://mohup.gov.om/ar/contact-us?tab=location" target="_blank" rel="noreferrer">الموقع</a>
                <div className="footer-socials" aria-label="حسابات التواصل الاجتماعي">
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
                <h3>الخدمات</h3>
                <i aria-hidden="true" />
                <a href={SERVICES_URL}>الخدمات الإلكترونية</a>
                <a href="https://mohup.gov.om/ar/e-services" target="_blank" rel="noreferrer">العقارات</a>
                <a href="https://mohup.gov.om/ar/e-services" target="_blank" rel="noreferrer">المرافق والخدمات</a>
                <a href="/login">تسجيل الدخول</a>
              </section>

              <section className="footer-column footer-reveal">
                <h3>استكشف</h3>
                <i aria-hidden="true" />
                <a href="#experience">عن المدينة</a>
                <a href="#city-map">الخريطة التفاعلية</a>
                <a href="#city-map">المشاريع</a>
                <a href="#city-map">الأحياء السكنية</a>
                <a href="#city-map">المساحات الخضراء</a>
              </section>

              <section className="footer-identity footer-reveal">
                <div className="footer-identity-brand">
                  <img src={logo} alt="" />
                  <img src={cityName} alt="مدينة السلطان هيثم" />
                  <div><span />زاهية بناسها<span /></div>
                </div>
                <p>وجهة عمرانية متكاملة<br />تضع الإنسان وجودة الحياة<br />في قلب المدينة.</p>
              </section>
            </div>

            <div className="footer-bottom footer-reveal">
              <div className="footer-legal">
                <div className="footer-language"><a href="https://mohup.gov.om/ar" target="_blank" rel="noreferrer">العربية</a><span /><a href="https://mohup.gov.om/en" target="_blank" rel="noreferrer" lang="en">English</a></div>
                <nav aria-label="الروابط القانونية">
                  <a href="https://mohup.gov.om/ar/privacy-policy" target="_blank" rel="noreferrer">سياسة الخصوصية</a>
                  <a href="https://mohup.gov.om/ar/terms-of-use" target="_blank" rel="noreferrer">شروط الاستخدام</a>
                  <a href="https://mohup.gov.om/ar/terms-of-use" target="_blank" rel="noreferrer">إمكانية الوصول</a>
                </nav>
              </div>
              <p>© 2026 مدينة السلطان هيثم. جميع الحقوق محفوظة.</p>
              <a className="footer-ministry-link" href="https://mohup.gov.om/" target="_blank" rel="noreferrer" aria-label="موقع وزارة الإسكان والتخطيط العمراني">
                <span className="footer-ministry-emblem"><img src={housingLogo} alt="" /></span>
                <span className="footer-ministry-copy">
                  <strong>وزارة الإسكان والتخطيط العمراني</strong>
                  <small>Ministry of Housing and Urban Planning</small>
                </span>
              </a>
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
