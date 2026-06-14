import Anthropic from '@anthropic-ai/sdk'
import type { BrandDNAData, ContentInputs, ScoreBreakdown } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function extractBrandDNA(pdfText: string): Promise<Partial<BrandDNAData>> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a brand design expert. Extract structured brand DNA from this brand guideline document.

Return ONLY valid JSON with these exact fields (omit any you cannot determine):
{
  "primaryFont": "font name",
  "secondaryFont": "font name",
  "headingWeight": "bold|semibold|medium",
  "bodyWeight": "regular|medium",
  "typeScale": { "h1": 64, "h2": 48, "h3": 36, "h4": 28, "body": 16, "small": 14, "caption": 12 },
  "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "layoutPreference": "minimalist|editorial|corporate|bold|luxury",
  "visualStyle": "photography|illustration|abstract|mixed",
  "shapeLanguage": "geometric|organic|minimal|bold",
  "imageTreatment": { "overlayOpacity": 0.4, "filter": "warm|cool|bw|none", "crop": "center|face|auto" },
  "tone": "professional|friendly|premium|technical",
  "voiceRules": { "avoidWords": [], "preferredPhrases": [] }
}

Brand guidelines:
${pdfText.slice(0, 8000)}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return {}

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return {}
    return JSON.parse(jsonMatch[0])
  } catch {
    return {}
  }
}

export async function generateCopySuggestions(
  headline: string,
  outputType: string,
  brandTone: string,
  maxChars: number = 45
): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a senior copywriter. Generate 3 alternative headlines for a ${outputType} asset.

Original headline: "${headline}"
Brand tone: ${brandTone}
Maximum characters: ${maxChars}

Return ONLY a JSON array of 3 strings. Each must be under ${maxChars} chars and match the ${brandTone} tone.
Example: ["Headline 1", "Headline 2", "Headline 3"]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return []

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0])
  } catch {
    return []
  }
}

export async function scoreBrandCompliance(
  contentInputs: ContentInputs,
  dna: BrandDNAData,
  layoutName: string
): Promise<ScoreBreakdown> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a brand compliance expert. Score this asset against the brand DNA.

Brand DNA:
- Tone: ${dna.tone || 'professional'}
- Layout preference: ${dna.layoutPreference || 'corporate'}
- Visual style: ${dna.visualStyle || 'mixed'}
- Primary font: ${dna.primaryFont || 'unknown'}

Asset:
- Headline: "${contentInputs.headline}"
- Body: "${contentInputs.body || ''}"
- CTA: "${contentInputs.cta || ''}"
- Layout: ${layoutName}

Score each dimension 0-20 and return ONLY JSON:
{
  "colors": 18,
  "typography": 17,
  "logo": 20,
  "spacing": 18,
  "tone": 16,
  "total": 89
}

Base tone score on how well the copy matches the brand tone. Other scores on layout appropriateness.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return { colors: 18, typography: 18, logo: 18, spacing: 18, tone: 16, total: 88 }
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { colors: 18, typography: 18, logo: 18, spacing: 18, tone: 16, total: 88 }
    return JSON.parse(jsonMatch[0])
  } catch {
    return { colors: 18, typography: 18, logo: 18, spacing: 18, tone: 16, total: 88 }
  }
}

export async function generateCampaignBrief(
  brief: string,
  brandName: string,
  outputTypes: string[]
): Promise<{ assets: Array<{ type: string; headline: string; subheadline: string; cta: string }> }> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an Art Director. Create content suggestions for a campaign.

Brand: ${brandName}
Campaign brief: ${brief}
Required outputs: ${outputTypes.join(', ')}

For each output type, suggest content. Return ONLY JSON:
{
  "assets": [
    {
      "type": "instagram_post",
      "headline": "Short punchy headline",
      "subheadline": "Supporting line",
      "cta": "Action text"
    }
  ]
}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return { assets: [] }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { assets: [] }
    return JSON.parse(jsonMatch[0])
  } catch {
    return { assets: [] }
  }
}
