import { Building2, Mail, Phone, X, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClinicPopupProps {
    data: any; // Awaitable interface from queries
    onClose: () => void;
}

export function ClinicPopup({ data, onClose }: ClinicPopupProps) {
    const formatAddress = (addr: any) => {
        if (!addr) return "Endereço não informado";
        const parts = [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean);
        return parts.join(", ");
    };

    return (
        <div className="w-[300px] rounded-xl bg-card p-4 shadow-sm">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <Building2 className="size-5 text-green-600" />
                    <h3 className="font-semibold text-foreground">Clínica</h3>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
                <h4 className="text-lg font-bold text-foreground truncate" title={data.name}>
                    {data.name}
                </h4>

                {data.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="size-4 shrink-0" />
                        <span>{data.phone}</span>
                    </div>
                )}

                {data.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="size-4 shrink-0" />
                        <span className="truncate" title={data.email}>{data.email}</span>
                    </div>
                )}

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{formatAddress(data.address)}</span>
                </div>
            </div>

            <div className="mt-4 pt-2">
                <Button asChild className="w-full" variant="outline" size="sm">
                    <Link href={`/admin/clinics/${data.id}`}>Ver Detalhes</Link>
                </Button>
            </div>
        </div>
    );
}
