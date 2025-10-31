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
      .select("id,email,cognitive_profile")
      .not("email", "is", null);

    let emailsSent = 0;

    for (const p of profiles ?? []) {
      const prefs = (p.cognitive_profile ?? {}) as any;
      if (prefs?.report_prefs?.daily_email !== true) continue;

      // Get attempts from last 24 hours
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const { data: attempts } = await supabase
        .from("attempts")
        .select("correct,time_taken_ms")
        .eq("user_id", p.id)
        .gte("created_at", since.toISOString());

      const total = attempts?.length ?? 0;
      const correct = attempts?.filter((a) => a.correct).length ?? 0;
      const acc = total ? Math.round((correct / total) * 100) : 0;
      const avgMs = total
        ? Math.round(
            attempts!.reduce((s, a) => s + (a.time_taken_ms || 0), 0) / total
          )
        : 0;

      // Get latest features (ECE, anchor metrics)
      const { data: features } = await supabase
        .from("feature_user_exam_daily")
        .select("ece_0_1,anchor_score_mean,anchor_score_std,exam_id")
        .eq("user_id", p.id)
        .order("snapshot_date", { ascending: false })
        .limit(1);

      const f = features?.[0];

      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Abhyas AI — Daily Summary</h2>
            <p><strong>Attempts today:</strong> ${total}</p>
            <p><strong>Accuracy:</strong> ${acc}% | <strong>Avg time:</strong> ${Math.round(avgMs / 1000)}s</p>
            <p><strong>ECE:</strong> ${f?.ece_0_1?.toFixed(3) ?? "—"} | <strong>Anchor σ:</strong> ${f?.anchor_score_std?.toFixed(2) ?? "—"}</p>
            <p><a href="${APP_URL}/dashboard" style="color: #2563eb;">Open Dashboard</a></p>
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
            subject: "Your Daily Progress Summary",
            html,
          }),
        });
        
        if (resp.ok) emailsSent++;
        console.log(`Daily summary sent to ${p.email}: ${resp.status}`);
      } else {
        console.log("[DRY-RUN] Daily email to", p.email);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-daily-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
