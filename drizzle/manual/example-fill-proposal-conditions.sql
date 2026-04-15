-- Exemplo manual (após migrations). Coluna única na clínica: proposal_general_notes.

UPDATE clinics
SET proposal_general_notes = $g$
• Orçamento válido por 15 dias
• No caso de complicações que necessitem período maior de internação, novo orçamento será apresentado, configurando-se gastos extras
$g$
WHERE id = (SELECT id FROM clinics LIMIT 1);
