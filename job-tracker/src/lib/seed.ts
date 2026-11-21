import type { Application, Settings, Stage, StageEvent, Upcoming } from '../types'
import { DEFAULT_RESUME_VERSIONS } from './constants'
import { addDays, daysBetween, today } from './dates'
import { newId } from './id'

type SeedRow = Omit<Application, 'id' | 'position' | 'createdAt' | 'updatedAt' | 'upcoming'> & {
  upcoming?: Upcoming
}

// The eight demo applications from the brief, with their original Oct–Nov 2024 dates.
const SEED: SeedRow[] = [
  {
    company: 'Google', role: 'SDE Intern', stage: 'interview', dateApplied: '2024-11-03', priority: 'high',
    source: 'Campus Placement', resumeVersion: 'Resume v1 - SDE', salary: '₹1,00,000/month', applicationLink: '', notes: '',
    checklist: { researched: false, starStories: false, reviewedJD: true, mockInterview: false, thankYouEmail: false },
    stageHistory: [
      { stage: 'applied', date: '2024-11-03' },
      { stage: 'oa', date: '2024-11-08' },
      { stage: 'interview', date: '2024-11-15' },
    ],
  },
  {
    company: 'Razorpay', role: 'PM Intern', stage: 'oa', dateApplied: '2024-11-08', priority: 'high',
    source: 'LinkedIn', resumeVersion: 'Resume v2 - PM', salary: '₹60,000/month', applicationLink: '', notes: '',
    checklist: { researched: true, starStories: false, reviewedJD: true, mockInterview: false, thankYouEmail: false },
    stageHistory: [
      { stage: 'applied', date: '2024-11-08' },
      { stage: 'oa', date: '2024-11-12' },
    ],
    // Not in the original table: gives the "This week" alert something real to show.
    upcoming: { kind: 'oa', date: 'TOMORROW' },
  },
  {
    company: 'Microsoft', role: 'SDE Intern', stage: 'applied', dateApplied: '2024-11-15', priority: 'medium',
    source: 'Campus Placement', resumeVersion: 'Resume v1 - SDE', salary: '₹80,000/month', applicationLink: '', notes: '',
    checklist: { researched: false, starStories: false, reviewedJD: false, mockInterview: false, thankYouEmail: false },
    stageHistory: [{ stage: 'applied', date: '2024-11-15' }],
  },
  {
    company: 'Flipkart', role: 'Data Analyst', stage: 'rejected', dateApplied: '2024-10-20', priority: 'medium',
    source: 'Company Portal', resumeVersion: 'General', salary: '₹50,000/month', applicationLink: '',
    notes: 'Rejected after OA round. DSA questions were too advanced.',
    checklist: { researched: true, starStories: false, reviewedJD: true, mockInterview: false, thankYouEmail: false },
    stageHistory: [
      { stage: 'applied', date: '2024-10-20' },
      { stage: 'oa', date: '2024-10-28' },
      { stage: 'rejected', date: '2024-11-05' },
    ],
  },
  {
    company: 'Groww', role: 'Product Intern', stage: 'applied', dateApplied: '2024-11-10', priority: 'high',
    source: 'Referral', resumeVersion: 'Resume v2 - PM', salary: '₹55,000/month', applicationLink: '',
    notes: 'Referred by Amit from Product team. Follow up after 1 week.',
    checklist: { researched: true, starStories: false, reviewedJD: true, mockInterview: false, thankYouEmail: false },
    stageHistory: [{ stage: 'applied', date: '2024-11-10' }],
  },
  {
    company: 'Cred', role: 'SDE Intern', stage: 'wishlist', dateApplied: '', priority: 'low',
    source: 'LinkedIn', resumeVersion: '', salary: '', applicationLink: '',
    notes: 'Interesting company culture. Wait for campus drive.',
    checklist: { researched: false, starStories: false, reviewedJD: false, mockInterview: false, thankYouEmail: false },
    stageHistory: [{ stage: 'wishlist', date: '2024-11-01' }],
  },
  {
    company: 'Uber', role: 'Backend Intern', stage: 'offer', dateApplied: '2024-10-05', priority: 'high',
    source: 'Referral', resumeVersion: 'Resume v1 - SDE', salary: '$45/hr', applicationLink: '',
    notes: 'Offer received! 3 rounds: DSA, System Design, Behavioral. Start date: Jan 2025.',
    checklist: { researched: true, starStories: true, reviewedJD: true, mockInterview: true, thankYouEmail: true },
    stageHistory: [
      { stage: 'applied', date: '2024-10-05' },
      { stage: 'oa', date: '2024-10-10' },
      { stage: 'interview', date: '2024-10-18' },
      { stage: 'offer', date: '2024-11-01' },
    ],
  },
  {
    company: 'Atlassian', role: 'SDE Intern', stage: 'interview', dateApplied: '2024-11-01', priority: 'medium',
    source: 'Company Portal', resumeVersion: 'Resume v1 - SDE', salary: '₹90,000/month', applicationLink: '',
    notes: 'Round 1 done — coding round. Waiting for Round 2 schedule.',
    checklist: { researched: true, starStories: false, reviewedJD: true, mockInterview: false, thankYouEmail: false },
    stageHistory: [
      { stage: 'applied', date: '2024-11-01' },
      { stage: 'interview', date: '2024-11-12' },
    ],
  },
]

/**
 * The brief's dates are from Nov 2024. Loaded as-is, every "Applied" card would be two years
 * old and the follow-up strip would be meaningless. So the whole timeline is slid forward,
 * keeping every gap between dates intact, so that the newest entry (Microsoft, 15 Nov) lands
 * 9 days before today. That gives the intended demo: 2 need follow-up, 1 stale, 1 this week.
 */
const SEED_LATEST = '2024-11-15'
const LATEST_DAYS_AGO = 9

export function buildSeed(): Application[] {
  const now = today()
  const offset = daysBetween(SEED_LATEST, addDays(now, -LATEST_DAYS_AGO))
  const shift = (d: string) => (d ? addDays(d, offset) : d)
  const stamp = new Date().toISOString()

  const perStage: Partial<Record<Stage, number>> = {}

  return SEED.map((row) => {
    const position = (perStage[row.stage] = (perStage[row.stage] ?? 0) + 1)
    const upcoming = row.upcoming ? { ...row.upcoming, date: addDays(now, 1) } : null
    return {
      ...row,
      id: newId(),
      dateApplied: shift(row.dateApplied),
      stageHistory: row.stageHistory.map((e: StageEvent) => ({ ...e, date: shift(e.date) })),
      checklist: { ...row.checklist },
      upcoming,
      position,
      createdAt: stamp,
      updatedAt: stamp,
    }
  })
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  resumeVersions: [...DEFAULT_RESUME_VERSIONS],
}
