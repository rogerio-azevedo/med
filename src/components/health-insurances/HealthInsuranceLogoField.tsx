"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadHealthInsuranceLogoFile } from "@/lib/client/health-insurance-logo-upload";
import { cn } from "@/lib/utils";

type HealthInsuranceLogoFieldProps = {
    healthInsuranceId: string;
    /** Call after successful upload (e.g. router.refresh) */
    onUploaded?: () => void;
    className?: string;
};

/**
 * Upload de logo do convênio (guia SADT). Requer permissão `health-insurances.can_update`.
 */
export function HealthInsuranceLogoField({
    healthInsuranceId,
    onUploaded,
    className,
}: HealthInsuranceLogoFieldProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoadingPreview(true);
            try {
                const res = await fetch(
                    `/api/health-insurance-logo/preview?healthInsuranceId=${encodeURIComponent(healthInsuranceId)}`
                );
                const data = (await res.json()) as { url?: string | null };
                if (!cancelled && data.url) {
                    setPreviewUrl(data.url);
                } else if (!cancelled) {
                    setPreviewUrl(null);
                }
            } catch {
                if (!cancelled) setPreviewUrl(null);
            } finally {
                if (!cancelled) setLoadingPreview(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [healthInsuranceId]);

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            await uploadHealthInsuranceLogoFile(healthInsuranceId, file);
            const res = await fetch(
                `/api/health-insurance-logo/preview?healthInsuranceId=${encodeURIComponent(healthInsuranceId)}`
            );
            const data = (await res.json()) as { url?: string | null };
            setPreviewUrl(data.url ?? null);
            toast.success("Logo atualizada.");
            onUploaded?.();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Falha no upload";
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Label>Logo (guia SADT / PDF)</Label>
            <p className="text-xs text-muted-foreground">
                PNG, JPEG ou WebP. Usada na impressão da guia conforme o plano.
            </p>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                    {loadingPreview ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="" className="max-h-16 max-w-full object-contain" />
                    ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={onFileChange}
                        disabled={uploading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Enviar logo
                    </Button>
                </div>
            </div>
        </div>
    );
}
