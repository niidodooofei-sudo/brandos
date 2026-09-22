import { describe, it, expect } from 'vitest'
import {
  normalizeDueDateEndOfDay,
  isOverdue,
  daysLate,
  calculateOnTimeRate,
  getPriorWeekWindow,
  getPriorMonthWindow,
} from './calc'

describe('normalizeDueDateEndOfDay', () => {
  it('sets the time to 23:59:59.999 UTC on the given date', () => {
    const result = normalizeDueDateEndOfDay('2026-09-25')
    expect(result.toISOString()).toBe('2026-09-25T23:59:59.999Z')
  })

  it('keeps the same calendar date when given a Date with an earlier time', () => {
    const result = normalizeDueDateEndOfDay(new Date('2026-01-05T08:30:00.000Z'))
    expect(result.toISOString()).toBe('2026-01-05T23:59:59.999Z')
  })
})

describe('isOverdue', () => {
  it('is false before the deadline instant', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(isOverdue(due, new Date('2026-09-25T12:00:00.000Z'))).toBe(false)
  })

  it('is true the instant after the deadline', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(isOverdue(due, new Date('2026-09-26T00:00:00.000Z'))).toBe(true)
  })
})

describe('daysLate', () => {
  it('is 0 when not yet overdue', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(daysLate(due, new Date('2026-09-25T12:00:00.000Z'))).toBe(0)
  })

  it('rounds up partial days late', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(daysLate(due, new Date('2026-09-27T01:00:00.000Z'))).toBe(2)
  })
})

describe('calculateOnTimeRate', () => {
  it('returns 100 when nothing was due', () => {
    expect(calculateOnTimeRate(0, 0)).toBe(100)
  })

  it('rounds to one decimal place', () => {
    expect(calculateOnTimeRate(2, 3)).toBe(66.7)
  })

  it('handles a perfect record', () => {
    expect(calculateOnTimeRate(5, 5)).toBe(100)
  })
})

describe('getPriorWeekWindow', () => {
  it('returns the prior Mon 00:00 - Sun 23:59:59.999 when run on a Monday', () => {
    const { start, end } = getPriorWeekWindow(new Date('2026-09-28T06:00:00.000Z')) // a Monday
    expect(start.toISOString()).toBe('2026-09-21T00:00:00.000Z') // prior Monday
    expect(end.toISOString()).toBe('2026-09-27T23:59:59.999Z') // prior Sunday
  })
})

describe('getPriorMonthWindow', () => {
  it('returns the full prior calendar month when run on the 1st', () => {
    const { start, end } = getPriorMonthWindow(new Date('2026-10-01T06:00:00.000Z'))
    expect(start.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-30T23:59:59.999Z')
  })

  it('rolls back across a year boundary', () => {
    const { start, end } = getPriorMonthWindow(new Date('2027-01-01T06:00:00.000Z'))
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-12-31T23:59:59.999Z')
  })
})
