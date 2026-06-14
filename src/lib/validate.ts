import { z } from 'zod'

export const generateSchema = z.object({
  outputType: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  contentInputs: z.object({
    headline: z.string().min(1).max(200),
    subheadline: z.string().max(200).optional(),
    bodyText: z.string().max(1000).optional(),
    cta: z.string().max(80).optional(),
    ctaUrl: z.string().url().max(500).optional().or(z.literal('')),
    offer: z.string().max(200).optional(),
    dates: z.string().max(100).optional(),
    images: z.array(z.string().max(500)).max(5).optional(),
  }),
})

export const copySuggestSchema = z.object({
  headline: z.string().min(1).max(200),
  outputType: z.string().max(64).optional(),
})

export const campaignBriefSchema = z.object({
  name: z.string().min(1).max(100),
  brief: z.string().max(2000).optional(),
  outputTypes: z.array(z.string().max(64)).min(1).max(20),
})

export const brandNameSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  orgId: z.string().min(1).max(64),
})

export type GenerateInput = z.infer<typeof generateSchema>
export type CopySuggestInput = z.infer<typeof copySuggestSchema>
