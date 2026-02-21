"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Settings,
    Building2,
    Calendar,
    ClipboardList,
    Package,
    Map,
} from "lucide-react"

import { NavMain } from "@/components/shared/Sidebar/nav-main"
import { NavUser } from "@/components/shared/Sidebar/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

// This would ideally come from a central config or session
const data = {
    patient: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Minhas Consultas",
            url: "/schedule",
            icon: Calendar,
        },
        {
            title: "Mapa de Profissionais",
            url: "/maps",
            icon: Map,
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Cadastros",
            url: "#",
            icon: ClipboardList,
            items: [
                {
                    title: "Pacientes",
                    url: "/patients",
                },
                {
                    title: "Médicos",
                    url: "/doctors",
                },
                {
                    title: "Especialidades",
                    url: "/specialties",
                },
                {
                    title: "Áreas de Atuação",
                    url: "/practice-areas",
                },
                {
                    title: "Planos/Pacotes",
                    url: "/packages",
                },
            ],
        },
        {
            title: "Agenda",
            url: "/schedule",
            icon: Calendar,
        },
        {
            title: "Mapa de Profissionais",
            url: "/maps",
            icon: Map,
        },
    ],
    admin: [
        {
            title: "Clínicas",
            url: "/admin/clinics",
            icon: Building2,
        },
        {
            title: "Médicos (Global)",
            url: "/admin/doctors",
            icon: Stethoscope,
        },
        {
            title: "Configurações",
            url: "/settings",
            icon: Settings,
        },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string | null
    }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const isSuperAdmin = user.role === "super_admin"
    const isPatient = user.role === "patient"

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center gap-2 py-4">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8">
                        <Stethoscope className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">Med</span>
                        <span className="truncate text-xs">Gestão Médica</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={isPatient ? data.patient : data.navMain} />
                {isSuperAdmin && (
                    <NavMain items={data.admin} label="Administração" />
                )}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
