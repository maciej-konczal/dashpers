
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";

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
    const { prompt, maxSteps = 20 } = await req.json();
    console.log('Received request with params:', { prompt, maxSteps });

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }

    // Initialize Pica SDK
    const pica = new Pica({
      apiKey: pica_key
    });

    console.log('Sending request to Pica using SDK...');
    const completion = await pica.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: "gpt-4",
      tools: ["pica.oneTool"],
      max_steps: maxSteps
    });

    console.log('Successfully received response from Pica');
    
    return new Response(JSON.stringify({ result: completion }), {
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
