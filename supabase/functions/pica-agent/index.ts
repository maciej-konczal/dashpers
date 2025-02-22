
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";
import { openai } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
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

    // Format messages to ensure they have the correct structure
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
    
    // Get the response from the stream
    const response = stream.toDataStreamResponse();
    
    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: headers,
    });

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
      headers: corsHeaders
    });
  }
});
