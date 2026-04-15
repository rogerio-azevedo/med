ALTER TABLE "service_types" ADD COLUMN IF NOT EXISTS "timeline_icon_key" varchar(40);
ALTER TABLE "service_types" ADD COLUMN IF NOT EXISTS "timeline_color_hex" varchar(7);

-- Sugestão inicial por fluxo / nome (editável em Tipos de Atendimento)
UPDATE "service_types"
SET timeline_icon_key = 'scissors', timeline_color_hex = '#e11d48'
WHERE workflow = 'surgery' AND timeline_icon_key IS NULL;

UPDATE "service_types"
SET timeline_icon_key = 'stethoscope', timeline_color_hex = '#0ea5e9'
WHERE workflow = 'consultation' AND timeline_icon_key IS NULL;

UPDATE "service_types"
SET timeline_icon_key = 'microscope', timeline_color_hex = '#7c3aed'
WHERE workflow = 'exam_review' AND timeline_icon_key IS NULL;

UPDATE "service_types"
SET timeline_icon_key = 'clipboard_list', timeline_color_hex = '#d97706'
WHERE workflow = 'procedure' AND timeline_icon_key IS NULL;

UPDATE "service_types"
SET timeline_icon_key = 'video', timeline_color_hex = '#06b6d4'
WHERE timeline_icon_key IS NULL
  AND (lower(name) LIKE '%vídeo%' OR lower(name) LIKE '%video%');

UPDATE "service_types"
SET timeline_icon_key = 'flask_conical', timeline_color_hex = '#059669'
WHERE timeline_icon_key IS NULL AND lower(name) LIKE '%exame%';

UPDATE "service_types"
SET timeline_icon_key = 'scissors', timeline_color_hex = '#e11d48'
WHERE timeline_icon_key IS NULL AND lower(name) LIKE '%cirurg%';

UPDATE "service_types"
SET timeline_icon_key = 'stethoscope', timeline_color_hex = '#0ea5e9'
WHERE timeline_icon_key IS NULL AND lower(name) LIKE '%consulta%';

UPDATE "service_types"
SET timeline_icon_key = 'file_text', timeline_color_hex = '#64748b'
WHERE timeline_icon_key IS NULL;

UPDATE "service_types"
SET timeline_color_hex = '#64748b'
WHERE timeline_color_hex IS NULL;
