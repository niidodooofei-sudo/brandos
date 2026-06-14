import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { BrandProvider } from '@/contexts/brand-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider>
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Sidebar />
        <Topbar />
        <main className="ml-[240px] pt-14 min-h-screen">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </BrandProvider>
  )
}
