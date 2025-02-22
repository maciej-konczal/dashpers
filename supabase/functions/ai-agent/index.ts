
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

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
    description: "Updates an existing widget. When in edit mode, this should be used for ANY changes to the widget including visual changes, data changes, or configuration updates.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the widget (required, must be preserved from current widget if not changing)"
        },
        preferences: {
          type: "object",
          description: "Any widget preferences that need to be updated. Can include visual properties (backgroundColor, etc), data configuration, or any other widget-specific settings."
        }
      },
      required: ["title"]
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

function generateSystemPrompt(currentWidget: any = null) {
  let basePrompt = `You are a helpful AI assistant that helps users manage their dashboard widgets. 
You have access to the following tools:

${JSON.stringify(tools, null, 2)}

Always follow these rules:
1. First understand if the user's request requires creating/updating a widget or just needs information
2. If they need a new widget, use create_widget tool
3. If they want to modify an existing widget AND you're in edit mode (currentWidget exists), ALWAYS use update_widget tool
4. If they just need information or have a question, use final_answer tool
5. Always be clear and concise in your responses
6. For ANY widget modifications in edit mode, use update_widget and include the changes in preferences
7. IMPORTANT: When using update_widget, ALWAYS include the current widget's title unless specifically asked to change it
8. If you don't understand the request or can't help, use final_answer to explain why
9. VERY IMPORTANT: Your response MUST be valid JSON with all property names double-quoted`;

  if (currentWidget) {
    basePrompt += `\n\nCURRENT WIDGET CONTEXT:
You are currently in EDIT MODE for this widget:
${JSON.stringify(currentWidget, null, 2)}

When using the update_widget tool:
- Use it for ANY changes to the widget (visual, data, or configuration)
- ALWAYS include the current widget's title in the response (required field)
- Only include properties that need to be changed in the preferences object
- Preserve existing preferences unless explicitly asked to change them
- Keep the widget type as is unless specifically asked to change it
- If updating visual properties, include them in preferences (e.g. backgroundColor)
- If updating data configuration, include it in preferences (e.g. soql_query for Salesforce)`;
  }

  basePrompt += `\n\nYou MUST respond with properly formatted JSON. Example format:
{
  "tool": "tool_name",
  "parameters": {
    "title": "Widget Title",
    "preferences": {
      "key": "value"
    }
  }
}`;

  return basePrompt;
}

function tryParseJSON(jsonString: string): { success: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (typeof data !== 'object' || !data.tool || !data.parameters) {
      return {
        success: false,
        error: 'Invalid response format. Expected object with tool and parameters.'
      };
    }
    return { success: true, data };
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Problematic JSON string:', jsonString);
    return {
      success: false,
      error: `Failed to parse JSON: ${error.message}`
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentWidget } = await req.json();

    console.log('Received request with messages:', messages);
    console.log('Current widget context:', currentWidget);
    
    const systemPrompt = generateSystemPrompt(currentWidget);
    
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
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    console.log('AI Response:', aiResponse);
    
    const parsed = tryParseJSON(aiResponse.choices[0].message.content);
    if (!parsed.success) {
      console.error('Failed to parse AI response:', parsed.error);
      return new Response(JSON.stringify({
        error: 'Invalid AI response format',
        details: parsed.error
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const toolCall = parsed.data;
    console.log('Tool Call:', toolCall);

    // Ensure title is preserved for widget updates
    if (toolCall.tool === 'update_widget' && currentWidget && !toolCall.parameters.title) {
      toolCall.parameters.title = currentWidget.title;
    }

    return new Response(JSON.stringify({
      message: aiResponse.choices[0].message.content,
      tool: toolCall.tool,
      widgetConfig: toolCall.parameters
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in AI agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
