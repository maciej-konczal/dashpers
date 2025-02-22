
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
    const { prompt, tool = "weather", maxSteps = 5 } = await req.json();
    console.log('Received request with params:', { prompt, tool, maxSteps });

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }

    // Using the base URL and v1 API endpoint
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt }],
      tool: tool,
      max_steps: maxSteps
    };

    const requestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pica_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    // Use the base API endpoint
    const response = await fetch('https://api.pica.io/v1/chat', requestConfig);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Pica API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('Successfully received response from Pica');
    
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
      cause: error.cause,
      type: typeof error,
      errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      name: error.name,
      cause: error.cause,
      full_error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
