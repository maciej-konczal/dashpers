
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const FAL_AI_KEY = Deno.env.get('FAL_AI_KEY');

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

    // Format messages for the API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(({ role, content }: { role: string; content: string }) => ({
        role,
        content
      }))
    ];

    // Call fal.ai API with the correct endpoint and parameters
    const response = await fetch('https://rest.fal.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_KEY}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        messages: formattedMessages,
        functions: tools.map(t => t.function),
        model: 'claude-3-opus',
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`fal.ai API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fal.ai Response:', data);

    let widgetConfig = null;
    let finalMessage = data.content;

    // Parse function calls if any
    if (data.function_calls && data.function_calls.length > 0) {
      for (const functionCall of data.function_calls) {
        if (functionCall.name === 'generate_widget_config') {
          widgetConfig = JSON.parse(functionCall.arguments);
        }
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
