
import React from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const handleCommand = (command: string) => {
    console.log("Received command:", command);
    // Here we'll later integrate with AI to process commands
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatPanel onCommand={handleCommand} />
      <main className="pl-0 transition-all duration-300">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
