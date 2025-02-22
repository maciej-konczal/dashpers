
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
    console.log('Initializing Pica client...');
    const pica = new Pica(pica_key);
    console.log('Pica client initialized');

    // Generate system prompt
    console.log('Generating system prompt...');
    const system = await pica.generateSystemPrompt();
    console.log('System prompt generated:', system);

    // Initialize OpenAI
    console.log('Initializing OpenAI...');
    const model = openai("gpt-4");  // Changed from gpt-4o to gpt-4
    console.log('OpenAI initialized');

    try {
      let fullText = '';
      
      console.log('Starting streamText...');
      console.log('Tools available:', Object.keys(pica.oneTool));

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Stream timeout after 30 seconds'));
        }, 30000);

        try {
          console.log('Configuring stream...');
          streamText({
            model,
            system,
            tools: pica.oneTool,  // Removed spread operator
            messages: formattedMessages,
            maxSteps: body.maxSteps || 5,  // Reduced max steps
            onTextContent: (content: string) => {
              console.log('Received chunk length:', content.length);
              console.log('Chunk preview:', content.substring(0, 50));
              fullText += content;
            },
            onComplete: () => {
              clearTimeout(timeout);
              console.log('Stream completed successfully');
              console.log('Final text length:', fullText.length);
              resolve();
            },
            onError: (error) => {
              clearTimeout(timeout);
              console.error('Stream error in handler:', error);
              reject(error);
            },
            onStep: (step) => {
              console.log('Processing step:', step);
            }
          });
          console.log('Stream configured and started');
        } catch (err) {
          clearTimeout(timeout);
          console.error('Error during stream configuration:', err);
          reject(err);
        }
      });
      
      console.log('Stream completed, full text length:', fullText.length);
      console.log('Text preview:', fullText.substring(0, 100));

      if (!fullText) {
        throw new Error('No content was generated');
      }

      return new Response(
        JSON.stringify({ 
          result: fullText,
          length: fullText.length
        }), 
        { headers: corsHeaders }
      );

    } catch (streamError) {
      console.error('Stream error:', streamError);
      return new Response(
        JSON.stringify({ 
          error: 'Stream error', 
          details: streamError.message,
          stack: streamError.stack 
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
