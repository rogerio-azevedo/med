const NAVY = "#162333";

type PrescriptionClinicBannerProps = {
    clinicName: string;
    clinicLogoUrl: string | null;
    clinicAddress: string | null;
    clinicPhone: string | null;
    /** Menos padding e tipografia menor (ex.: PDF de proposta comercial). */
    compact?: boolean;
};

function ClinicLogo({
    logoUrl,
    clinicName,
    compact,
}: {
    logoUrl: string | null;
    clinicName: string;
    compact?: boolean;
}) {
    const src = logoUrl?.trim() || "/instituto-logo.svg";
    return (
        <div className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                className={
                    compact
                        ? "h-10 w-auto max-w-[180px] object-contain object-left print:h-9"
                        : "h-14 w-auto max-w-[200px] object-contain object-left print:h-12"
                }
            />
            <span className="sr-only">{clinicName}</span>
        </div>
    );
}

export function PrescriptionClinicBanner({
    clinicName,
    clinicLogoUrl,
    clinicAddress,
    clinicPhone,
    compact = false,
}: PrescriptionClinicBannerProps) {
    return (
        <header
            className={
                compact
                    ? "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 print:px-3 print:py-2.5"
                    : "flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 print:px-4 print:py-4"
            }
            style={{ backgroundColor: NAVY, color: "#fff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
        >
            <ClinicLogo logoUrl={clinicLogoUrl} clinicName={clinicName} compact={compact} />
            <div className="min-w-0 flex-1 text-right sm:text-right">
                <p className={compact ? "text-base font-bold tracking-tight" : "text-lg font-bold tracking-tight"}>
                    {clinicName}
                </p>
                {clinicAddress ? (
                    <p
                        className={
                            compact
                                ? "mt-0.5 text-[11px] leading-snug text-white/90"
                                : "mt-1 text-xs leading-snug text-white/90"
                        }
                    >
                        {clinicAddress}
                    </p>
                ) : null}
                {clinicPhone ? (
                    <p
                        className={
                            compact
                                ? "mt-0.5 text-[11px] font-medium text-white/95"
                                : "mt-1 text-xs font-medium text-white/95"
                        }
                    >
                        Tel. {clinicPhone}
                    </p>
                ) : null}
            </div>
        </header>
    );
}
