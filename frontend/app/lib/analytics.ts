import mixpanel from 'mixpanel-browser';

let initialized = false;

function getMixpanel() {
  if (!initialized && typeof window !== 'undefined') {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) return null;
    mixpanel.init(token, {
      track_pageview: false,
      persistence: 'localStorage',
      ip: false,
    });
    initialized = true;
  }
  return initialized ? mixpanel : null;
}

export function identify(userId: string, plan?: string) {
  const mp = getMixpanel();
  if (!mp) return;
  mp.identify(userId);
  const props: Record<string, string> = {};
  if (plan) props.plan = plan;
  mp.people.set(props);
}

export function reset() {
  const mp = getMixpanel();
  if (!mp) return;
  mp.reset();
}

export function track(event: string, properties?: Record<string, unknown>) {
  const mp = getMixpanel();
  if (!mp) return;
  mp.track(event, properties);
}

export const events = {
  SEARCH: 'search',
  SEARCH_RESULTS: 'search_results',
  PROSPECT_VIEW: 'prospect_view',
  PROSPECT_ADD: 'prospect_add',
  PROSPECT_STATUS_CHANGE: 'prospect_status_change',
  EXPORT_CSV: 'export_csv',
  PLAN_UPGRADE_CLICK: 'plan_upgrade_click',
  PLAN_CHANGED: 'plan_changed',
  BILLING_PORTAL: 'billing_portal',
} as const;
