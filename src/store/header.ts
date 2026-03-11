import { create } from "zustand";

interface HeaderState {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    setHeader: (title: string | React.ReactNode, description?: string | React.ReactNode) => void;
    clearHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
    title: "",
    description: "",
    setHeader: (title, description = "") => set({ title, description }),
    clearHeader: () => set({ title: "", description: "" }),
}));
