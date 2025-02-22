
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
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

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
    
    const lowerCommand = command.toLowerCase();
    
    // Parse Salesforce tasks command
    if (lowerCommand.includes('salesforce tasks')) {
      const preferences = {
        // Extract color preference
        color: lowerCommand.includes('light blue') ? 'bg-[#D3E4FD]' : 
               lowerCommand.includes('blue') ? 'bg-blue-100' :
               undefined,
        // Check for emoji preference
        emojis: lowerCommand.includes('emoji') || 
                lowerCommand.includes('emojis') || 
                lowerCommand.includes('funny'),
      };

      try {
        // Insert the widget configuration into Supabase
        const { error } = await supabase
          .from('widgets')
          .insert({
            user_id: user?.id,
            type: 'salesforce-tasks',
            title: 'My Salesforce Tasks',
            preferences,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error creating widget:', error);
          toast.error('Failed to create widget');
          return;
        }

        toast.success('Widget added to dashboard!');
      } catch (error) {
        console.error('Error creating widget:', error);
        toast.error('Failed to create widget');
      }
    } else {
      toast.info('Command not recognized. Try asking for Salesforce tasks!');
    }
  };

  const handleEditWidget = (widgetId: string) => {
    setEditingWidgetId(widgetId);
    toast.info("Edit mode activated. Describe your changes in the chat.");
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
      <ChatPanel onCommand={handleCommand} editingWidgetId={editingWidgetId} />
      <main className="pl-0 transition-all duration-300">
        <Dashboard onEditWidget={handleEditWidget} editingWidgetId={editingWidgetId} />
      </main>
    </div>
  );
};

export default Index;
