
import { Tool } from './types.ts';

export const tools: Record<string, Tool> = {
  create_widget: {
    name: "create_widget",
    description: "Creates a new widget based on user requirements.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["salesforce", "pica"],
          description: "Use 'salesforce' for Salesforce-specific tasks (tasks, accounts, opportunities), use 'pica' for everything else (weather, news, general information)"
        },
        title: {
          type: "string",
          description: "The title of the widget"
        },
        preferences: {
          type: "object",
          description: "Widget-specific preferences. For Salesforce widgets, include SOQL query and display preferences. For Pica widgets, include prompt and optional tool name.",
          example: {
            // Salesforce example
            "soql_query": "SELECT Id, Name FROM Account",
            "max_records": 10,
            "show_totals": true,
            // Pica example
            "prompt": "Get the current weather for London",
            "tool": "weather",
            "maxSteps": 5,
            "backgroundColor": "bg-blue-100",
            "refreshInterval": 300
          }
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
          description: "Any widget preferences that need to be updated. For Salesforce widgets, ensure all required fields are included. For Pica widgets, include updated prompt or tool settings.",
          example: {
            // Salesforce example
            "columns": [
              {
                "field": "Name",
                "label": "Account Name"
              },
              {
                "field": "AnnualRevenue",
                "label": "Revenue",
                "format": "currency"
              }
            ],
            "chart_type": "table",
            "soql_query": "SELECT Id, Name, AnnualRevenue FROM Account ORDER BY AnnualRevenue DESC",
            "max_records": 10,
            "object_type": "Account",
            "show_totals": true,
            "backgroundColor": "#add8e6",
            "refreshInterval": 300,
            // Pica example
            "prompt": "Get the latest tech news",
            "tool": "news",
            "maxSteps": 5,
            "backgroundColor": "bg-blue-100",
            "refreshInterval": 300
          }
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
