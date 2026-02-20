---
name: project-conventions
description: >
  Convenções obrigatórias do projeto med. DEVE ser consultada antes de criar
  qualquer arquivo, componente, rota, query ou hook. Define stack, estrutura
  de pastas, padrões de nomenclatura, autenticação e regras de codificação.
metadata:
  author: project-team
  version: "1.1.0"
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

## 1. Stack Tecnológica

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

## 2. Estrutura de Pastas

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
│   ├── api/                    # API Routes (Route Handlers)
│   │   └── [recurso]/route.ts
│   ├── globals.css
│   └── layout.tsx              # Root layout
│
├── components/                 # Todos os componentes React
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
├── db/                         # Camada de dados (Drizzle + PostgreSQL)
│   ├── index.ts                # Instância do cliente Drizzle
│   ├── schema/                 # Definições de tabelas
│   │   └── [modulo].ts
│   └── queries/                # Queries organizadas por módulo
│       ├── index.ts
│       └── [modulo]/
│           └── index.ts
│
├── lib/                        # Utilitários e helpers
│   ├── utils.ts                # Funções utilitárias gerais (ex: cn())
│   └── validations/            # Schemas Zod reutilizáveis
│       └── [dominio].ts
│
├── hooks/                      # Custom React hooks
│   └── use-[nome].ts
│
└── types/                      # Tipos TypeScript globais
    └── index.ts
```

---

## 3. Convenção de Componentes

### 3.1 Organização por Rota

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

### 3.2 Nomenclatura

- **Componentes**: PascalCase — `MetricCard`, `UserAvatar`
- **Arquivos de componente**: sempre `index.tsx` dentro da pasta do componente
- **Hooks**: camelCase com prefixo `use-` — `use-debtors.ts`
- **Utilitários**: camelCase — `format-currency.ts`
- **Rotas/pastas de rotas**: kebab-case — `contas-receber/`

### 3.3 Anatomia de um Componente

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

## 4. Regras de Estilos (Tailwind)

- **Sempre Tailwind** — proibido CSS inline, exceto valores dinâmicos impossíveis de expressar em classes
- Usar `cn()` para composição condicional de classes
- Paleta de cores via variáveis CSS do shadcn/ui (`bg-card`, `text-foreground`, etc.)
- Responsividade: mobile-first (`sm:`, `md:`, `lg:`)
- **Dark mode**: suportado via classe `dark:` do Tailwind
- Breakpoints: seguir os padrões do Tailwind (não criar breakpoints customizados)

---

## 5. Banco de Dados e ORM (Drizzle)

### 5.1 Schema

```ts
// src/db/schema/patients.ts
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 5.2 Queries

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

## 6. Validação (Zod)

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

## 7. API Routes (Route Handlers)

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

## 8. TypeScript

- `strict: true` no `tsconfig.json` — obrigatório
- Proibido `any` — usar `unknown` + type guards quando necessário
- Preferir `type` para tipos simples/unions, `interface` para objetos extensíveis
- Imports absolutos via alias `@/` (configurado no tsconfig)

---

## 9. Checklist antes de Criar Código

Antes de gerar qualquer arquivo, responda:

- [ ] O componente está na pasta correta pela rota? (`components/[rota]/[Nome]/index.tsx`)
- [ ] Estou usando `pnpm` para instalar dependências?
- [ ] Estou usando Tailwind + `cn()` para estilos?
- [ ] Existe validação Zod para toda entrada de dados?
- [ ] As queries estão no módulo correto dentro de `src/db/queries/`?
- [ ] Estou evitando `any` no TypeScript?
- [ ] Estou usando shadcn/ui como base antes de criar componentes do zero?
- [ ] O componente tem export nomeado (não default)?
