
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  isSummarizing: boolean;
}

export const SummaryDialog: React.FC<SummaryDialogProps> = ({
  open,
  onOpenChange,
  summary,
  isSummarizing,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleTextToSpeech = async () => {
    try {
      if (isPlaying && audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: summary,
          voice: 'Aria', // Using Aria voice by default
        },
      });

      if (error) throw error;

      const audioContent = data.audioContent;
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setIsPlaying(false);
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Widgets Summary</DialogTitle>
            <DialogDescription>
              A comprehensive overview of all your widgets
            </DialogDescription>
          </div>
          {summary && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleTextToSpeech}
              className="ml-4"
            >
              {isPlaying ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </DialogHeader>
        <div className="mt-4">
          {isSummarizing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="prose max-w-none whitespace-pre-wrap overflow-y-auto max-h-[60vh]">
              {summary || "No summary available"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
