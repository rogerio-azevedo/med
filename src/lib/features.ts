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
    | "checkins"
    | "map"
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
}

export const ALL_FEATURES: FeatureDefinition[] = [
    { slug: "patients",           name: "Pacientes",              description: "Cadastro e gestão de pacientes",              category: "Cadastros" },
    { slug: "doctors",            name: "Médicos",                description: "Cadastro e gestão de médicos",                category: "Cadastros" },
    { slug: "hospitals",          name: "Hospitais",              description: "Cadastro e gestão de hospitais",              category: "Cadastros" },
    { slug: "specialties",        name: "Especialidades",         description: "Gestão de especialidades médicas",            category: "Cadastros" },
    { slug: "procedures",         name: "Procedimentos",          description: "Cadastro de procedimentos médicos",           category: "Cadastros" },
    { slug: "medications",        name: "Medicamentos",           description: "Cadastro e gestão de medicamentos",           category: "Cadastros" },
    { slug: "health-insurances",  name: "Convênios",              description: "Gestão de convênios e planos de saúde",       category: "Cadastros" },
    { slug: "practice-areas",     name: "Áreas de Atuação",       description: "Gestão de áreas de atuação",                 category: "Cadastros" },
    { slug: "packages",           name: "Planos/Pacotes",         description: "Gestão de planos e pacotes de serviço",       category: "Cadastros" },
    { slug: "payment-terms",      name: "Condições de Pagamento", description: "Gestão de prazos e condições de pagamento",   category: "Cadastros" },
    { slug: "scores",             name: "Pontuações",             description: "Gestão de pontuações e critérios",            category: "Cadastros" },
    { slug: "service-types",      name: "Tipos de Atendimento",   description: "Cadastro de tipos de atendimento",            category: "Cadastros" },
    { slug: "schedule",           name: "Agenda",                 description: "Agendamento e gestão de consultas",           category: "Operações" },
    { slug: "medical-records",    name: "Prontuário",             description: "Acesso ao prontuário eletrônico",             category: "Operações" },
    { slug: "tasks",              name: "Tarefas",                description: "Gestão de tarefas no quadro Kanban",          category: "Operações" },
    { slug: "proposals",          name: "Orçamentos",             description: "Criação e gestão de orçamentos/propostas",    category: "Operações" },
    { slug: "checkins",           name: "Check-ins",              description: "Registro e acompanhamento de check-ins",      category: "Operações" },
    { slug: "map",                name: "Mapa de Profissionais",  description: "Visualização do mapa de profissionais",       category: "Operações" },
    { slug: "consultations",      name: "Consultas",              description: "Listagem e gestão de consultas da clínica",   category: "Operações" },
    { slug: "surgeries",          name: "Cirurgias",              description: "Listagem e gestão de cirurgias da clínica",   category: "Operações" },
    { slug: "users",              name: "Usuários",               description: "Gestão de usuários da clínica",               category: "Administração" },
    { slug: "clinic-settings",    name: "Configurações",          description: "Configurações gerais da clínica",             category: "Administração" },
];

export const ALL_ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: "can_read",   label: "Visualizar" },
    { action: "can_create", label: "Criar" },
    { action: "can_update", label: "Editar" },
    { action: "can_delete", label: "Excluir" },
];

export const FEATURE_CATEGORIES = ["Cadastros", "Operações", "Administração"] as const;

export function getFeaturesByCategory(category: string): FeatureDefinition[] {
    return ALL_FEATURES.filter((f) => f.category === category);
}
