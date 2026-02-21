"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorQRCodeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    doctorName: string | null;
    inviteCode: string | null;
}

export function DoctorQRCodeDialog({
    isOpen,
    onOpenChange,
    doctorName,
    inviteCode,
}: DoctorQRCodeDialogProps) {
    const [copied, setCopied] = useState(false);

    const baseUrl =
        typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const registerUrl = inviteCode
        ? `${baseUrl}/register?invite=${inviteCode}`
        : null;

    const handleCopy = async () => {
        if (!registerUrl) return;
        await navigator.clipboard.writeText(registerUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <QrCode size={20} />
                        </div>
                        <div>
                            <DialogTitle>QR Code de Cadastro</DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                {doctorName
                                    ? `Pacientes de ${doctorName}`
                                    : "Pacientes"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!inviteCode ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="p-4 bg-muted rounded-full">
                            <QrCode className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Nenhum código de convite gerado para este médico.
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            Códigos são gerados automaticamente ao cadastrar novos médicos.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5 py-2">
                        {/* QR Code */}
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-border">
                            <QRCodeSVG
                                value={registerUrl!}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                                level="M"
                                includeMargin={false}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground text-center px-4 break-words w-full">
                            Pacientes que escanearem este código serão cadastrados automaticamente vinculados a{" "}
                            <span className="font-semibold text-foreground">
                                {doctorName ?? "este médico"}
                            </span>
                            .
                        </p>

                        {/* URL box */}
                        <div className="w-full rounded-xl border bg-muted/50 px-3 py-2.5 flex items-center gap-2 overflow-hidden">
                            <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate font-mono">
                                {registerUrl}
                            </span>
                            <a
                                href={registerUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                                <ExternalLink size={14} />
                            </a>
                        </div>

                        <Button
                            onClick={handleCopy}
                            className={cn(
                                "w-full transition-all",
                                copied && "bg-green-500 hover:bg-green-500"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Link copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copiar link
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
