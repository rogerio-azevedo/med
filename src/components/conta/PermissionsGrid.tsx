"use client";

import { useState } from "react";
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
import { ALL_FEATURES, ALL_ACTIONS, FEATURE_CATEGORIES, type FeatureSlug, type PermissionAction } from "@/lib/features";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

export function PermissionsGrid({ users, permissions, currentClinicUserId }: PermissionsGridProps) {
    const [localPermissions, setLocalPermissions] = useState<UserPermission[]>(permissions);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null); // "userId-featureSlug-action"

    // Only show non-admin users, because admins have full access by default. 
    // Or we show admins but disable the toggles with a nice badge.
    const displayUsers = users.filter(u => u.role !== "patient");

    const getPermission = (userId: string, featureSlug: string) => {
        return localPermissions.find(p => p.clinicUserId === userId && p.featureSlug === featureSlug);
    };

    const handleToggle = async (userId: string, featureSlug: FeatureSlug, action: PermissionAction, currentValue: boolean) => {
        if (userId === currentClinicUserId && (featureSlug === "users" || featureSlug === "clinic-settings")) {
            toast.error("Você não pode alterar suas permissões para este módulo.");
            return;
        }

        const updateKey = `${userId}-${featureSlug}-${action}`;
        setUpdatingParams(updateKey);

        const oldValue = currentValue;
        const newValue = !oldValue;

        const currentPerm = getPermission(userId, featureSlug);
        const currentActions = currentPerm?.actions || [];
        
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

    return (
        <Tabs defaultValue={FEATURE_CATEGORIES[0]} className="w-full">
            <TabsList className="mb-4">
                {FEATURE_CATEGORIES.map(category => (
                    <TabsTrigger key={category} value={category}>
                        {category}
                    </TabsTrigger>
                ))}
            </TabsList>

            {FEATURE_CATEGORIES.map(category => {
                const featuresInCategory = ALL_FEATURES.filter(f => f.category === category);
                
                return (
                    <TabsContent key={category} value={category} className="space-y-8">
                        {featuresInCategory.map(feature => (
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
                                                {ALL_ACTIONS.map(a => (
                                                    <TableHead key={a.action}>{a.label}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {displayUsers.map(user => {
                                                const isAdmin = user.role === "admin";
                                                const userAvatarName = user.name?.charAt(0) ?? "U";
                                                const perm = getPermission(user.id, feature.slug);
                                                
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
                                                                    {isAdmin && <Badge variant="secondary" className="text-[10px] h-4 leading-none px-1">Admin</Badge>}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                                                            </div>
                                                        </TableCell>
                                                        {ALL_ACTIONS.map(a => {
                                                            const isChecked = isAdmin ? true : perm?.actions.includes(a.action) ?? false;
                                                            const updateKey = `${user.id}-${feature.slug}-${a.action}`;
                                                            const isUpdating = updatingParams === updateKey;
                                                            // Disable toggle if user is admin (admins have full access)
                                                            const disabled = isAdmin || isUpdating;

                                                            return (
                                                                <TableCell key={a.action}>
                                                                    <Switch 
                                                                        checked={isChecked}
                                                                        disabled={disabled}
                                                                        onCheckedChange={() => handleToggle(user.id, feature.slug as FeatureSlug, a.action, isChecked)}
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
                                                        Nenhum usuário configurável encontrado.
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
    );
}
