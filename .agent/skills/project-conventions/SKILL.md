---
name: project-conventions
description: >
  Convenções obrigatórias do projeto med. DEVE ser consultada antes de criar
  qualquer arquivo, componente, rota, query ou hook. Define stack, estrutura
  de pastas, padrões de nomenclatura, autenticação e regras de codificação.
metadata:
  author: project-team
  version: "1.3.0"
---

# Project Conventions — med

## Contexto do Domínio

**med** é um sistema SaaS de **gestão médica multi-tenant**. As principais entidades são:

- **Tenant** (`clinics`): Clínica ou hospital — raiz de todo o isolamento de dados
- **Usuários** (`users`): Administradores, recepcionistas, médicos (com roles)
- **Médicos** (`doctors`): Perfil profissional vinculado a um `user` e a uma `clinic`
- **Pacientes** (`patients`): Vinculados à `clinic`; podem ser atendidos por múltiplos médicos
- **Consultas** (`appointments`): Agendamentos entre médico e paciente

> **ISOLAMENTO MULTI-TENANT**: Toda query ao banco DEVE filtrar por `clinic_id` (ou `tenant_id`).  
> Nunca retornar dados sem escopar pelo tenant do usuário autenticado.

> **OBRIGATÓRIO**: Leia e aplique este guia em sua totalidade antes de criar ou
> modificar qualquer arquivo no projeto.

---

---

## 1. Arquitetura (Server / Cliente / Compartilhado)

No App Router, a separação é feita por **diretiva** (`"use server"` / `"use client"`), não por pasta. Cada pasta tem um papel claro:

| Zona | Pastas | O que vai aqui | Roda onde |
|------|--------|----------------|-----------|
| **Servidor** | `src/db/`, `src/app/actions/`, `src/app/api/`, `src/services/`, `src/auth*.ts` | ORM, queries, Server Actions (thin), Route Handlers, **lógica de negócio** (services), config auth | servidor |
| **Compartilhado** | `src/lib/`, `src/utils/`, `src/types/`, `src/lib/validations/` | `cn()`, geocode, máscaras, formatadores, schemas Zod, tipos | ambos |
| **Cliente** | `src/components/`, `src/hooks/` | Componentes React, custom hooks | cliente |

**Fluxo Action → Service → Query:**
- **Action** (`app/actions/`): auth check, parse FormData, valida com Zod, chama service, revalidatePath, retorna
- **Service** (`services/`): lógica de negócio, orquestra queries e `lib/geocode`, sem `"use server"` nem revalidatePath
- **Query** (`db/queries/`): SQL com Drizzle, apenas data access

**Regra crítica para utilitários:**
- `src/lib/utils.ts` — **apenas `cn()`** (convenção shadcn). **Nunca mover nem adicionar outras funções aqui.**
- `src/utils/` — funções puras: máscaras (`masks.ts`), formatadores de data/hora/CPF/currency. Novos utilitários vão aqui.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Observações |
|--------|-----------|-------------|
| Framework | **Next.js 16** (App Router) | Sempre usar App Router, nunca Pages Router |
| Linguagem | **TypeScript 5** (strict mode) | Proibido usar `any`; prefira tipos explícitos |
| Estilos | **Tailwind CSS v4** | Utility-first; evitar CSS inline ou módulos CSS |
| Componentes UI | **shadcn/ui** | Instalar via `pnpm dlx shadcn@latest add <component>` |
| Selects | **react-select 5** | Usar para todos os dropdowns/multi-selects complexos |
| Banco de dados | **PostgreSQL 15+** | Via Drizzle ORM |
| ORM | **drizzle-orm 0.45** | Schema em `src/db/schema`; queries em `src/db/queries` |
| Driver PG | **postgres 3** | Driver nativo para PostgreSQL |
| Validação | **Zod 4** | Validar toda entrada de dados: forms, API routes, env |
| Autenticação | **next-auth v4** | Sessão server-side; roles via JWT/session callback |
| Gerenciador de pacotes | **pnpm** | **Nunca usar npm ou yarn** |

---

## 3. Estrutura de Pastas

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: autenticação
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/            # Route group: área logada
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── financeiro/
│   │   │   ├── contas-receber/page.tsx
│   │   │   └── contas-pagar/page.tsx
│   │   └── layout.tsx
│   ├── actions/                # Server Actions ("use server") — backend
│   │   └── [dominio].ts
│   ├── api/                    # API Routes (Route Handlers) — backend
│   │   └── [recurso]/route.ts
│   ├── globals.css
│   └── layout.tsx              # Root layout
│
├── components/                 # Componentes React (cliente)
│   ├── ui/                     # Componentes shadcn/ui (gerados automaticamente)
│   ├── shared/                 # Componentes reutilizáveis entre rotas
│   │   ├── Header/
│   │   │   └── index.tsx
│   │   └── Sidebar/
│   │       └── index.tsx
│   └── [rota]/                 # Componentes específicos de uma rota
│       └── [NomeComponente]/
│           └── index.tsx
│
├── db/                         # Camada de dados (Drizzle + PostgreSQL) — servidor
│   ├── index.ts                # Instância do cliente Drizzle
│   ├── schema/                 # Definições de tabelas
│   │   └── [modulo].ts
│   └── queries/                # Queries organizadas por módulo (apenas data access)
│       ├── index.ts
│       └── [modulo]/
│           └── index.ts
│
├── services/                   # Lógica de negócio (servidor)
│   └── [dominio].ts            # create*, update*, delete* — orquestra queries + geocode
│
├── lib/                        # Convenções shadcn + validações + geocode (compartilhado)
│   ├── geocode.ts              # geocodeAddress() — chama HERE API diretamente
│   ├── utils.ts                # APENAS cn() — intocável, convenção shadcn
│   └── validations/            # Schemas Zod reutilizáveis
│       └── [dominio].ts
│
├── utils/                      # Utilitários puros (compartilhado)
│   ├── masks.ts                # Máscaras de input (telefone, CPF, etc.)
│   └── [formatter].ts          # Formatadores: data, hora, currency
│
├── hooks/                      # Custom React hooks (cliente)
│   └── use-[nome].ts
│
└── types/                      # Tipos TypeScript globais
    └── index.ts
```

---

## 4. Convenção de Componentes

### 4.1 Organização por Rota

Componentes são organizados pela **rota/tela em que são usados**, não por tipo.

```
REGRA: components/[rota]/[NomeComponente]/index.tsx
```

**Exemplos:**

| Rota | Componente | Caminho |
|------|-----------|---------|
| `/dashboard` | Card de métricas | `components/dashboard/MetricCard/index.tsx` |
| `/financeiro/contas-receber` | Tabela de devedores | `components/financeiro/contas-receber/DebtorsTable/index.tsx` |
| Reutilizável | Filtro de data | `components/shared/DateFilter/index.tsx` |
| shadcn | Button, Input... | `components/ui/button.tsx` *(gerado pelo shadcn)* |

### 4.2 Nomenclatura

- **Componentes**: PascalCase — `MetricCard`, `UserAvatar`
- **Arquivos de componente**: sempre `index.tsx` dentro da pasta do componente
- **Hooks**: camelCase com prefixo `use-` — `use-debtors.ts`
- **Utilitários**: camelCase — `format-currency.ts`
- **Rotas/pastas de rotas**: kebab-case — `contas-receber/`

### 4.3 Anatomia de um Componente

```tsx
// components/dashboard/MetricCard/index.tsx

import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// 1. Tipos da interface do componente
interface MetricCardProps extends ComponentProps<"div"> {
  title: string;
  value: string | number;
  trend?: number;
}

// 2. Componente (arrow function com export nomeado)
export function MetricCard({ title, value, trend, className, ...props }: MetricCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)} {...props}>
      {/* ... */}
    </div>
  );
}
```

**Regras:**
- Preferir **export nomeado** (não default) para componentes
- Sempre declarar Props com interface explícita
- Usar `cn()` de `@/lib/utils` para composição de classes Tailwind

---

## 5. Regras de Estilos (Tailwind)

- **Sempre Tailwind** — proibido CSS inline, exceto valores dinâmicos impossíveis de expressar em classes
- Usar `cn()` para composição condicional de classes
- Paleta de cores via variáveis CSS do shadcn/ui (`bg-card`, `text-foreground`, etc.)
- Responsividade: mobile-first (`sm:`, `md:`, `lg:`)
- **Dark mode**: suportado via classe `dark:` do Tailwind
- Breakpoints: seguir os padrões do Tailwind (não criar breakpoints customizados)

---

## 6. Banco de Dados e ORM (Drizzle)

### 6.1 Schema

```ts
// src/db/schema/patients.ts
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 6.2 Queries

Organizar queries por módulo dentro de `src/db/queries/[modulo]/`:

```ts
// src/db/queries/patients/index.ts
import { db } from "@/db";
import { patients } from "@/db/schema/patients";

export async function getPatients() {
  return db.select().from(patients);
}
```

---

## 7. Validação (Zod)

- **Toda entrada de dados** (formulários, body de API, env vars) deve ser validada com Zod
- Schemas reutilizáveis em `src/lib/validations/`
- Schemas de API junto ao Route Handler ou importados de `validations/`

```ts
// src/lib/validations/patient.ts
import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2).max(255),
  birthDate: z.string().date(),
});

export type PatientInput = z.infer<typeof patientSchema>;
```

---

## 8. Server Actions e Services

**Action thin** — apenas orquestra:

```ts
// app/actions/doctors.ts
export async function createDoctorAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.clinicId) throw new Error("Unauthorized");

  const parsed = createDoctorSchema.safeParse({ ...Object.fromEntries(formData), ... });
  if (!parsed.success) return { error: "Dados inválidos", details: parsed.error.flatten() };

  const result = await createDoctor(parsed.data, session.user.clinicId);
  if (!result.success) return { error: result.error };

  revalidatePath("/doctors");
  return { success: true };
}
```

**Service** — lógica de negócio em `src/services/[dominio].ts`:

```ts
// services/doctors.ts — sem "use server"
export async function createDoctor(data: CreateDoctorInput, clinicId: string) {
  // regras de negócio, chama queries, geocode se necessário
  return { success: true } | { success: false; error: string };
}
```

---

## 9. API Routes (Route Handlers) e Geocode

A rota `/api/geocode` permanece para uso **client-side** (formulários de endereço). No servidor, use `geocodeAddress()` de `@/lib/geocode` diretamente.

```ts
// src/app/api/patients/route.ts
import { NextResponse } from "next/server";
import { patientSchema } from "@/lib/validations/patient";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = patientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // ... lógica de negócio
}
```

---

## 10. TypeScript

- `strict: true` no `tsconfig.json` — obrigatório
- Proibido `any` — usar `unknown` + type guards quando necessário
- Preferir `type` para tipos simples/unions, `interface` para objetos extensíveis
- Imports absolutos via alias `@/` (configurado no tsconfig)

---

## 11. Checklist antes de Criar Código

Antes de gerar qualquer arquivo, responda:

- [ ] O componente está na pasta correta pela rota? (`components/[rota]/[Nome]/index.tsx`)
- [ ] Estou usando `pnpm` para instalar dependências?
- [ ] Estou usando Tailwind + `cn()` para estilos?
- [ ] Existe validação Zod para toda entrada de dados?
- [ ] As queries estão no módulo correto dentro de `src/db/queries/`?
- [ ] Estou evitando `any` no TypeScript?
- [ ] Estou usando shadcn/ui como base antes de criar componentes do zero?
- [ ] O componente tem export nomeado (não default)?
- [ ] É um utilitário puro (máscara, formatador)? → `src/utils/`. É o `cn()`? → `@/lib/utils` (não criar em utils).
- [ ] Lógica de negócio complexa? → `src/services/`. Action só orquestra (auth, validação, revalidatePath).
