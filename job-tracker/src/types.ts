export type Stage = 'wishlist' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected'
export type Priority = 'high' | 'medium' | 'low'

export interface StageEvent {
  stage: Stage
  /** YYYY-MM-DD, local date */
  date: string
}

export interface Checklist {
  researched: boolean
  starStories: boolean
  reviewedJD: boolean
  mockInterview: boolean
  thankYouEmail: boolean
}

export type UpcomingKind = 'oa' | 'interview' | 'other'

export interface Upcoming {
  kind: UpcomingKind
  date: string
}

export interface Application {
  id: string
  company: string
  role: string
  stage: Stage
  dateApplied: string
  priority: Priority
  source: string
  resumeVersion: string
  salary: string
  applicationLink: string
  notes: string
  checklist: Checklist
  stageHistory: StageEvent[]
  /** Next OA deadline or interview date, if the user has one. Feeds the "This week" alert. */
  upcoming: Upcoming | null
  /** Sort order inside a column. Fractional so a drop between two cards never reindexes the rest. */
  position: number
  createdAt: string
  updatedAt: string
}

export interface Settings {
  name: string
  resumeVersions: string[]
}
