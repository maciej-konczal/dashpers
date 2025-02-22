
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

    console.log('Preparing chat request to Pica API');
    
    // Make direct API call since the SDK isn't compatible with Deno
    const response = await fetch('https://chat.pica.io/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pica_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        tool: tool,
        maxSteps: maxSteps
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pica API error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
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
