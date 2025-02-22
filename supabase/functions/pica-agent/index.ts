
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";
import { openai } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    console.log('Received body:', body);

    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Messages array is required and must be an array');
    }

    const formattedMessages = body.messages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    console.log('Formatted messages:', formattedMessages);

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }

    // Initialize Pica client
    const pica = new Pica(pica_key);

    // Generate system prompt
    const system = await pica.generateSystemPrompt();
    console.log('Generated system prompt');

    try {
      // Create the stream
      const stream = await streamText({
        model: openai("gpt-4o"),
        system,
        tools: {
          ...pica.oneTool,
        },
        messages: formattedMessages,
        maxSteps: 20,
      });

      console.log('Stream created successfully');

      // Get the response
      const result = await stream.finalText();
      console.log('Got final result:', result);

      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (streamError) {
      console.error('Stream error:', streamError);
      throw streamError;
    }

  } catch (error) {
    console.error('Detailed error in pica-agent:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: typeof error,
      errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      name: error.name,
      full_error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
