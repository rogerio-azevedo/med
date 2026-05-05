"use client";

import type { ReactNode } from "react";
import {
    ConsultationHistoryPanel,
    type ConsultationHistoryPanelEntry,
} from "./ConsultationHistoryPanel";

type ConsultationRecordSplitLayoutProps = {
    historyEntries: ConsultationHistoryPanelEntry[];
    historyLoading: boolean;
    historyError: string | null;
    children: ReactNode;
};

/** Layout 60/40 no passo de registro: formulário à esquerda, histórico à direita (md+). */
export function ConsultationRecordSplitLayout({
    historyEntries,
    historyLoading,
    historyError,
    children,
}: ConsultationRecordSplitLayoutProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col md:flex-row md:overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:basis-[60%] md:border-r md:border-border">
                    {children}
                </div>
                <aside className="flex min-h-[min(40vh,320px)] shrink-0 flex-col overflow-hidden border-t border-border bg-muted/10 md:min-h-0 md:w-[40%] md:max-w-[40%] md:border-l md:border-t-0">
                    <ConsultationHistoryPanel
                        entries={historyEntries}
                        loading={historyLoading}
                        error={historyError}
                        className="h-full min-h-0"
                    />
                </aside>
            </div>
        </div>
    );
}
