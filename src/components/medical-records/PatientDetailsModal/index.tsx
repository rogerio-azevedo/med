"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Shield,
    Stethoscope,
    Share2,
    UserCheck,
    Calendar,
    CreditCard,
    Hash,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ──────────────────────────────────────────────
// Tipos inferidos do retorno de getPatientById
// ──────────────────────────────────────────────
interface HealthInsurance {
    id: string;
    name?: string | null;
    planName?: string | null;
    cardNumber?: string | null;
    holderName?: string | null;
    holderCpf?: string | null;
    validUntil?: string | null;
    isPrimary?: boolean;
}

interface PatientAddress {
    zipCode?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
}

interface ResponsibleDoctor {
    id: string;
    name?: string | null;
}

interface PatientReferral {
    doctorName?: string | null;
    source?: string | null;
    notes?: string | null;
}

interface PatientDetailsModalPatient {
    id: string;
    name: string;
    cpf?: string | null;
    email?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    sex?: "M" | "F" | "other" | null;
    image?: string | null;
    address?: PatientAddress | null;
    patientHealthInsurances?: HealthInsurance[];
    responsibleDoctors?: ResponsibleDoctor[];
    originType?: string | null;
    referral?: PatientReferral | null;
}

interface PatientDetailsModalProps {
    patient: PatientDetailsModalPatient;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function age(birthDate: string): number {
    return Math.floor(
        (new Date().getTime() - new Date(birthDate).getTime()) / 31536000000
    );
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    try {
        return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
        return "—";
    }
}

const SEX_LABEL: Record<string, string> = {
    M: "Masculino",
    F: "Feminino",
    other: "Outro",
};

const ORIGIN_LABEL: Record<string, string> = {
    instagram: "Instagram",
    google: "Google",
    facebook: "Facebook",
    friends_family: "Amigos / Família",
    medical_referral: "Indicação Médica",
};

const REFERRAL_SOURCE_LABEL: Record<string, string> = {
    patient_reported: "Relatado pelo paciente",
    doctor_reported: "Relatado pelo médico",
    invite_link: "Link de convite",
    manual: "Manual",
};

// ──────────────────────────────────────────────
// Sub-componentes de seção
// ──────────────────────────────────────────────
function SectionTitle({
    icon: Icon,
    label,
}: {
    icon: React.ElementType;
    label: string;
}) {
    return (
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="size-4 shrink-0 text-primary" />
            {label}
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-foreground">{value || "—"}</span>
        </div>
    );
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
export function PatientDetailsModal({
    patient,
    isOpen,
    onOpenChange,
}: PatientDetailsModalProps) {
    const patientAge = patient.birthDate ? age(patient.birthDate) : null;
    const hasAddress =
        patient.address &&
        Object.values(patient.address).some((v) => v !== null && v !== "");
    const hasInsurances =
        patient.patientHealthInsurances &&
        patient.patientHealthInsurances.length > 0;
    const hasDoctors =
        patient.responsibleDoctors && patient.responsibleDoctors.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                {/* ── Header ── */}
                <DialogHeader className="shrink-0 border-b bg-muted/40 px-6 py-5">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-14 shrink-0 border-2 border-primary/20">
                            <AvatarImage src={patient.image ?? undefined} />
                            <AvatarFallback>
                                <User className="size-7" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="truncate text-lg font-bold leading-tight">
                                {patient.name}
                            </DialogTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {patient.sex && (
                                    <Badge variant="outline" className="text-xs">
                                        {SEX_LABEL[patient.sex] ?? patient.sex}
                                    </Badge>
                                )}
                                {patientAge !== null && (
                                    <Badge variant="secondary" className="text-xs">
                                        {patientAge} anos
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── Corpo com scroll ── */}
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">

                    {/* Identificação */}
                    <section>
                        <SectionTitle icon={Hash} label="Identificação" />
                        <div className="space-y-2 rounded-lg border bg-card px-4 py-3">
                            <Row label="CPF" value={patient.cpf} />
                            <Separator />
                            <Row
                                label="Data de nascimento"
                                value={formatDate(patient.birthDate)}
                            />
                            {patientAge !== null && (
                                <>
                                    <Separator />
                                    <Row label="Idade" value={`${patientAge} anos`} />
                                </>
                            )}
                            <Separator />
                            <Row
                                label="Sexo"
                                value={
                                    patient.sex
                                        ? (SEX_LABEL[patient.sex] ?? patient.sex)
                                        : undefined
                                }
                            />
                        </div>
                    </section>

                    {/* Contato */}
                    <section>
                        <SectionTitle icon={Phone} label="Contato" />
                        <div className="space-y-2 rounded-lg border bg-card px-4 py-3">
                            <Row label="Telefone" value={patient.phone} />
                            <Separator />
                            <Row label="E-mail" value={patient.email} />
                        </div>
                    </section>

                    {/* Endereço */}
                    <section>
                        <SectionTitle icon={MapPin} label="Endereço" />
                        {hasAddress ? (
                            <div className="space-y-2 rounded-lg border bg-card px-4 py-3">
                                <Row label="CEP" value={patient.address?.zipCode} />
                                <Separator />
                                <Row
                                    label="Rua"
                                    value={
                                        [
                                            patient.address?.street,
                                            patient.address?.number,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || undefined
                                    }
                                />
                                {patient.address?.complement && (
                                    <>
                                        <Separator />
                                        <Row
                                            label="Complemento"
                                            value={patient.address.complement}
                                        />
                                    </>
                                )}
                                <Separator />
                                <Row label="Bairro" value={patient.address?.neighborhood} />
                                <Separator />
                                <Row
                                    label="Cidade / UF"
                                    value={
                                        [patient.address?.city, patient.address?.state]
                                            .filter(Boolean)
                                            .join(" / ") || undefined
                                    }
                                />
                            </div>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                Endereço não cadastrado
                            </p>
                        )}
                    </section>

                    {/* Convênios */}
                    <section>
                        <SectionTitle icon={Shield} label="Convênios" />
                        {hasInsurances ? (
                            <div className="space-y-3">
                                {patient.patientHealthInsurances!.map((ins, idx) => (
                                    <div
                                        key={ins.id ?? idx}
                                        className="rounded-lg border bg-card px-4 py-3"
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-sm">
                                                {ins.name ?? "Convênio"}
                                            </span>
                                            {ins.isPrimary && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Principal
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {ins.planName && (
                                                <>
                                                    <Row label="Plano" value={ins.planName} />
                                                    <Separator />
                                                </>
                                            )}
                                            <Row label="Nº Carteirinha" value={ins.cardNumber} />
                                            <Separator />
                                            <Row label="Titular" value={ins.holderName} />
                                            {ins.holderCpf && (
                                                <>
                                                    <Separator />
                                                    <Row label="CPF Titular" value={ins.holderCpf} />
                                                </>
                                            )}
                                            {ins.validUntil && (
                                                <>
                                                    <Separator />
                                                    <Row
                                                        label="Validade"
                                                        value={formatDate(ins.validUntil)}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                Nenhum convênio cadastrado
                            </p>
                        )}
                    </section>

                    {/* Médicos Responsáveis */}
                    <section>
                        <SectionTitle icon={Stethoscope} label="Médicos Responsáveis" />
                        {hasDoctors ? (
                            <div className="flex flex-wrap gap-2">
                                {patient.responsibleDoctors!.map((doc) => (
                                    <Badge key={doc.id} variant="outline" className="gap-1.5">
                                        <UserCheck className="size-3" />
                                        {doc.name ?? "—"}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                Nenhum médico responsável vinculado
                            </p>
                        )}
                    </section>

                    {/* Origem */}
                    {patient.originType && (
                        <section>
                            <SectionTitle icon={Share2} label="Origem" />
                            <div className="rounded-lg border bg-card px-4 py-3">
                                <Row
                                    label="Canal"
                                    value={ORIGIN_LABEL[patient.originType] ?? patient.originType}
                                />
                            </div>
                        </section>
                    )}

                    {/* Indicação */}
                    {patient.referral && (
                        <section>
                            <SectionTitle icon={Calendar} label="Indicação" />
                            <div className="space-y-2 rounded-lg border bg-card px-4 py-3">
                                <Row label="Médico indicador" value={patient.referral.doctorName} />
                                <Separator />
                                <Row
                                    label="Fonte"
                                    value={
                                        patient.referral.source
                                            ? (REFERRAL_SOURCE_LABEL[patient.referral.source] ??
                                              patient.referral.source)
                                            : undefined
                                    }
                                />
                                {patient.referral.notes && (
                                    <>
                                        <Separator />
                                        <Row label="Observações" value={patient.referral.notes} />
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Spacer */}
                    <div className="h-1" />
                </div>

                {/* ── Footer ── */}
                <div className="shrink-0 border-t bg-muted/30 px-6 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="size-3.5" />
                        <span>ID: {patient.id}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
