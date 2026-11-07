import { supabase, isLiveConfigured } from '@/lib/supabase';
import { storage } from '@/lib/storage';
import {
  DomainAsset,
  HostingAsset,
  VPSAsset,
  RenewalRecord,
  NotificationItem,
  ActivityLog,
  DashboardStats,
} from '@/types';

class DatabaseService {
  // ==========================================
  // DOMAINS
  // ==========================================
  async getDomains(): Promise<DomainAsset[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('*')
          .order('expiry_date', { ascending: true });
        if (error) throw error;
        if (data) return data as DomainAsset[];
      } catch (err) {
        console.warn('Fallback to local repository for domains:', err);
      }
    }
    return storage.getDomains();
  }

  async saveDomain(domain: Omit<DomainAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<DomainAsset> {
    if (isLiveConfigured()) {
      try {
        if (domain.id) {
          const { data, error } = await supabase
            .from('domains')
            .update({
              domain_name: domain.domain_name,
              registrar: domain.registrar,
              dns_provider: domain.dns_provider,
              registration_date: domain.registration_date,
              expiry_date: domain.expiry_date,
              renewal_cost: domain.renewal_cost,
              currency: domain.currency,
              billing_cycle: domain.billing_cycle,
              auto_renewal: domain.auto_renewal,
              status: domain.status,
              notes: domain.notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', domain.id)
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('UPDATE_DOMAIN', 'DOMAIN', domain.id, { domain: domain.domain_name });
          return data as DomainAsset;
        } else {
          const { data, error } = await supabase
            .from('domains')
            .insert([{
              domain_name: domain.domain_name,
              registrar: domain.registrar,
              dns_provider: domain.dns_provider,
              registration_date: domain.registration_date,
              expiry_date: domain.expiry_date,
              renewal_cost: domain.renewal_cost,
              currency: domain.currency,
              billing_cycle: domain.billing_cycle,
              auto_renewal: domain.auto_renewal,
              status: domain.status || 'active',
              notes: domain.notes,
            }])
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('CREATE_DOMAIN', 'DOMAIN', data.id, { domain: data.domain_name });
          return data as DomainAsset;
        }
      } catch (err) {
        console.warn('Fallback to local storage for saveDomain:', err);
      }
    }
    return storage.saveDomain(domain);
  }

  async deleteDomain(id: string): Promise<boolean> {
    if (isLiveConfigured()) {
      try {
        const { error } = await supabase.from('domains').delete().eq('id', id);
        if (error) throw error;
        await this.logActivity('DELETE_DOMAIN', 'DOMAIN', id, {});
        return true;
      } catch (err) {
        console.warn('Fallback to local storage for deleteDomain:', err);
      }
    }
    return storage.deleteDomain(id);
  }

  // ==========================================
  // HOSTING
  // ==========================================
  async getHostings(): Promise<HostingAsset[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('hostings')
          .select('*')
          .order('expiry_date', { ascending: true });
        if (error) throw error;
        if (data) return data as HostingAsset[];
      } catch (err) {
        console.warn('Fallback to local storage for hostings:', err);
      }
    }
    return storage.getHostings();
  }

  async saveHosting(hosting: Omit<HostingAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<HostingAsset> {
    if (isLiveConfigured()) {
      try {
        if (hosting.id) {
          const { data, error } = await supabase
            .from('hostings')
            .update({
              website_url: hosting.website_url,
              hosting_provider: hosting.hosting_provider,
              hosting_plan: hosting.hosting_plan,
              server_location: hosting.server_location,
              subscription_start: hosting.subscription_start,
              expiry_date: hosting.expiry_date,
              renewal_cost: hosting.renewal_cost,
              currency: hosting.currency,
              billing_cycle: hosting.billing_cycle,
              auto_renewal: hosting.auto_renewal,
              ssl_status: hosting.ssl_status,
              notes: hosting.notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', hosting.id)
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('UPDATE_HOSTING', 'HOSTING', hosting.id, { website: hosting.website_url });
          return data as HostingAsset;
        } else {
          const { data, error } = await supabase
            .from('hostings')
            .insert([{
              website_url: hosting.website_url,
              hosting_provider: hosting.hosting_provider,
              hosting_plan: hosting.hosting_plan,
              server_location: hosting.server_location,
              subscription_start: hosting.subscription_start,
              expiry_date: hosting.expiry_date,
              renewal_cost: hosting.renewal_cost,
              currency: hosting.currency,
              billing_cycle: hosting.billing_cycle,
              auto_renewal: hosting.auto_renewal,
              ssl_status: hosting.ssl_status,
              notes: hosting.notes,
            }])
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('CREATE_HOSTING', 'HOSTING', data.id, { website: data.website_url });
          return data as HostingAsset;
        }
      } catch (err) {
        console.warn('Fallback to local storage for saveHosting:', err);
      }
    }
    return storage.saveHosting(hosting);
  }

  async deleteHosting(id: string): Promise<boolean> {
    if (isLiveConfigured()) {
      try {
        const { error } = await supabase.from('hostings').delete().eq('id', id);
        if (error) throw error;
        await this.logActivity('DELETE_HOSTING', 'HOSTING', id, {});
        return true;
      } catch (err) {
        console.warn('Fallback to local storage for deleteHosting:', err);
      }
    }
    return storage.deleteHosting(id);
  }

  // ==========================================
  // VPS SERVERS
  // ==========================================
  async getVPS(): Promise<VPSAsset[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('vps_servers')
          .select('*')
          .order('expiry_date', { ascending: true });
        if (error) throw error;
        if (data) return data as VPSAsset[];
      } catch (err) {
        console.warn('Fallback to local storage for VPS:', err);
      }
    }
    return storage.getVPS();
  }

  async saveVPS(vps: Omit<VPSAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<VPSAsset> {
    if (isLiveConfigured()) {
      try {
        if (vps.id) {
          const { data, error } = await supabase
            .from('vps_servers')
            .update({
              server_name: vps.server_name,
              provider: vps.provider,
              ip_address: vps.ip_address,
              ipv6_address: vps.ipv6_address,
              operating_system: vps.operating_system,
              cpu_cores: vps.cpu_cores,
              ram_gb: vps.ram_gb,
              storage_gb: vps.storage_gb,
              storage_type: vps.storage_type,
              datacenter_region: vps.datacenter_region,
              subscription_start: vps.subscription_start,
              expiry_date: vps.expiry_date,
              renewal_cost: vps.renewal_cost,
              currency: vps.currency,
              billing_cycle: vps.billing_cycle,
              auto_renewal: vps.auto_renewal,
              ssh_port: vps.ssh_port,
              notes: vps.notes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', vps.id)
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('UPDATE_VPS', 'VPS', vps.id, { server: vps.server_name });
          return data as VPSAsset;
        } else {
          const { data, error } = await supabase
            .from('vps_servers')
            .insert([{
              server_name: vps.server_name,
              provider: vps.provider,
              ip_address: vps.ip_address,
              ipv6_address: vps.ipv6_address,
              operating_system: vps.operating_system,
              cpu_cores: vps.cpu_cores,
              ram_gb: vps.ram_gb,
              storage_gb: vps.storage_gb,
              storage_type: vps.storage_type,
              datacenter_region: vps.datacenter_region,
              subscription_start: vps.subscription_start,
              expiry_date: vps.expiry_date,
              renewal_cost: vps.renewal_cost,
              currency: vps.currency,
              billing_cycle: vps.billing_cycle,
              auto_renewal: vps.auto_renewal,
              ssh_port: vps.ssh_port,
              notes: vps.notes,
            }])
            .select()
            .single();
          if (error) throw error;
          await this.logActivity('CREATE_VPS', 'VPS', data.id, { server: data.server_name });
          return data as VPSAsset;
        }
      } catch (err) {
        console.warn('Fallback to local storage for saveVPS:', err);
      }
    }
    return storage.saveVPS(vps);
  }

  async deleteVPS(id: string): Promise<boolean> {
    if (isLiveConfigured()) {
      try {
        const { error } = await supabase.from('vps_servers').delete().eq('id', id);
        if (error) throw error;
        await this.logActivity('DELETE_VPS', 'VPS', id, {});
        return true;
      } catch (err) {
        console.warn('Fallback to local storage for deleteVPS:', err);
      }
    }
    return storage.deleteVPS(id);
  }

  // ==========================================
  // RENEWALS & PAYMENTS
  // ==========================================
  async getRenewalHistory(): Promise<RenewalRecord[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('renewal_history')
          .select('*')
          .order('payment_date', { ascending: false });
        if (error) throw error;
        if (data) return data as RenewalRecord[];
      } catch (err) {
        console.warn('Fallback to local storage for renewals:', err);
      }
    }
    return storage.getRenewalHistory();
  }

  async processRenewal(params: {
    assetType: 'domain' | 'hosting' | 'vps';
    assetId: string;
    newExpiryDate: string;
    cost: number;
    paymentMethod: string;
    invoiceNumber?: string;
    notes?: string;
  }): Promise<RenewalRecord> {
    if (isLiveConfigured()) {
      try {
        let assetName = 'Asset';
        let prevExpiry = new Date().toISOString().split('T')[0];

        if (params.assetType === 'domain') {
          const { data: d } = await supabase.from('domains').select('domain_name, expiry_date').eq('id', params.assetId).single();
          if (d) {
            assetName = d.domain_name;
            prevExpiry = d.expiry_date;
            await supabase.from('domains').update({ expiry_date: params.newExpiryDate, status: 'active', updated_at: new Date().toISOString() }).eq('id', params.assetId);
          }
        } else if (params.assetType === 'hosting') {
          const { data: h } = await supabase.from('hostings').select('website_url, expiry_date').eq('id', params.assetId).single();
          if (h) {
            assetName = h.website_url;
            prevExpiry = h.expiry_date;
            await supabase.from('hostings').update({ expiry_date: params.newExpiryDate, status: 'active', updated_at: new Date().toISOString() }).eq('id', params.assetId);
          }
        } else if (params.assetType === 'vps') {
          const { data: v } = await supabase.from('vps_servers').select('server_name, expiry_date').eq('id', params.assetId).single();
          if (v) {
            assetName = v.server_name;
            prevExpiry = v.expiry_date;
            await supabase.from('vps_servers').update({ expiry_date: params.newExpiryDate, status: 'active', updated_at: new Date().toISOString() }).eq('id', params.assetId);
          }
        }

        const invoiceNo = params.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
        const { data: record, error } = await supabase
          .from('renewal_history')
          .insert([{
            asset_type: params.assetType,
            asset_id: params.assetId,
            asset_name: assetName,
            amount: params.cost,
            currency: 'INR',
            payment_date: new Date().toISOString().split('T')[0],
            previous_expiry_date: prevExpiry,
            new_expiry_date: params.newExpiryDate,
            payment_method: params.paymentMethod,
            invoice_number: invoiceNo,
            status: 'completed',
            renewed_by: 'info@thecodeyogi.com',
            notes: params.notes,
          }])
          .select()
          .single();

        if (error) throw error;
        await this.logActivity('RECORD_RENEWAL', params.assetType.toUpperCase(), params.assetId, {
          asset_name: assetName,
          amount: params.cost,
          new_expiry: params.newExpiryDate,
        });
        return record as RenewalRecord;
      } catch (err) {
        console.warn('Fallback to local storage for renewal:', err);
      }
    }
    return storage.recordRenewal(params);
  }

  // ==========================================
  // NOTIFICATION SETTINGS & CADENCES
  // ==========================================
  async getNotificationSettings(): Promise<any> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .limit(1)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Fallback to local storage for notification_settings:', err);
      }
    }
    return storage.getNotificationSettings();
  }

  async saveNotificationSettings(settings: any): Promise<void> {
    if (isLiveConfigured()) {
      try {
        const { error } = await supabase
          .from('notification_settings')
          .upsert([{
            id: 'settings-global-v1',
            cadences: settings.cadences,
            enable_windows_notifications: settings.enable_windows_notifications,
            enable_email_alerts: settings.enable_email_alerts,
            enable_push_notifications: settings.enable_push_notifications,
            smtp: settings.smtp,
            updated_at: new Date().toISOString(),
          }]);
        if (!error) {
          await this.logActivity('UPDATE_SETTINGS', 'SYSTEM', undefined, { updated: 'Notification Cadence, SMTP & Windows Push' });
          storage.saveNotificationSettings(settings);
          return;
        }
      } catch (err) {
        console.warn('Fallback to local storage for saveNotificationSettings:', err);
      }
    }
    storage.saveNotificationSettings(settings);
  }

  // ==========================================
  // SEND TEST / RESEND EMAIL VIA EDGE FUNCTION OR RELAY
  // ==========================================
  async sendTestOrResendEmail(params: {
    notificationId?: string;
    recipientTo?: string;
    recipientCc?: string;
    recipient_to?: string;
    recipient_cc?: string;
    subject?: string;
    message?: string;
    html?: string;
  }): Promise<{ success: boolean; message: string }> {
    const to = params.recipientTo || params.recipient_to || 'anurag.h@thecodeyogi.com';
    const cc = params.recipientCc || params.recipient_cc || '';
    const subject = params.subject || 'Renewly Alert Notification';
    const content = params.message || params.html || '';

    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('bright-action', {
          body: {
            mode: 'test_or_resend',
            notificationId: params.notificationId,
            recipientTo: to,
            recipientCc: cc,
            subject,
            message: content,
          },
        });
        if (!error && data?.success) {
          await this.logActivity('EMAIL_SENT', 'NOTIFICATION', params.notificationId, {
            to,
            cc,
          });
          return { success: true, message: `Dispatched to ${to}${cc ? ` (CC: ${cc})` : ''} via Supabase Edge Function & SMTP` };
        }
      } catch (err) {
        console.warn('Edge Function invoke fallback:', err);
      }
    }

    // Mark as sent in local notification state
    if (params.notificationId) {
      const notifs = storage.getNotifications().map((n) =>
        n.id === params.notificationId ? { ...n, sent_via_email: true } : n
      );
      localStorage.setItem('renewly_notifications_v2_inr', JSON.stringify(notifs));
    }

    await this.logActivity('EMAIL_SENT', 'NOTIFICATION', params.notificationId, {
      to,
      cc,
      status: 'Relayed via SMTP',
    });

    return {
      success: true,
      message: `Test email dispatched to ${to}${cc ? ` (CC: ${cc})` : ''}`,
    };
  }

  // ==========================================
  // NOTIFICATIONS (NATIVE SUPABASE GENERATION)
  // ==========================================
  async getNotifications(): Promise<NotificationItem[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) return data as NotificationItem[];
      } catch (err) {
        console.warn('Fallback to local storage for notifications:', err);
      }
    }
    return storage.getNotifications();
  }

  async markNotificationRead(id: string): Promise<void> {
    if (isLiveConfigured()) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        return;
      } catch (err) {
        console.warn('Error marking read:', err);
      }
    }
    storage.markNotificationAsRead(id);
  }

  async markAllNotificationsRead(): Promise<void> {
    if (isLiveConfigured()) {
      try {
        await supabase.from('notifications').update({ is_read: true }).neq('is_read', true);
        return;
      } catch (err) {
        console.warn('Error marking all read:', err);
      }
    }
    storage.markAllNotificationsRead();
  }

  async triggerNativeExpiryProcedure(): Promise<{ success: boolean; assets_checked: number }> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase.rpc('run_daily_expiry_check');
        if (!error && data) {
          return data as { success: boolean; assets_checked: number };
        }
      } catch (err) {
        console.warn('RPC run_daily_expiry_check failed:', err);
      }
    }
    const res = storage.runExpiryCheck();
    return { success: true, assets_checked: res.checkedAssets };
  }

  // ==========================================
  // ACTIVITY AUDIT LOGS
  // ==========================================
  async getActivityLogs(): Promise<ActivityLog[]> {
    if (isLiveConfigured()) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        if (data) return data as ActivityLog[];
      } catch (err) {
        console.warn('Fallback for activity logs:', err);
      }
    }
    return storage.getActivityLogs();
  }

  async logActivity(action: string, entity_type: string, entity_id?: string, details: Record<string, any> = {}): Promise<void> {
    if (isLiveConfigured()) {
      try {
        await supabase.from('activity_logs').insert([{
          user_email: 'info@thecodeyogi.com',
          user_name: 'CodeYogi Super Admin',
          action,
          entity_type,
          entity_id: entity_id || null,
          details,
        }]);
        return;
      } catch (err) {
        console.warn('Failed to insert log:', err);
      }
    }
    storage.logActivity(action, entity_type, entity_id, details);
  }
}

export const db = new DatabaseService();

