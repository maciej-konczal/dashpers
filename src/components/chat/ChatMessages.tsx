
import React from 'react';
import { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
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
  );
};
