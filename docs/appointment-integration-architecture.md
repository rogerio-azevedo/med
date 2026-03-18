# Integração Externa de Agenda: Documento Técnico Interno

## Objetivo
Expor uma API externa para criação, edição e cancelamento de agendamentos a partir de plataformas de automação. A integração é inbound: o sistema terceiro chama a API do Med por HTTP, com autenticação Bearer.

## Escopo da v1
- Criar agendamento.
- Editar agendamento.
- Cancelar agendamento.
- Autenticação dedicada por credencial de integração.
- Revogação e rotação imediata do token.

## Fora de escopo nesta fase
- Leitura ampla da agenda.
- Criação automática de pacientes.
- Resolução de médico por CRM.
- Exclusão física de agendamento.
- Idempotência persistida por `externalRequestId`.

## Arquitetura resumida
1. A clínica cria uma credencial de integração.
2. O backend gera um JWT longo com `type=integration`, `scope=appointments:write`, `clinicId`, `sub` e `jti`.
3. O terceiro envia chamadas HTTP para `/api/integrations/appointments`.
4. A API valida a assinatura do JWT e cruza `jti` com a tabela `appointment_integration_credentials`.
5. O backend valida payload, escopo da clínica e conflito de agenda.
6. O serviço de agendamentos executa a operação.

## Estratégia de autenticação
- Tabela: `appointment_integration_credentials`.
- Campos principais:
  - `id`
  - `clinicId`
  - `name`
  - `scope`
  - `tokenJti`
  - `isActive`
  - `lastUsedAt`
  - `revokedAt`
  - `createdAt`
  - `updatedAt`
- Token JWT:
  - sem expiração curta;
  - assinado com `APPOINTMENT_INTEGRATION_JWT_SECRET` ou fallback em `NEXTAUTH_SECRET`;
  - revogação imediata por troca/invalidação do `jti`.

## Regras de negócio
- Escopo exclusivo: `appointments:write`.
- “Excluir” = cancelar via status `cancelled`.
- O médico pode ser enviado por `doctorId` interno ou por `doctorCrm` + `doctorCrmState`, e precisa pertencer à clínica do token.
- O paciente pode ser informado por `patientId` ou CPF.
- Se o paciente for enviado por CPF, o CPF é normalizado e procurado apenas dentro da clínica.
- Se não existir paciente na clínica, a API retorna `404`.
- Se houver conflito de horário, a API retorna `409`.
- `specialtyId` é opcional.
- `externalRequestId` é aceito para rastreabilidade documental, mas não evita duplicidade nesta v1.

## Endpoints
### `POST /api/integrations/appointments`
- Cria agendamento.

### `PATCH /api/integrations/appointments/:appointmentId`
- Atualiza:
  - `scheduledAt`
  - `durationMinutes`
  - `modality`
  - `notes`
  - `doctorId`
  - `patientId` ou `patientCpf`
  - `specialtyId`

### `DELETE /api/integrations/appointments/:appointmentId`
- Cancela o agendamento.

## Códigos de erro
- `401`: token ausente, inválido ou revogado.
- `403`: escopo insuficiente.
- `404`: médico, paciente, especialidade ou agendamento não encontrado.
- `409`: conflito de horário.
- `422`: payload inválido ou regra de negócio não atendida.

## Operação administrativa
- Backend pronto para:
  - criar credencial;
  - listar credenciais;
  - revogar credencial;
  - rotacionar token.
- O token deve ser exibido apenas no momento da emissão/rotação.
- O integrador deve armazená-lo em cofre seguro.
