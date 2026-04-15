"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClinicUsersTable, type ClinicUser } from "@/components/conta/ClinicUsersTable";

interface ClinicUsersPageContentProps {
    users: ClinicUser[];
    currentClinicUserId: string;
}

function compareByUserName(a: ClinicUser, b: ClinicUser): number {
    const na = (a.user.name ?? "").trim();
    const nb = (b.user.name ?? "").trim();
    if (!na && !nb) return 0;
    if (!na) return 1;
    if (!nb) return -1;
    return na.localeCompare(nb, "pt-BR", { sensitivity: "base" });
}

export function ClinicUsersPageContent({ users, currentClinicUserId }: ClinicUsersPageContentProps) {
    const [search, setSearch] = useState("");

    const sortedUsers = useMemo(() => [...users].sort(compareByUserName), [users]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return sortedUsers;
        }
        return sortedUsers.filter((member) =>
            String(member.user.name ?? "").toLowerCase().includes(normalizedSearch)
        );
    }, [sortedUsers, search]);

    const emptyMessage =
        search.trim() && users.length > 0
            ? "Nenhum usuário encontrado para essa busca."
            : "Nenhum usuário encontrado.";

    return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar usuário por nome..."
                    className="pl-9"
                />
            </div>

            <ClinicUsersTable
                users={filteredUsers}
                currentClinicUserId={currentClinicUserId}
                emptyMessage={emptyMessage}
            />
        </div>
    );
}
