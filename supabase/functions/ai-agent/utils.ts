
import { ParsedJSON } from './types';
import { tools } from './tools';

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
2. If they need a new widget, use create_widget tool
3. If they want to modify an existing widget AND you're in edit mode (currentWidget exists), ALWAYS use update_widget tool
4. If they just need information or have a question, use final_answer tool
5. Always be clear and concise in your responses
6. For ANY widget modifications in edit mode, use update_widget and include the changes in preferences
7. IMPORTANT: When using update_widget, ALWAYS include the current widget's title unless specifically asked to change it
8. If you don't understand the request or can't help, use final_answer to explain why
9. VERY IMPORTANT: For Salesforce widgets, ALWAYS include these required fields in preferences:
   - columns: array of column configurations with field, label, and optional format
   - chart_type: usually "table" unless specifically requested otherwise
   - soql_query: the SOQL query to fetch data
   - max_records: number of records to display (default 5-10)
   - object_type: the Salesforce object type being queried
   - show_totals: boolean to show totals (default true)
   - backgroundColor: either a hex color or Tailwind class
   - refreshInterval: how often to refresh in seconds (default 300)
   - fields_to_display: array of field names to display

Here are some example widget configurations:

FOR CONTACTS:
{
  "type": "salesforce",
  "title": "Recent Contacts",
  "preferences": {
    "columns": [
      {"field": "Name", "label": "Contact Name"},
      {"field": "Email", "label": "Email"},
      {"field": "Phone", "label": "Phone"}
    ],
    "chart_type": "table",
    "soql_query": "SELECT Id, Name, Email, Phone FROM Contact ORDER BY CreatedDate DESC",
    "max_records": 5,
    "object_type": "Contact",
    "show_totals": true,
    "backgroundColor": "bg-blue-100",
    "refreshInterval": 300,
    "fields_to_display": ["Name", "Email", "Phone"]
  }
}

FOR ACCOUNTS:
{
  "type": "salesforce",
  "title": "Top Accounts",
  "preferences": {
    "columns": [
      {"field": "Name", "label": "Account Name"},
      {"field": "AnnualRevenue", "label": "Revenue", "format": "currency"},
      {"field": "Industry", "label": "Industry"}
    ],
    "chart_type": "table",
    "soql_query": "SELECT Id, Name, AnnualRevenue, Industry FROM Account ORDER BY AnnualRevenue DESC NULLS LAST",
    "max_records": 5,
    "object_type": "Account",
    "show_totals": true,
    "backgroundColor": "#add8e6",
    "refreshInterval": 300,
    "fields_to_display": ["Name", "AnnualRevenue", "Industry"]
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
