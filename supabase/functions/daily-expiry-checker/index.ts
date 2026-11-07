// Supabase Edge Function: Expiry Sweep & Dynamic SMTP Dispatcher
// Deployment path: supabase/functions/daily-expiry-checker/index.ts
// Supports both automated cron sweeps and explicit test_or_resend requests with dynamic CC recipients

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let bodyData: any = {};
    if (req.method === "POST") {
      try {
        bodyData = await req.json();
      } catch (_) {}
    }

    // 1. Fetch dynamic notification settings & SMTP credentials from database
    const { data: settingsRow } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

    const smtpConfig = settingsRow?.smtp || {
      host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT")) || 465,
      user: Deno.env.get("SMTP_USER") || "anurag.h@thecodeyogi.com",
      pass: Deno.env.get("SMTP_PASS") || "lutdfsixlzvvjzmu",
      from: Deno.env.get("SMTP_FROM") || "Renewly Alerts <anurag.h@thecodeyogi.com>",
      recipient_to: "anurag.h@thecodeyogi.com",
      recipient_cc: "info@thecodeyogi.com",
    };

    // 2. Initialize Denomailer SMTP client with TLS port 465 (required for Supabase Edge Runtime)
    let client: SMTPClient | null = null;
    try {
      client = new SMTPClient({
        connection: {
          hostname: smtpConfig.host,
          port: 465,
          tls: true,
          auth: {
            username: smtpConfig.user.replace(/\s+/g, ""),
            password: smtpConfig.pass.replace(/\s+/g, ""),
          },
        },
      });
    } catch (e) {
      console.error("Failed to initialize SMTP client:", e);
    }

    // Parse CC list into array
    const parseEmails = (str: string | undefined): string[] => {
      if (!str) return [];
      return str
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes("@"));
    };

    // MODE A: Explicit Test Email or Resend Single Notification
    if (bodyData.mode === "test_or_resend") {
      const recipientTo = bodyData.recipientTo || smtpConfig.recipient_to || "anurag.h@thecodeyogi.com";
      const ccList = parseEmails(bodyData.recipientCc || smtpConfig.recipient_cc);
      const subject = bodyData.subject || "[Renewly Test] Email Dispatch Verification";
      const message = bodyData.message || "This is a verified test email sent via Renewly SMTP configuration.";

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4338ca; margin: 0 0 12px 0;">Renewly Alert Dispatch</h2>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600;">${subject}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155; line-height: 1.5;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            <strong>Delivered To:</strong> ${recipientTo} ${ccList.length > 0 ? `<br /><strong>CC:</strong> ${ccList.join(", ")}` : ""}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <div style="font-size: 11px; color: #94a3b8; text-align: center;">
            Sent by Renewly Mail Relay &bull; CodeYogi Infrastructure Systems
          </div>
        </div>
      `;

      if (client) {
        await client.send({
          from: smtpConfig.from,
          to: recipientTo,
          cc: ccList.length > 0 ? ccList : undefined,
          subject,
          content: message,
          html: htmlContent,
        });
        await client.close();
      }

      if (bodyData.notificationId) {
        await supabase
          .from("notifications")
          .update({ sent_via_email: true })
          .eq("id", bodyData.notificationId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          recipientTo,
          ccList,
          message: `Dispatched to ${recipientTo}${ccList.length > 0 ? ` (CC: ${ccList.join(", ")})` : ""}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // MODE B: Daily Scheduled Sweep Execution
    const { data: sweepResult, error: rpcError } = await supabase.rpc("run_daily_expiry_check");
    if (rpcError) {
      console.error("RPC Error:", rpcError);
    }

    const { data: unsentNotifications, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("sent_via_email", false)
      .limit(50);

    if (fetchErr) {
      throw fetchErr;
    }

    const emailResults = [];
    const configuredTo = smtpConfig.recipient_to || "anurag.h@thecodeyogi.com";
    const configuredCc = parseEmails(smtpConfig.recipient_cc);

    for (const notif of (unsentNotifications || [])) {
      const recipient = configuredTo;
      const subject = `[Renewly Alert] ${notif.title}`;
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4338ca; margin: 0;">Renewly Expiry Reminder</h2>
          <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; border-left: 4px solid ${notif.days_until_expiry <= 3 ? '#ef4444' : '#f59e0b'}; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a; font-weight: 600;">${notif.title}</p>
            <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5;">${notif.message}</p>
            <p style="margin: 12px 0 0 0; font-weight: 700; color: ${notif.days_until_expiry <= 3 ? '#b91c1c' : '#b45309'}; font-size: 13px;">
              Days remaining: ${notif.days_until_expiry} day(s)
            </p>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            <strong>Recipient:</strong> ${recipient} ${configuredCc.length > 0 ? `<br /><strong>CC:</strong> ${configuredCc.join(", ")}` : ""}
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <div style="font-size: 11px; color: #94a3b8; text-align: center;">
            Sent by Renewly SMTP Service &bull; Account: ${smtpConfig.user} &bull; CodeYogi IT Operations
          </div>
        </div>
      `;

      if (client) {
        try {
          await client.send({
            from: smtpConfig.from,
            to: recipient,
            cc: configuredCc.length > 0 ? configuredCc : undefined,
            subject,
            content: notif.message,
            html: htmlContent,
          });

          await supabase
            .from("notifications")
            .update({ sent_via_email: true })
            .eq("id", notif.id);

          emailResults.push({ id: notif.id, recipient, status: "sent_via_smtp" });
        } catch (mailErr) {
          console.error(`SMTP delivery failed for notification ${notif.id}:`, mailErr);
          emailResults.push({ id: notif.id, recipient, status: "smtp_error", error: String(mailErr) });
        }
      }
    }

    if (client) {
      try {
        await client.close();
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        success: true,
        sweepResult,
        processed: emailResults.length,
        results: emailResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
