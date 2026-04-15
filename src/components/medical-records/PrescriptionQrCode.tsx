"use client";

import { QRCodeSVG } from "qrcode.react";

type PrescriptionQrCodeProps = {
    value: string;
    /** Tamanho em px (padrão adequado ao rodapé A4). */
    size?: number;
};

export function PrescriptionQrCode({ value, size = 112 }: PrescriptionQrCodeProps) {
    if (!value) {
        return (
            <p className="max-w-[140px] text-center text-[10px] leading-tight text-slate-500">
                Configure <span className="font-mono">NEXT_PUBLIC_APP_URL</span> para o QR Code apontar para a verificação
                pública.
            </p>
        );
    }

    return (
        <QRCodeSVG
            value={value}
            size={size}
            level="M"
            fgColor="#162333"
            bgColor="#ffffff"
            includeMargin={false}
        />
    );
}
