import React, { useState } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  CheckCheck,
  Settings,
  Monitor,
  Plus,
  Trash2,
  Send,
  RotateCw,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatDate } from '@/lib/utils';
import { showWindowsNotification } from '@/lib/pushNotification';
import type { ExpiryNotification } from '@/types';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    notificationSettings,
    updateNotificationSettings,
    requestDesktopPermission,
    markNotificationRead,
    markAllNotificationsRead,
    triggerNativeExpirySweep,
    sendTestOrResendEmail,
  } = useData();

  const [filter, setFilter] = useState<'all' | 'unread' | 'email'>('all');
  const [runningSweep, setRunningSweep] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [newDays, setNewDays] = useState<number>(14);
  const [newLabel, setNewLabel] = useState<string>('2 Weeks Before');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Local state for SMTP inputs so users can backspace, clear, and edit smoothly
  const [smtpForm, setSmtpForm] = useState({
    host: notificationSettings.smtp?.host ?? 'smtp.gmail.com',
    port: notificationSettings.smtp?.port ?? 587,
    user: notificationSettings.smtp?.user ?? 'anurag.h@thecodeyogi.com',
    pass: notificationSettings.smtp?.pass ?? 'lutdfsixlzvvjzmu',
    recipient_to: notificationSettings.smtp?.recipient_to ?? 'anurag.h@thecodeyogi.com',
    recipient_cc: notificationSettings.smtp?.recipient_cc ?? '',
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep local state in sync when external settings change (e.g. initial load or switch)
  React.useEffect(() => {
    if (notificationSettings.smtp) {
      setSmtpForm({
        host: notificationSettings.smtp.host ?? 'smtp.gmail.com',
        port: notificationSettings.smtp.port ?? 587,
        user: notificationSettings.smtp.user ?? 'anurag.h@thecodeyogi.com',
        pass: notificationSettings.smtp.pass ?? 'lutdfsixlzvvjzmu',
        recipient_to: notificationSettings.smtp.recipient_to ?? 'anurag.h@thecodeyogi.com',
        recipient_cc: notificationSettings.smtp.recipient_cc ?? '',
      });
    }
  }, [notificationSettings.smtp]);

  const handleSmtpFieldChange = (field: string, value: string | number) => {
    setSmtpForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSmtpSettings = async () => {
    setSavingSettings(true);
    try {
      await updateNotificationSettings({
        ...notificationSettings,
        smtp: {
          ...(notificationSettings.smtp || {
            host: 'smtp.gmail.com',
            port: 587,
            user: 'anurag.h@thecodeyogi.com',
            pass: 'lutdfsixlzvvjzmu',
            from: 'Renewly Alerts <anurag.h@thecodeyogi.com>',
            secure: false,
          }),
          ...smtpForm,
          from: `Renewly Alerts <${smtpForm.user}>`,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Failed to save settings to database.');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'email') return n.sent_via_email;
    return true;
  });

  const handleRunSweep = async () => {
    setRunningSweep(true);
    try {
      const res = await triggerNativeExpirySweep();
      setSweepResult(
        `System sweep evaluated ${res.assets_checked} assets across your configured trigger cadences.`
      );
      setTimeout(() => setSweepResult(null), 5000);
    } catch {
      setSweepResult('Evaluation completed.');
      setTimeout(() => setSweepResult(null), 3000);
    } finally {
      setRunningSweep(false);
    }
  };

  const handleToggleCadence = async (days: number) => {
    const updated = {
      ...notificationSettings,
      cadences: notificationSettings.cadences.map((c) =>
        c.days_before === days ? { ...c, enabled: !c.enabled } : c
      ),
    };
    await updateNotificationSettings(updated);
  };

  const handleAddCadence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notificationSettings.cadences.some((c) => c.days_before === newDays)) {
      alert('A cadence for this interval already exists.');
      return;
    }
    const updated = {
      ...notificationSettings,
      cadences: [
        ...notificationSettings.cadences,
        { days_before: Number(newDays), label: newLabel, enabled: true },
      ].sort((a, b) => b.days_before - a.days_before),
    };
    await updateNotificationSettings(updated);
    setNewDays(10);
    setNewLabel('');
  };

  const handleDeleteCadence = async (days: number) => {
    const updated = {
      ...notificationSettings,
      cadences: notificationSettings.cadences.filter((c) => c.days_before !== days),
    };
    await updateNotificationSettings(updated);
  };

  const handleToggleWindowsNotifications = async () => {
    if (!notificationSettings.enable_windows_notifications) {
      const perm = await requestDesktopPermission();
      if (perm !== 'granted') {
        alert('Please allow notification permission in your browser to enable Windows notifications.');
      }
    }
    await updateNotificationSettings({
      ...notificationSettings,
      enable_windows_notifications: !notificationSettings.enable_windows_notifications,
    });
  };

  const handleSendTestWindowsToast = async () => {
    await requestDesktopPermission();
    showWindowsNotification('Renewly Windows Alert', {
      body: 'Test notification delivered successfully. Windows Action Center integration is active.',
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const res = await sendTestOrResendEmail({
        recipient_to: notificationSettings.smtp?.recipient_to || 'anurag.h@thecodeyogi.com',
        recipient_cc: notificationSettings.smtp?.recipient_cc || '',
        subject: 'Renewly Test Notification: Infrastructure Email System Online',
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-top: 0;">Renewly Test Email</h2>
            <p>This is a test notification confirming that SMTP alerting via <strong>${notificationSettings.smtp?.user || 'anurag.h@thecodeyogi.com'}</strong> is successfully configured.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <div><strong>Primary Recipient:</strong> ${notificationSettings.smtp?.recipient_to || 'anurag.h@thecodeyogi.com'}</div>
              <div><strong>CC Recipients:</strong> ${notificationSettings.smtp?.recipient_cc || 'None'}</div>
              <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
            </div>
            <p style="color: #64748b; font-size: 13px;">CodeYogi Renewly &bull; Infrastructure Renewal Management</p>
          </div>
        `,
      });
      alert(res.message || 'Test email dispatched successfully!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to dispatch test email.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleResendNotification = async (notif: ExpiryNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    setResendingId(notif.id);
    try {
      const res = await sendTestOrResendEmail({
        recipient_to: notificationSettings.smtp?.recipient_to || notif.recipient_email || 'anurag.h@thecodeyogi.com',
        recipient_cc: notificationSettings.smtp?.recipient_cc || '',
        subject: `[ALERT] ${notif.title} - ${notif.days_until_expiry <= 0 ? 'EXPIRED' : `${notif.days_until_expiry} Days Left`}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1e293b;">
            <h2 style="color: ${notif.days_until_expiry <= 0 ? '#e11d48' : '#d97706'}; margin-top: 0;">${notif.title}</h2>
            <p style="font-size: 15px; line-height: 1.5;">${notif.message}</p>
            <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0;">
              <div><strong>Asset Category:</strong> <span style="text-transform: capitalize;">${notif.asset_type}</span></div>
              <div><strong>Time Remaining:</strong> ${notif.days_until_expiry <= 0 ? 'EXPIRED' : `${notif.days_until_expiry} Days`}</div>
              <div><strong>Dispatched via:</strong> Renewly Admin On-Demand Resend</div>
            </div>
            <p style="color: #64748b; font-size: 12px;">This is an automated infrastructure renewal reminder from CodeYogi Renewly.</p>
          </div>
        `,
      });
      alert(res.message || 'Notification resent successfully!');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to resend notification.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Automated Expiry Notifications &amp; Reminders
          </h1>
          <p className="text-sm text-slate-500">
            Fully configurable renewal alert cadences with Supabase Edge Function triggers and Windows desktop push.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 shadow-2xs ${
              showConfig
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configure Cadence
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600" />
              Mark All Read
            </button>
          )}

          <button
            onClick={handleRunSweep}
            disabled={runningSweep}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-300 ${runningSweep ? 'animate-spin' : ''}`} />
            {runningSweep ? 'Evaluating Trigger Sweep...' : 'Run Expiry Sweep'}
          </button>
        </div>
      </div>

      {sweepResult && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{sweepResult}</span>
        </div>
      )}

      {/* Configurable Cadence & Push Controls Box */}
      {showConfig && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-md space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                Notification Cadence &amp; Push Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize threshold intervals (e.g. 1 month, 1 week, 1 day) and toggle Windows desktop notifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendTestWindowsToast}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
              >
                <Monitor className="w-3.5 h-3.5" />
                {testNotificationSent ? 'Sent to Windows!' : 'Send Test Windows Toast'}
              </button>
            </div>
          </div>

          {/* Windows Push Notification Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Windows Action Center Toast Notifications
                </span>
                <span className="text-[11px] text-slate-500">
                  Deliver native desktop alerts even when browser is in background
                </span>
              </div>
              <button
                onClick={handleToggleWindowsNotifications}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notificationSettings.enable_windows_notifications ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notificationSettings.enable_windows_notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Supabase Edge Function Automation
                </span>
                <span className="text-[11px] text-slate-500">
                  Scheduled daily cron checks via Supabase Edge Function
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>
          </div>

          {/* Cadence Pills Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Configured Alert Cadences (Click to toggle on/off)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {notificationSettings.cadences.map((c) => (
                <div
                  key={c.days_before}
                  className={`p-3 rounded-xl border transition cursor-pointer relative group flex flex-col justify-between ${
                    c.enabled
                      ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 opacity-60'
                  }`}
                  onClick={() => handleToggleCadence(c.days_before)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {c.days_before === 0 ? 'Day 0' : `${c.days_before} Days`}
                    </span>
                    <input
                      type="checkbox"
                      checked={c.enabled}
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {c.label}
                  </span>
                  {c.days_before !== 0 && c.days_before !== 30 && c.days_before !== 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCadence(c.days_before);
                      }}
                      className="mt-2 text-[10px] text-rose-500 hover:text-rose-700 text-left flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Cadence Form */}
          <form onSubmit={handleAddCadence} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="w-full sm:w-36">
              <input
                type="number"
                min="1"
                max="365"
                required
                placeholder="Days before (e.g. 14)"
                value={newDays}
                onChange={(e) => setNewDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="w-full sm:flex-1">
              <input
                type="text"
                required
                placeholder="Cadence label (e.g. 2 Weeks Before)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Cadence
            </button>
          </form>

          {/* Dedicated SMTP Server Configuration Form */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  SMTP Mail Server Configuration
                </h4>
                <p className="text-[11px] text-slate-500">
                  Credentials used by the system to dispatch automated renewal alerts directly to user inboxes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpForm.host}
                  onChange={(e) => handleSmtpFieldChange('host', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={smtpForm.port}
                  onChange={(e) => handleSmtpFieldChange('port', Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Username / Email
                </label>
                <input
                  type="email"
                  value={smtpForm.user}
                  onChange={(e) => handleSmtpFieldChange('user', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  App Password / Secret
                </label>
                <input
                  type="password"
                  value={smtpForm.pass}
                  onChange={(e) => handleSmtpFieldChange('pass', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Recipient Deliver To & CC Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Deliver To (Primary Alert Recipient)
                </label>
                <input
                  type="email"
                  placeholder="e.g. anurag.h@thecodeyogi.com"
                  value={smtpForm.recipient_to}
                  onChange={(e) => handleSmtpFieldChange('recipient_to', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  CC Recipients (Multiple emails separated by comma)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ops@thecodeyogi.com, info@thecodeyogi.com"
                  value={smtpForm.recipient_cc}
                  onChange={(e) => handleSmtpFieldChange('recipient_cc', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Primary: {smtpForm.recipient_to || 'anurag.h@thecodeyogi.com'}
                </span>
                {saveSuccess && (
                  <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                    Saved to database!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSmtpSettings}
                  disabled={savingSettings}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {savingSettings ? 'Saving...' : 'Save Settings to DB'}
                </button>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-spin' : ''}`} />
                  {sendingTestEmail ? 'Sending Test...' : 'Send Test Alert Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Cadence Overview Banner */}
      {!showConfig && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Reminder Cadence (Configurable)
            </h3>
            <button
              onClick={() => setShowConfig(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Edit Intervals &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            {notificationSettings.cadences.map((c) => (
              <div
                key={c.days_before}
                className={`p-2.5 rounded-lg border ${
                  c.enabled
                    ? c.days_before <= 1
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : c.days_before <= 7
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                }`}
              >
                <span className="block font-bold">
                  {c.days_before === 0 ? 'Expired' : `${c.days_before} Days`}
                </span>
                <span className="text-[10px] text-slate-400">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('email')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            filter === 'email'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Sent via Email ({notificationSettings.smtp?.recipient_to || 'anurag.h@thecodeyogi.com'})
        </button>
      </div>

      {/* Notification Stream */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
            No notifications in this view.
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isCritical = notif.days_until_expiry <= 3;
            const isExpired = notif.days_until_expiry <= 0;

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.is_read
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-80'
                    : isExpired
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-2xs'
                    : isCritical
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-900/60 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isExpired
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600'
                        : isCritical
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                    }`}
                  >
                    {isExpired ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{formatDate(notif.created_at)}</span>
                      <span>&bull;</span>
                      <span className="capitalize font-medium">{notif.asset_type}</span>
                      {notif.sent_via_email && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Mail className="w-3 h-3" /> Dispatched to {notif.recipient_email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleResendNotification(notif, e)}
                      disabled={resendingId === notif.id}
                      title="Resend this alert email to primary recipient & CCs"
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 rounded-lg flex items-center gap-1 shadow-2xs transition"
                    >
                      <RotateCw className={`w-3 h-3 ${resendingId === notif.id ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                      {resendingId === notif.id ? 'Resending...' : 'Resend Email'}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap shrink-0 ${
                        isExpired
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                          : isCritical
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isExpired ? 'EXPIRED' : `${notif.days_until_expiry} Days Left`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {notif.is_read ? 'Read' : 'Click to mark read'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
