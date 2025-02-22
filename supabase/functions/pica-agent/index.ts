
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
  console.log('=== Starting new request ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    console.log('Parsed request body:', JSON.stringify(body, null, 2));

    if (!body.messages || !Array.isArray(body.messages)) {
      console.log('Invalid messages array in request body');
      return new Response(
        JSON.stringify({ error: 'Messages array is required and must be an array' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    const formattedMessages = body.messages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    console.log('Formatted messages:', JSON.stringify(formattedMessages, null, 2));

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      console.error('PICA_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'PICA_SECRET_KEY is not set' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    console.log('PICA_SECRET_KEY found');

    // Initialize Pica client
    console.log('Initializing Pica client...');
    const pica = new Pica(pica_key);
    console.log('Pica client initialized');

    // Generate system prompt
    console.log('Generating system prompt...');
    const system = await pica.generateSystemPrompt();
    console.log('System prompt generated:', system);

    try {
      console.log('Starting OpenAI completion...');
      console.log('Tools configuration:', JSON.stringify(pica.oneTool, null, 2));
      
      // Create the completion
      const completion = await openai("gpt-4o").chat.completions.create({
        messages: [
          { role: "system", content: system },
          ...formattedMessages
        ],
        tools: pica.oneTool,
        stream: false,
        max_tokens: 1000
      });

      console.log('Raw completion response:', JSON.stringify(completion, null, 2));

      // Extract the response from the completion
      const result = completion.choices[0]?.message?.content || '';
      console.log('Extracted result:', result);

      // Return the result as a properly formatted JSON response
      const response = { result };
      console.log('Sending response:', JSON.stringify(response, null, 2));
      
      return new Response(
        JSON.stringify(response), 
        { headers: corsHeaders }
      );

    } catch (streamError) {
      console.error('OpenAI error details:', {
        name: streamError.name,
        message: streamError.message,
        stack: streamError.stack,
        cause: streamError.cause
      });
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI error', 
          details: streamError.message,
          stack: streamError.stack 
        }), 
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('General error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
