import { auth } from "@/auth";
import { db } from "@/db";
import { inviteLinks, doctors } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq, desc, isNull, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InviteGenerator } from "@/components/dashboard/admin/InviteGenerator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export default async function GlobalDoctorsPage() {
    const session = await auth();

    if (session?.user?.role !== "super_admin") {
        redirect("/dashboard");
    }

    // Fetch global invites (clinicId is null)
    const invites = await db.query.inviteLinks.findMany({
        where: and(isNull(inviteLinks.clinicId), eq(inviteLinks.role, "doctor")),
        orderBy: [desc(inviteLinks.createdAt)],
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary" />
                    Médicos Globais
                </h1>
                <p className="text-muted-foreground">
                    Gerencie médicos não vinculados a clínicas específicas (autônomos).
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerar Convite Independente</CardTitle>
                        <CardDescription>
                            Gere um link para um médico se cadastrar na plataforma sem estar atrelado a nenhuma clínica.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InviteGenerator role="global_doctor" title="Médico Independente" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Convites Globais Recentes</CardTitle>
                        <CardDescription>Histórico de convites gerados para médicos autônomos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Usos</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.map((invite) => (
                                    <TableRow key={invite.id}>
                                        <TableCell className="font-mono text-sm">{invite.code}</TableCell>
                                        <TableCell>
                                            {invite.isActive ? (
                                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium">Ativo</span>
                                            ) : (
                                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium">Inativo</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{invite.usedCount}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {invites.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            Nenhum convite global gerado até o momento.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
