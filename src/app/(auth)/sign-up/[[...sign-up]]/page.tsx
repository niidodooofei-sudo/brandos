import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
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
            Set up your brand once.<br />Generate forever.
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Upload your brand guidelines. The AI does the rest — colors, fonts, layouts, tone of voice. Every asset is on-brand, every time.
          </p>
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Starter plan includes</p>
            {['1 brand workspace', '100 assets/month', '3 team members', 'PNG + JPG export', 'Brand DNA AI extraction'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-white/70 text-sm py-1">
                <span className="text-green-400">✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-8">
        <SignUp />
      </div>
    </div>
  )
}
