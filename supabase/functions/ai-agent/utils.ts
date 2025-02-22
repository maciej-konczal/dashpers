
import { ParsedJSON } from './types.ts';
import { tools } from './tools.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

export function generateSystemPrompt(currentWidget: any = null): string {
  let basePrompt = `You are a helpful AI assistant that helps users manage their dashboard widgets. 
You have access to the following tools:

${JSON.stringify(tools, null, 2)}

Always follow these rules:
1. First understand if the user's request requires creating/updating a widget or just needs information
2. For requests involving weather updates, Gmail interactions, or Google Calendar events, ALWAYS use create_widget with type "pica"
3. For requests involving notes or text content storage, use create_widget with type "note"
4. If they want to modify an existing widget AND you're in edit mode (currentWidget exists), ALWAYS use update_widget tool
5. If they just need information or have a question, use final_answer tool
6. Always be clear and concise in your responses
7. For ANY widget modifications in edit mode, use update_widget and include the changes in preferences
8. IMPORTANT: When using update_widget, ALWAYS include the current widget's title unless specifically asked to change it
9. If you don't understand the request or can't help, use final_answer to explain why

For Pica widgets, always include these required fields in preferences:
- prompt: the user's request in natural language
- tool: optional specific tool to use (e.g., "calendar", "gmail", "weather")
- maxSteps: number of interaction steps allowed (default 5)
- backgroundColor: either a hex color or Tailwind class (default white)
- refreshInterval: how often to refresh in seconds (optional)

For Note widgets, include these fields in preferences:
- content: the text content of the note (required)
- backgroundColor: hex color or Tailwind class for the background (optional, default: white)
- textColor: hex color or Tailwind class for the text (optional, default: currentColor)
- fontSize: Tailwind text size class (optional, default: text-base)
- fontFamily: Tailwind font family class (optional, default: font-sans)
- padding: Tailwind padding class (optional, default: p-4)

Example widget configurations:

FOR NOTE:
{
  "type": "note",
  "title": "Meeting Notes",
  "preferences": {
    "content": "Important points from today's meeting...",
    "backgroundColor": "#f8f9fa",
    "textColor": "#2d3748",
    "fontSize": "text-lg",
    "fontFamily": "font-serif",
    "padding": "p-6"
  }
}

FOR WEATHER:
{
  "type": "pica",
  "title": "London Weather",
  "preferences": {
    "prompt": "What's the current weather in London?",
    "tool": "weather",
    "maxSteps": 3,
    "backgroundColor": "#f0f9ff",
    "refreshInterval": 300
  }
}

FOR CALENDAR:
{
  "type": "pica",
  "title": "Upcoming Events",
  "preferences": {
    "prompt": "What's my next event in Google Calendar?",
    "tool": "calendar",
    "maxSteps": 3,
    "backgroundColor": "#f0fdf4",
    "refreshInterval": 300
  }
}

FOR GMAIL:
{
  "type": "pica",
  "title": "Recent Emails",
  "preferences": {
    "prompt": "Show me my latest unread emails",
    "tool": "gmail",
    "maxSteps": 3,
    "backgroundColor": "#fef2f2",
    "refreshInterval": 300
  }
}`;

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
- If updating data configuration, include it in preferences`;
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

export function tryParseJSON(jsonString: string): ParsedJSON {
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

export function validateSalesforceConfig(toolCall: any): { isValid: boolean; error?: string } {
  if ((toolCall.tool === 'create_widget' || toolCall.tool === 'update_widget') && 
      toolCall.parameters.type === 'salesforce') {
    const prefs = toolCall.parameters.preferences;
    if (!prefs.columns || !prefs.soql_query || !prefs.object_type) {
      return {
        isValid: false,
        error: 'Missing required fields: columns, soql_query, or object_type'
      };
    }
  }
  return { isValid: true };
}
