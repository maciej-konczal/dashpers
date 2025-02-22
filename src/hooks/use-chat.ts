
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ChatMessage } from '@/types/chat';
import { WidgetConfig } from '@/types/widgets';

export const useChat = (onCommand: (command: string) => void) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState("");

  const fetchWidgetData = async (widgetId: string): Promise<WidgetConfig | null> => {
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (error) {
      console.error('Error fetching widget:', error);
      return null;
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent, editingWidgetId: string | null) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Fetch current widget data first if we're editing
      const currentWidgetData = editingWidgetId ? await fetchWidgetData(editingWidgetId) : null;

      const response = await supabase.functions.invoke('ai-agent', {
        body: { 
          messages: [...messages, { role: 'user', content: userMessage }],
          currentWidget: currentWidgetData
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { message, widgetConfig, tool } = response.data;

      if (message) {
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: tool === 'create_widget' 
            ? "I'll create that widget for you right away." 
            : tool === 'update_widget'
            ? "I'll update the widget with your changes."
            : "I've processed your request."
        }]);
      }

      if (tool === 'create_widget' || tool === 'update_widget') {
        if (!widgetConfig) {
          throw new Error('No widget configuration provided');
        }

        try {
          let result;
          if (tool === 'update_widget' && editingWidgetId && currentWidgetData) {
            // Merge the new preferences with existing ones
            const updatedPreferences = {
              ...currentWidgetData.preferences,
              ...(widgetConfig.preferences || {})
            };

            // Merge all widget data, preserving existing fields unless explicitly changed
            const updatedWidget = {
              ...currentWidgetData,
              ...widgetConfig,
              preferences: updatedPreferences,
              updated_at: new Date().toISOString(),
            };

            result = await supabase
              .from('widgets')
              .update(updatedWidget)
              .eq('id', editingWidgetId);

            if (result.error) throw result.error;
            toast.success('Widget updated successfully!');
          } else {
            const { data: { user } } = await supabase.auth.getUser();
            result = await supabase
              .from('widgets')
              .insert({
                ...widgetConfig,
                user_id: user?.id,
                created_at: new Date().toISOString(),
              });

            if (result.error) throw result.error;
            toast.success('Widget created successfully!');
          }
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: tool === 'update_widget' 
              ? "I've successfully updated the widget for you!"
              : "I've successfully created the widget for you!"
          }]);
        } catch (error) {
          console.error('Error with widget operation:', error);
          toast.error(tool === 'update_widget' ? 'Failed to update widget' : 'Failed to create widget');
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Sorry, I encountered an error while ${tool === 'update_widget' ? 'updating' : 'creating'} the widget.`
          }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process your request');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    messages,
    isProcessing,
    input,
    setInput,
    handleSubmit
  };
};
