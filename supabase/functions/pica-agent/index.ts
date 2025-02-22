
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "https://esm.sh/@picahq/ai";

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

    console.log('Initializing Pica with provided key');
    const pica = new Pica(pica_key);

    console.log('Executing Pica generate with prompt:', prompt);
    const result = await pica.generate({
      prompt,
      tool,
      maxSteps,
    });

    console.log('Pica generation successful');
    return new Response(JSON.stringify({ result }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error in pica-agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
