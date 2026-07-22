import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, Environment, Html, Lightformer, Text } from '@react-three/drei'
import { ACESFilmicToneMapping, Plane, Vector3 } from 'three'
import Logo from './assets/components/Logo'
import './App.css'

const LOGO_WIDTH = 1.76
const LOGO_HEIGHT = 2
const LOGO_SIZE_MULTIPLIER = 1.45 // Cambia este valor para ajustar el tamaño del logo 3D -CG
const RISE_PHASE_END = 0.38
const OLD_TEXT_PLANE = new Plane(new Vector3(-1, 0, 0), 100)
const NEW_TEXT_PLANE = new Plane(new Vector3(1, 0, 0), -100)
const OLD_TEXT_CLIPPING_PLANES = [OLD_TEXT_PLANE]
const NEW_TEXT_CLIPPING_PLANES = [NEW_TEXT_PLANE]

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
  const glowRef = useRef(null)
  const { viewport } = useThree()

  useFrame(() => {
    const layout = getLogoLayout(viewport)
    const slideProgress = getSlideProgress(progressRef.current)
    const slidePosition = getSlidePosition(layout, slideProgress)
    const boundary =
      slideProgress === 0 ? viewport.width / 2 + 1 : slidePosition.x + LOGO_WIDTH * layout.scale * 0.18
    const glow = glowRef.current

    OLD_TEXT_PLANE.constant = boundary
    NEW_TEXT_PLANE.constant = -boundary

    if (glow) {
      glow.position.x = boundary
      glow.visible = slideProgress > 0.02 && slideProgress < 0.98
      glow.material.opacity = Math.sin(Math.PI * slideProgress) * 0.22
    }
  })

  return (
    <>
      <CrystalTextLayer clippingPlanes={OLD_TEXT_CLIPPING_PLANES}>Hola Mundo</CrystalTextLayer>
      <CrystalTextLayer clippingPlanes={NEW_TEXT_CLIPPING_PLANES}>Bilateral</CrystalTextLayer>
      <mesh ref={glowRef} position={[viewport.width / 2 + 1, 0, -0.32]}>
        <planeGeometry args={[0.1, clamp(viewport.width * 0.12, 0.6, 1.35)]} />
        <meshBasicMaterial color="#9ff6ff" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

function ScrollAnimatedLogo({ progressRef }) {
  const groupRef = useRef(null)
  const { viewport } = useThree()
  const initialLayout = getLogoLayout(viewport)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const scrollProgress = progressRef.current
    const layout = getLogoLayout(viewport)
    const riseProgress = getRiseProgress(scrollProgress)
    const slideProgress = getSlideProgress(scrollProgress)
    const slidePosition = getSlidePosition(layout, slideProgress)

    group.position.x = slideProgress === 0 ? layout.startX : slidePosition.x
    group.position.y = slideProgress === 0 ? layout.startY + (layout.topY - layout.startY) * riseProgress : slidePosition.y
    group.rotation.y = Math.PI * 2 * slideProgress
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

function SceneContent() {
  const progressRef = useScrollProgressRef()

  return (
    <>
      <MagicalTextTransition progressRef={progressRef} />
      <Suspense fallback={<Loader />}>
        <ScrollAnimatedLogo progressRef={progressRef} />
      </Suspense>
    </>
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
            gl.localClippingEnabled = true
          }}
        >
          <color attach="background" args={['#4f4f4f']} />
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

          <SceneContent />
        </Canvas>
      </section>
      <div className="scroll-space" aria-hidden="true" />
    </main>
  )
}

export default App
