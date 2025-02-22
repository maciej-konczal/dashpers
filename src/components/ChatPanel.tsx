
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { ChatPanelProps } from '@/types/chat';

export const ChatPanel: React.FC<ChatPanelProps> = ({ onCommand, editingWidgetId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { messages, isProcessing, input, setInput, handleSubmit } = useChat(onCommand);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, editingWidgetId);
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
          <ChatMessages messages={messages} />
          <ChatInput
            input={input}
            isProcessing={isProcessing}
            editingWidgetId={editingWidgetId}
            onInputChange={setInput}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </>
  );
};
