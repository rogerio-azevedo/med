# PROJECT GUIDE — med

> Documento central do projeto. Leia antes de contribuir.

---

## Visão Geral

Aplicação web desenvolvida com Next.js (App Router) para [descrever o propósito do sistema med].

---

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 15+ (App Router) |
| Linguagem | TypeScript (strict) |
| Estilos | Tailwind CSS v4 |
| Componentes UI | shadcn/ui |
| Selects | React-Select |
| Banco de dados | PostgreSQL |
| ORM | Drizzle |
| Validação | Zod |
| Gerenciador de pacotes | **pnpm** |

---

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15

---

## Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com as credenciais do banco

# 3. Executar migrations
pnpm db:migrate

# 4. Iniciar em desenvolvimento
pnpm dev
```

---

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rotas de autenticação (login, registro)
│   ├── (dashboard)/        # Área protegida (rotas autenticadas)
│   └── api/                # Route Handlers (API REST interna)
│
├── components/             # Componentes React
│   ├── ui/                 # shadcn/ui (gerado automaticamente)
│   ├── shared/             # Componentes reutilizáveis entre rotas
│   └── [rota]/             # Componentes específicos de cada tela
│
├── db/                     # Drizzle ORM
│   ├── schema/             # Definição das tabelas
│   └── queries/            # Queries organizadas por módulo
│
├── hooks/                  # Custom hooks (use-*.ts)
├── lib/                    # Utilitários e helpers
│   └── validations/        # Schemas Zod
└── types/                  # Tipos TypeScript globais
```

---

## Convenção de Componentes

Componentes são agrupados pela **rota em que são usados**:

```
components/
  dashboard/
    MetricCard/
      index.tsx       ← Componente
  financeiro/
    contas-receber/
      DebtorsTable/
        index.tsx
  shared/
    DateFilter/
      index.tsx       ← Reutilizado em múltiplas telas
```

**Regra geral:** `components/[rota]/[NomeComponente]/index.tsx`

---

## Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento (http://localhost:3000)
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Checar erros de lint
pnpm db:generate  # Gerar migrations (Drizzle)
pnpm db:migrate   # Executar migrations
pnpm db:studio    # Abrir Drizzle Studio (UI do banco)
```

---

## Guias Relacionados

- [**Conventions Skill**](.agent/skills/project-conventions/SKILL.md) — Guia detalhado para LLMs com todas as regras de código
- [**Vercel React Best Practices**](.agent/skills/vercel-react-best-practices/SKILL.md) — Performance e padrões React/Next.js
- [**Web Design Guidelines**](.agent/skills/web-design-guidelines/SKILL.md) — Acessibilidade e UI

---

## Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/med

# Next.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## Contribuição

1. Antes de criar qualquer arquivo, leia o guia de convenções em `.agent/skills/project-conventions/SKILL.md`
2. Use `pnpm` exclusivamente para gerenciar pacotes
3. Todo PR deve passar no `pnpm lint` sem erros
4. Componentes novos precisam de tipos TypeScript explícitos (sem `any`)
