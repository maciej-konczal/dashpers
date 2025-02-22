
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig } from '@/types/widgets';

interface SampleWidgetProps {
  config: WidgetConfig;
}

export const SampleWidget: React.FC<SampleWidgetProps> = ({ config }) => {
  return (
    <Card className="widget">
      <CardHeader>
        <CardTitle>Sample Widget</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {config.data?.content || "This is a sample widget. You can customize it based on your needs."}
        </p>
      </CardContent>
    </Card>
  );
};
