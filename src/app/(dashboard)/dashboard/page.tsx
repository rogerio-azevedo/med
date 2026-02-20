import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Bem-vindo!</CardTitle>
                        <CardDescription>Você está logado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Usuário: {session?.user?.name}
                            <br />
                            Email: {session?.user?.email}
                            <br />
                            ID: {session?.user?.id}
                        </p>
                    </CardContent>
                </Card>

                {/* Placeholder cards */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pacientes</CardTitle>
                        <CardDescription>Total cadastrados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">0</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Agendamentos</CardTitle>
                        <CardDescription>Hoje</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">0</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
