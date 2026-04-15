"use client"

import { useMemo } from "react"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Stethoscope,
    Settings,
    Building2,
    Calendar,
    ClipboardList,
    Map as MapIcon,
    ShieldCheck,
    FileText,
    LogIn,
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
            icon: MapIcon,
        },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tarefas",
      url: "/tarefas",
      icon: KanbanSquare,
    },
    {
      title: "Orçamentos",
      url: "/proposals",
      icon: FileText,
    },
    {
      title: "Check-ins",
      url: "/checkins",
      icon: LogIn,
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
          title: "Hospitais",
          url: "/hospitals",
        },
        {
          title: "Especialidades",
          url: "/specialties",
        },
        {
          title: "Procedimentos",
          url: "/procedures",
        },
        {
          title: "Medicamentos",
          url: "/medications",
        },
        {
          title: "Convênios",
          url: "/health-insurances",
        },
        {
          title: "Áreas de Atuação",
          url: "/practice-areas",
        },
        {
          title: "Planos/Pacotes",
          url: "/packages",
        },
        {
          title: "Pagamentos",
          url: "/payment-terms",
        },
        {
          title: "Pontuações",
          url: "/scores",
        },
        {
          title: "Tipos de Atendimento",
          url: "/service-types",
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
            icon: MapIcon,
        },
  ],
  admin: [
    {
      title: "Clínicas",
      url: "/admin/clinics",
      icon: Building2,
      superAdminOnly: true,
    },
    {
      title: "Médicos (Global)",
      url: "/admin/doctors",
      icon: Stethoscope,
      superAdminOnly: true,
    },
    {
      title: "Configuração da Clínica",
      url: "/conta",
      icon: Settings,
      clinicAdminOnly: true,
    },
    {
      title: "Usuários",
      url: "/conta/usuarios",
      icon: Users,
      clinicAdminOnly: true,
    },
    {
      title: "Permissões",
      url: "/conta/permissoes",
      icon: ShieldCheck,
      clinicAdminOnly: true,
    },
  ],
}

type NavMainItem = {
  title: string
  url: string
  icon?: LucideIcon
  superAdminOnly?: boolean
  clinicAdminOnly?: boolean
  items?: { title: string; url: string }[]
}

function filterMainNavItems(items: NavMainItem[], allowed: Set<string>): NavMainItem[] {
  return items
    .map((item) => {
      if (item.items && item.items.length > 0) {
        const filteredSub = item.items.filter((sub) => allowed.has(sub.url))
        if (filteredSub.length === 0) return null
        return { ...item, items: filteredSub }
      }
      if (allowed.has(item.url)) return item
      return null
    })
    .filter((item): item is NavMainItem => item != null)
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
    clinicRole?: string | null
  }
  /** null/undefined = sem filtro (paciente, super admin) */
  mainNavAllowedPaths?: string[] | null
  /** null/undefined = sem filtro nos links de admin da clínica */
  adminClinicAllowedPaths?: string[] | null
}

export function AppSidebar({
  user,
  mainNavAllowedPaths = null,
  adminClinicAllowedPaths = null,
  ...props
}: AppSidebarProps) {
  const isSuperAdmin = user.role === "super_admin"
  const isClinicAdmin = user.clinicRole === "admin"
  const isPatient = user.role === "patient"

  const mainNavItems = useMemo(() => {
    if (isPatient) return data.patient
    if (mainNavAllowedPaths == null) return data.navMain
    return filterMainNavItems(data.navMain, new Set(mainNavAllowedPaths))
  }, [isPatient, mainNavAllowedPaths])

  const adminItems = useMemo(() => {
    return data.admin.filter((item) => {
      if (item.superAdminOnly && !isSuperAdmin) return false
      if (item.clinicAdminOnly && !isClinicAdmin && !isSuperAdmin) return false
      if (
        item.clinicAdminOnly &&
        isClinicAdmin &&
        !isSuperAdmin &&
        adminClinicAllowedPaths != null
      ) {
        if (!adminClinicAllowedPaths.includes(item.url)) return false
      }
      return true
    })
  }, [isSuperAdmin, isClinicAdmin, adminClinicAllowedPaths])

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
        <NavMain items={mainNavItems} />
        {(isSuperAdmin || isClinicAdmin) && adminItems.length > 0 && (
          <NavMain items={adminItems} label="Administração" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
