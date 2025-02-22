
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  preferences: {
    color?: string;
    emojis?: boolean;
    // Add more preferences as needed
  };
  data?: any;
}

export type WidgetType = 'salesforce-tasks' | 'slack-notifications' | 'sample';
