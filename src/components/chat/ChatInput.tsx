
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  isProcessing: boolean;
  editingWidgetId: string | null;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isProcessing,
  editingWidgetId,
  onInputChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
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
  );
};
