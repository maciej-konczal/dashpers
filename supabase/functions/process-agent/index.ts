
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { fal } from "npm:@fal-ai/client";

const FAL_AI_KEY = Deno.env.get('FAL_AI_KEY');

// Configure fal client
fal.config({
  credentials: FAL_AI_KEY,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a helpful dashboard assistant that helps users create and manage widgets. 
When a user asks to create a widget, respond with a JSON object in this format:
{
  "type": "sample",
  "title": "Widget Title",
  "preferences": {
    "color": "bg-[#D3E4FD]",
    "emojis": true
  }
}

The type must be one of: "salesforce-tasks", "sample"
Keep your responses friendly but concise.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Format the conversation
    const conversation = messages.map(({ role, content }: { role: string; content: string }) => {
      if (role === 'system') return content;
      return role === 'user' ? `Human: ${content}` : `Assistant: ${content}`;
    }).join('\n');

    const prompt = `${systemPrompt}\n\n${conversation}\n\nHuman: ${messages[messages.length - 1].content}\n\nAssistant:`;

    console.log('Starting fal.ai request with prompt:', prompt);

    // Use fal.ai client with subscribe method and the correct model name
    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "anthropic/claude-3.5-sonnet",
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      }
    });

    console.log('Fal.ai Response:', result);

    const assistantResponse = result.response || '';
    
    let widgetConfig = null;
    let finalMessage = assistantResponse;

    // Check for function calls in the response
    const functionCallMatch = assistantResponse.match(/\{[\s\S]*\}/);
    if (functionCallMatch) {
      try {
        const functionCallData = JSON.parse(functionCallMatch[0]);
        if (functionCallData.type && functionCallData.title) {
          widgetConfig = functionCallData;
          // Remove the function call JSON from the message
          finalMessage = assistantResponse.replace(functionCallMatch[0], '').trim();
        }
      } catch (e) {
        console.error('Error parsing function call:', e);
      }
    }

    return new Response(
      JSON.stringify({
        message: finalMessage,
        widgetConfig
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
