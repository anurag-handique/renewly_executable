import { DomainAsset, HostingAsset, VPSAsset, RenewalRecord, NotificationItem, ActivityLog, UserProfile } from '@/types';

const STORAGE_KEYS = {
  DOMAINS: 'renewly_domains_v2_inr',
  HOSTINGS: 'renewly_hostings_v2_inr',
  VPS: 'renewly_vps_v2_inr',
  HISTORY: 'renewly_history_v2_inr',
  NOTIFICATIONS: 'renewly_notifications_v2_inr',
  ACTIVITY: 'renewly_activity_v2_inr',
  USERS: 'renewly_users_v2_inr',
  CURRENT_USER: 'renewly_current_user_v2_inr',
  NOTIFICATION_SETTINGS: 'renewly_notif_settings_v1',
};

const DEFAULT_CADENCES = [
  { days_before: 30, label: '1 Month Before', enabled: true },
  { days_before: 15, label: '15 Days Before', enabled: true },
  { days_before: 7, label: '1 Week Before', enabled: true },
  { days_before: 3, label: '3 Days Before', enabled: true },
  { days_before: 1, label: '1 Day Before', enabled: true },
  { days_before: 0, label: 'Day of Expiry & Expired', enabled: true },
];

const DEFAULT_SMTP = {
  host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
  port: Number(import.meta.env.VITE_SMTP_PORT) || 587,
  user: import.meta.env.VITE_SMTP_USER || 'anurag.h@thecodeyogi.com',
  pass: import.meta.env.VITE_SMTP_PASS || 'lutdfsixlzvvjzmu',
  from: import.meta.env.VITE_SMTP_FROM || 'Renewly Alerts <anurag.h@thecodeyogi.com>',
  secure: false,
  recipient_to: 'anurag.h@thecodeyogi.com',
  recipient_cc: 'info@thecodeyogi.com, devops@thecodeyogi.com',
};

// Seed initial realistic data for CodeYogi
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@codeyogi.org',
    full_name: 'Anurag Sharma (Admin)',
    role: 'admin',
    department: 'DevOps & IT',
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'usr-emp-2',
    email: 'dev@codeyogi.org',
    full_name: 'Priya Patel',
    role: 'employee',
    department: 'Fullstack Engineering',
    created_at: new Date('2024-02-15').toISOString(),
  },
];

const INITIAL_DOMAINS: DomainAsset[] = [
  {
    id: 'dom-1',
    domain_name: 'codeyogi.org',
    registrar: 'Cloudflare Registrar',
    dns_provider: 'Cloudflare Enterprise DNS',
    registration_date: '2022-04-10',
    expiry_date: '2027-04-10',
    renewal_cost: 14.50,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: true,
    status: 'active',
    assigned_user_id: 'usr-admin-1',
    tags: ['Production', 'Main Portal', 'SEO'],
    notes: 'Primary brand domain with Cloudflare SSL/TLS enabled and HSTS active.',
    created_at: '2022-04-10T10:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
  },
  {
    id: 'dom-2',
    domain_name: 'codeyogi.io',
    registrar: 'Namecheap',
    dns_provider: 'Cloudflare DNS',
    registration_date: '2023-11-20',
    expiry_date: '2026-11-22', // Expiring in ~15 days
    renewal_cost: 39.99,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: false,
    status: 'expiring_soon',
    assigned_user_id: 'usr-emp-2',
    tags: ['API Endpoints', 'Developer Docs'],
    notes: 'Needs credit card update before expiry on 22nd Nov.',
    created_at: '2023-11-20T12:00:00Z',
    updated_at: '2026-11-05T09:30:00Z',
  },
  {
    id: 'dom-3',
    domain_name: 'students-hub.in',
    registrar: 'GoDaddy',
    dns_provider: 'AWS Route53',
    registration_date: '2021-11-10',
    expiry_date: '2026-11-10', // Expiring in 3 days!
    renewal_cost: 18.00,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: false,
    status: 'expiring_soon',
    assigned_user_id: 'usr-admin-1',
    tags: ['LMS', 'Student Portal'],
    notes: 'High priority renewal for CodeYogi Student batch access.',
    created_at: '2021-11-10T15:00:00Z',
    updated_at: '2026-11-06T11:00:00Z',
  },
  {
    id: 'dom-4',
    domain_name: 'codeyogi-staging.net',
    registrar: 'Porkbun',
    dns_provider: 'Cloudflare',
    registration_date: '2023-10-15',
    expiry_date: '2026-10-15', // Expired!
    renewal_cost: 11.20,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: false,
    status: 'expired',
    assigned_user_id: 'usr-emp-2',
    tags: ['Staging', 'QA'],
    notes: 'In grace period; renewal required to avoid redemption fee.',
    created_at: '2023-10-15T09:00:00Z',
    updated_at: '2026-10-16T00:00:00Z',
  },
  {
    id: 'dom-5',
    domain_name: 'yogi-learn.tech',
    registrar: 'Google Domains (Squarespace)',
    dns_provider: 'Google Cloud DNS',
    registration_date: '2024-03-01',
    expiry_date: '2027-03-01',
    renewal_cost: 24.00,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: true,
    status: 'active',
    assigned_user_id: 'usr-admin-1',
    tags: ['NextGen', 'Micro-courses'],
    notes: 'Auto-renew enabled via corporate Amex.',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
];

const INITIAL_HOSTINGS: HostingAsset[] = [
  {
    id: 'host-1',
    website_url: 'https://codeyogi.org',
    hosting_provider: 'Vercel Pro',
    hosting_plan: 'Team Enterprise Plan',
    server_location: 'Washington D.C. (iad1)',
    subscription_start: '2023-01-01',
    expiry_date: '2027-01-01',
    renewal_cost: 240.00,
    currency: 'INR',
    billing_cycle: 'annual',
    auto_renewal: true,
    status: 'active',
    ssl_status: true,
    assigned_user_id: 'usr-admin-1',
    notes: 'Handles high traffic marketing and admissions portal.',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'host-2',
    website_url: 'https://learn.codeyogi.org',
    hosting_provider: 'AWS Elastic Beanstalk / S3 CloudFront',
    hosting_plan: 'High-Concurrency Cluster',
    server_location: 'Mumbai (ap-south-1)',
    subscription_start: '2024-05-15',
    expiry_date: '2026-11-14', // Expiring in 7 days!
    renewal_cost: 155.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    auto_renewal: false,
    status: 'expiring_soon',
    ssl_status: true,
    assigned_user_id: 'usr-admin-1',
    notes: 'Monthly billing cycle renewal for student LMS microservices.',
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2026-11-04T00:00:00Z',
  },
  {
    id: 'host-3',
    website_url: 'https://blogs.codeyogi.org',
    hosting_provider: 'Kinsta WordPress Hosting',
    hosting_plan: 'WP Single 30k Visits',
    server_location: 'Frankfurt (europe-west3)',
    subscription_start: '2024-11-18',
    expiry_date: '2026-11-18', // Expiring in 11 days
    renewal_cost: 35.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    auto_renewal: true,
    status: 'expiring_soon',
    ssl_status: true,
    assigned_user_id: 'usr-emp-2',
    notes: 'Managed WordPress cluster with CDN integration.',
    created_at: '2024-11-18T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
];

const INITIAL_VPS: VPSAsset[] = [
  {
    id: 'vps-1',
    server_name: 'prod-api-cluster-01',
    provider: 'Hetzner Cloud',
    ip_address: '159.69.88.14',
    ipv6_address: '2a01:4f8:1c1c:1e::1',
    operating_system: 'Ubuntu 24.04 LTS x86_64',
    cpu_cores: 8,
    ram_gb: 32,
    storage_gb: 240,
    storage_type: 'NVMe SSD RAID-10',
    datacenter_region: 'Falkenstein (fsn1-dc14)',
    subscription_start: '2024-01-10',
    expiry_date: '2027-01-10',
    renewal_cost: 48.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    auto_renewal: true,
    status: 'active',
    ssh_port: 2222,
    assigned_user_id: 'usr-admin-1',
    notes: 'Hosts Docker swarm for CodeYogi backend API and Redis caching.',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'vps-2',
    server_name: 'staging-build-runner',
    provider: 'DigitalOcean Droplet',
    ip_address: '167.99.145.202',
    operating_system: 'Debian 12 Bookworm',
    cpu_cores: 4,
    ram_gb: 8,
    storage_gb: 160,
    storage_type: 'NVMe SSD',
    datacenter_region: 'Bangalore (BLR1)',
    subscription_start: '2025-10-09',
    expiry_date: '2026-11-08', // Expiring in 1 day!
    renewal_cost: 48.00,
    currency: 'INR',
    billing_cycle: 'monthly',
    auto_renewal: false,
    status: 'expiring_soon',
    ssh_port: 22,
    assigned_user_id: 'usr-emp-2',
    notes: 'Self-hosted GitHub Actions runner for continuous integration pipelines.',
    created_at: '2025-10-09T00:00:00Z',
    updated_at: '2026-11-06T00:00:00Z',
  },
  {
    id: 'vps-3',
    server_name: 'postgres-backup-slave',
    provider: 'OVHcloud VPS',
    ip_address: '51.89.21.77',
    operating_system: 'Ubuntu 22.04 LTS',
    cpu_cores: 4,
    ram_gb: 16,
    storage_gb: 500,
    storage_type: 'SSD Storage Tier',
    datacenter_region: 'London (UK-1)',
    subscription_start: '2024-06-01',
    expiry_date: '2026-11-22', // Expiring in 15 days
    renewal_cost: 32.50,
    currency: 'INR',
    billing_cycle: 'monthly',
    auto_renewal: true,
    status: 'expiring_soon',
    ssh_port: 4422,
    assigned_user_id: 'usr-admin-1',
    notes: 'Nightly offsite WAL archiving and backup verification sandbox.',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2026-10-22T00:00:00Z',
  },
];

const INITIAL_HISTORY: RenewalRecord[] = [
  {
    id: 'ren-101',
    asset_type: 'domain',
    asset_id: 'dom-1',
    asset_name: 'codeyogi.org',
    amount: 14.50,
    currency: 'INR',
    payment_date: '2026-04-10',
    previous_expiry_date: '2026-04-10',
    new_expiry_date: '2027-04-10',
    payment_method: 'Corporate Visa Card (ends 4821)',
    invoice_number: 'INV-CF-2026-8812',
    status: 'completed',
    renewed_by: 'Anurag Sharma (Admin)',
    notes: '1-Year auto renewal processed successfully by Cloudflare.',
    created_at: '2026-04-10T08:30:00Z',
  },
  {
    id: 'ren-102',
    asset_type: 'hosting',
    asset_id: 'host-1',
    asset_name: 'https://codeyogi.org (Vercel)',
    amount: 240.00,
    currency: 'INR',
    payment_date: '2026-01-01',
    previous_expiry_date: '2026-01-01',
    new_expiry_date: '2027-01-01',
    payment_method: 'Amex Corporate',
    invoice_number: 'INV-VERCEL-2026-004',
    status: 'completed',
    renewed_by: 'Anurag Sharma (Admin)',
    notes: 'Annual upfront subscription renewal with 20% discount applied.',
    created_at: '2026-01-01T12:00:00Z',
  },
  {
    id: 'ren-103',
    asset_type: 'vps',
    asset_id: 'vps-1',
    asset_name: 'prod-api-cluster-01 (Hetzner)',
    amount: 48.00,
    currency: 'INR',
    payment_date: '2026-10-10',
    previous_expiry_date: '2026-10-10',
    new_expiry_date: '2026-11-10',
    payment_method: 'Direct SEPA / Credit Card',
    invoice_number: 'HETZ-993821-OCT',
    status: 'completed',
    renewed_by: 'Anurag Sharma (Admin)',
    notes: 'Monthly server renewal for primary production API.',
    created_at: '2026-10-10T03:15:00Z',
  },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    asset_type: 'vps',
    asset_id: 'vps-2',
    asset_name: 'staging-build-runner',
    recipient_email: 'admin@codeyogi.org',
    reminder_type: '1_day',
    days_until_expiry: 1,
    title: 'VPS Expiring Tomorrow: staging-build-runner',
    message: 'DigitalOcean Droplet staging-build-runner (167.99.145.202) expires in 1 day! Immediate renewal needed to prevent CI pipeline downtime.',
    sent_via_email: true,
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif-2',
    asset_type: 'domain',
    asset_id: 'dom-3',
    asset_name: 'students-hub.in',
    recipient_email: 'admin@codeyogi.org',
    reminder_type: '3_days',
    days_until_expiry: 3,
    title: 'Domain Expiry Warning: students-hub.in',
    message: 'Domain students-hub.in expires in 3 days. Estimated renewal cost is ?1,500 via GoDaddy.',
    sent_via_email: true,
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'notif-3',
    asset_type: 'hosting',
    asset_id: 'host-2',
    asset_name: 'learn.codeyogi.org',
    recipient_email: 'admin@codeyogi.org',
    reminder_type: '7_days',
    days_until_expiry: 7,
    title: 'Hosting Expiry in 7 Days: learn.codeyogi.org',
    message: 'AWS cluster hosting for learn.codeyogi.org requires monthly renewal approval.',
    sent_via_email: true,
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'notif-4',
    asset_type: 'domain',
    asset_id: 'dom-4',
    asset_name: 'codeyogi-staging.net',
    recipient_email: 'admin@codeyogi.org',
    reminder_type: 'expired',
    days_until_expiry: -23,
    title: 'Action Required: Domain Expired (codeyogi-staging.net)',
    message: 'Domain codeyogi-staging.net expired on 2026-10-15 and is currently in registrar grace period.',
    sent_via_email: true,
    is_read: false,
    created_at: '2026-10-16T08:00:00Z',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_name: 'Anurag Sharma (Admin)',
    user_email: 'admin@codeyogi.org',
    action: 'SYSTEM_AUDIT',
    entity_type: 'CRON',
    details: { automated_check: 'Daily Expiry Check performed successfully. 4 assets monitored.' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'log-2',
    user_name: 'Anurag Sharma (Admin)',
    user_email: 'admin@codeyogi.org',
    action: 'UPDATE_DOMAIN',
    entity_type: 'DOMAIN',
    entity_id: 'dom-2',
    details: { domain: 'codeyogi.io', change: 'Checked auto-renewal status' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        this.set(key, defaultValue);
        return defaultValue;
      }
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  // --- Current User & Profiles ---
  getCurrentUser(): UserProfile {
    return this.get<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  setCurrentUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  getUsers(): UserProfile[] {
    return this.get<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  addUser(user: UserProfile): void {
    const list = this.getUsers();
    list.push(user);
    this.set(STORAGE_KEYS.USERS, list);
    this.logActivity('USER_INVITED', 'USER', user.id, { email: user.email, role: user.role });
  }

  updateUser(id: string, updates: Partial<UserProfile>): void {
    const list = this.getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u));
    this.set(STORAGE_KEYS.USERS, list);
    const currentUser = this.getCurrentUser();
    if (currentUser.id === id) {
      this.setCurrentUser({ ...currentUser, ...updates });
    }
  }

  deleteUser(id: string): void {
    const list = this.getUsers().filter((u) => u.id !== id);
    this.set(STORAGE_KEYS.USERS, list);
  }

  // --- Domains ---
  getDomains(): DomainAsset[] {
    return this.get<DomainAsset[]>(STORAGE_KEYS.DOMAINS, INITIAL_DOMAINS);
  }

  saveDomain(domain: Omit<DomainAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): DomainAsset {
    const list = this.getDomains();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    if (domain.id) {
      // update
      const index = list.findIndex((d) => d.id === domain.id);
      if (index >= 0) {
        const updated: DomainAsset = {
          ...list[index],
          ...domain,
          updated_at: now,
        };
        list[index] = updated;
        this.set(STORAGE_KEYS.DOMAINS, list);
        this.logActivity('UPDATE_DOMAIN', 'DOMAIN', domain.id, { domain_name: domain.domain_name });
        return updated;
      }
    }

    // create
    const newDomain: DomainAsset = {
      ...domain,
      id: `dom-${Date.now()}`,
      created_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };
    list.unshift(newDomain);
    this.set(STORAGE_KEYS.DOMAINS, list);
    this.logActivity('CREATE_DOMAIN', 'DOMAIN', newDomain.id, { domain_name: newDomain.domain_name });
    this.runExpiryCheck();
    return newDomain;
  }

  deleteDomain(id: string): boolean {
    const list = this.getDomains();
    const target = list.find((d) => d.id === id);
    const filtered = list.filter((d) => d.id !== id);
    this.set(STORAGE_KEYS.DOMAINS, filtered);
    if (target) {
      this.logActivity('DELETE_DOMAIN', 'DOMAIN', id, { domain_name: target.domain_name });
    }
    return true;
  }

  // --- Hostings ---
  getHostings(): HostingAsset[] {
    return this.get<HostingAsset[]>(STORAGE_KEYS.HOSTINGS, INITIAL_HOSTINGS);
  }

  saveHosting(hosting: Omit<HostingAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): HostingAsset {
    const list = this.getHostings();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    if (hosting.id) {
      const index = list.findIndex((h) => h.id === hosting.id);
      if (index >= 0) {
        const updated: HostingAsset = {
          ...list[index],
          ...hosting,
          updated_at: now,
        };
        list[index] = updated;
        this.set(STORAGE_KEYS.HOSTINGS, list);
        this.logActivity('UPDATE_HOSTING', 'HOSTING', hosting.id, { website_url: hosting.website_url });
        return updated;
      }
    }

    const newHost: HostingAsset = {
      ...hosting,
      id: `host-${Date.now()}`,
      created_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };
    list.unshift(newHost);
    this.set(STORAGE_KEYS.HOSTINGS, list);
    this.logActivity('CREATE_HOSTING', 'HOSTING', newHost.id, { website_url: newHost.website_url });
    this.runExpiryCheck();
    return newHost;
  }

  deleteHosting(id: string): boolean {
    const list = this.getHostings();
    const target = list.find((h) => h.id === id);
    const filtered = list.filter((h) => h.id !== id);
    this.set(STORAGE_KEYS.HOSTINGS, filtered);
    if (target) {
      this.logActivity('DELETE_HOSTING', 'HOSTING', id, { website_url: target.website_url });
    }
    return true;
  }

  // --- VPS ---
  getVPS(): VPSAsset[] {
    return this.get<VPSAsset[]>(STORAGE_KEYS.VPS, INITIAL_VPS);
  }

  saveVPS(vps: Omit<VPSAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }): VPSAsset {
    const list = this.getVPS();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    if (vps.id) {
      const index = list.findIndex((v) => v.id === vps.id);
      if (index >= 0) {
        const updated: VPSAsset = {
          ...list[index],
          ...vps,
          updated_at: now,
        };
        list[index] = updated;
        this.set(STORAGE_KEYS.VPS, list);
        this.logActivity('UPDATE_VPS', 'VPS', vps.id, { server_name: vps.server_name });
        return updated;
      }
    }

    const newVPS: VPSAsset = {
      ...vps,
      id: `vps-${Date.now()}`,
      created_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };
    list.unshift(newVPS);
    this.set(STORAGE_KEYS.VPS, list);
    this.logActivity('CREATE_VPS', 'VPS', newVPS.id, { server_name: newVPS.server_name });
    this.runExpiryCheck();
    return newVPS;
  }

  deleteVPS(id: string): boolean {
    const list = this.getVPS();
    const target = list.find((v) => v.id === id);
    const filtered = list.filter((v) => v.id !== id);
    this.set(STORAGE_KEYS.VPS, filtered);
    if (target) {
      this.logActivity('DELETE_VPS', 'VPS', id, { server_name: target.server_name });
    }
    return true;
  }

  // --- Renewal Process & Payment Record ---
  recordRenewal(params: {
    assetType: 'domain' | 'hosting' | 'vps';
    assetId: string;
    newExpiryDate: string;
    cost: number;
    paymentMethod: string;
    invoiceNumber?: string;
    notes?: string;
  }): RenewalRecord {
    const currentUser = this.getCurrentUser();
    let assetName = 'Asset';
    let previousExpiry = new Date().toISOString().split('T')[0];

    if (params.assetType === 'domain') {
      const domains = this.getDomains();
      const dom = domains.find((d) => d.id === params.assetId);
      if (dom) {
        assetName = dom.domain_name;
        previousExpiry = dom.expiry_date;
        dom.expiry_date = params.newExpiryDate;
        dom.status = 'active';
        this.set(STORAGE_KEYS.DOMAINS, domains);
      }
    } else if (params.assetType === 'hosting') {
      const hostings = this.getHostings();
      const h = hostings.find((x) => x.id === params.assetId);
      if (h) {
        assetName = h.website_url;
        previousExpiry = h.expiry_date;
        h.expiry_date = params.newExpiryDate;
        h.status = 'active';
        this.set(STORAGE_KEYS.HOSTINGS, hostings);
      }
    } else if (params.assetType === 'vps') {
      const servers = this.getVPS();
      const s = servers.find((x) => x.id === params.assetId);
      if (s) {
        assetName = s.server_name;
        previousExpiry = s.expiry_date;
        s.expiry_date = params.newExpiryDate;
        s.status = 'active';
        this.set(STORAGE_KEYS.VPS, servers);
      }
    }

    const newRecord: RenewalRecord = {
      id: `ren-${Date.now()}`,
      asset_type: params.assetType,
      asset_id: params.assetId,
      asset_name: assetName,
      amount: params.cost,
      currency: 'INR',
      payment_date: new Date().toISOString().split('T')[0],
      previous_expiry_date: previousExpiry,
      new_expiry_date: params.newExpiryDate,
      payment_method: params.paymentMethod,
      invoice_number: params.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      renewed_by: currentUser.full_name,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    const history = this.getRenewalHistory();
    history.unshift(newRecord);
    this.set(STORAGE_KEYS.HISTORY, history);

    this.logActivity('RECORD_RENEWAL', params.assetType.toUpperCase(), params.assetId, {
      asset_name: assetName,
      amount: params.cost,
      new_expiry: params.newExpiryDate,
    });

    return newRecord;
  }

  getRenewalHistory(): RenewalRecord[] {
    return this.get<RenewalRecord[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
  }

  // --- Notification Settings & Configurable Cadences ---
  getNotificationSettings() {
    return this.get(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
      cadences: DEFAULT_CADENCES,
      enable_windows_notifications: true,
      enable_email_alerts: true,
      enable_push_notifications: true,
      smtp: DEFAULT_SMTP,
    });
  }

  saveNotificationSettings(settings: any) {
    this.set(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
    this.logActivity('UPDATE_SETTINGS', 'SYSTEM', undefined, { updated: 'Notification Cadence & Windows Push' });
    this.runExpiryCheck();
  }

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, is_read: true } : n));
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, is_read: true }));
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  clearNotifications(): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  // --- Daily Expiry Automated Check (30, 15, 7, 3, 1 day & expired) ---
  runExpiryCheck(): { addedCount: number; checkedAssets: number } {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const domains = this.getDomains();
    const hostings = this.getHostings();
    const vps = this.getVPS();
    const currentNotifs = this.getNotifications();

    let addedCount = 0;
    const allAssets: Array<{
      type: 'domain' | 'hosting' | 'vps';
      id: string;
      name: string;
      expiry_date: string;
      cost: number;
    }> = [
      ...domains.map((d) => ({ type: 'domain' as const, id: d.id, name: d.domain_name, expiry_date: d.expiry_date, cost: d.renewal_cost })),
      ...hostings.map((h) => ({ type: 'hosting' as const, id: h.id, name: h.website_url, expiry_date: h.expiry_date, cost: h.renewal_cost })),
      ...vps.map((v) => ({ type: 'vps' as const, id: v.id, name: v.server_name, expiry_date: v.expiry_date, cost: v.renewal_cost })),
    ];

    const settings = this.getNotificationSettings();
    const activeIntervals = (settings.cadences || DEFAULT_CADENCES)
      .filter((c: any) => c.enabled)
      .map((c: any) => c.days_before);

    for (const asset of allAssets) {
      const expDate = new Date(asset.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Match configured interval threshold
      const matched = activeIntervals.find((i: number) => i === diffDays || (diffDays < 0 && i === 0));

      if (matched !== undefined) {
        const reminderType =
          diffDays <= 0 ? 'expired' :
          diffDays === 1 ? '1_day' :
          diffDays === 3 ? '3_days' :
          diffDays === 7 ? '7_days' :
          diffDays === 15 ? '15_days' :
          diffDays === 30 ? '30_days' : `${diffDays}_days`;

        // Check duplicate prevention: Do not add if already notified for this asset & reminderType
        const alreadyExists = currentNotifs.some(
          (n) => n.asset_id === asset.id && n.reminder_type === reminderType
        );

        if (!alreadyExists) {
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            asset_type: asset.type,
            asset_id: asset.id,
            asset_name: asset.name,
            recipient_email: 'admin@codeyogi.org',
            reminder_type: reminderType,
            days_until_expiry: diffDays,
            title: `${asset.type.toUpperCase()} Expiry Alert: ${asset.name}`,
            message: diffDays <= 0 
              ? `${asset.name} has expired on ${asset.expiry_date}. Immediate renewal required!`
              : `${asset.name} will expire in ${diffDays} day(s). Expected renewal cost: ?${asset.cost.toFixed(2)}.`,
            sent_via_email: true,
            is_read: false,
            created_at: new Date().toISOString(),
          };

          currentNotifs.unshift(newNotif);
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, currentNotifs);
      this.logActivity('AUTOMATED_CRON_CHECK', 'SYSTEM', undefined, {
        checked: allAssets.length,
        reminders_triggered: addedCount,
      });
    }

    return { addedCount, checkedAssets: allAssets.length };
  }

  // --- Activity Logs ---
  getActivityLogs(): ActivityLog[] {
    return this.get<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, INITIAL_LOGS);
  }

  logActivity(action: string, entity_type: string, entity_id?: string, details: Record<string, any> = {}): void {
    const currentUser = this.getCurrentUser();
    const logs = this.getActivityLogs();
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name || 'System Worker',
      user_email: currentUser?.email || 'admin@codeyogi.org',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(log);
    // keep latest 200 logs
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.ACTIVITY, logs);
  }

  // --- Real Dynamic Dashboard Stats (Never Hardcoded) ---
  getDashboardStats(): DashboardStats {
    const domains = this.getDomains();
    const hostings = this.getHostings();
    const vps = this.getVPS();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allAssets = [
      ...domains.map((d) => ({ id: d.id, type: 'domain' as const, name: d.domain_name, expiry_date: d.expiry_date, cost: d.renewal_cost, status: d.status, cycle: d.billing_cycle })),
      ...hostings.map((h) => ({ id: h.id, type: 'hosting' as const, name: h.website_url, expiry_date: h.expiry_date, cost: h.renewal_cost, status: h.status, cycle: h.billing_cycle })),
      ...vps.map((v) => ({ id: v.id, type: 'vps' as const, name: v.server_name, expiry_date: v.expiry_date, cost: v.renewal_cost, status: v.status, cycle: v.billing_cycle })),
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

      // Calculate expense normalized to annual & monthly
      const cost = Number(asset.cost) || 0;
      if (asset.cycle === 'monthly') {
        totalMonthlyExpense += cost;
        totalAnnualExpense += cost * 12;
      } else if (asset.cycle === 'quarterly') {
        totalMonthlyExpense += cost / 3;
        totalAnnualExpense += cost * 4;
      } else {
        // annual
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

    // sort upcoming by daysLeft ascending
    upcomingRenewals.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      totalAssets: allAssets.length,
      activeSubscriptions,
      expiringIn30Days,
      expiredAssets,
      totalMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
      totalAnnualExpense: Math.round(totalAnnualExpense * 100) / 100,
      domainsCount: domains.length,
      hostingsCount: hostings.length,
      vpsCount: vps.length,
      upcomingRenewals: upcomingRenewals.slice(0, 10),
    };
  }

  // Reset to sample initial state
  resetData(): void {
    this.set(STORAGE_KEYS.DOMAINS, INITIAL_DOMAINS);
    this.set(STORAGE_KEYS.HOSTINGS, INITIAL_HOSTINGS);
    this.set(STORAGE_KEYS.VPS, INITIAL_VPS);
    this.set(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    this.set(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.set(STORAGE_KEYS.ACTIVITY, INITIAL_LOGS);
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }
}

export const storage = new StorageService();

