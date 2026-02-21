import { MapPin, Mail, Stethoscope, Briefcase, ChevronLeft } from "lucide-react";
import { maskPhone } from "@/lib/masks";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DoctorProfileProps {
    doctor: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        crm: string | null;
        crmState: string | null;
        address: {
            street: string | null;
            number: string | null;
            complement: string | null;
            neighborhood: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
        } | null;
        specialties: { id: string; name: string }[];
        practiceAreas: { id: string; name: string }[];
    };
}

export function DoctorProfile({ doctor }: DoctorProfileProps) {
    const formatAddress = (addr: any) => {
        if (!addr) return "Endereço não informado";
        const parts = [
            addr.street,
            addr.number,
            addr.neighborhood,
            `${addr.city ? addr.city : ""}${addr.state ? ` - ${addr.state}` : ""}`,
            addr.zipCode ? `CEP: ${addr.zipCode}` : ""
        ].filter(Boolean);
        return parts.join(", ");
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/doctors">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Perfil do Médico</h1>
                    <p className="text-muted-foreground text-sm">
                        Detalhes e informações de contato
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informações Principais */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-4 border-b pb-4">
                        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Stethoscope className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{doctor.name}</h2>
                            {doctor.email && (
                                <a
                                    href={`mailto:${doctor.email}`}
                                    className="text-muted-foreground flex items-center gap-2 mt-1 hover:text-primary transition-colors text-sm"
                                >
                                    <Mail className="h-4 w-4" />
                                    {doctor.email}
                                </a>
                            )}
                            {!doctor.email && (
                                <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
                                    <Mail className="h-4 w-4" /> —
                                </p>
                            )}
                            {doctor.phone && (
                                <div className="flex items-center gap-3 mt-1">
                                    {/* WhatsApp link */}
                                    <a
                                        href={`https://wa.me/55${doctor.phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir no WhatsApp"
                                        className="text-[#25D366] hover:text-[#1ebe5d] transition-colors"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 448 512"
                                            className="h-5 w-5 fill-current"
                                            aria-hidden="true"
                                        >
                                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                                        </svg>
                                    </a>
                                    {/* Phone number — tel: link to dial */}
                                    <a
                                        href={`tel:+55${doctor.phone.replace(/\D/g, "")}`}
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {maskPhone(doctor.phone)}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 py-2">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground">CRM</span>
                            <p className="font-medium">
                                {doctor.crm ? `${doctor.crmState ? `${doctor.crmState} - ` : ""}${doctor.crm}` : "Não informado"}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> Endereço Principal
                            </span>
                            <p className="font-medium mt-1 text-sm text-muted-foreground">
                                {formatAddress(doctor.address)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Especialidades e Áreas de Atuação */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                            <Stethoscope className="h-5 w-5 text-blue-500" />
                            Especialidades
                        </h3>
                        {doctor.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {doctor.specialties.map((s) => (
                                    <Badge key={s.id} variant="secondary" className="px-3 py-1 text-sm">
                                        {s.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                            <Briefcase className="h-5 w-5 text-emerald-500" />
                            Áreas de Atuação
                        </h3>
                        {doctor.practiceAreas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {doctor.practiceAreas.map((p) => (
                                    <Badge key={p.id} variant="outline" className="px-3 py-1 text-sm bg-emerald-50/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                        {p.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma área de atuação cadastrada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
