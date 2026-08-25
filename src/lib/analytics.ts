import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY || POSTHOG_KEY === 'phc_REEMPLAZA_CON_TU_API_KEY') return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing()
    },
  })
  initialized = true
}

export function identifyStudent(studentId: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.identify(studentId, properties)
}

export function resetAnalytics() {
  if (!initialized) return
  posthog.reset()
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function trackPageView(name: string, properties?: Record<string, any>) {
  if (!initialized) return
  const virtualUrl = window.location.origin + '/est/#/' + name
  posthog.capture('$pageview', { ...properties, $current_url: virtualUrl, page_name: name })
}

export function trackLogin(success: boolean, studentId?: string, method?: string) {
  trackEvent(success ? 'login_success' : 'login_failed', { student_id: studentId, method })
}

export function trackRegister(properties?: Record<string, any>) {
  trackEvent('register_completed', properties)
}

export function trackPeriodChange(period: string) {
  trackEvent('period_changed', { period })
}

export function trackTabChange(tab: string) {
  trackEvent('tab_changed', { tab })
}

export function trackGradeDetailView(subject: string, grade: string, period: string) {
  trackEvent('grade_detail_viewed', { subject, grade, period })
}

export function trackStatisticsView(subjectCount: number) {
  trackEvent('statistics_viewed', { subject_count: subjectCount })
}

export function trackReportExport(method: 'image' | 'print', subjectsCount: number) {
  trackEvent('report_exported', { method, subjects_count: subjectsCount })
}

export function trackNotificationOpen(count: number) {
  trackEvent('notification_opened', { count })
}

export function trackStudentSwitch(fromIdx: number, toIdx: number) {
  trackEvent('student_switched', { from: fromIdx, to: toIdx })
}

export function trackFavoriteToggle(subject: string, isFavorite: boolean) {
  trackEvent('favorite_toggled', { subject, is_favorite: isFavorite })
}

export function trackLogout(sessionDuration: number) {
  trackEvent('logout', { session_duration_seconds: sessionDuration })
}

export function trackPurchase(revenue: number, currency: string, properties?: Record<string, any>) {
  trackEvent('purchase', { revenue, currency, ...properties })
}
