
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatPanel } from '@/components/ChatPanel';
import { Dashboard } from '@/components/Dashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const widgetContents = useWidgetStore((state) => state.contents);

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

  const summarizeWidgets = async () => {
    setIsSummarizing(true);
    setSummary('');
    setShowSummary(true);
    
    try {
      // Format the content for the summary
      const formattedContent = widgetContents
        .map(w => `${w.title} (${w.type}):\n${w.content}`)
        .join('\n\n');

      const prompt = `Please provide a concise summary of these widget contents:\n\n${formattedContent}`;

      const response = await fetch('https://fal.run/fal-ai/claude-instant-1', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${import.meta.env.VITE_FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.response);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

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
    setIsChatOpen(true);
    toast.info("Edit mode activated. Describe your changes in the chat.");
  };

  const handleCancelEdit = () => {
    setEditingWidgetId(null);
    toast.info("Edit mode disabled");
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
      <div className="flex items-center justify-between p-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-['Roboto'] font-bold text-black">—pers</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={summarizeWidgets}
            disabled={widgetContents.length === 0}
          >
            Summarize Widgets
          </Button>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="flex">
        <ChatPanel 
          onCommand={handleCommand} 
          editingWidgetId={editingWidgetId}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
        />
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'ml-[320px]' : 'ml-0'}`}>
          <Dashboard 
            onEditWidget={handleEditWidget} 
            editingWidgetId={editingWidgetId} 
            onCancelEdit={handleCancelEdit}
          />
        </main>
      </div>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Widgets Summary</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isSummarizing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="prose max-w-none">
                {summary || "No summary available"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
