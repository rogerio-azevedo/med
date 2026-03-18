# Integração de Agenda por Webhook

## Visão geral
Você pode integrar uma ferramenta externa de automação ao Med enviando requisições HTTP autenticadas para a API de agenda. Na prática, o “webhook” da ferramenta externa fará chamadas para o Med para criar, editar ou cancelar agendamentos.

## Pré-requisitos
- URL base do sistema Med.
- Token Bearer da integração.
- CRM + UF do médico ou `doctorId` interno.
- CPF do paciente ou `patientId` interno.
- Data/hora no formato ISO 8601 com fuso explícito.

## Variáveis de ambiente do Med
- `DATABASE_URL`: conexão com o banco.
- `APPOINTMENT_INTEGRATION_JWT_SECRET`: segredo recomendado para assinar os tokens da integração.
- `NEXTAUTH_SECRET`: pode ser usado como fallback, mas o ideal é manter um segredo separado para integrações.

Exemplo:

```txt
2026-03-18T14:30:00-04:00
```

## Autenticação
Envie o token no header:

```http
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

## Passo a passo
### 1. Obter o token
Solicite à equipe do Med a criação de uma credencial de integração para sua clínica. O token será exibido apenas no momento da criação ou rotação.

Para teste local, o Med já possui um script de geração:

```bash
pnpm integration:token <clinicId> "Teste Insomnia"
```

Exemplo:

```bash
pnpm integration:token 11111111-2222-3333-4444-555555555555 "Teste Insomnia"
```

O comando imprime:
- `credentialId`
- `clinicId`
- `name`
- `scope`
- o JWT Bearer para usar no Insomnia

### 2. Configurar o webhook da ferramenta externa
- Método HTTP: `POST`, `PATCH` ou `DELETE`
- URL:
  - criação: `/api/integrations/appointments`
  - edição: `/api/integrations/appointments/{appointmentId}`
  - cancelamento: `/api/integrations/appointments/{appointmentId}`
- Headers:
  - `Authorization: Bearer SEU_TOKEN`
  - `Content-Type: application/json`

### 3. Enviar os dados do agendamento
Campos suportados na criação:
- `doctorId` obrigatório
  - alternativa: `doctorCrm` + `doctorCrmState`
- `patientId` ou `patientCpf` obrigatório
- `scheduledAt` obrigatório
- `durationMinutes` obrigatório
- `modality` obrigatório
- `specialtyId` opcional
- `notes` opcional
- `externalRequestId` opcional

### 4. Tratar a resposta
- `201` criação com sucesso
- `200` edição/cancelamento com sucesso
- `401` token ausente, inválido ou revogado
- `404` recurso não encontrado
- `409` horário em conflito
- `422` payload inválido

## Como mapear seus dados para o Med
- `doctorId`: ID interno do médico no Med.
- `doctorCrm`: CRM do médico, somente números ou texto simples.
- `doctorCrmState`: UF do CRM, por exemplo `MT`, `SP`, `GO`.
- `patientId`: ID interno do paciente no Med.
- `patientCpf`: use quando você não tiver o `patientId`.
- `scheduledAt`: data/hora da consulta em ISO 8601.
- `durationMinutes`: duração em minutos.
- `modality`:
  - `in_person`
  - `remote`
  - `phone`
  - `whatsapp`
- `notes`: observações livres.

## Exemplo de criação
```bash
curl -X POST "https://seu-dominio.com/api/integrations/appointments" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "2d9fe4d0-c4df-4937-95a0-fec2a5181d10",
    "doctorCrm": "12345",
    "doctorCrmState": "MT",
    "patientCpf": "12345678901",
    "scheduledAt": "2026-03-18T14:30:00-04:00",
    "durationMinutes": 30,
    "modality": "in_person",
    "notes": "Agendamento criado via automação",
    "externalRequestId": "flow-appointment-0001"
  }'
```

Resposta esperada:

```json
{
  "id": "a4a9f138-d19f-4552-a30f-b405ad6444f9",
  "status": "scheduled",
  "scheduledAt": "2026-03-18T14:30:00-04:00",
  "durationMinutes": 30,
  "doctorId": "2d9fe4d0-c4df-4937-95a0-fec2a5181d10",
  "patientId": "90d06dfb-6e7d-47ad-b9b1-7fcae9a9847c",
  "externalRequestId": "flow-appointment-0001"
}
```

## Exemplo de edição
```bash
curl -X PATCH "https://seu-dominio.com/api/integrations/appointments/a4a9f138-d19f-4552-a30f-b405ad6444f9" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2026-03-18T15:00:00-04:00",
    "durationMinutes": 45,
    "notes": "Horário ajustado pela automação"
  }'
```

## Exemplo de cancelamento
```bash
curl -X DELETE "https://seu-dominio.com/api/integrations/appointments/a4a9f138-d19f-4552-a30f-b405ad6444f9" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta esperada:

```json
{
  "id": "a4a9f138-d19f-4552-a30f-b405ad6444f9",
  "status": "cancelled"
}
```

## Exemplo de configuração genérica de webhook
- Método: `POST`
- URL: `https://seu-dominio.com/api/integrations/appointments`
- Headers:
  - `Authorization: Bearer SEU_TOKEN`
  - `Content-Type: application/json`
- Body JSON:

```json
{
  "doctorCrm": "{{crm_medico}}",
  "doctorCrmState": "{{uf_crm_medico}}",
  "patientCpf": "{{paciente_cpf}}",
  "scheduledAt": "{{data_iso}}",
  "durationMinutes": 30,
  "modality": "in_person",
  "notes": "{{observacoes}}",
  "externalRequestId": "{{id_execucao}}"
}
```

## Boas práticas
- Envie sempre `scheduledAt` com fuso explícito.
- Armazene o token em local seguro.
- Trate `409` como conflito real de agenda.
- Trate `422` como erro de payload ou de regra de entrada.
- Reenvios podem gerar duplicidade nesta versão, porque `externalRequestId` ainda não é idempotente.
- Se o token for revogado, gere um novo token antes de retomar o fluxo.
