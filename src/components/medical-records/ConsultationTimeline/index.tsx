import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronRight, FileText, ClipboardList, Send, Stethoscope } from "lucide-react";

interface ConsultationTimelineProps {
    consultations: any[];
    onSelect?: (consultationId: string) => void;
}

export function ConsultationTimeline({ consultations = [], onSelect }: ConsultationTimelineProps) {
    if (consultations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                <ClipboardList className="h-16 w-16 opacity-20" />
                <p>Nenhum atendimento registrado no histórico deste paciente.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-8 flex flex-col gap-4 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-border">
            {consultations.map((consultation, index) => (
                <div key={consultation.id} className="relative group">
                    {/* Indicador de Data na Timeline */}
                    <div className="absolute -left-[37px] top-1 p-1 bg-background border-2 border-primary rounded-full z-10">
                        <Stethoscope className="h-4 w-4 text-primary" />
                    </div>

                    <Card 
                        className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                        onClick={() => onSelect?.(consultation.id)}
                    >
                        <div className="p-4 py-3 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-3 items-center">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {format(new Date(consultation.startTime), "dd MMM yyyy", { locale: ptBR })}
                                    </span>
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 uppercase font-bold">
                                        {translateType(consultation.type)}
                                    </Badge>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium">
                                    Dr(a). {consultation.doctorName}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-base text-card-foreground">
                                        {consultation.diagnosis || "Atendimento Clínico"}
                                    </h4>
                                    {consultation.cidCode && (
                                        <Badge variant="outline" className="text-[10px] text-primary border-primary/20 h-5">
                                            {consultation.cidCode}
                                        </Badge>
                                    )}
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
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
