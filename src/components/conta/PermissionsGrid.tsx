"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { updateUserFeaturePermission } from "@/app/actions/permissions";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ALL_FEATURES,
    ALL_ACTIONS,
    FEATURE_CATEGORIES,
    type FeatureSlug,
    type PermissionAction,
} from "@/lib/features";

const IMPLICIT_ADMIN_ACTIONS: PermissionAction[] = ALL_ACTIONS.map((a) => a.action);

function getEffectiveActions(user: User, perm: UserPermission | undefined): PermissionAction[] {
    if (user.role === "admin" && !perm) {
        return [...IMPLICIT_ADMIN_ACTIONS];
    }
    return (perm?.actions as PermissionAction[]) ?? [];
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface User {
    id: string; // clinicUserId
    name: string | null;
    email: string;
    image: string | null;
    role: string;
}

interface UserPermission {
    clinicUserId: string;
    featureSlug: string;
    actions: string[];
}

interface PermissionsGridProps {
    users: User[];
    permissions: UserPermission[];
    currentClinicUserId: string;
}

function compareByName(a: User, b: User): number {
    const na = (a.name ?? "").trim();
    const nb = (b.name ?? "").trim();
    if (!na && !nb) return 0;
    if (!na) return 1;
    if (!nb) return -1;
    return na.localeCompare(nb, "pt-BR", { sensitivity: "base" });
}

export function PermissionsGrid({ users, permissions, currentClinicUserId }: PermissionsGridProps) {
    const [localPermissions, setLocalPermissions] = useState<UserPermission[]>(permissions);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null); // "userId-featureSlug-action"
    const [search, setSearch] = useState("");

    const configurableUsers = useMemo(
        () => [...users].filter((u) => u.role !== "patient").sort(compareByName),
        [users]
    );

    const displayUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return configurableUsers;
        }
        return configurableUsers.filter((u) =>
            String(u.name ?? "").toLowerCase().includes(normalizedSearch)
        );
    }, [configurableUsers, search]);

    const getPermission = (userId: string, featureSlug: string) => {
        return localPermissions.find(p => p.clinicUserId === userId && p.featureSlug === featureSlug);
    };

    const handleToggle = async (
        userId: string,
        featureSlug: FeatureSlug,
        action: PermissionAction,
        currentValue: boolean,
        baselineActions: PermissionAction[],
    ) => {
        if (userId === currentClinicUserId && (featureSlug === "users" || featureSlug === "clinic-settings")) {
            toast.error("Você não pode alterar suas permissões para este módulo.");
            return;
        }

        const updateKey = `${userId}-${featureSlug}-${action}`;
        setUpdatingParams(updateKey);

        const oldValue = currentValue;
        const newValue = !oldValue;

        const currentPerm = getPermission(userId, featureSlug);
        const currentActions = [...baselineActions];
        
        let newActions: string[];
        if (newValue) {
            newActions = [...currentActions, action];
        } else {
            newActions = currentActions.filter(a => a !== action);
        }

        // Optimistic update
        setLocalPermissions(prev => {
            const index = prev.findIndex(p => p.clinicUserId === userId && p.featureSlug === featureSlug);
            if (index >= 0) {
                const draft = [...prev];
                draft[index] = { ...draft[index], actions: newActions };
                return draft;
            } else {
                return [...prev, { clinicUserId: userId, featureSlug, actions: newActions }];
            }
        });

        const result = await updateUserFeaturePermission(userId, featureSlug, newActions as PermissionAction[]);
        
        if (result?.error) {
            toast.error(result.error);
            // Revert
            setLocalPermissions(prev => {
                const index = prev.findIndex(p => p.clinicUserId === userId && p.featureSlug === featureSlug);
                if (index >= 0) {
                    const draft = [...prev];
                    draft[index] = { ...draft[index], actions: currentActions };
                    return draft;
                }
                return prev;
            });
        }
        
        setUpdatingParams(null);
    };

    const emptyTableMessage =
        configurableUsers.length === 0
            ? "Nenhum usuário configurável encontrado."
            : "Nenhum usuário encontrado para essa busca.";

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

            <Tabs defaultValue={FEATURE_CATEGORIES[0]} className="w-full">
                <TabsList className="mb-4">
                    {FEATURE_CATEGORIES.map((category) => (
                        <TabsTrigger key={category} value={category}>
                            {category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {FEATURE_CATEGORIES.map((category) => {
                    const featuresInCategory = ALL_FEATURES.filter((f) => f.category === category);

                    return (
                        <TabsContent key={category} value={category} className="space-y-8">
                            {featuresInCategory.map((feature) => (
                                <div key={feature.slug} className="rounded-xl border bg-card text-card-foreground shadow">
                                    <div className="p-6 pb-2">
                                        <h3 className="font-semibold leading-none tracking-tight">{feature.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                                    </div>
                                    <div className="p-6 pt-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[300px]">Usuário</TableHead>
                                                    {ALL_ACTIONS.map((a) => (
                                                        <TableHead key={a.action}>{a.label}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {displayUsers.map((user) => {
                                                    const isAdmin = user.role === "admin";
                                                    const userAvatarName = user.name?.charAt(0) ?? "U";
                                                    const perm = getPermission(user.id, feature.slug);
                                                    const effective = getEffectiveActions(user, perm);

                                                    return (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={user.image ?? undefined} />
                                                                    <AvatarFallback>{userAvatarName.toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm leading-none flex items-center gap-2">
                                                                        {user.name ?? "S/ Nome"}
                                                                        {isAdmin && (
                                                                            <Badge variant="secondary" className="text-[10px] h-4 leading-none px-1">
                                                                                Admin
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            {ALL_ACTIONS.map((a) => {
                                                                const isChecked = effective.includes(a.action);
                                                                const updateKey = `${user.id}-${feature.slug}-${a.action}`;
                                                                const isUpdating = updatingParams === updateKey;
                                                                const disabled = isUpdating;

                                                                return (
                                                                    <TableCell key={a.action}>
                                                                        <Switch
                                                                            checked={isChecked}
                                                                            disabled={disabled}
                                                                            onCheckedChange={() =>
                                                                                handleToggle(
                                                                                    user.id,
                                                                                    feature.slug as FeatureSlug,
                                                                                    a.action,
                                                                                    isChecked,
                                                                                    effective,
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    );
                                                })}
                                                {displayUsers.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                            {emptyTableMessage}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
