
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeftFromLine, Pencil } from 'lucide-react';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { ChatPanelProps } from '@/types/chat';

interface ExtendedChatPanelProps extends ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const ChatPanel: React.FC<ExtendedChatPanelProps> = ({ 
  onCommand, 
  editingWidgetId, 
  isOpen, 
  setIsOpen 
}) => {
  const { messages, isProcessing, input, setInput, handleSubmit } = useChat((command: string) => {
    if (editingWidgetId) return;
    onCommand(command);
  });

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, editingWidgetId);
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 bottom-4 z-50"
          size="icon"
          variant="outline"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white/80 backdrop-blur-xl border-r shadow-lg transition-all duration-300 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingWidgetId ? 'Edit Widget' : 'Dashboard Builder'}
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
