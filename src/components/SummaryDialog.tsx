
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
import { toast } from 'sonner';

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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handleTextToSpeech = async () => {
    try {
      if (isPlaying && audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      setIsLoadingAudio(true);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: summary }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error('Failed to generate speech. Please try again.');
    } finally {
      setIsLoadingAudio(false);
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
              disabled={isLoadingAudio}
              className="ml-4"
            >
              {isLoadingAudio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
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
