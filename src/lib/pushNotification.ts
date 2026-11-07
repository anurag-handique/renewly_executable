/**
 * Native Web / Windows desktop notification helper.
 * Triggers standard Windows Action Center toast notifications via Notification API.
 */

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support Windows desktop notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

export function showWindowsNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return null;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/sidebar-icon.jpg',
        badge: '/favicon.jpg',
        tag: 'renewly-expiry-alert',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        window.location.href = '/notifications';
      };

      return notif;
    } catch (e) {
      console.warn('Failed to trigger Windows notification:', e);
      return null;
    }
  }

  return null;
}
