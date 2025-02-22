
import { create } from 'zustand';
import { WidgetType } from '@/types/widgets';

interface WidgetContent {
  id: string;
  title: string;
  type: WidgetType;
  content: string;
}

interface WidgetStore {
  contents: WidgetContent[];
  addContent: (content: WidgetContent) => void;
  clearContents: () => void;
}

export const useWidgetStore = create<WidgetStore>((set) => ({
  contents: [],
  addContent: (content) => {
    console.log('Adding/updating content to store:', content);
    set((state) => ({
      contents: [...state.contents.filter(c => c.id !== content.id), content]
    }));
  },
  clearContents: () => set({ contents: [] })
}));
