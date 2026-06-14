'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const steps = ['Organization', 'Brand', 'Brand DNA', 'Ready']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [orgName, setOrgName] = useState('')
  const [brandName, setBrandName] = useState('')

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">BrandOS</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-indigo-500 text-white' :
                'bg-neutral-200 text-neutral-400'
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-400' : 'bg-neutral-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Name your organization</h2>
                <p className="text-sm text-neutral-500 mt-1">This is your company or agency workspace.</p>
              </div>
              <Input
                label="Organization Name"
                placeholder="e.g. Acme Corp, Studio North"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <Button onClick={next} disabled={!orgName} className="w-full" size="lg">Continue</Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Create your first brand</h2>
                <p className="text-sm text-neutral-500 mt-1">You can manage multiple brands. Start with one.</p>
              </div>
              <Input
                label="Brand Name"
                placeholder="e.g. Acme, Nike, My Brand"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
              <Button onClick={next} disabled={!brandName} className="w-full" size="lg">Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Set up Brand DNA</h2>
                <p className="text-sm text-neutral-500 mt-1">Upload your guidelines or set it up later.</p>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 space-y-2">
                <p className="text-sm font-medium text-indigo-900">What Brand DNA does:</p>
                {[
                  'Automatically applies your colors to every asset',
                  'Uses your exact fonts and weights',
                  'Enforces your layout style (minimalist, bold, etc.)',
                  'Scores every asset for brand compliance',
                ].map((item) => (
                  <p key={item} className="text-xs text-indigo-700 flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />{item}</p>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={next} variant="brand" className="flex-1">Set Up Brand DNA</Button>
                <Button onClick={next} variant="outline">Skip for now</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-5">
              <div className="inline-flex rounded-full bg-green-100 p-5 mb-2">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">You&apos;re all set!</h2>
                <p className="text-sm text-neutral-500 mt-2">
                  {orgName} is ready. Create your first asset in seconds.
                </p>
              </div>
              <Button onClick={next} className="w-full" size="lg">Go to Dashboard →</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
