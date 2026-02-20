import { auth } from "@/auth";
import { db } from "@/db";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClinicForm } from "@/components/dashboard/admin/ClinicForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminClinicsPage() {
    const session = await auth();

    if (session?.user?.role !== "super_admin") {
        redirect("/dashboard");
    }

    const allClinics = await db.query.clinics.findMany({
        orderBy: (clinics, { desc }) => [desc(clinics.createdAt)],
    });

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Gerenciar Clínicas</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Nova Clínica</CardTitle>
                </CardHeader>
                <CardContent>
                    <ClinicForm />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Clínicas Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allClinics.map((clinic) => (
                                <TableRow key={clinic.id}>
                                    <TableCell className="font-medium">{clinic.name}</TableCell>
                                    <TableCell>{clinic.slug}</TableCell>
                                    <TableCell>{clinic.createdAt.toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/clinics/${clinic.id}`}>
                                                Gerenciar
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {allClinics.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Nenhuma clínica cadastrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
