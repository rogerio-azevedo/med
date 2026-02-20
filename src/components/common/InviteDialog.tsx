"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Link2, Copy, Check, Share2, UserPlus, Mail } from "lucide-react";
import { generateInvite } from "@/app/actions/invites";
import { toast } from "sonner";

interface InviteDialogProps {
    clinicId: string;
    role: "doctor" | "patient";
    trigger?: React.ReactNode;
}

export function InviteDialog({ clinicId, role, trigger }: InviteDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const formData = new FormData();
        formData.append("clinicId", clinicId);
        formData.append("role", role);

        try {
            const result = await generateInvite(formData);
            if (result.success && result.code) {
                setInviteCode(result.code);
            } else {
                toast.error("Erro ao gerar convite");
            }
        } catch (error) {
            toast.error("Erro ao gerar convite");
        } finally {
            setIsGenerating(false);
        }
    };

    const inviteUrl = inviteCode
        ? `${window.location.origin}/register?invite=${inviteCode}`
        : "";

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copiado!");
    };

    const roleLabel = role === "doctor" ? "Médico" : "Paciente";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setInviteCode(null);
                setCopied(false);
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Convidar {roleLabel}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convidar {roleLabel}</DialogTitle>
                    <DialogDescription>
                        Gere um link de cadastro para enviar ao {roleLabel.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>

                {!inviteCode ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <Mail size={32} />
                        </div>
                        <p className="text-sm text-center text-muted-foreground px-6">
                            Ao gerar o link, ele poderá ser usado uma única vez para cadastrar um novo {roleLabel.toLowerCase()} vinculado à sua clínica.
                        </p>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full"
                        >
                            {isGenerating ? "Gerando..." : "Gerar Link de Convite"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <label htmlFor="link" className="sr-only">
                                    Link
                                </label>
                                <div className="flex items-center px-3 h-10 rounded-md border bg-muted/50 text-sm font-mono truncate">
                                    {inviteUrl}
                                </div>
                            </div>
                            <Button size="icon" onClick={handleCopy} className="px-3">
                                <span className="sr-only">Copiar</span>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground">
                            Compartilhe este link com o {roleLabel.toLowerCase()} via WhatsApp ou Email.
                        </p>
                    </div>
                )}

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsOpen(false)}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
