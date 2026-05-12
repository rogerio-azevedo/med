import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper to format dates
function formatDate(date: Date | string | null | undefined, formatStr: string = "dd/MM/yyyy") {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return format(d, formatStr, { locale: ptBR });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Valores dos atalhos @@… para exibição em HTML (preview/impressão). */
function variableAsHtml(value: string): string {
  if (!value) return "";
  return `<strong>${escapeHtml(value)}</strong>`;
}

type TemplateAddress = {
  isPrimary?: boolean | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

type TemplatePatient = {
  id?: string | null;
  name?: string | null;
  cpf?: string | null;
  sex?: string | null;
  birthDate?: Date | string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  observations?: string | null;
  addresses?: TemplateAddress[] | null;
  healthInsurances?: Array<{
    cardNumber?: string | null;
    healthInsurance?: { name?: string | null } | null;
  }> | null;
};

type TemplateConsultation = {
  startTime?: Date | string | null;
  surgeryProcedures?: Array<{ name?: string | null }> | null;
  doctor?: { user?: { name?: string | null } | null } | null;
};

export type TemplateData = {
  patient: TemplatePatient;
  consultation?: TemplateConsultation | null;
};

export function parseTemplate(content: string, data: TemplateData): string {
  if (!content) return "";

  let result = content;
  const { patient, consultation } = data;

  const getAge = (birthDate: Date | string | null | undefined) => {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  // Patient data
  result = result.replace(/@@nome/g, variableAsHtml(patient?.name || ""));
  result = result.replace(/@@cpf/g, variableAsHtml(patient?.cpf || ""));
  result = result.replace(/@@sexo/g, variableAsHtml(patient?.sex || ""));
  result = result.replace(/@@dtnasc/g, variableAsHtml(formatDate(patient?.birthDate)));
  result = result.replace(/@@idade/g, variableAsHtml(getAge(patient?.birthDate)));
  result = result.replace(/@@telefone/g, variableAsHtml(patient?.phone || patient?.mobile || ""));
  result = result.replace(/@@email/g, variableAsHtml(patient?.email || ""));
  result = result.replace(/@@idpaciente/g, variableAsHtml(patient?.id?.substring(0, 8) || ""));
  
  const primaryAddress = patient?.addresses?.find((a) => a.isPrimary) || patient?.addresses?.[0];
  const addressStr = primaryAddress 
    ? `${primaryAddress.street || ""}, ${primaryAddress.number || ""} - ${primaryAddress.neighborhood || ""}, ${primaryAddress.city || ""} - ${primaryAddress.state || ""}`
    : "";
  result = result.replace(/@@endereco/g, variableAsHtml(addressStr));
  
  const healthInsurance = patient?.healthInsurances?.[0]?.healthInsurance?.name || "";
  result = result.replace(/@@convenio/g, variableAsHtml(healthInsurance));
  
  const healthInsuranceCard = patient?.healthInsurances?.[0]?.cardNumber || "";
  result = result.replace(/@@numerodamatricula/g, variableAsHtml(healthInsuranceCard));

  result = result.replace(/@@observacoes/g, variableAsHtml(patient?.observations || ""));

  // Consultation data
  if (consultation) {
    result = result.replace(/@@data/g, variableAsHtml(formatDate(consultation.startTime)));
    result = result.replace(/@@horario/g, variableAsHtml(formatDate(consultation.startTime, "HH:mm")));
    result = result.replace(
      /@@dataextenso/g,
      variableAsHtml(formatDate(consultation.startTime, "dd 'de' MMMM 'de' yyyy"))
    );

    const proced = consultation.surgeryProcedures?.map((p) => p.name).join(", ") || "";
    result = result.replace(/@@proced/g, variableAsHtml(proced));

    const profissional = consultation.doctor?.user?.name || "";
    result = result.replace(/@@profissional/g, variableAsHtml(profissional));
    result = result.replace(/@@medsol/g, variableAsHtml(profissional));
  } else {
    // If no consultation, replace with empty or placeholder
    result = result.replace(/@@data/g, variableAsHtml("___________"));
    result = result.replace(/@@horario/g, variableAsHtml("_____"));
    result = result.replace(/@@dataextenso/g, variableAsHtml("_________________________"));
    result = result.replace(/@@proced/g, variableAsHtml(""));
    result = result.replace(/@@profissional/g, variableAsHtml("___________"));
    result = result.replace(/@@medsol/g, variableAsHtml("___________"));
  }

  // Relative dates
  result = parseRelativeDates(result);

  return result;
}

export function parseRelativeDates(content: string): string {
  if (!content) return "";
  let result = content;

  // Replace @@hoje
  const today = new Date();
  result = result.replace(/@@hoje\b(?!\+|\-)/g, variableAsHtml(format(today, "dd/MM/yyyy", { locale: ptBR })));

  // Replace @@hoje+N
  result = result.replace(/@@hoje\+(\d+)/g, (_, days) => {
    return variableAsHtml(format(addDays(today, parseInt(days, 10)), "dd/MM/yyyy", { locale: ptBR }));
  });

  // Replace @@hoje-N
  result = result.replace(/@@hoje\-(\d+)/g, (_, days) => {
    return variableAsHtml(format(subDays(today, parseInt(days, 10)), "dd/MM/yyyy", { locale: ptBR }));
  });

  return result;
}

export function findInvalidShortcuts(content: string): string[] {
  if (!content) return [];
  
  const validShortcuts = [
    "@@nome", "@@cpf", "@@sexo", "@@idade", "@@dtnasc", "@@telefone", "@@email",
    "@@rg", "@@profissao", "@@estadocivil", "@@endereco", "@@nomedamae", "@@nomedopai",
    "@@nomedoresponsavel", "@@cpfdoresponsavel", "@@numerodamatricula", "@@idpaciente",
    "@@naturalidade", "@@raca", "@@etnia", "@@alergia", "@@observacoes", "@@convenio",
    "@@data", "@@horario", "@@dataextenso", "@@proced", "@@medsol", "@@profissional",
    "@@hoje"
  ];

  // Regex to find anything starting with @@ followed by word characters, optionally + or - and numbers
  const allShortcutsFound = content.match(/@@\w+([+-]\d+)?/g) || [];
  
  const invalid = allShortcutsFound.filter(match => {
    // Special handling for @@hoje+N and @@hoje-N
    if (match.startsWith("@@hoje+") || match.startsWith("@@hoje-")) {
      return false; // It's valid
    }
    return !validShortcuts.includes(match);
  });

  return [...new Set(invalid)]; // Unique invalid shortcuts
}
