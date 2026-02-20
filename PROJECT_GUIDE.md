# PROJECT GUIDE — med

Sistema SaaS de **gestão médica multi-tenant** especializado em tireoide e câncer.  
Modelo de negócio: venda de **pacotes de acompanhamento** com timeline completa por paciente.

---

## Stack

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Next.js (App Router) | 16.x |
| Linguagem | TypeScript (strict) | 5.x |
| Estilos | Tailwind CSS v4 | 4.x |
| Componentes UI | shadcn/ui | latest |
| Selects | react-select | 5.x |
| Banco de dados | PostgreSQL | 15+ |
| ORM | drizzle-orm | 0.45.x |
| Migrations | drizzle-kit | 0.31.x |
| Validação | Zod | 4.x |
| Autenticação | next-auth | 4.x |
| Driver PG | postgres | 3.x |
| Pkg manager | **pnpm** | — |

> **Nunca usar `npm` ou `yarn`** — somente `pnpm`.

---

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15

---

## Instalação

```bash
pnpm install
cp .env.example .env.local   # configurar variáveis
pnpm db:migrate              # rodar migrations
pnpm dev                     # http://localhost:3000
```

---

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@localhost:5432/med
NEXTAUTH_SECRET=sua-chave-secreta
NEXTAUTH_URL=http://localhost:3000
```

---

## Scripts

```bash
pnpm dev           # Servidor de desenvolvimento
pnpm build         # Build de produção
pnpm lint          # ESLint
pnpm db:generate   # Gerar migrations (Drizzle)
pnpm db:migrate    # Executar migrations
pnpm db:studio     # Drizzle Studio (UI do banco)
```

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/             # Login, registro
│   ├── (dashboard)/        # Área autenticada
│   └── api/                # Route Handlers
├── components/
│   ├── ui/                 # shadcn/ui (gerado)
│   ├── shared/             # Componentes reutilizáveis
│   └── [rota]/             # Componentes por tela
├── db/
│   ├── index.ts            # Cliente Drizzle
│   ├── schema/             # Definição das tabelas
│   └── queries/            # Queries por módulo
├── hooks/                  # use-*.ts
├── lib/
│   ├── utils.ts            # cn() e helpers
│   └── validations/        # Schemas Zod
└── types/                  # Tipos globais
```

### Regra de componentes

```
components/[rota]/[NomeComponente]/index.tsx
```

Exemplos:
- `components/dashboard/MetricCard/index.tsx`
- `components/patients/PatientForm/index.tsx`
- `components/shared/DateFilter/index.tsx`

---

## Modelo de Dados (18 entidades)

### Multi-tenant
> Toda query **deve** filtrar por `clinic_id`. Nunca retornar dados sem escopo de tenant.

### Entidades

| Entidade | Descrição |
|----------|-----------|
| `clinics` | Tenant raiz — clínica ou hospital |
| `users` | Contas de acesso (gerenciadas pelo NextAuth) |
| `clinic_users` | Vínculo user ↔ clinic + role (`admin`, `doctor`, `receptionist`, `nurse`) |
| `addresses` | Endereços polimórficos: clínica (1), médico (N), paciente (N) |
| `specialties` | Especialidades médicas globais |
| `practice_areas` | Áreas de atuação — **independente** de specialties |
| `doctors` | Perfil profissional global (pode estar em múltiplas clínicas) |
| `clinic_doctors` | Vínculo doctor ↔ clinic |
| `doctor_specialties` | N:N médico ↔ especialidade |
| `doctor_practice_areas` | N:N médico ↔ área de atuação |
| `patients` | Paciente global por **CPF único** |
| `clinic_patients` | Vínculo patient ↔ clinic (deduplicação por CPF) |
| `doctor_schedules` | Disponibilidade do médico por dia da semana |
| `appointments` | Agendamentos (presencial, remoto, phone, whatsapp) |
| `service_records` | **Timeline do paciente** — todo atendimento registrado |
| `medical_records` | Prontuário eletrônico (1:1 com service_records clínicos) |
| `care_packages` | Pacotes de acompanhamento oferecidos pela clínica |
| `patient_packages` | Pacote comprado pelo paciente (controle de uso) |

### Tipos de atendimento (`service_records.type`)
`consultation` · `remote` · `phone` · `whatsapp` · `exam_review` · `other`

### Fora do MVP
- Financeiro (invoices, pagamentos)
- Multi-tenant URL / subdomínio por clínica

---

## Guias

| Guia | Finalidade |
|------|-----------|
| [project-conventions](.agent/skills/project-conventions/SKILL.md) | Regras para LLMs — ler antes de criar qualquer arquivo |
| [vercel-react-best-practices](.agent/skills/vercel-react-best-practices/SKILL.md) | Performance React/Next.js |
| [web-design-guidelines](.agent/skills/web-design-guidelines/SKILL.md) | Acessibilidade e UI |
| [entity-proposal](../../.gemini/antigravity/brain/f5bf5ca9-7482-4d8b-9bf1-61351bb60596/entity-proposal.md) | Entidades detalhadas com todos os campos |
