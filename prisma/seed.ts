import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // Create demo user
  const user = await db.user.upsert({
    where: { email: 'demo@brandos.io' },
    update: {},
    create: {
      clerkId: 'demo_clerk_id',
      email: 'demo@brandos.io',
      name: 'Demo User',
    },
  })

  // Create demo org
  const org = await db.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'PRO',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  })

  // Create demo brand
  const brand = await db.brand.upsert({
    where: { orgId_slug: { orgId: org.id, slug: 'demo-brand' } },
    update: {},
    create: {
      name: 'Demo Brand',
      slug: 'demo-brand',
      orgId: org.id,
      dna: {
        create: {
          primaryFont: 'Inter',
          secondaryFont: 'Georgia',
          headingWeight: '700',
          bodyWeight: '400',
          typeScale: { h1: 64, h2: 48, h3: 36, h4: 28, body: 16, small: 14, caption: 12 },
          colors: {
            primary: '#1a1a2e',
            secondary: '#16213e',
            accent: '#e94560',
            background: '#ffffff',
            text: '#1a1a2e',
          },
          layoutPreference: 'minimalist',
          visualStyle: 'photography',
          shapeLanguage: 'geometric',
          tone: 'professional',
          isComplete: true,
        },
      },
    },
  })

  // Create system blueprints
  const blueprintData = [
    {
      name: 'Instagram Post — Image Led',
      outputType: 'instagram_post',
      category: 'SOCIAL' as const,
      styleAffinities: ['bold', 'promotional'],
      hierarchyScore: 92,
      isSystem: true,
      isLocked: true,
      layoutLogic: { type: 'image-led', condition: 'always' },
      components: {
        zones: ['image-bg', 'overlay', 'headline', 'subheadline', 'cta', 'logo'],
      },
      constraints: {
        headline: { maxChars: 45 },
        image: { required: false, ratio: '1:1' },
      },
    },
    {
      name: 'Instagram Post — Text Led',
      outputType: 'instagram_post',
      category: 'SOCIAL' as const,
      styleAffinities: ['minimalist', 'corporate'],
      hierarchyScore: 88,
      isSystem: true,
      layoutLogic: { type: 'text-led', condition: 'no-image-or-long-headline' },
      components: { zones: ['solid-bg', 'headline', 'body', 'cta', 'logo'] },
      constraints: { headline: { maxChars: 55 }, image: { required: false } },
    },
    {
      name: 'Instagram Story — Full Bleed',
      outputType: 'instagram_story',
      category: 'SOCIAL' as const,
      styleAffinities: ['bold', 'luxury'],
      hierarchyScore: 91,
      isSystem: true,
      layoutLogic: { type: 'image-led', condition: 'always' },
      components: { zones: ['image-bg', 'overlay', 'headline', 'cta', 'logo'] },
      constraints: { headline: { maxChars: 40 } },
    },
  ]

  for (const bp of blueprintData) {
    await db.blueprint.upsert({
      where: { id: `system-${bp.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `system-${bp.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...bp,
        isActive: true,
      },
    })
  }

  console.log('Seed complete ✓')
  console.log('  User:', user.email)
  console.log('  Org:', org.name)
  console.log('  Brand:', brand.name)
  console.log('  Blueprints:', blueprintData.length)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
