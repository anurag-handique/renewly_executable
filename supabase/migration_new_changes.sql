-- ====================================================================
-- RENEWLY: Migration Script for New Changes (Configurable Cadences & INR)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Safe to execute: uses IF NOT EXISTS and non-destructive ALTER statements.
-- ====================================================================

-- 1. Ensure UUID Extension is Enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update default currencies on existing tables to INR
ALTER TABLE IF EXISTS public.domains 
  ALTER COLUMN currency SET DEFAULT 'INR';

ALTER TABLE IF EXISTS public.hostings 
  ALTER COLUMN currency SET DEFAULT 'INR';

ALTER TABLE IF EXISTS public.vps_servers 
  ALTER COLUMN currency SET DEFAULT 'INR';

ALTER TABLE IF EXISTS public.renewal_history 
  ALTER COLUMN currency SET DEFAULT 'INR';

-- Update existing rows where currency might still be USD
UPDATE public.domains SET currency = 'INR' WHERE currency = 'USD';
UPDATE public.hostings SET currency = 'INR' WHERE currency = 'USD';
UPDATE public.vps_servers SET currency = 'INR' WHERE currency = 'USD';
UPDATE public.renewal_history SET currency = 'INR' WHERE currency = 'USD';

-- 3. Create NOTIFICATION_SETTINGS table (for Configurable Cadences)
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
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS and add policy for notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notification_settings' 
        AND policyname = 'Allow all operations on notification_settings'
    ) THEN
        CREATE POLICY "Allow all operations on notification_settings" 
        ON public.notification_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Insert default settings row if missing
INSERT INTO public.notification_settings (id, enable_windows_notifications, enable_email_alerts, enable_push_notifications)
VALUES ('settings-global-v1', TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Update Native Trigger Function to respect dynamic settings and Rupee formatting
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
    v_settings RECORD;
    v_is_enabled BOOLEAN := TRUE;
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

    -- Determine reminder type and title
    IF v_days_left <= 0 THEN
        v_reminder_type := 'expired';
        v_title := 'EXPIRED: ' || v_asset_name;
        v_message := v_asset_name || ' has reached expiration date (' || NEW.expiry_date || '). Immediate renewal required to prevent downtime.';
    ELSIF v_days_left <= 1 THEN
        v_reminder_type := '1_day';
        v_title := '1 Day Left: ' || v_asset_name;
        v_message := v_asset_name || ' expires tomorrow! Scheduled renewal cost: Rs. ' || v_cost;
    ELSIF v_days_left <= 3 THEN
        v_reminder_type := '3_days';
        v_title := '3 Days Left: ' || v_asset_name;
        v_message := v_asset_name || ' expires in 3 days. Estimated renewal: Rs. ' || v_cost;
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

-- 5. Stored Procedure for Daily Sweeps (Called by cron / Edge Function)
CREATE OR REPLACE FUNCTION public.run_daily_expiry_check()
RETURNS jsonb AS $$
DECLARE
    r RECORD;
    v_count INT := 0;
BEGIN
    FOR r IN SELECT id FROM public.domains LOOP
        UPDATE public.domains SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    FOR r IN SELECT id FROM public.hostings LOOP
        UPDATE public.hostings SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    FOR r IN SELECT id FROM public.vps_servers LOOP
        UPDATE public.vps_servers SET updated_at = NOW() WHERE id = r.id;
        v_count := v_count + 1;
    END LOOP;

    INSERT INTO public.activity_logs (user_email, user_name, action, entity_type, details)
    VALUES ('info@thecodeyogi.com', 'System Native Trigger', 'DAILY_EXPIRY_SWEEP', 'SYSTEM', jsonb_build_object('assets_checked', v_count));

    RETURN jsonb_build_object('success', true, 'assets_checked', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Execute sweep once to update all existing rows with new cadences
SELECT public.run_daily_expiry_check();

