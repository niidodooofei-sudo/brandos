import { Board } from '@/components/delivery/board'

export default function DeliveryPage() {
  return (
    <div className="max-w-[1400px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Delivery</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Log what you owe, prove what you delivered, explain what's late.
        </p>
      </div>
      <Board />
    </div>
  )
}
