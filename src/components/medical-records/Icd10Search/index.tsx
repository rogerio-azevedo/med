"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface Icd10SearchProps {
    onSelect: (cid: any) => void;
}

export function Icd10Search({ onSelect }: Icd10SearchProps) {
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedTerm = useDebounce(term, 300);

    const search = useCallback(async (searchTerm: string) => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Chamada para uma API route que criarei em breve
            const response = await fetch(`/api/icd10?q=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Erro na busca de CID:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        search(debouncedTerm);
    }, [debouncedTerm, search]);

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar CID-10 por nome ou código..." 
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="pl-10"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
                    <ScrollArea className="max-h-60">
                        {results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => {
                                    onSelect(result);
                                    setTerm("");
                                    setResults([]);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center justify-between border-b last:border-0"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary">{result.code}</span>
                                    <span className="text-sm text-muted-foreground line-clamp-1">{result.description}</span>
                                </div>
                                {result.chapter && (
                                    <Badge variant="outline" className="text-[10px] opacity-60">Cap. {result.chapter}</Badge>
                                )}
                            </button>
                        ))}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
