import type { Checklist, Priority, Stage, UpcomingKind } from '../types'

export const STAGES: Stage[] = ['wishlist', 'applied', 'oa', 'interview', 'offer', 'rejected']

interface StageMeta {
  label: string
  short: string
  hint: string
  dot: string
  text: string
  hex: string
}

export const STAGE_META: Record<Stage, StageMeta> = {
  wishlist: { label: 'Wishlist', short: 'Wishlist', hint: "Eyeing it, haven't applied", dot: 'bg-zinc-400', text: 'text-zinc-300', hex: '#94a3b8' },
  applied: { label: 'Applied', short: 'Applied', hint: 'Application submitted', dot: 'bg-sky-400', text: 'text-sky-300', hex: '#38bdf8' },
  oa: { label: 'Online Assessment', short: 'OA', hint: 'OA received or scheduled', dot: 'bg-amber-400', text: 'text-amber-300', hex: '#fbbf24' },
  interview: { label: 'Interview', short: 'Interview', hint: 'Rounds in progress', dot: 'bg-violet-400', text: 'text-violet-300', hex: '#a78bfa' },
  offer: { label: 'Offer', short: 'Offer', hint: 'Offer received', dot: 'bg-emerald-400', text: 'text-emerald-300', hex: '#34d399' },
  rejected: { label: 'Rejected', short: 'Rejected', hint: 'Closed at any stage', dot: 'bg-rose-400', text: 'text-rose-300', hex: '#fb7185' },
}

export const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  high: { label: 'High', dot: 'bg-rose-500' },
  medium: { label: 'Medium', dot: 'bg-amber-400' },
  low: { label: 'Low', dot: 'bg-emerald-500' },
}

/** `value` is what gets stored (matches the seed data); `label` is what the user sees. */
export const SOURCES: { value: string; label: string }[] = [
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Company Portal', label: 'Company Portal' },
  { value: 'Campus Placement', label: 'Campus Placement Cell' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Email', label: 'Cold Email' },
  { value: 'Other', label: 'Other' },
]

export function sourceLabel(value: string) {
  return SOURCES.find((s) => s.value === value)?.label ?? (value || 'Other')
}

export const DEFAULT_RESUME_VERSIONS = ['Resume v1 - SDE', 'Resume v2 - PM', 'General']

export const CHECKLIST_ITEMS: { key: keyof Checklist; label: string }[] = [
  { key: 'researched', label: 'Researched company' },
  { key: 'starStories', label: 'Prepared STAR stories' },
  { key: 'reviewedJD', label: 'Reviewed job description' },
  { key: 'mockInterview', label: 'Mock interview done' },
  { key: 'thankYouEmail', label: 'Thank-you email sent' },
]

export const EMPTY_CHECKLIST: Checklist = {
  researched: false,
  starStories: false,
  reviewedJD: false,
  mockInterview: false,
  thankYouEmail: false,
}

export const UPCOMING_LABEL: Record<UpcomingKind, string> = {
  oa: 'OA deadline',
  interview: 'Interview',
  other: 'Follow-up',
}

/** Days in "Applied" before we nudge, and before we call it stale. */
export const FOLLOW_UP_DAYS = 7
export const STALE_DAYS = 14
