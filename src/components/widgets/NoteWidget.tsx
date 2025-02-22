
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig } from '@/types/widgets';

interface NoteWidgetProps {
  config: WidgetConfig;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ config }) => {
  const {
    backgroundColor = 'white',
    textColor = 'currentColor',
    fontSize = 'text-base',
    fontFamily = 'font-sans',
    padding = 'p-4',
    content = ''
  } = config.preferences;

  return (
    <Card 
      className="widget" 
      style={{
        backgroundColor: backgroundColor.startsWith('#') ? backgroundColor : undefined
      }}
    >
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className={`whitespace-pre-wrap ${fontSize} ${fontFamily} ${padding}`}
          style={{
            color: textColor.startsWith('#') ? textColor : undefined,
          }}
        >
          {content}
        </div>
      </CardContent>
    </Card>
  );
};
