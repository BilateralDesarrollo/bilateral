import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Html, Lightformer, Text, useProgress } from '@react-three/drei'
import { ACESFilmicToneMapping, Plane, Vector3 } from 'three'
import Logo from './assets/components/Logo'
import './App.css'

const LOGO_WIDTH = 1.76
const LOGO_HEIGHT = 2
const LOGO_SIZE_MULTIPLIER = 1.45 // Cambia este valor para ajustar el tamaño del logo 3D -CG
const LOGO_FORWARD_DEPTH = 1.35
const LOGO_FORWARD_SCALE = 0.38
const RISE_PHASE_END = 0.38
const OLD_TEXT_PLANE = new Plane(new Vector3(-1, 0, 0), 100)
const NEW_TEXT_PLANE = new Plane(new Vector3(1, 0, 0), -100)
const OLD_TEXT_CLIPPING_PLANES = [OLD_TEXT_PLANE]
const NEW_TEXT_CLIPPING_PLANES = [NEW_TEXT_PLANE]
const AWARDS = [
  {
    color: '#00d47a',
    emissive: '#003d25',
    title: 'Green Horizon Award',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer feugiat arcu vitae sem porttitor, sed tempor justo facilisis.',
  },
  {
    color: '#ff3d3d',
    emissive: '#4a0505',
    title: 'Red Signal Prize',
    body: 'Praesent luctus ligula non lorem volutpat, nec hendrerit lectus aliquet. Donec sed sapien vel magna luctus dignissim.',
  },
  {
    color: '#9b5cff',
    emissive: '#211044',
    title: 'Purple Motion Honors',
    body: 'Suspendisse potenti. Vivamus viverra diam at tortor tincidunt, id egestas nibh bibendum. Sed vitae lorem non mauris.',
  },
  {
    color: '#ffd84d',
    emissive: '#4f3900',
    title: 'Golden Flow Mention',
    body: 'Curabitur feugiat nibh et risus dictum, quis fermentum justo porta. Maecenas luctus elit in ipsum commodo malesuada.',
  },
  {
    color: '#ff6fcf',
    emissive: '#4f113b',
    title: 'Pink Glass Selection',
    body: 'Aliquam erat volutpat. Nam vehicula turpis eu odio tempor, et placerat nulla ullamcorper. Nulla facilisi in amet.',
  },
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function getScrollProgress() {
  const animationDistance = window.innerHeight * 2.45
  return clamp(window.scrollY / animationDistance, 0, 1)
}

function getAwardsRevealProgress() {
  const awardsSection = document.querySelector('.awards-section')
  if (!awardsSection) return 0

  const rect = awardsSection.getBoundingClientRect()
  return clamp((window.innerHeight - rect.top) / (window.innerHeight * 0.9), 0, 1)
}

function getLogoLayout(viewport) {
  const edgeMargin = Math.max(Math.min(viewport.width, viewport.height) * 0.035, 0.1)
  const baseScale = Math.min((viewport.height * 0.52) / LOGO_HEIGHT, (viewport.width * 0.62) / LOGO_WIDTH)
  const scale = clamp(baseScale * LOGO_SIZE_MULTIPLIER, 0.52, 1.18)
  const halfWidth = (LOGO_WIDTH * scale) / 2
  const halfHeight = (LOGO_HEIGHT * scale) / 2
  const bottomY = -viewport.height / 2 + halfHeight + edgeMargin
  const topY = viewport.height / 2 - halfHeight - edgeMargin

  return {
    endX: -viewport.width / 2 + halfWidth + edgeMargin,
    endY: bottomY,
    scale,
    startX: viewport.width / 2 - halfWidth - edgeMargin,
    startY: bottomY,
    topY,
  }
}

function getSlidePosition(layout, progress) {
  const centerX = 0
  const centerY = (layout.topY + layout.endY) * 0.5
  const inverseProgress = 1 - progress

  return {
    x:
      inverseProgress * inverseProgress * layout.startX +
      2 * inverseProgress * progress * centerX +
      progress * progress * layout.endX,
    y:
      inverseProgress * inverseProgress * layout.topY +
      2 * inverseProgress * progress * centerY +
      progress * progress * layout.endY,
  }
}

function Loader() {
  return (
    <Html center>
      <div className="model-loader" aria-label="Cargando modelo 3D" />
    </Html>
  )
}

function getRiseProgress(scrollProgress) {
  return easeInOutCubic(clamp(scrollProgress / RISE_PHASE_END, 0, 1))
}

function getSlideProgress(scrollProgress) {
  return easeInOutCubic(clamp((scrollProgress - RISE_PHASE_END) / (1 - RISE_PHASE_END), 0, 1))
}

function useScrollProgressRef() {
  const progressRef = useRef(0)
  const { invalidate } = useThree()

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      progressRef.current = getScrollProgress()
      invalidate()
      frame = 0
    }

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateProgress)
      }
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [invalidate])

  return progressRef
}

function LoadingScreen({ contentReady, modelReady }) {
  const { active, progress } = useProgress()
  const [fontsReady, setFontsReady] = useState(() => typeof document === 'undefined' || !document.fonts)
  const [windowReady, setWindowReady] = useState(() => typeof document === 'undefined' || document.readyState === 'complete')
  const [opening, setOpening] = useState(false)
  const [visible, setVisible] = useState(true)
  const ready = contentReady && modelReady && fontsReady && windowReady && !active
  const loadingProgress = Math.round(
    ready
      ? 100
      : clamp(Math.max(progress || 0, modelReady ? 68 : 0) + (fontsReady ? 10 : 0) + (contentReady ? 12 : 0) + (windowReady ? 10 : 0), 0, 99),
  )

  useEffect(() => {
    if (!document.fonts) return

    let mounted = true

    Promise.all([document.fonts.load('1em "Cook Thonic"'), document.fonts.load('1em "Lenia Mono"'), document.fonts.ready])
      .then(() => {
        if (mounted) setFontsReady(true)
      })
      .catch(() => {
        if (mounted) setFontsReady(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (document.readyState === 'complete') {
      const readyTimer = window.setTimeout(() => setWindowReady(true), 0)

      return () => {
        window.clearTimeout(readyTimer)
      }
    }

    const handleLoad = () => setWindowReady(true)
    window.addEventListener('load', handleLoad, { once: true })

    return () => {
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('site-loading', visible)

    return () => {
      document.body.classList.remove('site-loading')
    }
  }, [visible])

  useEffect(() => {
    if (!ready) return

    const openTimer = window.setTimeout(() => setOpening(true), 260)
    const removeTimer = window.setTimeout(() => setVisible(false), 1500)

    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(removeTimer)
    }
  }, [ready])

  if (!visible) return null

  return (
    <div className={`loading-screen${opening ? ' is-opening' : ''}`} role="status" aria-live="polite">
      <div className="loading-screen__panel">
        <div className="loading-screen__content">
          <p>Bilateral</p>
          <span>{loadingProgress}</span>
        </div>
        <div className="loading-screen__handle" />
      </div>
    </div>
  )
}

function CrystalTextLayer({ children, clippingPlanes }) {
  const { viewport } = useThree()
  const fontSize = clamp(viewport.width * 0.085, 0.28, 0.72)

  return (
    <group position={[0, 0, -0.5]}>
      <Text anchorX="center" anchorY="middle" color="#36d6ff" fontSize={fontSize} letterSpacing={0} outlineColor="#b9f7ff" outlineOpacity={0.22} outlineWidth={0.012}>
        {children}
        <meshPhysicalMaterial
          clippingPlanes={clippingPlanes}
          color="#36d6ff"
          emissive="#07364d"
          emissiveIntensity={0.12}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={2.4}
          ior={1.45}
          metalness={0}
          opacity={0.78}
          roughness={0.08}
          specularColor="#f1fdff"
          specularIntensity={1}
          thickness={0.35}
          transmission={0.18}
          transparent
        />
      </Text>
      <Text anchorX="center" anchorY="middle" color="#61eaff" fontSize={fontSize * 1.015} letterSpacing={0} position={[0.018, -0.02, -0.04]}>
        {children}
        <meshBasicMaterial clippingPlanes={clippingPlanes} color="#61eaff" opacity={0.16} transparent />
      </Text>
    </group>
  )
}

function MagicalTextTransition({ progressRef }) {
  const { viewport } = useThree()
  const textGroupRef = useRef(null)

  useFrame(() => {
    const layout = getLogoLayout(viewport)
    const slideProgress = getSlideProgress(progressRef.current)
    const slidePosition = getSlidePosition(layout, slideProgress)
    const boundary =
      slideProgress === 0 ? viewport.width / 2 + 1 : slidePosition.x + LOGO_WIDTH * layout.scale * 0.18

    OLD_TEXT_PLANE.constant = boundary
    NEW_TEXT_PLANE.constant = -boundary

    if (textGroupRef.current) {
      textGroupRef.current.position.y = getAwardsRevealProgress() * viewport.height * 0.72
    }
  })

  return (
    <group ref={textGroupRef}>
      <CrystalTextLayer clippingPlanes={OLD_TEXT_CLIPPING_PLANES}>Hola Mundo</CrystalTextLayer>
      <CrystalTextLayer clippingPlanes={NEW_TEXT_CLIPPING_PLANES}>Bilateral</CrystalTextLayer>
    </group>
  )
}

function CursorLamp() {
  const lightRef = useRef(null)
  const targetRef = useRef(new Vector3(0, 0, 2.8))
  const activeRef = useRef(false)
  const { gl, invalidate, viewport } = useThree()

  useEffect(() => {
    const updateLightTarget = (event) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

      targetRef.current.set((x * viewport.width) / 2, (y * viewport.height) / 2, 2.8)
      activeRef.current = true
      invalidate()
    }

    const dimLight = () => {
      activeRef.current = false
      invalidate()
    }

    const canvas = gl.domElement
    canvas.addEventListener('pointermove', updateLightTarget)
    canvas.addEventListener('pointerenter', updateLightTarget)
    canvas.addEventListener('pointerleave', dimLight)

    return () => {
      canvas.removeEventListener('pointermove', updateLightTarget)
      canvas.removeEventListener('pointerenter', updateLightTarget)
      canvas.removeEventListener('pointerleave', dimLight)
    }
  }, [gl, invalidate, viewport.height, viewport.width])

  useFrame(() => {
    const light = lightRef.current
    if (!light) return

    light.position.lerp(targetRef.current, 0.32)
    light.intensity += ((activeRef.current ? 7.5 : 0.85) - light.intensity) * 0.24

    if (activeRef.current || light.intensity > 0.9) {
      invalidate()
    }
  })

  return <pointLight ref={lightRef} position={[0, 0, 2.8]} intensity={0.85} distance={3.8} decay={1.35} color="#e9fdff" />
}

function ScrollAnimatedLogo({ activeAward, onReady, progressRef }) {
  const groupRef = useRef(null)
  const { viewport } = useThree()
  const initialLayout = getLogoLayout(viewport)
  const logoColor = activeAward?.color || '#93e7f2'
  const logoEmissive = activeAward?.emissive || '#063044'
  const useCrystalTexture = !activeAward

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const scrollProgress = progressRef.current
    const layout = getLogoLayout(viewport)
    const riseProgress = getRiseProgress(scrollProgress)
    const slideProgress = getSlideProgress(scrollProgress)
    const slidePosition = getSlidePosition(layout, slideProgress)
    const forwardProgress = Math.sin(Math.PI * slideProgress)

    const sceneX = slideProgress === 0 ? layout.startX : slidePosition.x
    const sceneY = slideProgress === 0 ? layout.startY + (layout.topY - layout.startY) * riseProgress : slidePosition.y

    group.position.x = sceneX
    group.position.y = sceneY
    group.position.z = forwardProgress * LOGO_FORWARD_DEPTH
    group.rotation.y = Math.PI * 2 * slideProgress
    group.scale.setScalar(layout.scale * (1 + forwardProgress * LOGO_FORWARD_SCALE))
  })

  return (
    <group ref={groupRef} position={[initialLayout.startX, initialLayout.startY, 0]} scale={initialLayout.scale}>
      <Center>
        <Logo color={logoColor} emissive={logoEmissive} onReady={onReady} useCrystalTexture={useCrystalTexture} />
      </Center>
    </group>
  )
}

function SceneContent({ activeAward, onLogoReady }) {
  const progressRef = useScrollProgressRef()

  return (
    <>
      <MagicalTextTransition progressRef={progressRef} />
      <Suspense fallback={<Loader />}>
        <ScrollAnimatedLogo activeAward={activeAward} onReady={onLogoReady} progressRef={progressRef} />
      </Suspense>
    </>
  )
}

function App() {
  const [activeAward, setActiveAward] = useState(null)
  const [contentReady, setContentReady] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const handleAwardsReady = useCallback(() => setContentReady(true), [])
  const handleLogoReady = useCallback(() => setModelReady(true), [])

  return (
    <>
      <main className="logo-viewer">
        <section className="logo-scene">
          <Canvas
            frameloop="demand"
            dpr={1}
            camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false }}
            onCreated={({ gl }) => {
              gl.toneMapping = ACESFilmicToneMapping
              gl.toneMappingExposure = 1
              gl.localClippingEnabled = true
            }}
          >
            <color attach="background" args={['#1a1a1a']} />
            <ambientLight intensity={0.26} />
            <hemisphereLight args={['#d8fbff', '#0b3750', 0.72]} />
            <directionalLight position={[4, 5, 7]} intensity={1.55} color="#2bf6f9" />
            <directionalLight position={[-4, -2, 5]} intensity={0.48} color="#0c82bd" />
            <directionalLight position={[0, 2, -6]} intensity={0.95} color="#9beeff" />
            <pointLight position={[0, 0, 4]} intensity={0.64} color="#50d8ff" />
            <pointLight position={[0, 1.5, -3.5]} intensity={0.78} color="#8cefff" />
            <Environment resolution={64} background={false} environmentIntensity={1.15}>
              <Lightformer intensity={4.2} color="#ffffff" position={[-2.5, 2.5, 5]} rotation={[0, 0.35, 0]} scale={[0.9, 5.2, 1]} />
              <Lightformer intensity={6.4} color="#dffbff" position={[2.8, 1.4, 4]} rotation={[0, -0.45, 0]} scale={[0.8, 3.8, 1]} />
              <Lightformer intensity={2.2} color="#1ec9f2" position={[0, -2.2, 4]} rotation={[0.6, 0, 0]} scale={[5, 1.2, 1]} />
              <Lightformer intensity={3.4} color="#4edcff" position={[0, 0.5, -4]} scale={[8, 8, 1]} />
            </Environment>
            <CursorLamp />

            <SceneContent activeAward={activeAward} onLogoReady={handleLogoReady} />
          </Canvas>
        </section>
        <div className="scroll-space" aria-hidden="true" />
        <AwardsSection onActiveAwardChange={setActiveAward} onReady={handleAwardsReady} />
      </main>
      <LoadingScreen contentReady={contentReady} modelReady={modelReady} />
    </>
  )
}

function AwardsSection({ onActiveAwardChange, onReady }) {
  const sectionRef = useRef(null)
  const rowRefs = useRef([])
  const activeIndexRef = useRef()

  useEffect(() => {
    let firstFrame = 0
    let secondFrame = 0

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const section = sectionRef.current
        const rowsReady = rowRefs.current.filter(Boolean).length === AWARDS.length

        if (section && rowsReady && section.offsetHeight > 0) {
          onReady()
        }
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [onReady])

  useEffect(() => {
    let frame = 0

    const updateActiveAward = () => {
      const section = sectionRef.current
      if (!section) return

      const sectionRect = section.getBoundingClientRect()
      const logoY = window.innerHeight * 0.64
      let nextIndex = null

      if (sectionRect.top > logoY || sectionRect.bottom < logoY) {
        if (activeIndexRef.current !== null) {
          activeIndexRef.current = null
          onActiveAwardChange(null)
        }
        frame = 0
        return
      }

      rowRefs.current.forEach((row, index) => {
        if (!row) return

        const rowRect = row.getBoundingClientRect()

        if (rowRect.top <= logoY && rowRect.bottom >= logoY) {
          nextIndex = index
        }
      })

      const lastRow = rowRefs.current[rowRefs.current.length - 1]

      if (nextIndex === null && lastRow?.getBoundingClientRect().bottom < logoY) {
        nextIndex = AWARDS.length - 1
      }

      if (activeIndexRef.current !== nextIndex) {
        activeIndexRef.current = nextIndex
        onActiveAwardChange(nextIndex === null ? null : AWARDS[nextIndex])
      }

      frame = 0
    }

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActiveAward)
      }
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [onActiveAwardChange])

  return (
    <section className="awards-section" ref={sectionRef}>
      <div className="awards-left-space" aria-hidden="true" />
      <div className="awards-content">
        <header className="awards-header">
          <p>Reconocimientos</p>
          <h2>Premios y menciones</h2>
        </header>
        <div className="awards-list">
          {AWARDS.map((award, index) => (
            <article
              className="award-row"
              key={award.title}
              ref={(node) => {
                rowRefs.current[index] = node
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{award.title}</h3>
                <p>{award.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default App
