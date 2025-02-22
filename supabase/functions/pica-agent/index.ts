
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PicaAI } from "https://esm.sh/@picahq/ai@2.0.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tool, maxSteps = 5 } = await req.json();

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }

    console.log('Initializing Pica with key length:', pica_key.length);
    const pica = new PicaAI(pica_key);

    console.log('Preparing chat request with:', { prompt, tool, maxSteps });
    const result = await pica.chat({
      messages: [{ role: 'user', content: prompt }],
      tool: tool,
      maxSteps: maxSteps,
      apiUrl: 'https://chat.pica.io/v1' // Explicitly set the API URL
    });

    console.log('Pica chat response received');
    return new Response(JSON.stringify({ result }), {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Detailed error in pica-agent:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      name: error.name,
      cause: error.cause
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
