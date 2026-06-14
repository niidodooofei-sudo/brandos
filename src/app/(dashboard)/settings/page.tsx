import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { currentUser } from '@clerk/nextjs/server'
import { ShieldCheck, Key, CreditCard, User } from 'lucide-react'

export default async function SettingsPage() {
  const user = await currentUser().catch(() => null)

  return (
    <div className="max-w-[720px] space-y-5 animate-fade-up">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>Manage your account, billing, and API access.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: 'var(--brand)' }} />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your account information synced from your auth provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="flex items-center gap-4">
              {user.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="h-14 w-14 rounded-full shrink-0"
                  style={{ border: '2px solid var(--border)' }}
                />
              )}
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{user.fullName || '—'}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {user.primaryEmailAddress?.emailAddress ?? '—'}
                </p>
                <Badge variant="brand" className="mt-2" dot>Verified</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              Connect your Clerk account to see profile information here.
            </p>
          )}
          <Button variant="outline" size="sm">Manage Account →</Button>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" style={{ color: 'var(--brand)' }} />
              <CardTitle>Plan & Billing</CardTitle>
            </div>
            <Badge variant="brand" dot>Starter</Badge>
          </div>
          <CardDescription>Your current subscription plan and usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Brands', used: 0, total: 1 },
              { label: 'Assets / mo', used: 0, total: 50 },
              { label: 'Team Members', used: 1, total: 1 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>{item.label}</p>
                <p className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
                  {item.used}
                  <span className="text-sm font-normal" style={{ color: 'var(--fg-subtle)' }}>/{item.total}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-inset)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(item.used / item.total) * 100}%`, background: 'var(--brand)' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <Button variant="brand" size="sm">Upgrade Plan</Button>
            <Button variant="outline" size="sm">View Invoices</Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" style={{ color: 'var(--brand)' }} />
            <CardTitle>API Access</CardTitle>
          </div>
          <CardDescription>Generate API keys to integrate BrandOS into your own tools and workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl p-5 text-center"
            style={{ background: 'var(--surface-muted)', border: '1px dashed var(--border)' }}
          >
            <Key className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--fg-subtle)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--fg)' }}>No API keys yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--fg-muted)' }}>API keys are available on Pro and Agency plans.</p>
            <Button variant="brand" size="sm">Upgrade to generate keys</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: '#10b981' }} />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Authentication and session management via Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Two-factor authentication</p>
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Managed in your Clerk account settings</p>
            </div>
            <Button variant="outline" size="sm">Manage in Clerk →</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
        <CardHeader>
          <CardTitle className="text-rose-600">Danger Zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Delete Account</p>
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
