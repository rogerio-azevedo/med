export type FeatureSlug =
    | "patients"
    | "doctors"
    | "hospitals"
    | "specialties"
    | "procedures"
    | "medications"
    | "health-insurances"
    | "practice-areas"
    | "packages"
    | "payment-terms"
    | "scores"
    | "service-types"
    | "schedule"
    | "medical-records"
    | "tasks"
    | "proposals"
    | "patient-plans"
    | "checkins"
    | "map"
    | "document-templates"
    | "consultations"
    | "surgeries"
    | "users"
    | "clinic-settings";

export type PermissionAction = "can_read" | "can_create" | "can_update" | "can_delete";

export interface FeatureDefinition {
    slug: FeatureSlug;
    name: string;
    description: string;
    category: string;
    routePaths?: readonly string[];
}

export const ALL_FEATURES: FeatureDefinition[] = [
    { slug: "patients",           name: "Pacientes",              description: "Cadastro e gestão de pacientes",              category: "Cadastros", routePaths: ["/patients"] },
    { slug: "doctors",            name: "Médicos",                description: "Cadastro e gestão de médicos",                category: "Cadastros", routePaths: ["/doctors"] },
    { slug: "hospitals",          name: "Hospitais",              description: "Cadastro e gestão de hospitais",              category: "Cadastros", routePaths: ["/hospitals"] },
    { slug: "specialties",        name: "Especialidades",         description: "Gestão de especialidades médicas",            category: "Cadastros", routePaths: ["/specialties"] },
    { slug: "procedures",         name: "Procedimentos",          description: "Cadastro de procedimentos médicos",           category: "Cadastros", routePaths: ["/procedures"] },
    { slug: "medications",        name: "Medicamentos",           description: "Cadastro e gestão de medicamentos",           category: "Cadastros", routePaths: ["/medications"] },
    { slug: "health-insurances",  name: "Convênios",              description: "Gestão de convênios e planos de saúde",       category: "Cadastros", routePaths: ["/health-insurances"] },
    { slug: "practice-areas",     name: "Áreas de Atuação",       description: "Gestão de áreas de atuação",                  category: "Cadastros", routePaths: ["/practice-areas"] },
    { slug: "packages",           name: "Planos/Pacotes",         description: "Gestão de planos e pacotes de serviço",       category: "Cadastros", routePaths: ["/packages"] },
    { slug: "payment-terms",      name: "Condições de Pagamento", description: "Gestão de prazos e condições de pagamento",   category: "Cadastros", routePaths: ["/payment-terms"] },
    { slug: "scores",             name: "Pontuações",             description: "Gestão de pontuações e critérios",            category: "Cadastros", routePaths: ["/scores"] },
    { slug: "document-templates", name: "Modelos de Documentos",  description: "Criação e gestão de modelos de documentos (atestados, receitas etc.)", category: "Cadastros", routePaths: ["/document-templates"] },
    { slug: "service-types",      name: "Tipos de Atendimento",   description: "Cadastro de tipos de atendimento",            category: "Cadastros", routePaths: ["/service-types"] },
    { slug: "schedule",           name: "Agenda",                 description: "Agendamento e gestão de consultas",           category: "Operações", routePaths: ["/schedule"] },
    { slug: "medical-records",    name: "Prontuário",             description: "Acesso ao prontuário eletrônico",             category: "Operações", routePaths: ["/medical-records"] },
    { slug: "tasks",              name: "Tarefas",                description: "Gestão de tarefas no quadro Kanban",          category: "Operações", routePaths: ["/tarefas"] },
    { slug: "proposals",          name: "Orçamentos",             description: "Criação e gestão de orçamentos/propostas",    category: "Operações", routePaths: ["/proposals"] },
    { slug: "patient-plans",      name: "Planos ativos",          description: "Acompanhamento de planos vendidos a pacientes", category: "Operações", routePaths: ["/patient-plans"] },
    { slug: "checkins",           name: "Check-ins",              description: "Registro e acompanhamento de check-ins",      category: "Operações", routePaths: ["/checkins"] },
    { slug: "map",                name: "Mapa de Profissionais",  description: "Visualização do mapa de profissionais",       category: "Operações", routePaths: ["/maps"] },
    { slug: "consultations",      name: "Consultas",              description: "Listagem e gestão de consultas da clínica",   category: "Operações", routePaths: ["/gestao/consultas", "/gestao/exames", "/gestao/video-consultas"] },
    { slug: "surgeries",          name: "Cirurgias",              description: "Listagem e gestão de cirurgias da clínica",   category: "Operações", routePaths: ["/gestao/cirurgias"] },
    { slug: "users",              name: "Usuários",               description: "Gestão de usuários da clínica",               category: "Administração", routePaths: ["/conta/usuarios", "/conta/permissoes"] },
    { slug: "clinic-settings",    name: "Configurações",          description: "Configurações gerais da clínica",             category: "Administração", routePaths: ["/conta"] },
];

export const ALL_ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: "can_read",   label: "Visualizar" },
    { action: "can_create", label: "Criar" },
    { action: "can_update", label: "Editar" },
    { action: "can_delete", label: "Excluir" },
];

export const FEATURE_CATEGORIES = Array.from(new Set(ALL_FEATURES.map((feature) => feature.category)));

export function getFeaturesByCategory(category: string): FeatureDefinition[] {
    return ALL_FEATURES.filter((f) => f.category === category);
}
