const NAVY = "#162333";

type PrescriptionClinicBannerProps = {
    clinicName: string;
    clinicLogoUrl: string | null;
    clinicAddress: string | null;
    clinicPhone: string | null;
};

function ClinicLogo({ logoUrl, clinicName }: { logoUrl: string | null; clinicName: string }) {
    const src = logoUrl?.trim() || "/instituto-logo.svg";
    return (
        <div className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-14 w-auto max-w-[200px] object-contain object-left print:h-12" />
            <span className="sr-only">{clinicName}</span>
        </div>
    );
}

export function PrescriptionClinicBanner({
    clinicName,
    clinicLogoUrl,
    clinicAddress,
    clinicPhone,
}: PrescriptionClinicBannerProps) {
    return (
        <header
            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 print:px-4 print:py-4"
            style={{ backgroundColor: NAVY, color: "#fff" }}
        >
            <ClinicLogo logoUrl={clinicLogoUrl} clinicName={clinicName} />
            <div className="min-w-0 flex-1 text-right sm:text-right">
                <p className="text-lg font-bold tracking-tight">{clinicName}</p>
                {clinicAddress ? <p className="mt-1 text-xs leading-snug text-white/90">{clinicAddress}</p> : null}
                {clinicPhone ? (
                    <p className="mt-1 text-xs font-medium text-white/95">Tel. {clinicPhone}</p>
                ) : null}
            </div>
        </header>
    );
}
