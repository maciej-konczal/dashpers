
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig } from '@/types/widgets';
import { useWidgetStore } from '@/stores/widgetStore';
import { useEffect } from 'react';

interface NoteWidgetProps {
  config: WidgetConfig;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ config }) => {
  const {
    backgroundColor = '#ffffff',
    textColor = '#000000',
    fontSize = 'text-base',
    fontFamily = 'font-sans',
    padding = 'p-4',
    content = ''
  } = config.preferences;

  const addContent = useWidgetStore(state => state.addContent);

  useEffect(() => {
    // Store the note content in the widget store
    addContent({
      id: config.id,
      title: config.title,
      type: 'note',
      content: content
    });
  }, [config.id, config.title, content, addContent]);

  return (
    <Card 
      className="widget" 
      style={{ backgroundColor }}
    >
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className={`whitespace-pre-wrap ${fontSize} ${fontFamily} ${padding}`}
          style={{ color: textColor }}
        >
          {content}
        </div>
      </CardContent>
    </Card>
  );
};
