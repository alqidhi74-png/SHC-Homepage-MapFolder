import { useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Home,
  Eye,
  EyeOff,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import gsap from 'gsap'

import { useAdminAuth } from '../../auth/AdminAuth'
import { DEMO_ADMIN_EMAIL } from '../../auth/demoAdminAuth'
import { getSafeReturnTarget, setSiteAuthenticated } from '../../auth/siteAuth'
import { usePageTransition } from '../PageTransition/PageTransitionProvider'

import loginBg from '../../assets/login.png'
import cityLogo from '../../assets/logo.png'
import cityName from '../../assets/city-name.png'
import housingLogo from '../../assets/housing.png'

import './LoginPage.css'

export default function LoginPage() {
  const pageRef = useRef(null)
  const otpRefs = useRef([])

  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [showCitizenId, setShowCitizenId] = useState(false)
  const [citizenMethod, setCitizenMethod] = useState('phone')
  const [citizenIdentifier, setCitizenIdentifier] = useState('')
  const [citizenMessage, setCitizenMessage] = useState(null)
  const [citizenStep, setCitizenStep] = useState('identity')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])

  const { signIn, signOut } = useAdminAuth()

  const {
    navigateWithTransition,
    isTransitioning,
  } = usePageTransition()

  // =========================================================
  // Page entrance animation
  // =========================================================
  useLayoutEffect(() => {
    if (!pageRef.current) return undefined

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) return undefined

    const context = gsap.context(() => {
      gsap.fromTo(
        '.login-page-bg',
        {
          scale: 1.035,
        },
        {
          scale: 1,
          duration: 1.4,
          ease: 'power2.out',
        },
      )

      const entrance = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
      })

      entrance
        .fromTo(
          '.login-brand',
          {
            autoAlpha: 0,
            x: -30,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
          },
          0.2,
        )
        .fromTo(
          '.login-panel',
          {
            autoAlpha: 0,
            x: 35,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.8,
          },
          0.25,
        )
        .fromTo(
          '.login-page-topbar',
          {
            autoAlpha: 0,
            y: -12,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
          },
          0.35,
        )
    }, pageRef)

    return () => {
      context.revert()
    }
  }, [])

  // =========================================================
  // Admin login
  // =========================================================
  const handleSubmit = (event) => {
    event.preventDefault()

    // منع الضغط المتكرر أثناء حركة الانتقال
    if (isTransitioning) return

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

    // بيانات الدخول غير صحيحة
    if (!authenticated) {
      signOut()
      setSiteAuthenticated(false)
      setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة.')
      return
    }

    // نجاح تسجيل الدخول
    setMessage('')
    setSiteAuthenticated(true, {
      name: 'إسراء الوهيبية',
      role: 'admin',
    })

    if (form.elements.password) {
      form.elements.password.value = ''
    }

    const returnTarget = getSafeReturnTarget()

    if (returnTarget) {
      window.location.assign(returnTarget)
      return
    }

    // الانتقال إلى لوحة التحكم
    navigateWithTransition('/dashboard', {
      direction: 'forward',
    })
  }

  const handleCitizenIdentity = () => {
    const value = citizenIdentifier.replace(/\s/g, '')
    const valid = citizenMethod === 'phone'
      ? /^\+?[0-9]{8,15}$/.test(value)
      : /^[0-9]{8,12}$/.test(value)

    if (!valid) {
      setCitizenMessage({
        type: 'error',
        text: citizenMethod === 'phone'
          ? 'أدخل رقم هاتف صحيحًا ومسجلًا في الهوية الوطنية.'
          : 'أدخل الرقم المدني الصحيح.',
      })
      return
    }

    setOtpDigits(['', '', '', '', '', ''])
    setCitizenMessage(null)
    setCitizenStep('otp')

    window.setTimeout(() => {
      otpRefs.current[0]?.focus()
    }, 50)
  }

  const updateOtpDigit = (index, inputValue) => {
    const digit = inputValue.replace(/\D/g, '').slice(-1)

    setOtpDigits((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })
    setCitizenMessage(null)

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    if (event.key === 'ArrowLeft' && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    if (event.key === 'ArrowRight' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)

    if (!pastedDigits) return

    event.preventDefault()
    const next = Array.from({ length: 6 }, (_, index) => pastedDigits[index] || '')
    setOtpDigits(next)
    setCitizenMessage(null)
    otpRefs.current[Math.min(pastedDigits.length, 6) - 1]?.focus()
  }

  const handleOtpVerification = () => {
    const otp = otpDigits.join('')

    if (!/^\d{6}$/.test(otp)) {
      setCitizenMessage({
        type: 'error',
        text: 'أدخل رمز التحقق المكوّن من 6 أرقام.',
      })
      return
    }

    setSiteAuthenticated(true, {
      name: 'سالم الحارثي',
      role: 'citizen',
    })
    setCitizenMessage({
      type: 'success',
      text: 'تم التحقق وتسجيل الدخول بنجاح.',
    })

    const returnTarget = getSafeReturnTarget()
    window.setTimeout(() => {
      window.location.assign(returnTarget || '/')
    }, 650)
  }

  return (
    <main
      ref={pageRef}
      className={`login-page${showCitizenId ? ' has-citizen-id' : ''}`}
      dir="rtl"
    >
      {/* Background */}
      <img
        className="login-page-bg"
        src={loginBg}
        alt="مدينة السلطان هيثم وقت الغروب"
      />

      <div
        className="login-page-overlay"
        aria-hidden="true"
      />

      {/* =====================================================
          TOP BAR
      ====================================================== */}
      <header className="login-page-topbar">

        {/* Languages */}
        <nav
          className="login-languages"
          aria-label="اختيار اللغة"
        >
          <a
            className="is-active"
            href="/login"
          >
            Ar
          </a>

          <span aria-hidden="true">/</span>

          <a
            href="/login"
            lang="en"
          >
            En
          </a>
        </nav>

        {/* Return to homepage */}
        <a
          className="login-return"
          href="/"
          aria-label="الرئيسية"
          title="الرئيسية"
          aria-disabled={isTransitioning}
          onClick={(event) => {
            event.preventDefault()

            if (isTransitioning) return

            navigateWithTransition('/', {
              direction: 'reverse',
            })
          }}
        >
          <Home aria-hidden="true" />
        </a>

      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="login-page-main">

        {/* Brand */}
        <section
          className="login-brand"
          aria-label="مدينة السلطان هيثم"
        >
          <img
            className="login-brand-mark"
            src={cityLogo}
            alt=""
          />

          <img
            className="login-brand-name"
            src={cityName}
            alt="مدينة السلطان هيثم — Sultan Haitham City"
          />
        </section>

        {/* ===================================================
            LOGIN PANEL
        ==================================================== */}
        <section
          className="login-panel"
          aria-labelledby="login-title"
        >

          <div className="login-panel-heading">
            <h1 id="login-title">
              {showCitizenId ? 'الهوية الوطنية' : 'تسجيل الدخول'}
            </h1>

            <p>
              {showCitizenId
                ? citizenStep === 'otp'
                  ? 'أدخل رمز التحقق المرسل لإكمال تسجيل الدخول'
                  : 'دخول أو تسجيل المواطن عبر نظام الهوية الوطنية'
                : 'سجل الدخول إلى منصة مدينة السلطان هيثم'}
            </p>
          </div>

          <form
            className="login-form"
            noValidate
            onSubmit={(event) => {
              if (!showCitizenId) {
                handleSubmit(event)
                return
              }

              event.preventDefault()

              if (citizenStep === 'identity') {
                handleCitizenIdentity()
              } else {
                handleOtpVerification()
              }
            }}
            onChange={() => {
              setMessage('')
            }}
          >

            {/* Error Message */}
            {message && (
              <p
                id="login-error"
                className="login-form-message"
                role="alert"
              >
                {message}
              </p>
            )}

            {/* =================================================
                EMAIL
            ================================================== */}
            <div className="login-field">

              <label htmlFor="login-identity">
                البريد الإلكتروني
              </label>

              <Mail
                className="login-field-icon"
                aria-hidden="true"
              />

              <input
                id="login-identity"
                name="identity"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={DEMO_ADMIN_EMAIL}
                placeholder="البريد الإلكتروني"
                aria-invalid={Boolean(message)}
                aria-describedby={
                  message
                    ? 'login-error'
                    : undefined
                }
                required
              />

            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}
            <div className="login-field">

              <label htmlFor="login-password">
                كلمة المرور
              </label>

              <input
                id="login-password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                placeholder="كلمة المرور"
                aria-invalid={Boolean(message)}
                aria-describedby={
                  message
                    ? 'login-error'
                    : undefined
                }
                required
              />

              <button
                className="login-password-toggle"
                type="button"
                onClick={() => {
                  setShowPassword(
                    (visible) => !visible,
                  )
                }}
                aria-label={
                  showPassword
                    ? 'إخفاء كلمة المرور'
                    : 'إظهار كلمة المرور'
                }
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>

            </div>

            {/* =================================================
                OPTIONS
            ================================================== */}
            <div className="login-options">

              <label className="login-remember">
                <input
                  type="checkbox"
                  name="remember"
                />

                <span aria-hidden="true" />

                تذكرني
              </label>

              <a href="/forgot-password">
                نسيت كلمة المرور؟
              </a>

            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}
            <button
              className="login-submit"
              type="submit"
              disabled={isTransitioning}
            >
              <span aria-hidden="true" />

              <strong>
                {isTransitioning
                  ? 'جاري الدخول...'
                  : 'تسجيل الدخول'}
              </strong>

              <ArrowLeft aria-hidden="true" />
            </button>

            {/* Divider */}
            <div
              className="login-divider"
              aria-label="أو"
            >
              <span />
              <em>أو</em>
              <span />
            </div>

            {/* =================================================
                DIGITAL ID
            ================================================== */}
            <button
              className="login-digital-id"
              type="button"
              aria-expanded={showCitizenId}
              aria-controls="citizen-national-id"
              onClick={() => {
                setShowCitizenId((visible) => !visible)
                setCitizenMessage(null)
                setCitizenStep('identity')
                setOtpDigits(['', '', '', '', '', ''])
              }}
            >
              <span
                className="login-digital-emblem"
                aria-hidden="true"
              >
                <img
                  src={housingLogo}
                  alt=""
                />
              </span>

              <strong>
                الدخول أو التسجيل عبر الهوية الوطنية
              </strong>
            </button>

            {showCitizenId && (
              <section id="citizen-national-id" className="login-citizen-panel" aria-label="الدخول أو التسجيل بالهوية الوطنية">
                <button
                  className="login-citizen-back"
                  type="button"
                  onClick={() => {
                    setShowCitizenId(false)
                    setCitizenMessage(null)
                    setCitizenIdentifier('')
                    setCitizenStep('identity')
                    setOtpDigits(['', '', '', '', '', ''])
                  }}
                >
                  <ArrowLeft aria-hidden="true" />
                  العودة إلى تسجيل الدخول
                </button>

                {citizenStep === 'identity' ? (
                  <>
                    <div className="login-citizen-heading">
                      <strong>الهوية الوطنية للمواطن</strong>
                      <span>اختر وسيلة التحقق المسجلة في نظام الهوية الوطنية</span>
                    </div>

                    <div className="login-citizen-methods" role="radiogroup" aria-label="وسيلة التحقق">
                      <button
                        className={citizenMethod === 'phone' ? 'is-active' : ''}
                        type="button"
                        role="radio"
                        aria-checked={citizenMethod === 'phone'}
                        onClick={() => {
                          setCitizenMethod('phone')
                          setCitizenIdentifier('')
                          setCitizenMessage(null)
                        }}
                      >
                        <Phone aria-hidden="true" />
                        رقم الهاتف
                      </button>
                      <button
                        className={citizenMethod === 'civil' ? 'is-active' : ''}
                        type="button"
                        role="radio"
                        aria-checked={citizenMethod === 'civil'}
                        onClick={() => {
                          setCitizenMethod('civil')
                          setCitizenIdentifier('')
                          setCitizenMessage(null)
                        }}
                      >
                        <CreditCard aria-hidden="true" />
                        الرقم المدني
                      </button>
                    </div>

                    <label className="login-citizen-field" htmlFor="citizen-identifier">
                      <span>{citizenMethod === 'phone' ? 'رقم الهاتف المسجل' : 'الرقم المدني'}</span>
                      <div>
                        {citizenMethod === 'phone' ? <Phone aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                        <input
                          id="citizen-identifier"
                          type={citizenMethod === 'phone' ? 'tel' : 'text'}
                          inputMode={citizenMethod === 'phone' ? 'tel' : 'numeric'}
                          value={citizenIdentifier}
                          placeholder={citizenMethod === 'phone' ? 'مثال: 9123 4567' : 'أدخل الرقم المدني'}
                          onChange={(event) => {
                            setCitizenIdentifier(event.target.value)
                            setCitizenMessage(null)
                          }}
                        />
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="login-otp-step">
                    <div className="login-citizen-heading">
                      <strong>رمز التحقق لمرة واحدة</strong>
                      <span>
                        أرسلنا رمزًا من 6 أرقام إلى {citizenMethod === 'phone' ? 'رقم الهاتف المسجل' : 'الهاتف المرتبط بالرقم المدني'}
                      </span>
                    </div>

                    <div className="login-otp-inputs" dir="ltr" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(element) => { otpRefs.current[index] = element }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          maxLength={1}
                          value={digit}
                          aria-label={`الرقم ${index + 1} من رمز التحقق`}
                          onChange={(event) => updateOtpDigit(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        />
                      ))}
                    </div>

                    <button
                      className="login-otp-change"
                      type="button"
                      onClick={() => {
                        setCitizenStep('identity')
                        setOtpDigits(['', '', '', '', '', ''])
                        setCitizenMessage(null)
                      }}
                    >
                      تغيير {citizenMethod === 'phone' ? 'رقم الهاتف' : 'الرقم المدني'}
                    </button>
                  </div>
                )}

                {citizenMessage && (
                  <p className={`login-citizen-message is-${citizenMessage.type}`} role={citizenMessage.type === 'error' ? 'alert' : 'status'}>
                    {citizenMessage.type === 'success' && <CheckCircle2 aria-hidden="true" />}
                    {citizenMessage.text}
                  </p>
                )}

                <button
                  className="login-citizen-submit"
                  type="submit"
                >
                  {citizenStep === 'identity' ? 'إرسال رمز التحقق' : 'تأكيد الرمز والدخول'}
                  <ArrowLeft aria-hidden="true" />
                </button>
              </section>
            )}

          </form>
        </section>

      </div>
    </main>
  )
}
