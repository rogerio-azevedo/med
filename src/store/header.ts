import { create } from "zustand";
import type { ReactNode } from "react";

interface HeaderState {
    title: string | ReactNode;
    description: string | ReactNode;
    toolbar: ReactNode | null;
    setHeader: (title: string | ReactNode, description?: string | ReactNode) => void;
    setToolbar: (toolbar: ReactNode | null) => void;
    clearHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: "",
    description: "",
    toolbar: null,
    setHeader: (title, description = "") => set({ title, description }),
    setToolbar: (toolbar) => set({ toolbar }),
    clearHeader: () => set({ title: "", description: "", toolbar: null }),
}));
