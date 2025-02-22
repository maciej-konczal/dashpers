import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatPanel } from '@/components/ChatPanel';
import { Dashboard } from '@/components/Dashboard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2 } from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { SummaryDialog } from '@/components/SummaryDialog';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const widgetContents = useWidgetStore((state) => state.contents);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const formatWidgetContent = (widget: any) => {
    console.log('Formatting widget:', { type: widget.type, title: widget.title });
    let content = widget.content;
    
    try {
      console.log('Raw widget content:', { type: widget.type, content });
      
      if (widget.type === 'note') {
        console.log('Processing note widget');
        return `${widget.title} (${widget.type}):\n${content}`;
      }

      const parsedContent = JSON.parse(content);
      console.log('Parsed content:', { type: widget.type, parsedContent });
      
      if (widget.type === 'salesforce') {
        console.log('Processing Salesforce widget');
        if (Array.isArray(parsedContent)) {
          content = parsedContent.map(record => 
            Object.entries(record)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          ).join('\n');
        }
      } else if (widget.type === 'calendar') {
        console.log('Processing calendar widget');
        content = parsedContent.events?.map((event: any) => 
          `Event: "${event.title}" on ${event.date} at ${event.time}`
        ).join('\n') || content;
      } else if (widget.type === 'weather') {
        console.log('Processing weather widget');
        const weather = parsedContent;
        content = [
          `Condition: ${weather.condition || 'N/A'}`,
          `Temperature: ${weather.temperature || 'N/A'}`,
          `Humidity: ${weather.humidity || 'N/A'}`,
          `Wind: ${weather.wind || 'N/A'}`,
          `Visibility: ${weather.visibility || 'N/A'}`,
          weather.precipitation ? `Precipitation: ${weather.precipitation}` : '',
        ].filter(Boolean).join('\n');
      }
    } catch (e) {
      console.log('Content parsing failed for widget', {
        title: widget.title,
        type: widget.type,
        error: e.message,
        rawContent: content
      });
    }
    
    const formattedWidget = `${widget.title} (${widget.type}):\n${content}`;
    console.log('Formatted widget result:', formattedWidget);
    return formattedWidget;
  };

  const summarizeWidgets = async () => {
    setIsSummarizing(true);
    setSummary('');
    setShowSummary(true);
    
    try {
      console.log('All widgets to process:', widgetContents.map(w => ({
        type: w.type,
        title: w.title,
        hasContent: Boolean(w.content)
      })));

      const formattedContent = widgetContents
        .map(formatWidgetContent)
        .join('\n\n---\n\n');

      console.log('Final formatted content for summary:', formattedContent);

      const { data, error } = await supabase.functions.invoke('summarize-widgets', {
        body: { content: formattedContent }
      });

      if (error) {
        throw error;
      }

      if (!data?.summary) {
        throw new Error('No summary generated');
      }

      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  const summarizeAndListen = async () => {
    setIsSummarizing(true);
    setIsGeneratingAudio(true);
    setSummary('');
    setShowSummary(true);
    
    try {
      const formattedContent = widgetContents
        .map(formatWidgetContent)
        .join('\n\n---\n\n');

      const { data: summaryData, error: summaryError } = await supabase.functions.invoke('summarize-widgets', {
        body: { content: formattedContent }
      });

      if (summaryError) throw summaryError;
      if (!summaryData?.summary) throw new Error('No summary generated');

      setSummary(summaryData.summary);

      const { data: audioData, error: audioError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: summaryData.summary }
      });

      if (audioError) throw audioError;
      if (!audioData?.audioContent) throw new Error('No audio content received');

      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioData.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Error in summarize and listen:', error);
      toast.error('Failed to generate audio summary');
    } finally {
      setIsSummarizing(false);
      setIsGeneratingAudio(false);
    }
  };

  const handleCommand = async (command: string) => {
    console.log("Received command:", command);
    
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('salesforce tasks')) {
      const preferences = {
        color: lowerCommand.includes('light blue') ? 'bg-[#D3E4FD]' : 
               lowerCommand.includes('blue') ? 'bg-blue-100' :
               undefined,
        emojis: lowerCommand.includes('emoji') || 
                lowerCommand.includes('emojis') || 
                lowerCommand.includes('funny'),
      };

      try {
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
            onClick={summarizeAndListen}
            disabled={widgetContents.length === 0 || isSummarizing || isGeneratingAudio}
          >
            {isGeneratingAudio ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Audio...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Listen to Summary
              </>
            )}
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

      <SummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        summary={summary}
        isSummarizing={isSummarizing}
      />
    </div>
  );
};

export default Index;
