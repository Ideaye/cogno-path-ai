import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content = "", confidence = 50 } = await req.json().catch(() => ({}));
    
    // Simple heuristic scorer: length + confidence -> 0..1
    const words = content.trim().split(/\s+/);
    const len = Math.min(words.length, 150);
    
    // Base score: 70% from length, 30% from confidence
    const lengthScore = (len / 150) * 0.7;
    const confidenceScore = (confidence / 100) * 0.3;
    const base = Math.min(1, lengthScore + confidenceScore);
    
    const jqs_0_1 = Number(base.toFixed(2));
    
    console.log('Evaluated justification:', { 
      words: words.length, 
      confidence, 
      jqs_0_1 
    });

    return new Response(
      JSON.stringify({ jqs_0_1 }), 
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  } catch (error) {
    console.error('Error evaluating justification:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});
