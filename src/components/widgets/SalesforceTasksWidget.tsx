
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig } from '@/types/widgets';

interface SalesforceTasksWidgetProps {
  config: WidgetConfig;
}

export const SalesforceTasksWidget: React.FC<SalesforceTasksWidgetProps> = ({ config }) => {
  const bgColor = config.preferences.color || 'bg-[#D3E4FD]';
  
  return (
    <Card className={`widget ${bgColor} border-none`}>
      <CardHeader>
        <CardTitle>
          {config.preferences.emojis ? '📋 ' : ''}{config.title || 'Salesforce Tasks'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {/* We'll implement Salesforce data fetching later */}
          Loading Salesforce tasks...
        </p>
      </CardContent>
    </Card>
  );
};
