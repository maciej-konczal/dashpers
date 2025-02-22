
import React from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { Dashboard } from '@/components/Dashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Index = () => {
  const handleCommand = async (command: string) => {
    console.log("Received command:", command);
    
    // Basic command parsing
    if (command.toLowerCase().includes('salesforce tasks')) {
      const preferences = {
        color: command.includes('light blue') ? 'bg-[#D3E4FD]' : undefined,
        emojis: command.toLowerCase().includes('emoji'),
      };

      // Create new widget in Supabase
      const { error } = await supabase
        .from('widgets')
        .insert({
          type: 'salesforce-tasks',
          title: 'My Salesforce Tasks',
          preferences,
          created_at: new Date().toISOString(),
        });

      if (error) {
        toast.error('Failed to create widget');
        return;
      }

      toast.success('Widget added to dashboard!');
    }
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
