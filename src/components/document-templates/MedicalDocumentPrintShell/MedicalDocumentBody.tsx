type MedicalDocumentBodyProps = {
    documentTitle: string;
    renderedContentHtml: string;
    hideDocumentTitle: boolean;
};

export function MedicalDocumentBody({
    documentTitle,
    renderedContentHtml,
    hideDocumentTitle,
}: MedicalDocumentBodyProps) {
    return (
        <main className="mt-6 text-black">
            {!hideDocumentTitle ? (
                <h1 className="mb-6 border-b border-black pb-1 text-center text-xl font-bold uppercase tracking-wide print:text-[18pt]">
                    {documentTitle}
                </h1>
            ) : null}
            <div
                className="max-w-none text-left text-[13px] leading-relaxed [&_b]:font-semibold [&_strong]:font-semibold [&_p]:mb-3 last:[&_p]:mb-0"
                dangerouslySetInnerHTML={{
                    __html: renderedContentHtml.replace(/\n/g, "<br/>"),
                }}
            />
        </main>
    );
}
