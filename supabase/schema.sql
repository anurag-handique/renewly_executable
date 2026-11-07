-- ====================================================================
-- RENEWLY: Complete Production PostgreSQL Schema & Native Automations
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing triggers & tables if you want a clean reset (optional)
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.renewal_history CASCADE;
-- DROP TABLE IF EXISTS public.vps_servers CASCADE;
-- DROP TABLE IF EXISTS public.hostings CASCADE;
-- DROP TABLE IF EXISTS public.domains CASCADE;
-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. PROFILES TABLE (Single Admin: info@thecodeyogi.com)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Administrator',
    role TEXT NOT NULL DEFAULT 'admin',
    department TEXT DEFAULT 'Infrastructure & DevOps',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert / Ensure info@thecodeyogi.com exists
INSERT INTO public.profiles (email, full_name, role, department)
VALUES ('info@thecodeyogi.com', 'CodeYogi Super Admin', 'admin', 'DevOps & IT')
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', full_name = 'CodeYogi Super Admin';

-- 4. DOMAINS TABLE
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_name TEXT NOT NULL UNIQUE,
    registrar TEXT NOT NULL,
    dns_provider TEXT NOT NULL,
    registration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    billing_cycle TEXT DEFAULT 'annual' NOT NULL,
    auto_renewal BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. WEBSITE HOSTINGS TABLE
CREATE TABLE IF NOT EXISTS public.hostings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_url TEXT NOT NULL,
    hosting_provider TEXT NOT NULL,
    hosting_plan TEXT NOT NULL,
    server_location TEXT,
    subscription_start DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    billing_cycle TEXT DEFAULT 'annual' NOT NULL,
    auto_renewal BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    ssl_status BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. VPS SERVERS TABLE
CREATE TABLE IF NOT EXISTS public.vps_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    ipv6_address TEXT,
    operating_system TEXT NOT NULL,
    cpu_cores INT NOT NULL DEFAULT 2,
    ram_gb NUMERIC(6, 2) NOT NULL DEFAULT 4,
    storage_gb NUMERIC(8, 2) NOT NULL DEFAULT 80,
    storage_type TEXT DEFAULT 'NVMe SSD',
    datacenter_region TEXT,
    subscription_start DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
    auto_renewal BOOLEAN DEFAULT FALSE NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    ssh_port INT DEFAULT 22,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. RENEWAL HISTORY & PAYMENTS
CREATE TABLE IF NOT EXISTS public.renewal_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('domain', 'hosting', 'vps')),
    asset_id UUID NOT NULL,
    asset_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    previous_expiry_date DATE NOT NULL,
    new_expiry_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    invoice_number TEXT,
    invoice_url TEXT,
    status TEXT DEFAULT 'completed' NOT NULL,
    renewed_by TEXT DEFAULT 'info@thecodeyogi.com',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. NOTIFICATIONS TABLE (Native Trigger Auto-Generation & Duplicate Prevention)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('domain', 'hosting', 'vps')),
    asset_id UUID NOT NULL,
    asset_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL DEFAULT 'info@thecodeyogi.com',
    reminder_type TEXT NOT NULL,
    days_until_expiry INT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_via_email BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_asset_reminder UNIQUE (asset_id, reminder_type)
);

-- 8B. CONFIGURABLE NOTIFICATION SETTINGS & SMTP
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings-global-v1',
    cadences JSONB NOT NULL DEFAULT '[
      {"days_before": 30, "label": "1 Month Before", "enabled": true},
      {"days_before": 15, "label": "15 Days Before", "enabled": true},
      {"days_before": 7, "label": "1 Week Before", "enabled": true},
      {"days_before": 3, "label": "3 Days Before", "enabled": true},
      {"days_before": 1, "label": "1 Day Before", "enabled": true},
      {"days_before": 0, "label": "Day of Expiry & Expired", "enabled": true}
    ]'::jsonb,
    enable_windows_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    enable_email_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    enable_push_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    smtp JSONB NOT NULL DEFAULT '{
      "host": "smtp.gmail.com",
      "port": 587,
      "user": "anurag.h@thecodeyogi.com",
      "pass": "lutdfsixlzvvjzmu",
      "from": "Renewly Alerts <anurag.h@thecodeyogi.com>",
      "secure": false
    }'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure default settings row exists with SMTP configuration
INSERT INTO public.notification_settings (id, enable_windows_notifications, enable_email_alerts, enable_push_notifications, smtp)
VALUES (
  'settings-global-v1', 
  TRUE, 
  TRUE, 
  TRUE, 
  '{
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "anurag.h@thecodeyogi.com",
    "pass": "lutdfsixlzvvjzmu",
    "from": "Renewly Alerts <anurag.h@thecodeyogi.com>",
    "secure": false
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  smtp = EXCLUDED.smtp,
  updated_at = NOW();

-- 9. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT DEFAULT 'info@thecodeyogi.com',
    user_name TEXT DEFAULT 'Administrator',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. INDEXES FOR LIGHTNING FAST QUERIES
CREATE INDEX IF NOT EXISTS idx_domains_expiry ON public.domains (expiry_date);
CREATE INDEX IF NOT EXISTS idx_hostings_expiry ON public.hostings (expiry_date);
CREATE INDEX IF NOT EXISTS idx_vps_expiry ON public.vps_servers (expiry_date);
CREATE INDEX IF NOT EXISTS idx_history_date ON public.renewal_history (payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_unread ON public.notifications (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs (created_at DESC);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- Giving full access to authenticated / anon with anon key for this deployment
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vps_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on domains" ON public.domains FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on hostings" ON public.hostings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on vps_servers" ON public.vps_servers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on renewal_history" ON public.renewal_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notification_settings" ON public.notification_settings FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 12. NATIVE SUPABASE TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- Whenever any domain, hosting, or VPS is inserted or updated,
-- this native trigger function calculates the days left and automatically
-- generates the corresponding notification if within 30, 15, 7, 3, or 1 days or expired!
-- ====================================================================

CREATE OR REPLACE FUNCTION public.generate_asset_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_days_left INT;
    v_asset_type TEXT;
    v_asset_name TEXT;
    v_cost NUMERIC(10,2);
    v_reminder_type TEXT;
    v_title TEXT;
    v_message TEXT;
BEGIN
    v_days_left := (NEW.expiry_date - CURRENT_DATE);
    v_cost := NEW.renewal_cost;

    IF TG_TABLE_NAME = 'domains' THEN
        v_asset_type := 'domain';
        v_asset_name := NEW.domain_name;
    ELSIF TG_TABLE_NAME = 'hostings' THEN
        v_asset_type := 'hosting';
        v_asset_name := NEW.website_url;
    ELSE
        v_asset_type := 'vps';
        v_asset_name := NEW.server_name;
    END IF;

    -- Check intervals
    IF v_days_left <= 0 THEN
        v_reminder_type := 'expired';
        v_title := 'EXPIRED: ' || v_asset_name;
        v_message := v_asset_name || ' has reached expiration date (' || NEW.expiry_date || '). Immediate renewal required to prevent downtime.';
    ELSIF v_days_left <= 1 THEN
        v_reminder_type := '1_day';
        v_title := '1 Day Left: ' || v_asset_name;
        v_message := v_asset_name || ' expires tomorrow! Scheduled renewal cost: '?' || v_cost;
    ELSIF v_days_left <= 3 THEN
        v_reminder_type := '3_days';
        v_title := '3 Days Left: ' || v_asset_name;
        v_message := v_asset_name || ' expires in 3 days. Estimated renewal: '?' || v_cost;
    ELSIF v_days_left <= 7 THEN
        v_reminder_type := '7_days';
        v_title := '7 Days Left: ' || v_asset_name;
        v_message := v_asset_name || ' will expire in 7 days. Action required.';
    ELSIF v_days_left <= 15 THEN
        v_reminder_type := '15_days';
        v_title := '15 Days Notice: ' || v_asset_name;
        v_message := v_asset_name || ' is due for renewal in 15 days.';
    ELSIF v_days_left <= 30 THEN
        v_reminder_type := '30_days';
        v_title := '30 Days Advance Notice: ' || v_asset_name;
        v_message := v_asset_name || ' expires on ' || NEW.expiry_date || '.';
    ELSE
        RETURN NEW;
    END IF;

    -- Insert or update notification natively
    INSERT INTO public.notifications (
        asset_type,
        asset_id,
        asset_name,
        recipient_email,
        reminder_type,
        days_until_expiry,
        title,
        message,
        sent_via_email,
        is_read
    )
    VALUES (
        v_asset_type,
        NEW.id,
        v_asset_name,
        'info@thecodeyogi.com',
        v_reminder_type,
        v_days_left,
        v_title,
        v_message,
        TRUE,
        FALSE
    )
    ON CONFLICT (asset_id, reminder_type)
    DO UPDATE SET
        days_until_expiry = EXCLUDED.days_until_expiry,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        created_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop previous triggers if any
DROP TRIGGER IF EXISTS trg_domains_notification ON public.domains;
DROP TRIGGER IF EXISTS trg_hostings_notification ON public.hostings;
DROP TRIGGER IF EXISTS trg_vps_notification ON public.vps_servers;

-- Create triggers on Insert & Update
CREATE TRIGGER trg_domains_notification
AFTER INSERT OR UPDATE OF expiry_date, renewal_cost ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.generate_asset_notification_trigger();

CREATE TRIGGER trg_hostings_notification
AFTER INSERT OR UPDATE OF expiry_date, renewal_cost ON public.hostings
FOR EACH ROW EXECUTE FUNCTION public.generate_asset_notification_trigger();

CREATE TRIGGER trg_vps_notification
AFTER INSERT OR UPDATE OF expiry_date, renewal_cost ON public.vps_servers
FOR EACH ROW EXECUTE FUNCTION public.generate_asset_notification_trigger();

-- ====================================================================
-- 13. SCHEDULED SYSTEM PROCEDURE FOR DAILY SWEEPS
-- Can also be invoked manually or via pg_cron:
-- SELECT cron.schedule('daily-expiry-sweep', '0 0 * * *', 'SELECT public.run_daily_expiry_check();');
-- ====================================================================

CREATE OR REPLACE FUNCTION public.run_daily_expiry_check()
RETURNS jsonb AS $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    FOR r IN SELECT id, domain_name, expiry_date, renewal_cost FROM public.domains LOOP
        -- Trigger notification logic by touch update
        UPDATE public.domains SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    FOR r IN SELECT id, website_url, expiry_date, renewal_cost FROM public.hostings LOOP
        UPDATE public.hostings SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    FOR r IN SELECT id, server_name, expiry_date, renewal_cost FROM public.vps_servers LOOP
        UPDATE public.vps_servers SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    INSERT INTO public.activity_logs (user_email, user_name, action, entity_type, details)
    VALUES ('info@thecodeyogi.com', 'System Native Trigger', 'DAILY_EXPIRY_SWEEP', 'SYSTEM', jsonb_build_object('assets_checked', v_count));

    RETURN jsonb_build_object('success', true, 'assets_checked', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. SEED DATA TO START WITH (Matching CodeYogi Infrastructure)
INSERT INTO public.domains (id, domain_name, registrar, dns_provider, registration_date, expiry_date, renewal_cost, currency, billing_cycle, auto_renewal, status, tags, notes)
VALUES 
  ('a1b2c3d4-0001-4000-8000-000000000001', 'thecodeyogi.com', 'Cloudflare Registrar', 'Cloudflare DNS', '2023-01-15', '2027-01-15', 14.50, 'INR', 'annual', true, 'active', ARRAY['Production', 'Primary'], 'Primary corporate domain'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'codeyogi.org', 'Namecheap', 'Cloudflare DNS', '2022-04-10', '2026-11-20', 16.00, 'INR', 'annual', false, 'active', ARRAY['LMS', 'Students'], 'Student academy learning portal'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'codeyogi-staging.net', 'Porkbun', 'Cloudflare', '2023-10-15', '2026-10-15', 11.20, 'INR', 'annual', false, 'expired', ARRAY['QA', 'Staging'], 'Expired staging domain in grace period')
ON CONFLICT (domain_name) DO NOTHING;

INSERT INTO public.hostings (id, website_url, hosting_provider, hosting_plan, server_location, subscription_start, expiry_date, renewal_cost, currency, billing_cycle, auto_renewal, status, ssl_status, notes)
VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'https://thecodeyogi.com', 'Vercel Pro', 'Team Enterprise Plan', 'Washington D.C. (iad1)', '2023-01-01', '2027-01-01', 240.00, 'INR', 'annual', true, 'active', true, 'High traffic production frontend deployment'),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'https://learn.thecodeyogi.com', 'AWS Elastic Beanstalk', 'High-Concurrency Cluster', 'Mumbai (ap-south-1)', '2024-05-15', '2026-11-14', 155.00, 'INR', 'monthly', false, 'active', true, 'Student LMS backend API cluster')
ON CONFLICT DO NOTHING;

INSERT INTO public.vps_servers (id, server_name, provider, ip_address, ipv6_address, operating_system, cpu_cores, ram_gb, storage_gb, storage_type, datacenter_region, subscription_start, expiry_date, renewal_cost, currency, billing_cycle, auto_renewal, status, ssh_port, notes)
VALUES
  ('c1b2c3d4-0001-4000-8000-000000000001', 'prod-api-cluster-01', 'Hetzner Cloud', '159.69.88.14', '2a01:4f8:1c1c:1e::1', 'Ubuntu 24.04 LTS', 8, 32, 240, 'NVMe SSD', 'Falkenstein (fsn1)', '2024-01-10', '2027-01-10', 48.00, 'INR', 'monthly', true, 'active', 2222, 'Main API Docker swarm node'),
  ('c1b2c3d4-0002-4000-8000-000000000002', 'ci-build-runner', 'DigitalOcean Droplet', '167.99.145.202', '', 'Debian 12 Bookworm', 4, 8, 160, 'NVMe SSD', 'Bangalore (BLR1)', '2025-10-09', '2026-11-08', 48.00, 'INR', 'monthly', false, 'active', 22, 'CI/CD pipeline test runner')
ON CONFLICT DO NOTHING;

INSERT INTO public.renewal_history (asset_type, asset_id, asset_name, amount, currency, payment_date, previous_expiry_date, new_expiry_date, payment_method, invoice_number, status, renewed_by, notes)
VALUES
  ('domain', 'a1b2c3d4-0001-4000-8000-000000000001', 'thecodeyogi.com', 14.50, 'INR', '2026-01-15', '2026-01-15', '2027-01-15', 'Corporate Visa Card (ends 4821)', 'INV-CF-2026-001', 'completed', 'info@thecodeyogi.com', '1-Year auto renewal processed successfully')
ON CONFLICT DO NOTHING;

-- Trigger notification generation for the seeded rows
SELECT public.run_daily_expiry_check();
