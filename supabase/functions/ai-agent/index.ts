
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
    description: "Creates a new widget based on user requirements.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["salesforce", "slack", "news", "weather", "calendar", "chart"],
          description: "The type of widget to create"
        },
        title: {
          type: "string",
          description: "The title of the widget"
        },
        preferences: {
          type: "object",
          description: "Widget-specific preferences like query, layout, etc"
        }
      },
      required: ["type", "title", "preferences"]
    }
  },
  update_widget: {
    name: "update_widget",
    description: "Updates an existing widget based on user modifications.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["salesforce", "slack", "news", "weather", "calendar", "chart"],
          description: "The type of widget (if changing)"
        },
        title: {
          type: "string",
          description: "Updated title (if changing)"
        },
        preferences: {
          type: "object",
          description: "Updated widget preferences"
        }
      }
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

// Generate system prompt based on context
function generateSystemPrompt(currentWidget: any = null) {
  let basePrompt = `You are a helpful AI assistant that helps users manage their dashboard widgets. 
You have access to the following tools:

${JSON.stringify(tools, null, 2)}

Always follow these rules:
1. First understand if the user's request requires creating/updating a widget or just needs information
2. If they need a new widget, use the create_widget tool
3. If they want to modify an existing widget, use the update_widget tool
4. If they just need information or have a question, use final_answer tool
5. Always be clear and concise in your responses
6. If you don't understand the request or can't help, use final_answer to explain why`;

  // Add context about current widget if editing
  if (currentWidget) {
    basePrompt += `\n\nCURRENT WIDGET CONTEXT:
The user is currently editing a widget with the following configuration:
${JSON.stringify(currentWidget, null, 2)}

When using the update_widget tool:
- Only include properties that need to be changed
- Preserve existing preferences unless explicitly asked to change them
- Use the same widget type unless asked to change it
- Keep the same query structure for Salesforce widgets unless specifically asked to modify it`;
  }

  basePrompt += `\n\nRespond in the following JSON format:
{
  "tool": "tool_name",
  "parameters": {
    // tool-specific parameters
  }
}`;

  return basePrompt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentWidget } = await req.json();
    
    // Generate system prompt with current widget context if editing
    const systemPrompt = generateSystemPrompt(currentWidget);
    
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
    console.log('AI Response:', aiResponse);
    
    const toolCall = JSON.parse(aiResponse.choices[0].message.content);
    console.log('Tool Call:', toolCall);

    // Return the tool call response
    return new Response(JSON.stringify({
      message: aiResponse.choices[0].message.content,
      tool: toolCall.tool,
      widgetConfig: toolCall.parameters
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
