"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateClinicUserRole } from "@/app/actions/clinics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ClinicUser {
    id: string;
    clinicId: string;
    role: "admin" | "doctor" | "receptionist" | "nurse" | "patient";
    isActive: boolean;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface ClinicUsersTableProps {
    users: ClinicUser[];
    currentClinicUserId: string;
    emptyMessage?: string;
}

const roleNames = {
    admin: "Administrador",
    doctor: "Médico",
    receptionist: "Recepcionista",
    nurse: "Enfermeiro",
    patient: "Paciente",
};

export function ClinicUsersTable({
    users,
    currentClinicUserId,
    emptyMessage = "Nenhum usuário encontrado.",
}: ClinicUsersTableProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (userId === currentClinicUserId) {
            toast.error("Você não pode alterar seu próprio papel.");
            return;
        }

        setLoadingId(userId);
        try {
            const result = await updateClinicUserRole(userId, newRole as any);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Papel atualizado com sucesso!");
            }
        } catch (error) {
            toast.error("Falha ao atualizar papel.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((member) => {
                        const isSelf = member.id === currentClinicUserId;
                        const userAvatarName = member.user.name?.charAt(0) ?? "U";

                        return (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.image ?? undefined} />
                                            <AvatarFallback>{userAvatarName.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">
                                            {member.user.name ?? "Usuário sem nome"}
                                            {isSelf && <span className="ml-2 text-muted-foreground">(Você)</span>}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{member.user.email}</span>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        disabled={isSelf || loadingId === member.id}
                                        value={member.role}
                                        onValueChange={(value) => handleRoleChange(member.id, value)}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="doctor">Médico</SelectItem>
                                            <SelectItem value="receptionist">Recepcionista</SelectItem>
                                            <SelectItem value="nurse">Enfermeiro</SelectItem>
                                            {member.role === "patient" && (
                                                <SelectItem value="patient" disabled>Paciente</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.isActive ? "default" : "secondary"}>
                                        {member.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
