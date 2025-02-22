
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pica } from "npm:@picahq/ai";
import { openai } from "npm:@ai-sdk/openai";
import { generateText } from "npm:ai";

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
    const { message } = await req.json();
    console.log('Received message:', message);

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    const pica_key = Deno.env.get('PICA_SECRET_KEY');
    if (!pica_key) {
      return new Response(
        JSON.stringify({ error: 'PICA_SECRET_KEY is not set' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Pica client
    console.log('Initializing Pica client...');
    const pica = new Pica(pica_key);
    console.log('Pica client initialized');

    // Generate system prompt
    console.log('Generating system prompt...');
    const systemPrompt = await pica.generateSystemPrompt();
    console.log('System prompt generated');

    try {
      console.log('Starting generateText...');
      const { text } = await generateText({
        model: openai("gpt-4"),  // Using gpt-4 instead of gpt-4o
        system: systemPrompt,
        tools: pica.oneTool,  // Passing tools directly
        prompt: message,
        maxSteps: 5,
      });
      console.log('Text generated successfully');

      return new Response(
        JSON.stringify({ text }), 
        { headers: corsHeaders }
      );

    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return new Response(
        JSON.stringify({ 
          error: 'AI generation error', 
          details: aiError.message 
        }), 
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
