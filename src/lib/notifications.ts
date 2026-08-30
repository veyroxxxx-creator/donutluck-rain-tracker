export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export function getNotificationSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!getNotificationSupport()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!getNotificationSupport()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return 'denied';
  }
}

export function showRainNotification(title: string, body: string) {
  if (!getNotificationSupport() || Notification.permission !== 'granted') return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, {
      body,
      icon: '/icons/icon-192.svg',
      tag: 'donutluck-rain', // collapses into one notification instead of stacking
    });
  } catch {
    // Some environments (e.g. certain mobile browsers) throw on direct
    // construction and require a Service Worker instead — fail quietly
    // rather than crash the dashboard.
  }
}
