import { useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react'
import gsap from 'gsap'
import { useAdminAuth } from '../../auth/AdminAuth'
import loginBg from '../../assets/login.png'
import cityLogo from '../../assets/logo.png'
import cityName from '../../assets/city-name.png'
import housingLogo from '../../assets/housing.png'
import { usePageTransition } from '../PageTransition/PageTransitionProvider'
import './LoginPage.css'

export default function LoginPage() {
  const pageRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const { admin, signIn, signOut } = useAdminAuth()
  const { navigateWithTransition, isTransitioning } = usePageTransition()

  useLayoutEffect(() => {
    if (!pageRef.current) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return undefined

    const context = gsap.context(() => {
      gsap.fromTo('.login-page-bg', { scale: 1.035 }, { scale: 1, duration: 1.4, ease: 'power2.out' })

      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } })
      entrance
        .fromTo('.login-brand', { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.8 }, 0.2)
        .fromTo('.login-panel', { autoAlpha: 0, x: 35 }, { autoAlpha: 1, x: 0, duration: 0.8 }, 0.25)
        .fromTo('.login-page-topbar', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.35)
    }, pageRef)

    return () => context.revert()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget

    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    const data = new FormData(form)
    const authenticated = signIn({
      email: data.get('identity'),
      password: data.get('password'),
      remember: data.get('remember') === 'on',
    })

    if (!authenticated) {
      signOut()
      setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.')
      return
    }

    setMessage('')
    form.elements.password.value = ''
  }

  return (
    <main ref={pageRef} className="login-page" dir="rtl">
      <img className="login-page-bg" src={loginBg} alt="مدينة السلطان هيثم وقت الغروب" />
      <div className="login-page-overlay" aria-hidden="true" />

      <header className="login-page-topbar">
        <nav className="login-languages" aria-label="اختيار اللغة">
          <a className="is-active" href="/login">العربية</a>
          <span aria-hidden="true" />
          <a href="/login" lang="en">English</a>
        </nav>
        <a
          className="login-return"
          href="/"
          aria-label="الرئيسية"
          title="الرئيسية"
          aria-disabled={isTransitioning}
          onClick={(event) => {
            event.preventDefault()
            navigateWithTransition('/', { direction: 'reverse' })
          }}
        >
          <Home aria-hidden="true" />
        </a>
      </header>

      <div className="login-page-main">
        <section className="login-brand" aria-label="مدينة السلطان هيثم">
          <img className="login-brand-mark" src={cityLogo} alt="" />
          <img
            className="login-brand-name"
            src={cityName}
            alt="مدينة السلطان هيثم — Sultan Haitham City"
          />
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel-heading">
            <h1 id="login-title">تسجيل الدخول</h1>
            <p>سجل الدخول إلى منصة مدينة السلطان هيثم</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} onChange={() => {
            setMessage('')
            if (admin) signOut()
          }}>
            {admin && (
              <div className="login-test-success" role="status">
                <p>تم تسجيل الدخول بنجاح كأدمن.</p>
                <button type="button" onClick={signOut}>تسجيل الخروج</button>
              </div>
            )}
            {message && <p id="login-error" className="login-form-message" role="alert">{message}</p>}
            <div className="login-field">
              <label htmlFor="login-identity">البريد الإلكتروني</label>
              <Mail className="login-field-icon" aria-hidden="true" />
              <input
                id="login-identity"
                name="identity"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="البريد الإلكتروني"
                aria-invalid={Boolean(message)}
                aria-describedby={message ? 'login-error' : undefined}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">كلمة المرور</label>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="كلمة المرور"
                aria-invalid={Boolean(message)}
                aria-describedby={message ? 'login-error' : undefined}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" name="remember" />
                <span aria-hidden="true" />
                تذكرني
              </label>
              <a href="/forgot-password">نسيت كلمة المرور؟</a>
            </div>

            <button className="login-submit" type="submit" disabled={isTransitioning}>
              <span aria-hidden="true" />
              <strong>تسجيل الدخول</strong>
              <ArrowLeft aria-hidden="true" />
            </button>

            <div className="login-divider" aria-label="أو"><span /><em>أو</em><span /></div>

            <a className="login-digital-id" href="https://mohup.gov.om/ar/e-services" target="_blank" rel="noreferrer">
              <span className="login-digital-emblem" aria-hidden="true"><img src={housingLogo} alt="" /></span>
              <strong>الدخول عبر الهوية الرقمية</strong>
            </a>

            <p className="login-register">
              ليس لديك حساب؟ <a href="/register">إنشاء حساب</a>
              <ArrowLeft aria-hidden="true" />
            </p>

          </form>
        </section>
      </div>
    </main>
  )
}
