export function normalizeDueDateEndOfDay(input: string | Date): Date {
  const d = new Date(input)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  return now.getTime() > dueDate.getTime()
}

export function daysLate(dueDate: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - dueDate.getTime()
  return Math.max(0, Math.ceil(diffMs / 86_400_000))
}

export function calculateOnTimeRate(onTimeCount: number, totalDueCount: number): number {
  if (totalDueCount === 0) return 100
  return Math.round((onTimeCount / totalDueCount) * 1000) / 10
}

export function getPriorWeekWindow(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  end.setUTCDate(end.getUTCDate() - 1) // yesterday (Sunday, when run on a Monday)
  end.setUTCHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  start.setUTCHours(0, 0, 0, 0)
  return { start, end }
}

export function getPriorMonthWindow(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))
  return { start, end }
}
