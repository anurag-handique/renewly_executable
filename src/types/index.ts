export type UserRole = 'admin' | 'employee';
export type AssetStatus = 'active' | 'expiring_soon' | 'expired' | 'renewed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type ReminderInterval = '30_days' | '15_days' | '7_days' | '3_days' | '1_day' | 'expired';
export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'multi_year';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  department?: string;
  created_at: string;
}

export interface DomainAsset {
  id: string;
  domain_name: string;
  registrar: string;
  dns_provider: string;
  registration_date: string;
  expiry_date: string;
  renewal_cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  auto_renewal: boolean;
  status: AssetStatus;
  assigned_user_id?: string;
  tags?: string[];
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface HostingAsset {
  id: string;
  website_url: string;
  hosting_provider: string;
  hosting_plan: string;
  server_location?: string;
  subscription_start: string;
  expiry_date: string;
  renewal_cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  auto_renewal: boolean;
  status: AssetStatus;
  ssl_status: boolean;
  assigned_user_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VPSAsset {
  id: string;
  server_name: string;
  provider: string;
  ip_address: string;
  ipv6_address?: string;
  operating_system: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  storage_type: string;
  datacenter_region?: string;
  subscription_start: string;
  expiry_date: string;
  renewal_cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  auto_renewal: boolean;
  status: AssetStatus;
  ssh_port: number;
  assigned_user_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalRecord {
  id: string;
  asset_type: 'domain' | 'hosting' | 'vps';
  asset_id: string;
  asset_name: string;
  amount: number;
  currency: string;
  payment_date: string;
  previous_expiry_date: string;
  new_expiry_date: string;
  payment_method: string;
  invoice_number?: string;
  invoice_url?: string;
  status: PaymentStatus;
  renewed_by?: string;
  notes?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  asset_type: 'domain' | 'hosting' | 'vps';
  asset_id: string;
  asset_name: string;
  recipient_email: string;
  reminder_type: ReminderInterval | string;
  days_until_expiry: number;
  title: string;
  message: string;
  sent_via_email: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ReminderCadenceConfig {
  id?: string;
  days_before: number;
  label: string;
  enabled: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  recipient_to: string; // Configurable Primary Recipient Email
  recipient_cc: string; // Configurable comma-separated CC emails
}

export interface NotificationSettings {
  cadences: ReminderCadenceConfig[];
  enable_windows_notifications: boolean;
  enable_email_alerts: boolean;
  enable_push_notifications: boolean;
  smtp?: SmtpConfig;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalAssets: number;
  activeSubscriptions: number;
  expiringIn30Days: number;
  expiredAssets: number;
  totalMonthlyExpense: number;
  totalAnnualExpense: number;
  domainsCount: number;
  hostingsCount: number;
  vpsCount: number;
  upcomingRenewals: Array<{
    id: string;
    type: 'domain' | 'hosting' | 'vps';
    name: string;
    expiry_date: string;
    cost: number;
    daysLeft: number;
    status: AssetStatus;
  }>;
}

