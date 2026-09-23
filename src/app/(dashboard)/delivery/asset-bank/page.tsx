import { AssetBankGrid } from '@/components/delivery/asset-bank-grid'

export default function AssetBankPage() {
  return (
    <div className="max-w-[1400px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Asset Bank</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Every file you've ever delivered, automatically indexed.
        </p>
      </div>
      <AssetBankGrid />
    </div>
  )
}
