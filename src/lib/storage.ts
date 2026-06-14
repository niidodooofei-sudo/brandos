/* eslint-disable @typescript-eslint/no-explicit-any */
import { createCanvas, loadImage } from 'canvas'
import type { BrandDNAData, ContentInputs } from '@/types'
import { buildCanvasSpec, selectBlueprints } from './canvas-renderer'
import type { LayoutBlueprint } from './canvas-renderer'

export interface GeneratedVariation {
  id: string
  blueprintId: string
  layoutName: string
  thumbnailDataUrl: string
  canvasData: Record<string, unknown>
  score: number
}

export async function generateAssetVariations(
  contentInputs: ContentInputs,
  dna: BrandDNAData,
  outputType: string,
  width: number,
  height: number
): Promise<GeneratedVariation[]> {
  const blueprints = selectBlueprints(contentInputs, dna, outputType, 4)
  const variations: GeneratedVariation[] = []

  for (let i = 0; i < blueprints.length; i++) {
    const bp = blueprints[i]
    const canvasData = buildCanvasSpec(bp, contentInputs, dna, outputType, i)
    const thumbnail = await renderToCanvas(canvasData, bp, contentInputs, dna, width, height)

    variations.push({
      id: `var-${i + 1}`,
      blueprintId: bp.id,
      layoutName: bp.name,
      thumbnailDataUrl: thumbnail,
      canvasData,
      score: 75 + Math.floor(Math.random() * 20),
    })
  }

  return variations
}

async function renderToCanvas(
  spec: Record<string, unknown>,
  blueprint: LayoutBlueprint,
  contentInputs: ContentInputs,
  dna: BrandDNAData,
  width: number,
  height: number
): Promise<string> {
  const scale = Math.min(400 / width, 400 / height)
  const cw = Math.round(width * scale)
  const ch = Math.round(height * scale)

  const canvas = createCanvas(cw, ch)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D

  const bg = spec.background as Record<string, unknown>
  const typography = spec.typography as Record<string, unknown>
  const colors = (dna.colors as Record<string, string>) || {}
  const primary = colors.primary || '#1a1a2e'
  const accent = colors.accent || '#e94560'
  const bgColor = colors.background || '#ffffff'

  if (bg.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, cw, ch)
    grad.addColorStop(0, primary)
    grad.addColorStop(1, accent)
    ctx.fillStyle = grad
  } else if (bg.type === 'solid') {
    ctx.fillStyle = (bg.color as string) || bgColor
  } else {
    ctx.fillStyle = primary
  }
  ctx.fillRect(0, 0, cw, ch)

  if (bg.type === 'image' && contentInputs.images?.[0]) {
    try {
      const img = await loadImage(contentInputs.images[0])
      const imgAspect = img.width / img.height
      const canvasAspect = cw / ch
      let sx = 0, sy = 0, sw = img.width, sh = img.height
      if (imgAspect > canvasAspect) {
        sw = img.height * canvasAspect
        sx = (img.width - sw) / 2
      } else {
        sh = img.width / canvasAspect
        sy = (img.height - sh) / 2
      }
      ctx.drawImage(img as unknown as CanvasImageSource, sx, sy, sw, sh, 0, 0, cw, ch)
    } catch {
      // fallback background already drawn
    }
  }

  const overlay = spec.overlay as Record<string, unknown> | undefined
  if (overlay) {
    ctx.fillStyle = `${overlay.color || primary}${Math.round((overlay.opacity as number) * 255).toString(16).padStart(2, '0')}`
    ctx.fillRect(0, 0, cw, ch)
  }

  const elements = spec.elements as Array<Record<string, unknown>> | undefined
  if (elements) {
    for (const el of elements) {
      if (!el) continue
      const zone = el.zone as Record<string, number>
      const style = el.style as Record<string, unknown>
      const x = (zone.x / width) * cw
      const y = (zone.y / height) * ch
      const w = (zone.width / width) * cw

      if (el.type === 'headline' || el.type === 'subheadline' || el.type === 'body') {
        const fontSize = Math.max(8, ((style.fontSize as number || 20) / height) * ch * 2.5)
        ctx.font = `${style.fontWeight || '700'} ${fontSize}px ${typography.primaryFont || 'sans-serif'}`
        ctx.fillStyle = style.color as string || '#ffffff'
        ctx.textAlign = ((zone.align as unknown as string) || 'left') as CanvasTextAlign

        const textX = String(zone.align) === 'center' ? x + w / 2 : x
        wrapText(ctx, el.text as string, textX, y, w, fontSize * 1.3)
      }

      if (el.type === 'cta') {
        const bh = (zone.height / height) * ch
        const br = Math.min(((style.borderRadius as number || 8) / height) * ch, bh / 2)
        ctx.fillStyle = style.backgroundColor as string || accent
        roundRect(ctx, x, y, w, bh, br)
        ctx.fill()

        const fontSize = Math.max(8, (18 / height) * ch * 2.5)
        ctx.font = `600 ${fontSize}px ${typography.primaryFont || 'sans-serif'}`
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(el.text as string, x + w / 2, y + bh / 2 + fontSize / 3)
      }
    }
  }

  const logoZone = blueprint.zones.logo
  if (logoZone && dna.logoFiles) {
    const logoFiles = dna.logoFiles as Record<string, string>
    const logoSrc = logoFiles.primary || logoFiles.icon
    if (logoSrc) {
      try {
        const logoImg = await loadImage(logoSrc)
        const lx = (logoZone.x / width) * cw
        const ly = (logoZone.y / height) * ch
        const lw = (logoZone.width / width) * cw
        const lh = (lw / logoImg.width) * logoImg.height
        ctx.drawImage(logoImg as unknown as CanvasImageSource, lx, ly, lw, lh)
      } catch {
        // skip if logo can't be loaded
      }
    }
  }

  return canvas.toDataURL('image/jpeg', 0.85)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line + word + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
