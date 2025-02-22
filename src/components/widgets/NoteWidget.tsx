
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WidgetConfig } from '@/types/widgets';
import { supabase } from '@/lib/supabase';

interface NoteWidgetProps {
  config: WidgetConfig;
}

export const NoteWidget: React.FC<NoteWidgetProps> = ({ config }) => {
  const [content, setContent] = useState(config.preferences.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Debounced save functionality could be added here
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('widgets')
        .update({
          preferences: {
            ...config.preferences,
            content: newContent
          }
        })
        .eq('id', config.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const {
    backgroundColor = 'white',
    textColor = 'currentColor',
    fontSize = 'text-base',
    fontFamily = 'font-sans',
    padding = 'p-4'
  } = config.preferences;

  return (
    <Card 
      className="widget" 
      style={{
        backgroundColor: backgroundColor.startsWith('#') ? backgroundColor : undefined
      }}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {config.title}
          {isSaving && <span className="text-sm text-gray-400">Saving...</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Type your note here..."
          className={`min-h-[200px] resize-y bg-transparent ${fontSize} ${fontFamily} ${padding}`}
          style={{
            color: textColor.startsWith('#') ? textColor : undefined,
          }}
        />
      </CardContent>
    </Card>
  );
};
