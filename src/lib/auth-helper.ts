// Returns the authenticated Clerk userId.
// Falls back to a demo ID only in development when Clerk is not configured.
// In production, returns null if auth fails (callers must handle 401).
export async function getAuthId(): Promise<string | null> {
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}
