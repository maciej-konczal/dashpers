
import { Tool } from './types';

export const tools: Record<string, Tool> = {
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
          description: "Widget-specific preferences. For Salesforce widgets, must include detailed configuration.",
          example: {
            "columns": [
              {
                "field": "Name",
                "label": "Contact Name"
              },
              {
                "field": "Email",
                "label": "Email Address"
              },
              {
                "field": "CreatedDate",
                "label": "Created",
                "format": "date"
              }
            ],
            "chart_type": "table",
            "soql_query": "SELECT Id, Name, Email, CreatedDate FROM Contact ORDER BY CreatedDate DESC",
            "max_records": 5,
            "object_type": "Contact",
            "show_totals": true,
            "backgroundColor": "bg-blue-100",
            "refreshInterval": 300,
            "fields_to_display": ["Name", "Email", "CreatedDate"]
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
          description: "Any widget preferences that need to be updated. For Salesforce widgets, ensure all required fields are included.",
          example: {
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
            "fields_to_display": ["Name", "AnnualRevenue"]
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
