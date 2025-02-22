
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
            enum: ['salesforce-tasks', 'sample']
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
2. final_answer: Use this to provide a final response to the user

Follow these steps for each user request:
1. Understand the user's intent
2. If they want to create/modify a widget, use generate_widget_config
3. Always end with a final_answer explaining what you did

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

    // Call fal.ai API
    const response = await fetch('https://rest.fal.ai/fal/claude-instant/completion', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: formattedMessages,
        tools,
        temperature: 0.7,
        stream: false
      })
    });

    const data = await response.json();
    console.log('AI Response:', data);

    let widgetConfig = null;
    let finalMessage = data.content;

    // Parse tool calls if any
    if (data.tool_calls && data.tool_calls.length > 0) {
      for (const toolCall of data.tool_calls) {
        if (toolCall.function.name === 'generate_widget_config') {
          widgetConfig = JSON.parse(toolCall.function.arguments);
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
