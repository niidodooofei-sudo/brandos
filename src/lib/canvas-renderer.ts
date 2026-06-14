import type { BrandDNAData, ContentInputs, AssetVariation } from '@/types'

export interface LayoutBlueprint {
  id: string
  name: string
  style: 'image-led' | 'text-led' | 'split' | 'minimal' | 'bold'
  zones: {
    image?: { x: number; y: number; width: number; height: number; fill?: boolean }
    headline: { x: number; y: number; width: number; maxChars: number; align: 'left' | 'center' | 'right' }
    subheadline?: { x: number; y: number; width: number }
    body?: { x: number; y: number; width: number }
    cta?: { x: number; y: number; width: number; height: number }
    logo?: { x: number; y: number; width: number }
    overlay?: { opacity: number; color?: string }
  }
  background: 'image' | 'solid' | 'gradient' | 'pattern'
  energyLevel: 'calm' | 'moderate' | 'bold'
}

export function selectBlueprints(
  contentInputs: ContentInputs,
  dna: BrandDNAData,
  outputType: string,
  count: number = 4
): LayoutBlueprint[] {
  const hasImage = Boolean(contentInputs.images && contentInputs.images.length > 0)
  const headlineLength = contentInputs.headline?.length || 0
  const hasBody = Boolean(contentInputs.body)
  const hasCTA = Boolean(contentInputs.cta)

  const allBlueprints = getLayoutBlueprintsForType(outputType)

  const scored = allBlueprints.map((bp) => ({
    bp,
    score: scoreBlueprintForContent(bp, { hasImage, headlineLength, hasBody, hasCTA, dna }),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map((s) => s.bp)
}

function scoreBlueprintForContent(
  bp: LayoutBlueprint,
  params: {
    hasImage: boolean
    headlineLength: number
    hasBody: boolean
    hasCTA: boolean
    dna: BrandDNAData
  }
): number {
  let score = 50

  if (params.hasImage && bp.background === 'image') score += 20
  if (!params.hasImage && bp.background !== 'image') score += 15
  if (params.headlineLength < 30 && bp.style === 'minimal') score += 10
  if (params.headlineLength > 40 && bp.style === 'text-led') score += 10
  if (params.hasCTA && bp.zones.cta) score += 15
  if (params.dna.layoutPreference === 'minimalist' && bp.energyLevel === 'calm') score += 10
  if (params.dna.layoutPreference === 'bold' && bp.energyLevel === 'bold') score += 10
  if (params.dna.layoutPreference === 'luxury' && bp.style === 'minimal') score += 10

  return score + Math.random() * 10
}

function getLayoutBlueprintsForType(outputType: string): LayoutBlueprint[] {
  const isSquare = ['instagram_post', 'instagram_carousel', 'facebook_post', 'event_material'].includes(outputType)
  const isStory = ['instagram_story', 'reel_cover'].includes(outputType)
  const isLandscape = ['linkedin_post', 'x_post', 'hero_banner', 'presentation_slide', 'proposal_cover'].includes(outputType)
  const isPortrait = ['flyer', 'poster', 'report_cover', 'rollup_banner'].includes(outputType)

  if (isSquare) return getSquareBlueprints()
  if (isStory) return getStoryBlueprints()
  if (isLandscape) return getLandscapeBlueprints()
  if (isPortrait) return getPortraitBlueprints()
  return getSquareBlueprints()
}

function getSquareBlueprints(): LayoutBlueprint[] {
  return [
    {
      id: 'sq-image-led',
      name: 'Image Led',
      style: 'image-led',
      zones: {
        image: { x: 0, y: 0, width: 1080, height: 1080, fill: true },
        overlay: { opacity: 0.5 },
        headline: { x: 60, y: 640, width: 960, maxChars: 45, align: 'left' },
        subheadline: { x: 60, y: 780, width: 800 },
        cta: { x: 60, y: 900, width: 200, height: 56 },
        logo: { x: 60, y: 60, width: 120 },
      },
      background: 'image',
      energyLevel: 'bold',
    },
    {
      id: 'sq-text-led',
      name: 'Text Led',
      style: 'text-led',
      zones: {
        headline: { x: 80, y: 200, width: 920, maxChars: 55, align: 'center' },
        subheadline: { x: 80, y: 480, width: 920 },
        body: { x: 80, y: 600, width: 920 },
        cta: { x: 390, y: 800, width: 300, height: 60 },
        logo: { x: 80, y: 60, width: 100 },
      },
      background: 'solid',
      energyLevel: 'calm',
    },
    {
      id: 'sq-split',
      name: 'Split Layout',
      style: 'split',
      zones: {
        image: { x: 540, y: 0, width: 540, height: 1080, fill: true },
        headline: { x: 60, y: 300, width: 440, maxChars: 35, align: 'left' },
        subheadline: { x: 60, y: 540, width: 440 },
        cta: { x: 60, y: 700, width: 220, height: 56 },
        logo: { x: 60, y: 900, width: 100 },
      },
      background: 'solid',
      energyLevel: 'moderate',
    },
    {
      id: 'sq-minimal',
      name: 'Minimal',
      style: 'minimal',
      zones: {
        headline: { x: 80, y: 380, width: 920, maxChars: 40, align: 'center' },
        subheadline: { x: 80, y: 580, width: 920 },
        logo: { x: 460, y: 860, width: 160 },
      },
      background: 'solid',
      energyLevel: 'calm',
    },
  ]
}

function getStoryBlueprints(): LayoutBlueprint[] {
  return [
    {
      id: 'story-full-image',
      name: 'Full Image',
      style: 'image-led',
      zones: {
        image: { x: 0, y: 0, width: 1080, height: 1920, fill: true },
        overlay: { opacity: 0.55 },
        headline: { x: 60, y: 900, width: 960, maxChars: 40, align: 'center' },
        subheadline: { x: 60, y: 1100, width: 960 },
        cta: { x: 290, y: 1400, width: 500, height: 70 },
        logo: { x: 80, y: 100, width: 120 },
      },
      background: 'image',
      energyLevel: 'bold',
    },
    {
      id: 'story-top-image',
      name: 'Top Image',
      style: 'split',
      zones: {
        image: { x: 0, y: 0, width: 1080, height: 1000, fill: true },
        headline: { x: 60, y: 1080, width: 960, maxChars: 45, align: 'left' },
        subheadline: { x: 60, y: 1280, width: 960 },
        cta: { x: 60, y: 1550, width: 300, height: 70 },
        logo: { x: 80, y: 1760, width: 100 },
      },
      background: 'solid',
      energyLevel: 'moderate',
    },
  ]
}

function getLandscapeBlueprints(): LayoutBlueprint[] {
  return [
    {
      id: 'land-image-left',
      name: 'Image Left',
      style: 'split',
      zones: {
        image: { x: 0, y: 0, width: 600, height: 627, fill: true },
        headline: { x: 660, y: 100, width: 500, maxChars: 50, align: 'left' },
        subheadline: { x: 660, y: 260, width: 500 },
        body: { x: 660, y: 350, width: 480 },
        cta: { x: 660, y: 480, width: 200, height: 50 },
        logo: { x: 660, y: 40, width: 100 },
      },
      background: 'solid',
      energyLevel: 'moderate',
    },
    {
      id: 'land-full-image',
      name: 'Full Bleed',
      style: 'image-led',
      zones: {
        image: { x: 0, y: 0, width: 1200, height: 627, fill: true },
        overlay: { opacity: 0.5 },
        headline: { x: 80, y: 200, width: 800, maxChars: 55, align: 'left' },
        subheadline: { x: 80, y: 360, width: 700 },
        cta: { x: 80, y: 480, width: 200, height: 52 },
        logo: { x: 1040, y: 50, width: 100 },
      },
      background: 'image',
      energyLevel: 'bold',
    },
    {
      id: 'land-text-center',
      name: 'Centered Text',
      style: 'text-led',
      zones: {
        headline: { x: 100, y: 150, width: 1000, maxChars: 60, align: 'center' },
        subheadline: { x: 100, y: 330, width: 1000 },
        cta: { x: 500, y: 470, width: 200, height: 52 },
        logo: { x: 80, y: 50, width: 100 },
      },
      background: 'gradient',
      energyLevel: 'calm',
    },
  ]
}

function getPortraitBlueprints(): LayoutBlueprint[] {
  return [
    {
      id: 'port-hero-top',
      name: 'Hero Top',
      style: 'image-led',
      zones: {
        image: { x: 0, y: 0, width: 2480, height: 1600, fill: true },
        overlay: { opacity: 0.45 },
        headline: { x: 120, y: 1700, width: 2240, maxChars: 50, align: 'left' },
        subheadline: { x: 120, y: 2000, width: 2000 },
        body: { x: 120, y: 2200, width: 2000 },
        cta: { x: 120, y: 2800, width: 400, height: 100 },
        logo: { x: 120, y: 120, width: 200 },
      },
      background: 'image',
      energyLevel: 'bold',
    },
    {
      id: 'port-text-center',
      name: 'Centered',
      style: 'minimal',
      zones: {
        headline: { x: 120, y: 800, width: 2240, maxChars: 40, align: 'center' },
        subheadline: { x: 120, y: 1200, width: 2240 },
        body: { x: 200, y: 1600, width: 2080 },
        cta: { x: 990, y: 2400, width: 500, height: 110 },
        logo: { x: 1100, y: 200, width: 280 },
      },
      background: 'solid',
      energyLevel: 'calm',
    },
  ]
}

export function buildCanvasSpec(
  blueprint: LayoutBlueprint,
  contentInputs: ContentInputs,
  dna: BrandDNAData,
  outputType: string,
  variationIndex: number
): Record<string, unknown> {
  const colors = (dna.colors as Record<string, string>) || {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
    background: '#ffffff',
    text: '#1a1a2e',
  }

  const primaryColor = colors.primary || '#1a1a2e'
  const accentColor = colors.accent || '#e94560'
  const backgroundColor = colors.background || '#ffffff'
  const textColor = colors.text || '#1a1a2e'

  const variationTweaks = [
    { bgTint: primaryColor, ctaColor: accentColor, overlayColor: primaryColor },
    { bgTint: accentColor, ctaColor: primaryColor, overlayColor: accentColor },
    { bgTint: backgroundColor, ctaColor: primaryColor, overlayColor: primaryColor },
    { bgTint: primaryColor, ctaColor: backgroundColor, overlayColor: accentColor },
  ]
  const tweak = variationTweaks[variationIndex % variationTweaks.length]

  return {
    blueprint: blueprint.id,
    outputType,
    background: {
      type: blueprint.background,
      color: blueprint.background === 'solid' ? tweak.bgTint : backgroundColor,
      gradient: blueprint.background === 'gradient'
        ? { from: primaryColor, to: accentColor, direction: 'to-br' }
        : undefined,
    },
    overlay: blueprint.zones.overlay
      ? { opacity: blueprint.zones.overlay.opacity, color: tweak.overlayColor }
      : undefined,
    image: contentInputs.images?.[0]
      ? { src: contentInputs.images[0], zone: blueprint.zones.image, fit: 'cover' }
      : undefined,
    typography: {
      primaryFont: dna.primaryFont || 'Inter',
      secondaryFont: dna.secondaryFont || 'Inter',
      headingWeight: dna.headingWeight || '700',
      bodyWeight: dna.bodyWeight || '400',
      color: textColor,
    },
    elements: [
      contentInputs.headline && {
        type: 'headline',
        text: contentInputs.headline,
        zone: blueprint.zones.headline,
        style: {
          fontFamily: dna.primaryFont || 'Inter',
          fontWeight: dna.headingWeight || '700',
          color: blueprint.background === 'image' || blueprint.background === 'gradient' ? '#ffffff' : textColor,
          fontSize: getHeadlineFontSize(contentInputs.headline.length, blueprint.zones.headline.maxChars),
        },
      },
      contentInputs.subheadline && blueprint.zones.subheadline && {
        type: 'subheadline',
        text: contentInputs.subheadline,
        zone: blueprint.zones.subheadline,
        style: {
          fontFamily: dna.secondaryFont || dna.primaryFont || 'Inter',
          fontWeight: '400',
          color: blueprint.background === 'image' ? 'rgba(255,255,255,0.85)' : textColor,
          fontSize: 24,
        },
      },
      contentInputs.body && blueprint.zones.body && {
        type: 'body',
        text: contentInputs.body,
        zone: blueprint.zones.body,
        style: {
          fontFamily: dna.secondaryFont || dna.primaryFont || 'Inter',
          fontWeight: '400',
          color: blueprint.background === 'image' ? 'rgba(255,255,255,0.75)' : `${textColor}cc`,
          fontSize: 18,
        },
      },
      contentInputs.cta && blueprint.zones.cta && {
        type: 'cta',
        text: contentInputs.cta,
        zone: blueprint.zones.cta,
        style: {
          backgroundColor: tweak.ctaColor,
          color: '#ffffff',
          fontFamily: dna.primaryFont || 'Inter',
          fontWeight: '600',
          borderRadius: dna.shapeLanguage === 'geometric' ? 0 : dna.shapeLanguage === 'organic' ? 50 : 8,
          fontSize: 18,
        },
      },
      dna.logoFiles && blueprint.zones.logo && {
        type: 'logo',
        src: (dna.logoFiles as Record<string, string>).primary || (dna.logoFiles as Record<string, string>).icon,
        zone: blueprint.zones.logo,
      },
    ].filter(Boolean),
    meta: {
      blueprintName: blueprint.name,
      variationIndex,
      generatedAt: new Date().toISOString(),
    },
  }
}

function getHeadlineFontSize(charCount: number, maxChars: number): number {
  const ratio = charCount / maxChars
  if (ratio < 0.5) return 72
  if (ratio < 0.7) return 60
  if (ratio < 0.85) return 48
  return 38
}
