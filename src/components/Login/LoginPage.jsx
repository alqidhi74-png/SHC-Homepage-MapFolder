import { useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
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
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('sh_lang') === 'en' ? 'en' : 'ar' } catch (_) { return 'ar' }
  })

  const isArabic = language === 'ar'
  const T = (ar, en) => isArabic ? ar : en

  const switchLanguage = (lang) => {
    setLanguage(lang)
    setMessage('')
    setCitizenMessage(null)
    try { localStorage.setItem('sh_lang', lang) } catch (_) {}
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  const { signIn, signOut } = useAdminAuth()

  const {
    navigateWithTransition,
    isTransitioning,
  } = usePageTransition()

  useLayoutEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    document.title = T('تسجيل الدخول — مدينة السلطان هيثم', 'Sign in — Sultan Haitham City')
  }, [isArabic, language])

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
      setMessage(T('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'The email address or password is incorrect.'))
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
          ? T('أدخل رقم هاتف صحيحًا ومسجلًا في الهوية الوطنية.', 'Enter a valid phone number registered with the National ID system.')
          : T('أدخل الرقم المدني الصحيح.', 'Enter a valid Civil ID.'),
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
        text: T('أدخل رمز التحقق المكوّن من 6 أرقام.', 'Enter the 6-digit verification code.'),
      })
      return
    }

    setSiteAuthenticated(true, {
      name: 'سالم الحارثي',
      role: 'citizen',
    })
    setCitizenMessage({
      type: 'success',
      text: T('تم التحقق وتسجيل الدخول بنجاح.', 'Verification complete. You are now signed in.'),
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
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={language}
    >
      {/* Background */}
      <img
        className="login-page-bg"
        src={loginBg}
        alt={T('مدينة السلطان هيثم وقت الغروب', 'Sultan Haitham City at sunset')}
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
          aria-label={T('اختيار اللغة', 'Choose language')}
        >
          <button
            type="button"
            className={isArabic ? 'is-active' : ''}
            onClick={() => switchLanguage('ar')}
          >
            Ar
          </button>

          <span aria-hidden="true">/</span>

          <button
            type="button"
            lang="en"
            className={!isArabic ? 'is-active' : ''}
            onClick={() => switchLanguage('en')}
          >
            En
          </button>
        </nav>

        {/* Return to the Direct Access section. */}
        <a
          className="login-return"
          href="/#direct-access"
          aria-label={T('رجوع', 'Back')}
          title={T('رجوع', 'Back')}
          aria-disabled={isTransitioning}
          onClick={(event) => {
            event.preventDefault()

            if (isTransitioning) return

            window.location.assign('/#direct-access')
          }}
        >
          <ArrowLeft aria-hidden="true" />
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
              {showCitizenId ? T('الهوية الوطنية', 'National ID') : T('تسجيل الدخول', 'Sign In')}
            </h1>

            <p>
              {showCitizenId
                ? citizenStep === 'otp'
                  ? T('أدخل رمز التحقق المرسل لإكمال تسجيل الدخول', 'Enter the verification code to complete sign-in')
                  : T('دخول أو تسجيل المواطن عبر نظام الهوية الوطنية', 'Sign in or register via the National ID system')
                : T('سجل الدخول إلى منصة مدينة السلطان هيثم', 'Sign in to Sultan Haitham City platform')}
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
                {T('البريد الإلكتروني', 'Email address')}
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
                placeholder={T('البريد الإلكتروني', 'Email address')}
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
                {T('كلمة المرور', 'Password')}
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
                placeholder={T('كلمة المرور', 'Password')}
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
                    ? T('إخفاء كلمة المرور', 'Hide password')
                    : T('إظهار كلمة المرور', 'Show password')
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

                {T('تذكرني', 'Remember me')}
              </label>

              <a href="/forgot-password">
                {T('نسيت كلمة المرور؟', 'Forgot password?')}
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
                  ? T('جاري الدخول...', 'Signing in...')
                  : T('تسجيل الدخول', 'Sign In')}
              </strong>

              <ArrowLeft aria-hidden="true" />
            </button>

            {/* Divider */}
            <div
              className="login-divider"
              aria-label={T('أو', 'or')}
            >
              <span />
              <em>{T('أو', 'or')}</em>
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
                {T('الدخول أو التسجيل عبر الهوية الوطنية', 'Sign in or register via National ID')}
              </strong>
            </button>

            {showCitizenId && (
              <section id="citizen-national-id" className="login-citizen-panel" aria-label={T('الدخول أو التسجيل بالهوية الوطنية', 'Sign in or register via National ID')}>
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
                  {T('العودة إلى تسجيل الدخول', 'Back to sign in')}
                </button>

                {citizenStep === 'identity' ? (
                  <>
                    <div className="login-citizen-heading">
                      <strong>{T('الهوية الوطنية للمواطن', 'Citizen National ID')}</strong>
                      <span>{T('اختر وسيلة التحقق المسجلة في نظام الهوية الوطنية', 'Choose the verification method registered in the National ID system')}</span>
                    </div>

                    <div className="login-citizen-methods" role="radiogroup" aria-label={T('وسيلة التحقق', 'Verification method')}>
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
                        {T('رقم الهاتف', 'Phone number')}
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
                        {T('الرقم المدني', 'Civil ID')}
                      </button>
                    </div>

                    <label className="login-citizen-field" htmlFor="citizen-identifier">
                      <span>{citizenMethod === 'phone' ? T('رقم الهاتف المسجل', 'Registered phone number') : T('الرقم المدني', 'Civil ID')}</span>
                      <div>
                        {citizenMethod === 'phone' ? <Phone aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                        <input
                          id="citizen-identifier"
                          type={citizenMethod === 'phone' ? 'tel' : 'text'}
                          inputMode={citizenMethod === 'phone' ? 'tel' : 'numeric'}
                          value={citizenIdentifier}
                          placeholder={citizenMethod === 'phone' ? T('مثال: 9123 4567', 'e.g. 9123 4567') : T('أدخل الرقم المدني', 'Enter Civil ID')}
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
                      <strong>{T('رمز التحقق لمرة واحدة', 'One-time verification code')}</strong>
                      <span>
                        {T('أرسلنا رمزًا من 6 أرقام إلى', 'We sent a 6-digit code to')} {citizenMethod === 'phone' ? T('رقم الهاتف المسجل', 'your registered phone') : T('الهاتف المرتبط بالرقم المدني', 'the phone linked to your Civil ID')}
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
                          aria-label={T(`الرقم ${index + 1} من رمز التحقق`, `Digit ${index + 1} of verification code`)}
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
                      {T('تغيير', 'Change')} {citizenMethod === 'phone' ? T('رقم الهاتف', 'phone number') : T('الرقم المدني', 'Civil ID')}
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
                  {citizenStep === 'identity' ? T('إرسال رمز التحقق', 'Send verification code') : T('تأكيد الرمز والدخول', 'Verify and sign in')}
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
