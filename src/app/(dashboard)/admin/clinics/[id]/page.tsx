import { auth } from "@/auth";
import { db } from "@/db";
import { clinics, inviteLinks } from "@/db/schema";
import { notFound, redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteGenerator } from "@/components/dashboard/admin/InviteGenerator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ClinicDashboardProps {
    params: Promise<{ id: string }>;
}

export default async function ClinicDashboardPage({ params }: ClinicDashboardProps) {
    const session = await auth();
    const { id } = await params;

    if (session?.user?.role !== "super_admin") {
        redirect("/dashboard");
    }

    const clinic = await db.query.clinics.findFirst({
        where: eq(clinics.id, id),
    });

    if (!clinic) {
        notFound();
    }

    const invites = await db.query.inviteLinks.findMany({
        where: eq(inviteLinks.clinicId, id),
        orderBy: [desc(inviteLinks.createdAt)],
    });

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{clinic.name}</h1>
            <p className="text-muted-foreground">Dashboard da Clínica</p>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerar Convites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InviteGenerator clinicId={clinic.id} role="admin" />
                        <InviteGenerator clinicId={clinic.id} role="doctor" />
                        <InviteGenerator clinicId={clinic.id} role="patient" />
                    </CardContent>

                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Convites Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Usos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.slice(0, 5).map((invite) => (
                                    <TableRow key={invite.id}>
                                        <TableCell className="font-mono">{invite.code}</TableCell>
                                        <TableCell>{invite.role}</TableCell>
                                        <TableCell>{invite.usedCount}</TableCell>
                                    </TableRow>
                                ))}
                                {invites.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Nenhum convite gerado.
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
