import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, ClipboardList, Stethoscope } from "lucide-react";

interface ConsultationTimelineProps {
    consultations: any[];
    onSelect?: (consultationId: string) => void;
}

export function ConsultationTimeline({ consultations = [], onSelect }: ConsultationTimelineProps) {
    if (consultations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
                <ClipboardList className="h-16 w-16 opacity-20" />
                <p className="text-center text-sm">Nenhum atendimento registrado no histórico deste paciente.</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-5 pl-9 before:absolute before:bottom-0 before:left-[13px] before:top-2 before:w-0.5 before:bg-border md:pl-10 md:before:left-[15px]">
            {consultations.map((consultation) => (
                <div key={consultation.id} className="group relative">
                    {/* Indicador na timeline — alinhado ao trilho; padding à esquerda evita corte */}
                    <div className="absolute -left-8.5 top-1 z-10 rounded-full border-2 border-primary bg-background p-1 md:-left-9.5">
                        <Stethoscope className="size-4 text-primary md:size-4.5" />
                    </div>

                    <Card
                        className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                        onClick={() => onSelect?.(consultation.id)}
                    >
                        <div className="flex flex-col gap-1.5 px-3 py-2.5 md:px-4 md:py-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {format(new Date(consultation.startTime), "dd MMM yyyy", { locale: ptBR })}
                                    </span>
                                    <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px] font-bold uppercase md:text-xs">
                                        {translateType(consultation.type)}
                                    </Badge>
                                </div>
                                <div className="shrink-0 truncate text-xs font-medium text-muted-foreground">
                                    Dr(a). {consultation.doctorName}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <h4 className="truncate text-base font-bold text-card-foreground">
                                        {consultation.diagnosis || "Atendimento Clínico"}
                                    </h4>
                                    {consultation.cidCode ? (
                                        <Badge
                                            variant="outline"
                                            className="h-5 shrink-0 border-primary/20 px-2 py-0 text-xs text-primary"
                                        >
                                            {consultation.cidCode}
                                        </Badge>
                                    ) : null}
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary md:size-5" />
                            </div>
                        </div>
                    </Card>
                </div>
            ))}
        </div>
    );
}

function translateType(type: string) {
    const types: Record<string, string> = {
        consultation: "Consulta",
        return: "Retorno",
        emergency: "Urgência",
        procedure: "Procedimento",
        remote: "Telemedicina",
        phone: "Telefone",
    };
    return types[type] || type;
}
