import { Stethoscope, Mail, MapPin, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DoctorPopupProps {
    data: any; // Awaitable interface from queries
    onClose: () => void;
}

export function DoctorPopup({ data, onClose }: DoctorPopupProps) {
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
                    <Stethoscope className="size-5 text-blue-600" />
                    <h3 className="font-semibold text-foreground">Médico</h3>
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

                {data.crm && (
                    <div className="text-sm text-muted-foreground">
                        CRM {data.crmState ? `${data.crmState} - ` : ""}{data.crm}
                    </div>
                )}

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{formatAddress(data.address)}</span>
                </div>

                {data.specialties && data.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {data.specialties.slice(0, 3).map((s: any) => (
                            <Badge key={s.specialty.id} variant="secondary" className="text-xs">
                                {s.specialty.name}
                            </Badge>
                        ))}
                        {data.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{data.specialties.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-2">
                <Button asChild className="w-full" variant="outline" size="sm">
                    <Link href={`/doctors/${data.id}`}>Ver Detalhes</Link>
                </Button>
            </div>
        </div>
    );
}
