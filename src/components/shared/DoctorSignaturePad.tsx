"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

const CANVAS_W = 560;
const CANVAS_H = 160;

export type DoctorSignaturePadHandle = {
    clear: () => void;
    /** PNG data URL ou null se vazio / erro */
    toDataUrl: () => string | null;
    /** PNG blob ou null se vazio */
    toPngBlob: () => Promise<Blob | null>;
    hasInk: () => boolean;
};

type DoctorSignaturePadProps = {
    /** Quando mudar, o canvas é reiniciado (ex.: abrir diálogo ou modal de desenho). */
    resetKey?: string | number | boolean;
    className?: string;
};

export const DoctorSignaturePad = forwardRef<DoctorSignaturePadHandle, DoctorSignaturePadProps>(
    function DoctorSignaturePad({ resetKey, className }, ref) {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);
        const drawingRef = useRef(false);
        const lastPoint = useRef<{ x: number; y: number } | null>(null);
        const hasInkRef = useRef(false);

        const setupCanvas = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = CANVAS_W;
            canvas.height = CANVAS_H;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#111";
            ctx.lineWidth = 2;
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
            hasInkRef.current = false;
        }, []);

        useEffect(() => {
            requestAnimationFrame(() => setupCanvas());
        }, [resetKey, setupCanvas]);

        const toCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return { x: 0, y: 0 };
            const rect = canvas.getBoundingClientRect();
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
            const scaleX = CANVAS_W / rect.width;
            const scaleY = CANVAS_H / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY,
            };
        };

        const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            if ("touches" in e) e.preventDefault();
            drawingRef.current = true;
            lastPoint.current = toCanvasCoords(e);
        };

        const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            if ("touches" in e) e.preventDefault();
            if (!drawingRef.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx || !lastPoint.current) return;
            const { x, y } = toCanvasCoords(e);
            ctx.beginPath();
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            lastPoint.current = { x, y };
            hasInkRef.current = true;
        };

        const endDraw = () => {
            drawingRef.current = false;
            lastPoint.current = null;
        };

        useImperativeHandle(
            ref,
            () => ({
                clear: () => {
                    setupCanvas();
                },
                toDataUrl: () => {
                    const canvas = canvasRef.current;
                    if (!canvas || !hasInkRef.current) return null;
                    try {
                        return canvas.toDataURL("image/png");
                    } catch {
                        return null;
                    }
                },
                toPngBlob: () =>
                    new Promise<Blob | null>((resolve) => {
                        const canvas = canvasRef.current;
                        if (!canvas || !hasInkRef.current) {
                            resolve(null);
                            return;
                        }
                        canvas.toBlob((b) => resolve(b), "image/png");
                    }),
                hasInk: () => hasInkRef.current,
            }),
            [setupCanvas]
        );

        return (
            <canvas
                ref={canvasRef}
                className={className}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
            />
        );
    }
);
