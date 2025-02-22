
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
  connection_id?: string;
}

export type WidgetType = 'salesforce-tasks' | 'slack-notifications' | 'sample';

export interface SalesforceTask {
  Id: string;
  Subject: string;
  Status: string;
  ActivityDate: string | null;
}
