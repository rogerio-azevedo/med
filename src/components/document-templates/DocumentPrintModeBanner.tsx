"use client";

type DocumentPrintModeBannerProps = {
    mode: "print" | "pdf";
};

export function DocumentPrintModeBanner({ mode }: DocumentPrintModeBannerProps) {
    return (
        <div className="mx-auto mb-6 max-w-[21cm] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm print:hidden">
            {mode === "pdf"
                ? "A impressão foi aberta: use “Salvar como PDF” no diálogo do navegador."
                : "A impressão foi aberta. Ajuste papel e margens se necessário."}
        </div>
    );
}
