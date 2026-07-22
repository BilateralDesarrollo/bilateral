import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import Logo from './assets/components/Logo'
import './App.css'

function Loader() {
  return (
    <Html center>
      <div className="model-loader" aria-label="Cargando modelo 3D" />
    </Html>
  )
}

function App() {
  return (
    <main className="logo-viewer">
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
        <color attach="background" args={['#e8eaed']} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[4, 5, 7]} intensity={2.1} color="#2bf6f9" /> // Luz externa
        <directionalLight position={[-4, -2, 5]} intensity={0.55} color="#0c82bd" /> // Luz interna
        <pointLight position={[0, 0, 4]} intensity={0.85} color="#50d8ff" /> // Luz interna
        <Environment resolution={64} background={false} environmentIntensity={1.35}>
          <Lightformer intensity={5.2} color="#ffffff" position={[-2.5, 2.5, 5]} rotation={[0, 0.35, 0]} scale={[0.9, 5.2, 1]} />
          <Lightformer intensity={9.4} color="#dffbff" position={[2.8, 1.4, 4]} rotation={[0, -0.45, 0]} scale={[0.8, 3.8, 1]} />
          <Lightformer intensity={2.2} color="#1ec9f2" position={[0, -2.2, 4]} rotation={[0.6, 0, 0]} scale={[5, 1.2, 1]} />
          <Lightformer intensity={4.4} color="#061c3a" position={[0, 0, -4]} scale={[8, 8, 1]} />
        </Environment>

        <Suspense fallback={null}>
          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={1.25}>
              <Center>
                <Logo />
              </Center>
            </Bounds>
          </Suspense>
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping={false}
          enablePan={false}
          enableZoom={false}
          rotateSpeed={1}
          target={[0, 0, 0]}
        />
      </Canvas>
    </main>
  )
}

export default App
