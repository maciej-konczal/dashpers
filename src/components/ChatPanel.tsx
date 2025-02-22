
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftFromLine, ArrowRightFromLine, Send } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { WidgetConfig } from '@/types/widgets';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  onCommand: (command: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onCommand }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If we're editing a widget, fetch its current data
      let currentWidget = null;
      if (editingWidgetId) {
        currentWidget = await fetchWidgetData(editingWidgetId);
        if (!currentWidget) {
          throw new Error("Could not find widget to edit");
        }
      }

      const response = await supabase.functions.invoke('ai-agent', {
        body: { 
          messages: [...messages, { role: 'user', content: userMessage }],
          currentWidget: currentWidget // Pass current widget data if editing
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { message, widgetConfig, tool } = response.data;

      // Always add assistant response to chat if there's a message
      if (message) {
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      } else {
        // Fallback message if no message was provided
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: tool === 'create_widget' 
            ? "I'll create that widget for you right away." 
            : tool === 'update_widget'
            ? "I'll update the widget with your changes."
            : "I've processed your request."
        }]);
      }

      // Handle widget creation or update
      if (tool === 'create_widget' || tool === 'update_widget') {
        if (!widgetConfig) {
          throw new Error('No widget configuration provided');
        }

        try {
          let result;
          if (tool === 'update_widget' && editingWidgetId) {
            // Update existing widget
            result = await supabase
              .from('widgets')
              .update({
                ...widgetConfig,
                updated_at: new Date().toISOString(),
              })
              .eq('id', editingWidgetId);

            if (result.error) throw result.error;
            toast.success('Widget updated successfully!');
            setEditingWidgetId(null); // Clear editing state
          } else {
            // Create new widget
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
          
          // Add a confirmation message to the chat
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

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-50"
          size="icon"
          variant="outline"
        >
          <ArrowRightFromLine className="h-4 w-4" />
        </Button>
      )}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white/80 backdrop-blur-xl border-r shadow-lg transition-transform duration-300 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingWidgetId ? 'Edit Widget' : 'Dashboard Assistant'}
            </h2>
            <Button
              onClick={() => setIsOpen(false)}
              size="icon"
              variant="ghost"
            >
              <ArrowLeftFromLine className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-grow overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'assistant'
                    ? 'bg-blue-100 ml-4'
                    : 'bg-gray-100 mr-4'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={editingWidgetId ? "Describe your changes..." : "Ask for a widget..."}
              className="flex-grow"
              disabled={isProcessing}
            />
            <Button type="submit" size="icon" disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
