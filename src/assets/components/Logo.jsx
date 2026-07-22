import { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  MeshPhysicalMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

const MODEL_PATH = '/models/logo.glb'
const TEXTURE_SIZE = 1024

function drawWavePath(ctx, points, color, width, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = width * 0.8
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let index = 1; index < points.length - 2; index += 1) {
    const xc = (points[index].x + points[index + 1].x) / 2
    const yc = (points[index].y + points[index + 1].y) / 2
    ctx.quadraticCurveTo(points[index].x, points[index].y, xc, yc)
  }

  ctx.stroke()
  ctx.restore()
}

function createOceanWaveTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE

  const ctx = canvas.getContext('2d')
  const base = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  base.addColorStop(0, '#02101b')
  base.addColorStop(0.35, '#05283e')
  base.addColorStop(0.65, '#073b57')
  base.addColorStop(1, '#010914')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  for (let band = 0; band < 18; band += 1) {
    const points = []
    const yStart = -80 + band * 70
    const amplitude = 26 + (band % 4) * 9
    const phase = band * 0.83

    for (let step = 0; step <= 52; step += 1) {
      const x = -80 + step * 24
      const y =
        yStart +
        Math.sin(step * 0.42 + phase) * amplitude +
        Math.sin(step * 0.14 + phase * 2.1) * 38
      points.push({ x, y })
    }

    drawWavePath(ctx, points, band % 3 === 0 ? '#58e4f4' : '#0e789e', band % 3 === 0 ? 18 : 28, 0.18)
    drawWavePath(ctx, points, '#8cf5ff', 4, band % 3 === 0 ? 0.55 : 0.28)
  }

  for (let swirl = 0; swirl < 9; swirl += 1) {
    const cx = 120 + ((swirl * 173) % 840)
    const cy = 90 + ((swirl * 251) % 850)
    const radius = 80 + (swirl % 3) * 48

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(swirl * 0.72)
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = swirl % 2 ? '#0ea0c8' : '#6fefff'
    ctx.lineWidth = 12
    ctx.shadowColor = '#67ecff'
    ctx.shadowBlur = 18
    ctx.beginPath()

    for (let t = 0; t < Math.PI * 1.85; t += 0.12) {
      const r = radius * (t / (Math.PI * 1.85))
      const x = Math.cos(t) * r
      const y = Math.sin(t) * r * 0.58
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
    ctx.restore()
  }

  const gloss = ctx.createRadialGradient(360, 220, 20, 360, 220, 520)
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.22)')
  gloss.addColorStop(0.22, 'rgba(102, 235, 255, 0.12)')
  gloss.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(1.45, 1.9)
  texture.rotation = -0.16
  texture.center.set(0.5, 0.5)
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true

  return texture
}

export default function Logo(props) {
  const { scene } = useGLTF(MODEL_PATH)
  const oceanMaterial = useMemo(() => {
    const oceanTexture = createOceanWaveTexture()

    return new MeshPhysicalMaterial({ // Color principal logo 3D
      color: '#00afbf',
      map: oceanTexture,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.8,
      ior: 1.4,
      metalness: 0,
      opacity: 1,
      roughness: 0.2,
      side: DoubleSide,
      specularColor: '#b9f7ff',
      specularIntensity: 0.75,
      transmission: 0,
      transparent: false,
    })
  }, [])

  useLayoutEffect(() => {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.material = oceanMaterial
      }
    })
  }, [oceanMaterial, scene])

  return <primitive object={scene} {...props} />
}

useGLTF.preload(MODEL_PATH)
