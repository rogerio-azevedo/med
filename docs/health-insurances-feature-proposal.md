# Proposta Tecnica: Feature de Convenios Medicos

## Objetivo

Implementar uma nova feature de convenios medicos que permita:

- Criar, editar, listar e excluir convenios
- Vincular e remover convenios aceitos por clinicas
- Vincular e remover convenios aceitos por medicos
- Vincular convenios a pacientes com dados da carteirinha/plano
- Validar compatibilidade entre paciente, clinica e medico em fluxos futuros

## Contexto Atual

Hoje o projeto possui:

- `patients`, `doctors` e `clinics` como entidades principais
- Relacoes N:N para medico-clinica e paciente-medico
- `patients.healthInsurance` em `jsonb`, o que nao escala bem para busca, filtros, validacao e governanca de dados

Trecho relevante:

- [src/db/schema/medical.ts](/Users/rogerio/Projetos/TESTE/med/src/db/schema/medical.ts#L167)

## Regras de Negocio

As regras propostas para a feature sao:

1. Um paciente pode ter um ou mais convenios.
2. Uma clinica pode aceitar um ou mais convenios.
3. Um medico pode aceitar um ou mais convenios.
4. Um convenio aceito pela clinica nao implica que todos os medicos da clinica o aceitam.
5. Um atendimento coberto por convenio exige a intersecao entre:
   - convenio vinculado ao paciente
   - convenio aceito pela clinica
   - convenio aceito pelo medico
6. O cadastro do convenio deve ser catalogo reutilizavel, nao texto livre repetido em cada entidade.

## Modelagem de Dados Proposta

### 1. Tabela catalogo: `health_insurances`

Representa a operadora/convenio em si.

Campos sugeridos:

- `id: uuid`
- `name: varchar(150)` - nome exibido
- `code: varchar(50)` - codigo interno opcional
- `ansCode: varchar(30)` - opcional
- `notes: text` - opcional
- `isActive: boolean`
- `createdAt: timestamp`
- `updatedAt: timestamp`

Observacoes:

- `name` deve ter indice e, idealmente, unicidade case-insensitive no futuro
- `isActive` e preferivel a delete fisico para preservar historico

### 2. Tabela de vinculo: `clinic_health_insurances`

Relaciona clinicas com convenios aceitos.

Campos sugeridos:

- `id: uuid`
- `clinicId: uuid`
- `healthInsuranceId: uuid`
- `isActive: boolean`
- `createdAt: timestamp`

Restricoes:

- unique `(clinicId, healthInsuranceId)`

### 3. Tabela de vinculo: `doctor_health_insurances`

Relaciona medicos com convenios aceitos.

Campos sugeridos:

- `id: uuid`
- `doctorId: uuid`
- `healthInsuranceId: uuid`
- `isActive: boolean`
- `createdAt: timestamp`

Restricoes:

- unique `(doctorId, healthInsuranceId)`

### 4. Tabela de vinculo: `patient_health_insurances`

Relaciona pacientes com convenios e armazena dados da carteirinha/plano.

Campos sugeridos:

- `id: uuid`
- `patientId: uuid`
- `healthInsuranceId: uuid`
- `cardNumber: varchar(100)` - numero da carteirinha
- `planName: varchar(150)` - nome comercial do plano
- `planCode: varchar(50)` - codigo do plano
- `holderName: varchar(255)` - titular
- `holderCpf: varchar(14)` - titular
- `validUntil: date`
- `isPrimary: boolean`
- `isActive: boolean`
- `createdAt: timestamp`
- `updatedAt: timestamp`

Restricoes:

- indice por `patientId`
- regra de apenas um `isPrimary = true` por paciente deve ser tratada na aplicacao inicialmente

## Decisoes Arquiteturais

### Catalogo global

`health_insurances` deve ser global, assim como especialidades e areas de atuacao. Isso evita duplicidade e facilita:

- padronizacao de nomes
- filtros e relatorios
- reutilizacao por varias clinicas
- manutencao centralizada

### Vinculos separados por contexto

Nao devemos guardar "clinica aceita" ou "medico aceita" dentro da tabela do convenio. Os vinculos separados escalam melhor e deixam as regras claras.

### Convenio do paciente separado do catalogo

Os dados da carteirinha nao pertencem ao catalogo do convenio. Eles pertencem ao relacionamento paciente-convenio.

### Remocao logica nos vinculos

Nos vinculos com clinica, medico e paciente, preferir `isActive` em vez de delete fisico. Isso preserva historico e simplifica auditoria.

## Impacto na Base Atual

### Remocao gradual de `patients.healthInsurance`

Campo atual:

- [src/db/schema/medical.ts](/Users/rogerio/Projetos/TESTE/med/src/db/schema/medical.ts#L177)

Plano:

1. Criar as novas tabelas
2. Adaptar leitura/escrita da aplicacao para o novo modelo
3. Migrar dados existentes do `jsonb` para `patient_health_insurances`, se houver uso real
4. Remover o campo legado em migracao posterior

### Ajustes em consultas

Sera necessario atualizar queries que retornam dados de paciente, medico e clinica para incluir convenios quando necessario.

## Estrutura de Arquivos Proposta

### Banco e schema

- `src/db/schema/medical.ts`
  - adicionar novas tabelas
- `drizzle/00xx_health_insurances.sql`
  - migration

### Queries

- `src/db/queries/health-insurances.ts`
  - CRUD do catalogo
- `src/db/queries/doctors/index.ts`
  - incluir convenios aceitos pelo medico em consultas detalhadas
- `src/db/queries/patients/index.ts`
  - incluir convenios do paciente
- criar `src/db/queries/clinics/health-insurances.ts` se a equipe quiser separar por dominio

### Validacoes

- `src/lib/validations/health-insurance.ts`
  - schema de criacao/edicao do catalogo
  - schema de vinculo a medico
  - schema de vinculo a clinica
  - schema de vinculo a paciente

### Servicos

- `src/services/health-insurances.ts`
  - regra de negocio principal
  - protecao contra duplicidade
  - regra de convenio principal do paciente

### Server actions

- `src/app/actions/health-insurances.ts`
  - CRUD do catalogo
  - vinculos com medico
  - vinculos com clinica
  - vinculos com paciente

### Interface

- `src/app/(dashboard)/health-insurances/page.tsx`
  - pagina de catalogo
- `src/components/health-insurances/*`
  - tabela
  - dialog de criacao
  - dialog de edicao
  - dialog de exclusao
- `src/components/doctors/*`
  - secao para selecionar convenios aceitos
- `src/components/patients/*`
  - secao para vincular convenios do paciente
- tela de clinica:
  - pagina dedicada ou secao no detalhe da clinica

## Contratos de Dados

### Catalogo de convenio

```ts
type HealthInsuranceInput = {
  name: string;
  code?: string;
  ansCode?: string;
  notes?: string;
};
```

### Vinculo do medico

```ts
type AttachDoctorHealthInsuranceInput = {
  doctorId: string;
  healthInsuranceIds: string[];
};
```

### Vinculo da clinica

```ts
type AttachClinicHealthInsuranceInput = {
  clinicId: string;
  healthInsuranceIds: string[];
};
```

### Vinculo do paciente

```ts
type PatientHealthInsuranceInput = {
  healthInsuranceId: string;
  cardNumber?: string;
  planName?: string;
  planCode?: string;
  holderName?: string;
  holderCpf?: string;
  validUntil?: string;
  isPrimary?: boolean;
};
```

## Fluxos da Aplicacao

### 1. CRUD do catalogo de convenios

Fluxo:

1. Usuario acessa `/health-insurances`
2. Lista convenios cadastrados
3. Pode criar, editar, inativar ou excluir

Regras:

- nao permitir duplicidade de nome sem tratamento
- ao excluir, validar se o convenio esta em uso
- preferir inativacao quando houver vinculos existentes

### 2. Vincular convenios a uma clinica

Fluxo:

1. Usuario acessa o detalhe da clinica
2. Visualiza convenios aceitos
3. Adiciona ou remove vinculos

Regras:

- vinculo e por clinica
- nao duplicar linhas
- remocao deve ser logica se o historico for importante

### 3. Vincular convenios a um medico

Fluxo:

1. Usuario acessa cadastro/edicao do medico
2. Visualiza convenios aceitos
3. Adiciona ou remove vinculos

Regras:

- medico pode aceitar menos convenios que a clinica
- opcionalmente, o frontend pode destacar convenios aceitos pela clinica e ainda nao aceitos pelo medico

### 4. Vincular convenios a um paciente

Fluxo:

1. Usuario acessa cadastro/edicao do paciente
2. Informa um ou mais convenios
3. Marca um como principal
4. Salva dados da carteirinha

Regras:

- permitir multiplos convenios
- um unico convenio principal por paciente
- manter historico via `isActive`

## Regras de Validacao

### Banco

- unicidade nos vinculos N:N
- foreign keys com `onDelete: cascade` nos vinculos
- indices por chaves estrangeiras

### Aplicacao

- evitar mais de um convenio principal por paciente
- ao marcar um novo principal, desmarcar os demais
- validar que o medico pertence a clinica quando a tela estiver operando no contexto da clinica
- em fluxos futuros de agenda, bloquear combinacoes invalidas

## Consultas Futuras Importantes

### Convenios aceitos para agendamento

Criar helper para retornar apenas convenios validos para um contexto:

```ts
getEligibleHealthInsurances({
  clinicId,
  doctorId,
  patientId,
})
```

Resultado esperado:

- lista de convenios que o paciente possui
- filtrada pelos convenios aceitos pela clinica
- filtrada pelos convenios aceitos pelo medico

Isso prepara a base para agenda, triagem e faturamento.

## Permissoes e Autorizacao

Sugestao inicial:

- `admin`
  - CRUD do catalogo
  - vinculo com clinica
  - vinculo com medico
  - vinculo com paciente
- `doctor`
  - visualizar proprios convenios aceitos
  - opcionalmente editar os proprios convenios
- `receptionist`
  - vincular convenio ao paciente
- `patient`
  - apenas visualizar, se houver portal futuro

## Estrategia de Implementacao

### Fase 1 - Base da feature

- criar schema e migration
- criar queries do catalogo
- criar actions e componentes do CRUD de convenios

Entregavel:

- pagina `/health-insurances` funcionando

### Fase 2 - Vinculo com clinica

- criar actions de attach/detach
- criar UI no contexto da clinica
- criar listagem de convenios aceitos por clinica

Entregavel:

- clinica passa a manter sua lista oficial de convenios aceitos

### Fase 3 - Vinculo com medico

- criar actions de attach/detach
- adicionar selecao no fluxo de medico
- incluir convenios em `getDoctorsByClinic` e `getDoctorDetails` quando necessario

Entregavel:

- medico passa a informar os convenios que realmente aceita

### Fase 4 - Vinculo com paciente

- substituir `healthInsurance` legado por relacao nova
- atualizar form de paciente
- atualizar query de detalhes do paciente

Entregavel:

- paciente com um ou mais convenios e dados estruturados

### Fase 5 - Elegibilidade

- criar helper de compatibilidade
- integrar com agenda ou fluxo de atendimento

Entregavel:

- sistema consegue validar cobertura no contexto clinica + medico + paciente

## Riscos e Pontos de Atencao

- o campo legado `patients.healthInsurance` pode conter dados inconsistentes para migracao
- se exclusao fisica for usada cedo demais, pode quebrar historico
- sem regra de negocio clara para `isPrimary`, o paciente pode acabar com varios convenios principais
- se o medico puder ser global e atuar em varias clinicas, a regra de aceite por medico deve continuar global ou ser revista no futuro

## Decisao em Aberto

Existe uma decisao funcional que vale alinhar antes da implementacao completa:

### Aceite do medico deve ser global ou por clinica?

Opcao atual recomendada:

- `doctor_health_insurances` global por medico

Vantagens:

- mais simples
- combina com a modelagem atual do medico como perfil global

Limitacao:

- se o medico aceitar um convenio apenas em uma clinica, essa modelagem nao captura a variacao por clinica

Alternativa para cenario mais complexo:

- `doctor_clinic_health_insurances`
  - `doctorId`
  - `clinicId`
  - `healthInsuranceId`

Minha recomendacao:

- iniciar com `doctor_health_insurances` se a regra de negocio atual for realmente global
- se houver chance real de "medico aceita o plano A na clinica X, mas nao na clinica Y", entao vale modelar direto com `doctorId + clinicId + healthInsuranceId`

Pelo teu exemplo, existe um caso de "clinica aceita, medico nao aceita", mas nao necessariamente um caso de "mesmo medico aceita em uma clinica e nao aceita em outra". Se isso existir, a modelagem precisa nascer com contexto de clinica.

## Recomendacao Final

Para o estado atual do produto, a proposta mais equilibrada e escalavel e:

- `health_insurances` como catalogo global
- `clinic_health_insurances` para aceite da clinica
- `doctor_health_insurances` para aceite do medico
- `patient_health_insurances` para posse do paciente

Se voces antecipam regra por medico dentro da clinica, substituam `doctor_health_insurances` por `doctor_clinic_health_insurances` antes de implementar.

## Backlog Tecnico Sugerido

1. Criar migration e schema Drizzle
2. Criar queries do catalogo
3. Criar validations Zod
4. Criar `services/health-insurances.ts`
5. Criar `app/actions/health-insurances.ts`
6. Criar CRUD de catalogo
7. Adicionar gestao de convenios da clinica
8. Adicionar gestao de convenios do medico
9. Migrar paciente para modelo relacional
10. Criar helper de elegibilidade

