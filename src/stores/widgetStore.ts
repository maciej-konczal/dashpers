
import { create } from 'zustand'

interface WidgetContent {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface WidgetStore {
  contents: WidgetContent[];
  addContent: (content: WidgetContent) => void;
  clearContents: () => void;
}

export const useWidgetStore = create<WidgetStore>((set) => ({
  contents: [],
  addContent: (content) => set((state) => ({
    contents: [...state.contents.filter(c => c.id !== content.id), content]
  })),
  clearContents: () => set({ contents: [] })
}))
