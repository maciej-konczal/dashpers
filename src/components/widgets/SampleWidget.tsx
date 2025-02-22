
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SampleWidgetProps {
  data?: any;
}

export const SampleWidget: React.FC<SampleWidgetProps> = ({ data }) => {
  return (
    <Card className="widget">
      <CardHeader>
        <CardTitle>Sample Widget</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {data?.content || "This is a sample widget. You can customize it based on your needs."}
        </p>
      </CardContent>
    </Card>
  );
};
