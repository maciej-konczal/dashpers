
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log('Making request to Pica API with prompt:', prompt);
    
    const response = await fetch('https://api.pica.io/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pica_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        tool,
        maxSteps,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pica API error response:', errorText);
      throw new Error(`Pica API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Pica API response successful:', result);

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
