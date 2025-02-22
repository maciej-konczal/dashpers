
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions
const tools = {
  create_widget: {
    name: "create_widget",
    description: "Creates a widget based on user requirements. Use this when user wants to add new data visualization.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["salesforce", "sample"],
          description: "The type of widget to create"
        },
        title: {
          type: "string",
          description: "The title of the widget"
        },
        preferences: {
          type: "object",
          description: "Widget-specific preferences"
        }
      },
      required: ["type", "title"]
    }
  },
  final_answer: {
    name: "final_answer",
    description: "Use this to provide a final response to the user without taking any action",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to send to the user"
        }
      },
      required: ["message"]
    }
  }
};

const systemPrompt = `You are a helpful AI assistant that helps users manage their dashboard widgets and answer questions.
You have access to the following tools:

${JSON.stringify(tools, null, 2)}

Always follow these rules:
1. First understand if the user's request requires creating a widget or just needs information
2. If they need a widget, use the create_widget tool
3. If they just need information or have a question, use the final_answer tool
4. Always be clear and concise in your responses
5. If you don't understand the request or can't help, use final_answer to explain why

Respond in the following JSON format:
{
  "tool": "tool_name",
  "parameters": {
    // tool-specific parameters
  }
}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Call AI model with system prompt and messages
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    const toolCall = JSON.parse(aiResponse.choices[0].message.content);

    // Handle tool calls
    if (toolCall.tool === 'create_widget') {
      // Call the existing process-agent function
      const widgetResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-agent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }),
        }
      );

      if (!widgetResponse.ok) {
        throw new Error('Failed to create widget');
      }

      const widgetData = await widgetResponse.json();
      return new Response(JSON.stringify({
        message: widgetData.message,
        widgetConfig: widgetData.widgetConfig,
        tool: 'create_widget'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (toolCall.tool === 'final_answer') {
      return new Response(JSON.stringify({
        message: toolCall.parameters.message,
        tool: 'final_answer'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid tool call');
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
