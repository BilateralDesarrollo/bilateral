import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Html, Lightformer } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import Logo from './assets/components/Logo'
import './App.css'

const LOGO_WIDTH = 1.76
const LOGO_HEIGHT = 2

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function getScrollProgress() {
  const animationDistance = window.innerHeight * 1.2
  return clamp(window.scrollY / animationDistance, 0, 1)
}

function getLogoLayout(viewport) {
  const edgeMargin = Math.max(Math.min(viewport.width, viewport.height) * 0.04, 0.12)
  const scale = clamp(
    Math.min((viewport.height * 0.36) / LOGO_HEIGHT, (viewport.width * 0.42) / LOGO_WIDTH),
    0.32,
    0.72,
  )
  const halfWidth = (LOGO_WIDTH * scale) / 2
  const halfHeight = (LOGO_HEIGHT * scale) / 2

  return {
    endX: -viewport.width / 2 + halfWidth + edgeMargin,
    endY: -viewport.height / 2 + halfHeight + edgeMargin,
    scale,
    startX: viewport.width / 2 - halfWidth - edgeMargin,
    startY: viewport.height / 2 - halfHeight - edgeMargin,
  }
}

function Loader() {
  return (
    <Html center>
      <div className="model-loader" aria-label="Cargando modelo 3D" />
    </Html>
  )
}

function ScrollAnimatedLogo() {
  const groupRef = useRef(null)
  const progressRef = useRef(0)
  const { invalidate, viewport } = useThree()
  const initialLayout = getLogoLayout(viewport)

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

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const progress = easeInOutCubic(progressRef.current)
    const layout = getLogoLayout(viewport)

    group.position.x = layout.startX + (layout.endX - layout.startX) * progress
    group.position.y = layout.startY + (layout.endY - layout.startY) * progress
    group.rotation.y = Math.PI * 2 * progress
    group.scale.setScalar(layout.scale)
  })

  return (
    <group ref={groupRef} position={[initialLayout.startX, initialLayout.startY, 0]} scale={initialLayout.scale}>
      <Center>
        <Logo />
      </Center>
    </group>
  )
}

function App() {
  return (
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
          }}
        >
          <color attach="background" args={['#4f4f4f']} /> // Color fondo -S
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

          <Suspense fallback={<Loader />}>
            <ScrollAnimatedLogo />
          </Suspense>
        </Canvas>
      </section>
      <div className="scroll-space" aria-hidden="true" />
    </main>
  )
}

export default App
