
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
      const completion = await openai("gpt-4o").chat.completions.create({
        messages: [
          { role: "system", content: system },
          ...formattedMessages
        ],
        tools: pica.oneTool,
        stream: false,
        max_tokens: 1000
      });

      console.log('Completion received:', completion);

      // Extract the response from the completion
      const result = completion.choices[0]?.message?.content || '';
      console.log('Got final result:', result);

      // Return the result as a properly formatted JSON response
      return new Response(
        JSON.stringify({ result }), 
        { headers: corsHeaders }
      );

    } catch (streamError) {
      console.error('OpenAI error:', streamError);
      return new Response(
        JSON.stringify({ error: 'OpenAI error', details: streamError.message }), 
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
