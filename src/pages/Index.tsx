
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatPanel } from '@/components/ChatPanel';
import { Dashboard } from '@/components/Dashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/auth');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-end p-4">
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <ChatPanel onCommand={handleCommand} />
      <main className="pl-0 transition-all duration-300">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
