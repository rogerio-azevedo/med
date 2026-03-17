import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, User, Activity, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientContextPanelProps {
    patient: any;
    latestVitals?: any;
    alerts?: any[];
}

export function PatientContextPanel({ patient, latestVitals, alerts = [] }: PatientContextPanelProps) {
    const age = patient.birthDate
        ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / 31536000000)
        : null;

    return (
        <div className="flex flex-col gap-6 h-full p-4 border-r bg-muted/30">
            {/* Header com Foto e Dados Básicos */}
            <div className="flex flex-col items-center text-center gap-3 py-4">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={patient.image} />
                    <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {patient.sex === "M" ? "Masculino" : patient.sex === "F" ? "Feminino" : "Não informado"}
                        {age !== null && ` • ${age} anos`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-background">{patient.cpf || "CPF não informado"}</Badge>
                </div>
            </div>

            <Separator />

            {/* Alertas Críticos */}
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-destructive font-semibold">
                            <AlertCircle className="h-4 w-4" />
                            <h3>Alertas Críticos</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {alerts.length > 0 ? (
                                alerts.map((alert) => (
                                    <Badge key={alert.id} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                                        {alert.description}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Nenhum alerta registrado</p>
                            )}
                        </div>
                    </div>

                    {/* Sinais Vitais Recentes */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 font-semibold">
                            <Activity className="h-4 w-4 text-primary" />
                            <h3>Últimas Métricas</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="shadow-none bg-background">
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground">PA</p>
                                    <p className="font-bold">{latestVitals?.bloodPressure || "--"}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-none bg-background">
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground">Peso</p>
                                    <p className="font-bold">{latestVitals?.weight ? `${latestVitals.weight} kg` : "--"}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-none bg-background">
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground">FC</p>
                                    <p className="font-bold">{latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : "--"}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-none bg-background">
                                <CardContent className="p-3">
                                    <p className="text-xs text-muted-foreground">Temp</p>
                                    <p className="font-bold">{latestVitals?.temperature ? `${latestVitals.temperature} °C` : "--"}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Informações Complementares */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 font-semibold">
                            <Info className="h-4 w-4 text-primary" />
                            <h3>Resumo Clínico</h3>
                        </div>
                        <Card className="shadow-none bg-background">
                            <CardContent className="p-4 flex flex-col gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Convênio</p>
                                    <p className="font-medium">{patient.healthInsurance?.company || "Particular"}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-muted-foreground mb-1">Última Consulta</p>
                                    <p className="font-medium">
                                        {patient.lastConsultationDate
                                            ? format(new Date(patient.lastConsultationDate), "dd MMM yyyy", { locale: ptBR })
                                            : "Nenhuma registrada"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>

        </div>
    );
}
