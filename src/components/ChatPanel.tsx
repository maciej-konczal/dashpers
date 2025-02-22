
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftFromLine, ArrowRightFromLine, Send } from 'lucide-react';

interface ChatPanelProps {
  onCommand: (command: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onCommand }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input);
      setInput("");
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
          <div className="flex-grow overflow-y-auto mb-4 p-2 rounded-lg bg-gray-50">
            {/* Chat messages will go here */}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a widget..."
              className="flex-grow"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
