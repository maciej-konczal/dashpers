
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

type Tool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
};

const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'generate_widget_config',
      description: 'Generate a widget configuration based on user requirements',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of widget to create',
            enum: ['salesforce-tasks', 'slack-notifications', 'sample']
          },
          title: {
            type: 'string',
            description: 'Title of the widget'
          },
          preferences: {
            type: 'object',
            description: 'Widget preferences like color and styling',
            properties: {
              color: { type: 'string' },
              emojis: { type: 'boolean' }
            }
          }
        },
        required: ['type', 'title']
      }
    }
  }
];

const systemPrompt = `You are a helpful dashboard assistant that helps users create and manage widgets. 
You have access to these tools:
1. generate_widget_config: Use this to create widget configurations based on user requirements

Follow these steps for each user request:
1. Understand if they want to create/modify a widget
2. If they do, use generate_widget_config to create appropriate configuration
3. Provide a friendly response explaining what you did

Be concise but friendly in your responses.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Format the conversation for the any-llm endpoint
    const conversation = messages.map(({ role, content }: { role: string; content: string }) => {
      if (role === 'system') return content;
      return role === 'user' ? `Human: ${content}` : `Assistant: ${content}`;
    }).join('\n');

    const prompt = `${systemPrompt}\n\n${conversation}\n\nHuman: ${messages[messages.length - 1].content}\n\nAssistant:`;

    console.log('Starting fal.ai stream with prompt:', prompt);

    // Use fal.ai client to stream the response
    const stream = await fal.stream('fal-ai/any-llm', {
      input: {
        model: "anthropic/claude-3-sonnet",
        prompt: prompt,
      }
    });

    let fullResponse = '';
    for await (const event of stream) {
      if (event.type === 'message') {
        fullResponse += event.data;
      }
    }

    // Wait for the stream to complete
    await stream.done();

    console.log('Fal.ai Response:', fullResponse);

    let widgetConfig = null;
    let finalMessage = fullResponse;

    // Check for function calls in the response
    const functionCallMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (functionCallMatch) {
      try {
        const functionCallData = JSON.parse(functionCallMatch[0]);
        if (functionCallData.type && functionCallData.title) {
          widgetConfig = functionCallData;
          // Remove the function call JSON from the message
          finalMessage = fullResponse.replace(functionCallMatch[0], '').trim();
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
