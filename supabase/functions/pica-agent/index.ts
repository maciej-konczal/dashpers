
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, maxSteps = 20 } = await req.json();
    console.log('Received request with params:', { prompt, maxSteps });

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }
    console.log('PICA_SECRET_KEY found with length:', pica_key.length);

    // Following Pica's official format
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt }],
      tools: "pica.oneTool", // Using the oneTool as specified
      maxSteps: maxSteps
    };
    console.log('Preparing request body:', JSON.stringify(requestBody, null, 2));

    const requestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pica_key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };
    console.log('Request configuration:', {
      url: 'https://picahq.com/api/v1/chat',
      method: requestConfig.method,
      headers: Object.keys(requestConfig.headers)
    });

    console.log('Initiating fetch request to Pica API...');
    const response = await fetch('https://picahq.com/api/v1/chat', requestConfig);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API error response:', errorData);
      throw new Error(`Pica API error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
    console.log('Successfully received and parsed response');
    
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
