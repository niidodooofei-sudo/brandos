import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-950 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">BrandOS</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Every marketing asset.<br />No designer needed.
          </h1>
          <div className="space-y-4">
            {[
              { emoji: '⚡', text: 'Generate on-brand assets in seconds' },
              { emoji: '🎨', text: 'AI learns your brand DNA automatically' },
              { emoji: '📊', text: 'Brand compliance scoring on every asset' },
              { emoji: '🚀', text: 'Export PNG, JPG, PDF, SVG instantly' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/80">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right: auth */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-8">
        <SignIn />
      </div>
    </div>
  )
}
