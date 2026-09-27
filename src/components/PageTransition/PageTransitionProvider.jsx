import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import './PageTransition.css'

gsap.registerPlugin(DrawSVGPlugin)

const PageTransitionContext = createContext(null)

export function PageTransitionProvider({ children }) {
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const pathRef = useRef(null)
  const timelineRef = useRef(null)
  const transitioningRef = useRef(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const path = pathRef.current

    gsap.set(overlay, {
      opacity: 0,
      visibility: 'hidden',
    })
    gsap.set(path, {
      drawSVG: '0%',
      strokeWidth: 2,
    })

    return () => {
      timelineRef.current?.kill()
      gsap.killTweensOf([overlay, path])
    }
  }, [])

  const navigateWithTransition = useCallback((to, { direction = 'forward' } = {}) => {
    if (transitioningRef.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(to)
      window.scrollTo(0, 0)
      return
    }

    const overlay = overlayRef.current
    const path = pathRef.current
    if (!overlay || !path) return
    const isReverse = direction === 'reverse'

    transitioningRef.current = true
    setIsTransitioning(true)

    timelineRef.current?.kill()
    gsap.set(overlay, {
      opacity: 0,
      visibility: 'visible',
    })
    gsap.set(path, {
      drawSVG: isReverse ? '100% 100%' : '0%',
      strokeWidth: 2,
    })

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.set(path, {
          drawSVG: '0%',
          strokeWidth: 2,
        })
        gsap.set(overlay, {
          opacity: 0,
          visibility: 'hidden',
        })
        timelineRef.current = null
        transitioningRef.current = false
        setIsTransitioning(false)
      },
    })

    timeline.to(overlay, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.inOut',
    }, 0)

    if (isReverse) {
      timeline
        .to(path, {
          drawSVG: '0% 100%',
          strokeWidth: 300,
          duration: 1.5,
          ease: 'power2.inOut',
        }, 0)
        .add(() => {
          navigate(to)
          window.scrollTo(0, 0)
        }, 1.5)
        .to(path, {
          drawSVG: '0% 0%',
          strokeWidth: 2,
          duration: 1.5,
          ease: 'power2.inOut',
        }, 1.5)
    } else {
      timeline
        .to(path, {
          drawSVG: '100%',
          strokeWidth: 300,
          duration: 1.5,
          ease: 'power2.inOut',
        }, 0)
        .add(() => {
          navigate(to)
          window.scrollTo(0, 0)
        }, 1.5)
        .to(path, {
          drawSVG: '100% 100%',
          strokeWidth: 2,
          duration: 1.5,
          ease: 'power2.inOut',
        }, 1.5)
    }

    timeline.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
    }, 2.5)

    timelineRef.current = timeline
  }, [navigate])

  const contextValue = useMemo(() => ({
    navigateWithTransition,
    isTransitioning,
  }), [navigateWithTransition, isTransitioning])

  return (
    <PageTransitionContext.Provider value={contextValue}>
      {children}
      <div
        ref={overlayRef}
        className="page-transition"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1316 664"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            ref={pathRef}
            d="M13.4746 291.27C13.4746 291.27 100.646 -18.6724 255.617 16.8418C410.588 52.356 61.0296 431.197 233.017 546.326C431.659 679.299 444.494 21.0125 652.73 100.784C860.967 180.556 468.663 430.709 617.216 546.326C765.769 661.944 819.097 48.2722 988.501 120.156C1174.21 198.957 809.424 543.841 988.501 636.726C1189.37 740.915 1301.67 149.213 1301.67 149.213"
            fill="none"
            stroke="#D8B568"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </PageTransitionContext.Provider>
  )
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext)

  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider')
  }

  return context
}
