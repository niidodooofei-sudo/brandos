import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BrandOS — AI-Powered Brand Automation',
  description: 'Generate on-brand marketing assets automatically. No designer needed.',
}

// Dynamically wrap with ClerkProvider only when real keys are present
async function MaybeClerk({ children }: { children: React.ReactNode }) {
  const hasClerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_key')

  if (hasClerk) {
    const { ClerkProvider } = await import('@clerk/nextjs')
    return <ClerkProvider>{children}</ClerkProvider>
  }
  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaybeClerk>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="h-full bg-white text-neutral-900">{children}</body>
      </html>
    </MaybeClerk>
  )
}
