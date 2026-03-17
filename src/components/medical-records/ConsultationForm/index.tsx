"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icd10Search } from "../Icd10Search";
import { Activity, Stethoscope, ClipboardList, Pill, Microscope, Send, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsultationFormProps {
    patient: any;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export function ConsultationForm({ patient, isOpen, onClose, onSubmit }: ConsultationFormProps) {
    const [activeTab, setActiveTab] = useState("subjective");
    const [soap, setSoap] = useState({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        diagnosisCidId: null as string | null,
        diagnosisCode: "",
        diagnosisDescription: "",
        diagnosisFreeText: "",
    });

    const [vitals, setVitals] = useState({
        weight: "",
        height: "",
        bloodPressure: "",
        heartRate: "",
        temperature: "",
    });

    const handleSelectCid = (cid: any) => {
        setSoap(prev => ({
            ...prev,
            diagnosisCidId: cid.id,
            diagnosisCode: cid.code,
            diagnosisDescription: cid.description
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Stethoscope className="h-6 w-6 text-primary" />
                            Novo Atendimento: {patient.name}
                        </DialogTitle>
                        <Badge variant="outline" className="px-3 py-1">Consulta Clínica</Badge>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-4">
                    <div className="px-6 border-b">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
                            <TabsTrigger 
                                value="subjective" 
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-2"
                            >
                                <span className="mr-2 px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold">S</span>
                                Subjetivo
                            </TabsTrigger>
                            <TabsTrigger 
                                value="objective" 
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-2"
                            >
                                <span className="mr-2 px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold">O</span>
                                Objetivo
                            </TabsTrigger>
                            <TabsTrigger 
                                value="assessment" 
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-2"
                            >
                                <span className="mr-2 px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold">A</span>
                                Avaliação
                            </TabsTrigger>
                            <TabsTrigger 
                                value="plan" 
                                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-2"
                            >
                                <span className="mr-2 px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold">P</span>
                                Plano
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 px-6 py-4">
                        <TabsContent value="subjective" className="mt-0 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold flex items-center gap-2">
                                        Queixa Principal e História (HDA)
                                    </Label>
                                    <Textarea 
                                        placeholder="Descreva o motivo da consulta, sintomas e histórico atual..."
                                        className="min-h-[300px] text-base"
                                        value={soap.subjective}
                                        onChange={(e) => setSoap({...soap, subjective: e.target.value})}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="objective" className="mt-0 space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label>Peso (kg)</Label>
                                    <Input placeholder="70.5" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Altura (cm)</Label>
                                    <Input placeholder="175" value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>PA (mmHg)</Label>
                                    <Input placeholder="120/80" value={vitals.bloodPressure} onChange={e => setVitals({...vitals, bloodPressure: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>FC (bpm)</Label>
                                    <Input placeholder="72" value={vitals.heartRate} onChange={e => setVitals({...vitals, heartRate: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Temp (°C)</Label>
                                    <Input placeholder="36.5" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-lg font-semibold">Exame Físico</Label>
                                <Textarea 
                                    placeholder="Descreva os achados do exame físico..."
                                    className="min-h-[200px]"
                                    value={soap.objective}
                                    onChange={(e) => setSoap({...soap, objective: e.target.value})}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="assessment" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold italic">Diagnóstico / Hipótese Diagnóstica (CID-10)</Label>
                                    <Icd10Search onSelect={handleSelectCid} />
                                    {soap.diagnosisCode && (
                                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge className="text-md h-8">{soap.diagnosisCode}</Badge>
                                                <span className="font-medium">{soap.diagnosisDescription}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSoap({...soap, diagnosisCidId: null, diagnosisCode: "", diagnosisDescription: ""})}>
                                                Remover
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-lg font-semibold">Avaliação Clínica / Observações</Label>
                                    <Textarea 
                                        placeholder="Discuta o raciocínio clínico, gravidade e prognóstico..."
                                        className="min-h-[200px]"
                                        value={soap.assessment}
                                        onChange={(e) => setSoap({...soap, assessment: e.target.value})}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="plan" className="mt-0 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group">
                                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 py-8">
                                        <Pill className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <p className="font-semibold text-muted-foreground group-hover:text-primary">Prescrição de Medicamentos</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group">
                                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 py-8">
                                        <Microscope className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <p className="font-semibold text-muted-foreground group-hover:text-primary">Solicitar Exames</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-lg font-semibold">Conduta / Orientações ao Paciente</Label>
                                <Textarea 
                                    placeholder="Descreva as orientações, próximas etapas e plano de cuidado..."
                                    className="min-h-[200px]"
                                    value={soap.plan}
                                    onChange={(e) => setSoap({...soap, plan: e.target.value})}
                                />
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="p-6 border-t gap-3">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => onSubmit({ soap, vitals })}>
                        Finalizar e Salvar Prontuário
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
