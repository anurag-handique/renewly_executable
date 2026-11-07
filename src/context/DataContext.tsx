import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  DomainAsset,
  HostingAsset,
  VPSAsset,
  RenewalRecord,
  NotificationItem,
  ActivityLog,
  DashboardStats,
  NotificationSettings,
} from '@/types';
import { db } from '@/lib/db';
import { showWindowsNotification, requestDesktopNotificationPermission } from '@/lib/pushNotification';

interface DataContextType {
  domains: DomainAsset[];
  hostings: HostingAsset[];
  vps: VPSAsset[];
  history: RenewalRecord[];
  notifications: NotificationItem[];
  logs: ActivityLog[];
  stats: DashboardStats;
  notificationSettings: NotificationSettings;
  unreadCount: number;
  loading: boolean;
  refreshData: () => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  requestDesktopPermission: () => Promise<NotificationPermission>;
  // Domain operations
  saveDomain: (domain: Omit<DomainAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  deleteDomain: (id: string) => Promise<void>;
  // Hosting operations
  saveHosting: (hosting: Omit<HostingAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  deleteHosting: (id: string) => Promise<void>;
  // VPS operations
  saveVPS: (vps: Omit<VPSAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  deleteVPS: (id: string) => Promise<void>;
  // Renewals & payments
  processRenewal: (params: {
    assetType: 'domain' | 'hosting' | 'vps';
    assetId: string;
    newExpiryDate: string;
    cost: number;
    paymentMethod: string;
    invoiceNumber?: string;
    notes?: string;
  }) => Promise<void>;
  // Notifications & Emails
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  triggerNativeExpirySweep: () => Promise<{ success: boolean; assets_checked: number }>;
  sendTestOrResendEmail: (params: {
    notificationId?: string;
    recipientTo?: string;
    recipientCc?: string;
    recipient_to?: string;
    recipient_cc?: string;
    subject?: string;
    message?: string;
    html?: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [domains, setDomains] = useState<DomainAsset[]>([]);
  const [hostings, setHostings] = useState<HostingAsset[]>([]);
  const [vps, setVPS] = useState<VPSAsset[]>([]);
  const [history, setHistory] = useState<RenewalRecord[]>([]);
  const calculateStats = (
    doms: DomainAsset[],
    hosts: HostingAsset[],
    servers: VPSAsset[]
  ): DashboardStats => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allAssets = [
      ...doms.map((d) => ({ id: d.id, type: 'domain' as const, name: d.domain_name, expiry_date: d.expiry_date, cost: d.renewal_cost, status: d.status, cycle: d.billing_cycle })),
      ...hosts.map((h) => ({ id: h.id, type: 'hosting' as const, name: h.website_url, expiry_date: h.expiry_date, cost: h.renewal_cost, status: h.status, cycle: h.billing_cycle })),
      ...servers.map((v) => ({ id: v.id, type: 'vps' as const, name: v.server_name, expiry_date: v.expiry_date, cost: v.renewal_cost, status: v.status, cycle: v.billing_cycle })),
    ];

    let activeSubscriptions = 0;
    let expiringIn30Days = 0;
    let expiredAssets = 0;
    let totalAnnualExpense = 0;
    let totalMonthlyExpense = 0;

    const upcomingRenewals: DashboardStats['upcomingRenewals'] = [];

    allAssets.forEach((asset) => {
      const expDate = new Date(asset.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        expiredAssets++;
      } else {
        activeSubscriptions++;
        if (daysLeft <= 30) {
          expiringIn30Days++;
        }
      }

      const cost = Number(asset.cost) || 0;
      if (asset.cycle === 'monthly') {
        totalMonthlyExpense += cost;
        totalAnnualExpense += cost * 12;
      } else if (asset.cycle === 'quarterly') {
        totalMonthlyExpense += cost / 3;
        totalAnnualExpense += cost * 4;
      } else {
        totalMonthlyExpense += cost / 12;
        totalAnnualExpense += cost;
      }

      upcomingRenewals.push({
        id: asset.id,
        type: asset.type,
        name: asset.name,
        expiry_date: asset.expiry_date,
        cost: asset.cost,
        daysLeft,
        status: asset.status,
      });
    });

    upcomingRenewals.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      totalAssets: allAssets.length,
      activeSubscriptions,
      expiringIn30Days,
      expiredAssets,
      totalMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
      totalAnnualExpense: Math.round(totalAnnualExpense * 100) / 100,
      domainsCount: doms.length,
      hostingsCount: hosts.length,
      vpsCount: servers.length,
      upcomingRenewals: upcomingRenewals.slice(0, 10),
    };
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    cadences: [
      { days_before: 30, label: '1 Month Before', enabled: true },
      { days_before: 15, label: '15 Days Before', enabled: true },
      { days_before: 7, label: '1 Week Before', enabled: true },
      { days_before: 3, label: '3 Days Before', enabled: true },
      { days_before: 1, label: '1 Day Before', enabled: true },
      { days_before: 0, label: 'Day of Expiry & Expired', enabled: true },
    ],
    enable_windows_notifications: true,
    enable_email_alerts: true,
    enable_push_notifications: true,
  });

  const lastNotifiedRef = useRef<Set<string>>(new Set());

  const refreshData = useCallback(async () => {
    try {
      const [d, h, v, hist, notifs, act, settings] = await Promise.all([
        db.getDomains(),
        db.getHostings(),
        db.getVPS(),
        db.getRenewalHistory(),
        db.getNotifications(),
        db.getActivityLogs(),
        db.getNotificationSettings(),
      ]);
      setDomains(d);
      setHostings(h);
      setVPS(v);
      setHistory(hist);
      setNotifications(notifs);
      setLogs(act);
      if (settings && settings.cadences) {
        setNotificationSettings(settings);
      }

      // Check for Windows desktop push notifications for unread alerts
      if (settings?.enable_windows_notifications !== false && notifs.length > 0) {
        const unread = notifs.filter((n) => !n.is_read);
        unread.forEach((n) => {
          if (!lastNotifiedRef.current.has(n.id)) {
            lastNotifiedRef.current.add(n.id);
            showWindowsNotification(n.title, {
              body: n.message,
              data: { id: n.id },
            });
          }
        });
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNotificationSettings = async (settings: NotificationSettings) => {
    await db.saveNotificationSettings(settings);
    setNotificationSettings(settings);
    await refreshData();
  };

  const requestDesktopPermission = async () => {
    return await requestDesktopNotificationPermission();
  };

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const saveDomain = async (domain: Omit<DomainAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    await db.saveDomain(domain);
    await refreshData();
  };

  const deleteDomain = async (id: string) => {
    await db.deleteDomain(id);
    await refreshData();
  };

  const saveHosting = async (hosting: Omit<HostingAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    await db.saveHosting(hosting);
    await refreshData();
  };

  const deleteHosting = async (id: string) => {
    await db.deleteHosting(id);
    await refreshData();
  };

  const saveVPS = async (v: Omit<VPSAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    await db.saveVPS(v);
    await refreshData();
  };

  const deleteVPS = async (id: string) => {
    await db.deleteVPS(id);
    await refreshData();
  };

  const processRenewal = async (params: {
    assetType: 'domain' | 'hosting' | 'vps';
    assetId: string;
    newExpiryDate: string;
    cost: number;
    paymentMethod: string;
    invoiceNumber?: string;
    notes?: string;
  }) => {
    await db.processRenewal(params);
    await refreshData();
  };

  const markNotificationRead = async (id: string) => {
    await db.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await db.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const triggerNativeExpirySweep = async () => {
    const res = await db.triggerNativeExpiryProcedure();
    await refreshData();
    return res;
  };

  const sendTestOrResendEmail = async (params: {
    notificationId?: string;
    recipientTo?: string;
    recipientCc?: string;
    recipient_to?: string;
    recipient_cc?: string;
    subject?: string;
    message?: string;
    html?: string;
  }) => {
    const res = await db.sendTestOrResendEmail(params);
    await refreshData();
    return res;
  };

  const stats = calculateStats(domains, hostings, vps);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DataContext.Provider
      value={{
        domains,
        hostings,
        vps,
        history,
        notifications,
        logs,
        stats,
        notificationSettings,
        unreadCount,
        loading,
        refreshData,
        updateNotificationSettings,
        requestDesktopPermission,
        saveDomain,
        deleteDomain,
        saveHosting,
        deleteHosting,
        saveVPS,
        deleteVPS,
        processRenewal,
        markNotificationRead,
        markAllNotificationsRead,
        triggerNativeExpirySweep,
        sendTestOrResendEmail,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
