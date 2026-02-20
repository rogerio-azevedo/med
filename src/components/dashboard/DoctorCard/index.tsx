import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

interface DoctorCardProps {
    doctorId: string;
    doctorName: string | null;
    image: string | null;
    specialties: string[];
    className?: string;
}

function getInitials(name: string | null) {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

export function DoctorCard({
    doctorName,
    image,
    specialties,
    className,
}: DoctorCardProps) {
    return (
        <Card
            className={cn(
                "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                className
            )}
        >
            <CardContent className="p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={image}
                            alt={doctorName ?? "Médico"}
                            className="size-12 rounded-full object-cover"
                        />
                    ) : (
                        getInitials(doctorName)
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Stethoscope className="size-3.5 text-blue-500 shrink-0" />
                        <p className="text-sm font-semibold truncate">
                            {doctorName ?? "Médico"}
                        </p>
                    </div>

                    {specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {specialties.map((spec) => (
                                <Badge key={spec} variant="secondary" className="text-xs py-0">
                                    {spec}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Sem especialidade cadastrada
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
