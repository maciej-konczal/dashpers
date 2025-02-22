
export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  example?: any;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface ParsedJSON {
  success: boolean;
  data?: any;
  error?: string;
}

export interface WidgetConfiguration {
  type?: string;
  title: string;
  preferences: {
    columns?: Array<{
      field: string;
      label: string;
      format?: string;
    }>;
    chart_type?: string;
    soql_query?: string;
    max_records?: number;
    object_type?: string;
    show_totals?: boolean;
    backgroundColor?: string;
    refreshInterval?: number;
    fields_to_display?: string[];
  };
}
