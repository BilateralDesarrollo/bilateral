import { useLayoutEffect, useMemo, useRef } from 'react'
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
const TEXTURE_SIZE = 512

function drawSoftRibbon(ctx, points, color, width, alpha, blur = width) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = color
  ctx.shadowBlur = blur
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

function drawGlowEllipse(ctx, x, y, radiusX, radiusY, rotation, color, alpha) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.filter = 'blur(22px)'
  ctx.beginPath()
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function createCrystalTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE

  const ctx = canvas.getContext('2d')
  const base = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  base.addColorStop(0, '#08253a')
  base.addColorStop(0.34, '#1c6a83')
  base.addColorStop(0.68, '#0d425e')
  base.addColorStop(1, '#041725')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  drawGlowEllipse(ctx, 180, 280, 180, 70, -0.45, '#4fe5f1', 0.34)
  drawGlowEllipse(ctx, 760, 300, 220, 85, 0.62, '#7af4ff', 0.28)
  drawGlowEllipse(ctx, 540, 740, 260, 95, -0.28, '#2fc4e3', 0.26)
  drawGlowEllipse(ctx, 250, 780, 190, 72, 0.94, '#b3fff4', 0.16)

  const ribbons = [
    {
      alpha: 0.32,
      color: '#9ef8ff',
      points: [
        { x: -80, y: 290 },
        { x: 150, y: 180 },
        { x: 370, y: 180 },
        { x: 610, y: 250 },
        { x: 910, y: 160 },
        { x: 1110, y: 230 },
      ],
      width: 34,
    },
    {
      alpha: 0.24,
      color: '#25c9ef',
      points: [
        { x: -60, y: 650 },
        { x: 190, y: 560 },
        { x: 440, y: 670 },
        { x: 680, y: 610 },
        { x: 1100, y: 700 },
      ],
      width: 44,
    },
    {
      alpha: 0.18,
      color: '#d3fff7',
      points: [
        { x: 40, y: 910 },
        { x: 300, y: 840 },
        { x: 590, y: 930 },
        { x: 900, y: 820 },
        { x: 1080, y: 870 },
      ],
      width: 26,
    },
  ]

  ribbons.forEach((ribbon) => {
    drawSoftRibbon(ctx, ribbon.points, ribbon.color, ribbon.width, ribbon.alpha, 34)
  })

  const gloss = ctx.createRadialGradient(360, 220, 20, 360, 220, 520)
  gloss.addColorStop(0, 'rgba(255, 255, 255, 0.36)')
  gloss.addColorStop(0.18, 'rgba(165, 250, 255, 0.18)')
  gloss.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  const shade = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, 0)
  shade.addColorStop(0, 'rgba(0, 14, 28, 0.28)')
  shade.addColorStop(0.45, 'rgba(255, 255, 255, 0)')
  shade.addColorStop(1, 'rgba(0, 12, 24, 0.34)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(1.08, 1.18)
  texture.rotation = -0.06
  texture.center.set(0.5, 0.5)
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true

  return texture
}

export default function Logo({ color = '#93e7f2', emissive = '#063044', onReady, useCrystalTexture = true, ...props }) {
  const { scene } = useGLTF(MODEL_PATH)
  const modelScene = useMemo(() => scene.clone(true), [scene])
  const crystalTexture = useMemo(() => createCrystalTexture(), [])
  const readyRef = useRef(false)
  const crystalMaterial = useMemo(() => {
    return new MeshPhysicalMaterial({
      color,
      map: useCrystalTexture ? crystalTexture : null,
      attenuationColor: '#55cfe6',
      attenuationDistance: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.055,
      depthWrite: false,
      emissive,
      emissiveIntensity: 0.08,
      emissiveMap: useCrystalTexture ? crystalTexture : null,
      envMapIntensity: 2.65,
      ior: 1.48,
      metalness: 0,
      opacity: 0.9,
      roughness: 0.08,
      side: DoubleSide,
      specularColor: '#ecfdff',
      specularIntensity: 1,
      thickness: 0.55,
      transmission: 0.08,
      transparent: true,
    })
  }, [color, crystalTexture, emissive, useCrystalTexture])

  useLayoutEffect(() => {
    modelScene.traverse((object) => {
      if (object.isMesh) {
        object.material = crystalMaterial
      }
    })

    if (!readyRef.current) {
      readyRef.current = true
      onReady?.()
    }
  }, [crystalMaterial, modelScene, onReady])

  return <primitive object={modelScene} {...props} />
}

useGLTF.preload(MODEL_PATH)
