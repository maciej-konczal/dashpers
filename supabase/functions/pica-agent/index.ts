
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";
import { openai } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
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
      return new Response(
        JSON.stringify({ error: 'Messages array is required and must be an array' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    const formattedMessages = body.messages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    console.log('Formatted messages:', formattedMessages);

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      return new Response(
        JSON.stringify({ error: 'PICA_SECRET_KEY is not set' }), 
        { status: 500, headers: corsHeaders }
      );
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
        maxSteps: body.maxSteps || 20,
      });

      console.log('Stream created successfully');

      // Collect all chunks from the stream
      let fullText = '';
      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          fullText += chunk;
        }
      }

      console.log('Got full text:', fullText);

      // Return the result as a properly formatted JSON response
      return new Response(
        JSON.stringify({ result: fullText }), 
        { headers: corsHeaders }
      );

    } catch (streamError) {
      console.error('Stream error:', streamError);
      return new Response(
        JSON.stringify({ error: 'Stream error', details: streamError.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error in pica-agent:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
