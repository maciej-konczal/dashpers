
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { fal } from "npm:@fal-ai/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const falKey = Deno.env.get('FAL_AI_KEY');
if (falKey) {
  fal.config({
    credentials: falKey,
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!falKey) {
      throw new Error('FAL_AI_KEY is not configured');
    }

    console.log('Processing summary request with content:', content);

    const prompt = `
Please provide a comprehensive summary of all the following widget contents:

${content}

Format the summary as a clear overview of all widgets' content.
    `.trim();

    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "anthropic/claude-3.5-sonnet",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 500,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      }
    });

    if (!result.data?.output) {
      throw new Error('No output received from AI');
    }

    console.log('Generated summary:', result.data.output);

    return new Response(
      JSON.stringify({ summary: result.data.output }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in summarize-widgets function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
