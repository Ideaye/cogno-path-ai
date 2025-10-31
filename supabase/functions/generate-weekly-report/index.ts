import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    const { user_id } = (await req.json().catch(() => ({}))) as { user_id?: string };
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get last 7 days attempts
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: attempts } = await supabase
      .from("attempts")
      .select("created_at,correct,time_taken_ms")
      .eq("user_id", user_id)
      .gte("created_at", since.toISOString());

    const total = attempts?.length ?? 0;
    const correct = attempts?.filter((a) => a.correct).length ?? 0;
    const acc = total ? Math.round((correct / total) * 100) : 0;

    // Get CDNA metrics
    const { data: features } = await supabase
      .from("feature_user_exam_daily")
      .select("ece_0_1,anchor_score_mean,anchor_score_std,calibration_progress_0_1")
      .eq("user_id", user_id)
      .order("snapshot_date", { ascending: false })
      .limit(1);

    const f = features?.[0];

    // Create PDF
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    page.setFont(boldFont);
    page.setFontSize(18);
    page.drawText("Abhyas AI — Weekly Report", { x: 50, y: 740 });

    page.setFont(font);
    page.setFontSize(12);
    let y = 700;

    page.drawText(`Report Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
    y -= 30;

    page.setFont(boldFont);
    page.drawText("Practice Summary (Last 7 Days)", { x: 50, y });
    y -= 20;

    page.setFont(font);
    page.drawText(`Total Attempts: ${total}`, { x: 50, y });
    y -= 20;
    page.drawText(`Correct: ${correct} (${acc}%)`, { x: 50, y });
    y -= 30;

    if (f) {
      page.setFont(boldFont);
      page.drawText("CDNA Metrics", { x: 50, y });
      y -= 20;

      page.setFont(font);
      page.drawText(`ECE: ${f.ece_0_1?.toFixed(3) ?? "—"}`, { x: 50, y });
      y -= 20;
      page.drawText(`Anchor Mean: ${f.anchor_score_mean?.toFixed(2) ?? "—"}`, { x: 50, y });
      y -= 20;
      page.drawText(`Anchor Std: ${f.anchor_score_std?.toFixed(2) ?? "—"}`, { x: 50, y });
      y -= 20;
      page.drawText(`Calibration Progress: ${Math.round((f.calibration_progress_0_1 ?? 0) * 100)}%`, { x: 50, y });
    }

    const pdfBytes = await doc.save();

    // Upload to storage
    const filename = `${user_id}/weekly-${new Date().toISOString().slice(0, 10)}.pdf`;
    const { data: upload, error } = await supabase.storage
      .from("reports")
      .upload(filename, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active exam
    const { data: enr } = await supabase
      .from("user_exam_enrollments")
      .select("exam_id")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .maybeSingle();

    // Insert report record
    await supabase.from("calibration_reports").insert({
      user_id,
      exam_id: enr?.exam_id ?? "00000000-0000-0000-0000-000000000000",
      report_type: "weekly",
      storage_path: upload.path,
    });

    // Create signed URL
    const { data: signed } = await supabase.storage
      .from("reports")
      .createSignedUrl(upload.path, 60 * 60 * 24 * 7); // 7 days

    return new Response(
      JSON.stringify({ 
        ok: true, 
        path: upload.path,
        signedUrl: signed?.signedUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-weekly-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
