export async function track(name: string, payload: any = {}) {
  try {
    // Analytics tracking - log to console in dev
    console.log('[Analytics]', name, payload);
    // TODO: Implement analytics_events table if needed
  } catch (e) {
    // non-blocking
    console.warn('track failed', e);
  }
}
