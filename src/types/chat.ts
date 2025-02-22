
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPanelProps {
  onCommand: (command: string) => void;
  editingWidgetId?: string | null;
}
