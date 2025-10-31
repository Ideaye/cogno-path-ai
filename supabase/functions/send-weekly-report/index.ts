// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const APP_URL = Deno.env.get("APP_URL") ?? "https://abhyas.ai";

    // Get all profiles with email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,name,cognitive_profile")
      .not("email", "is", null);

    let emailsSent = 0;

    for (const p of profiles ?? []) {
      const prefs = (p.cognitive_profile ?? {}) as any;
      if (prefs?.report_prefs?.weekly_pdf !== true) continue;

      // Get latest weekly report
      const { data: rep } = await supabase
        .from("calibration_reports")
        .select("storage_path,created_at")
        .eq("user_id", p.id)
        .eq("report_type", "weekly")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!rep) {
        console.log(`No weekly report found for ${p.email}`);
        continue;
      }

      // Create signed URL (3 days expiry)
      const { data: signed } = await supabase.storage
        .from("reports")
        .createSignedUrl(rep.storage_path, 60 * 60 * 24 * 3);

      if (!signed?.signedUrl) {
        console.log(`Failed to create signed URL for ${p.email}`);
        continue;
      }

      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Your Weekly Report is Ready</h2>
            <p>Hi ${p.name || 'there'},</p>
            <p>Your weekly performance report for Abhyas AI is now available.</p>
            <p>
              <a href="${signed.signedUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Download PDF Report
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              This link expires in 3 days. You can also access your reports from the 
              <a href="${APP_URL}/dashboard" style="color: #2563eb;">dashboard</a>.
            </p>
          </body>
        </html>
      `;

      if (RESEND_API_KEY) {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Abhyas AI <reports@abhyas.ai>",
            to: p.email,
            subject: "Your Weekly Report",
            html,
          }),
        });

        if (resp.ok) emailsSent++;
        console.log(`Weekly report email sent to ${p.email}: ${resp.status}`);
      } else {
        console.log("[DRY-RUN] Weekly email to", p.email, signed.signedUrl);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-weekly-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
