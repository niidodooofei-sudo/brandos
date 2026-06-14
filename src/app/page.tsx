import { redirect } from 'next/navigation'
import { getAuthId } from '@/lib/auth-helper'

export default async function RootPage() {
  const userId = await getAuthId()
  if (userId) redirect('/dashboard')
  else redirect('/sign-in')
}
