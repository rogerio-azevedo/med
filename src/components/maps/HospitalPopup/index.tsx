import { Building2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HospitalPopupProps {
    data: {
        name: string;
        description: string | null;
        address: {
            street: string | null;
            number: string | null;
            neighborhood: string | null;
            city: string | null;
        } | null;
    };
    onClose: () => void;
}

function formatAddress(addr: HospitalPopupProps["data"]["address"]) {
    if (!addr) return "Endereço não informado";
    const parts = [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean);
    return parts.join(", ") || "Endereço não informado";
}

export function HospitalPopup({ data, onClose }: HospitalPopupProps) {
    return (
        <div className="w-[300px] rounded-xl bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                    <Building2 className="size-5 text-rose-600" />
                    <h3 className="font-semibold text-foreground">Hospital</h3>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="space-y-3">
                <h4 className="truncate text-lg font-bold text-foreground" title={data.name}>
                    {data.name}
                </h4>

                {data.description ? (
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                ) : null}

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{formatAddress(data.address)}</span>
                </div>
            </div>

            <div className="mt-4 pt-2">
                <Button className="w-full" variant="outline" size="sm" disabled>
                    Hospital cadastrado
                </Button>
            </div>
        </div>
    );
}
