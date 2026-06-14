export type PlanType = 'STARTER' | 'PRO' | 'AGENCY' | 'ENTERPRISE'
export type UserRole = 'OWNER' | 'ADMIN' | 'DESIGNER' | 'MEMBER' | 'VIEWER'
export type AssetStatus = 'PENDING' | 'GENERATING' | 'COMPLETE' | 'FAILED'
export type OutputCategory = 'SOCIAL' | 'PRINT' | 'WEB' | 'CORPORATE'
export type ExportFormat = 'PNG' | 'JPG' | 'PDF' | 'SVG'
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETE' | 'ARCHIVED'

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  [key: string]: string
}

export interface TypeScale {
  h1: number
  h2: number
  h3: number
  h4: number
  body: number
  small: number
  caption: number
}

export interface BrandDNAData {
  primaryFont?: string
  secondaryFont?: string
  headingWeight?: string
  bodyWeight?: string
  typeScale?: TypeScale
  colors?: BrandColors
  layoutPreference?: 'minimalist' | 'editorial' | 'corporate' | 'bold' | 'luxury'
  visualStyle?: 'photography' | 'illustration' | 'abstract' | 'mixed'
  shapeLanguage?: 'geometric' | 'organic' | 'minimal' | 'bold'
  imageTreatment?: {
    overlayOpacity?: number
    filter?: string
    crop?: string
  }
  tone?: 'professional' | 'friendly' | 'premium' | 'technical'
  voiceRules?: {
    avoidWords?: string[]
    preferredPhrases?: string[]
  }
  logoFiles?: {
    primary?: string
    dark?: string
    light?: string
    icon?: string
  }
  logoClearance?: {
    minSize?: number
    clearSpace?: string
  }
  isComplete?: boolean
}

export interface ContentInputs {
  headline: string
  subheadline?: string
  body?: string
  cta?: string
  ctaUrl?: string
  images?: string[]
  offerDetails?: string
  dates?: string
  tags?: string[]
}

export interface AssetVariation {
  id: string
  blueprintId: string
  layoutName: string
  thumbnailUrl?: string
  canvasData: Record<string, unknown>
  score: number
}

export interface ScoreBreakdown {
  colors: number
  typography: number
  logo: number
  spacing: number
  tone: number
  total: number
}

export interface OutputType {
  id: string
  name: string
  category: OutputCategory
  width: number
  height: number
  description: string
  icon: string
}

export const OUTPUT_TYPES: OutputType[] = [
  { id: 'instagram_post', name: 'Instagram Post', category: 'SOCIAL', width: 1080, height: 1080, description: '1080 × 1080px', icon: '📷' },
  { id: 'instagram_story', name: 'Instagram Story', category: 'SOCIAL', width: 1080, height: 1920, description: '1080 × 1920px', icon: '📱' },
  { id: 'instagram_carousel', name: 'Carousel', category: 'SOCIAL', width: 1080, height: 1080, description: '1080 × 1080px', icon: '🎠' },
  { id: 'reel_cover', name: 'Reel Cover', category: 'SOCIAL', width: 1080, height: 1920, description: '1080 × 1920px', icon: '🎬' },
  { id: 'linkedin_post', name: 'LinkedIn Post', category: 'SOCIAL', width: 1200, height: 627, description: '1200 × 627px', icon: '💼' },
  { id: 'x_post', name: 'X Post', category: 'SOCIAL', width: 1600, height: 900, description: '1600 × 900px', icon: '𝕏' },
  { id: 'facebook_post', name: 'Facebook Post', category: 'SOCIAL', width: 1200, height: 628, description: '1200 × 628px', icon: '📘' },
  { id: 'flyer', name: 'Flyer', category: 'PRINT', width: 2480, height: 3508, description: 'A4 Print', icon: '📄' },
  { id: 'poster', name: 'Poster', category: 'PRINT', width: 2480, height: 3508, description: 'A3 Print', icon: '🖼️' },
  { id: 'brochure', name: 'Brochure', category: 'PRINT', width: 3508, height: 2480, description: 'A4 Landscape', icon: '📋' },
  { id: 'rollup_banner', name: 'Roll-up Banner', category: 'PRINT', width: 850, height: 2000, description: '850 × 2000mm', icon: '🏷️' },
  { id: 'hero_banner', name: 'Hero Banner', category: 'WEB', width: 1440, height: 600, description: '1440 × 600px', icon: '🌐' },
  { id: 'display_ad', name: 'Display Ad', category: 'WEB', width: 728, height: 90, description: 'Leaderboard', icon: '📢' },
  { id: 'landing_block', name: 'Landing Page Block', category: 'WEB', width: 1440, height: 800, description: '1440 × 800px', icon: '🖥️' },
  { id: 'proposal_cover', name: 'Proposal Cover', category: 'CORPORATE', width: 1191, height: 842, description: 'A4 Landscape', icon: '📊' },
  { id: 'presentation_slide', name: 'Presentation Slide', category: 'CORPORATE', width: 1920, height: 1080, description: '16:9 HD', icon: '🎤' },
  { id: 'report_cover', name: 'Report Cover', category: 'CORPORATE', width: 2480, height: 3508, description: 'A4 Portrait', icon: '📑' },
  { id: 'event_material', name: 'Event Material', category: 'CORPORATE', width: 1080, height: 1080, description: '1080 × 1080px', icon: '🎪' },
]
