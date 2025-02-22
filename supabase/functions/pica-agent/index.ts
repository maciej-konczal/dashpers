
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";
import { openai } from "npm:@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "npm:ai";

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
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      throw new Error('PICA_SECRET_KEY is not set');
    }

    // Initialize Pica client
    const pica = new Pica(pica_key);

    // Generate system prompt
    const system = await pica.generateSystemPrompt();
    console.log('Generated system prompt');

    // Create the stream
    const stream = await streamText({
      model: openai("gpt-4o"),
      system,
      tools: {
        ...pica.oneTool,
      },
      messages: convertToCoreMessages(messages),
      maxSteps: 20,
    });

    console.log('Stream created successfully');
    return stream.toDataStreamResponse();

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
      cause: error.cause,
      full_error: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
