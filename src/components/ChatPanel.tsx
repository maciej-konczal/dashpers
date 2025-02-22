
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftFromLine, ArrowRightFromLine, Send } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
      
      const response = await supabase.functions.invoke('ai-agent', {
        body: { 
          messages: [...messages, { role: 'user', content: userMessage }]
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { message, widgetConfig, tool } = response.data;

      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);

      // If widget config was generated, create it
      if (tool === 'create_widget' && widgetConfig) {
        try {
          const { error: widgetError } = await supabase
            .from('widgets')
            .insert({
              ...widgetConfig,
              user_id: user?.id,
              created_at: new Date().toISOString(),
            });

          if (widgetError) throw widgetError;
          
          toast.success('Widget created successfully!');
        } catch (error) {
          console.error('Error creating widget:', error);
          toast.error('Failed to create widget');
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
            <h2 className="text-xl font-semibold">Dashboard Assistant</h2>
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
              placeholder="Ask for a widget..."
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
