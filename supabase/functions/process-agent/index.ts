
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', data);

    let widgetConfig = null;
    let finalMessage = data.choices[0].message.content;

    // Parse tool calls if any
    if (data.choices[0].message.tool_calls) {
      for (const toolCall of data.choices[0].message.tool_calls) {
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
