import fs from "node:fs/promises";
import path from "node:path";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    PDFDocument,
    StandardFonts,
    rgb,
    type PDFPage,
    type PDFFont,
} from "pdf-lib";
import type { ExamGuidePrintContext } from "@/db/queries/exams/guide-print-context";
import {
    SADT_TEMPLATE_PATH,
    sadtFieldMap,
    type SadtBoxField,
    type SadtTextField,
} from "@/lib/medical-document/sadt-field-map";

const TUSS_TABELA_22 = "22";

function s(v: string | null | undefined): string {
    return v?.trim() ?? "";
}

/** Texto impresso na guia: sempre maiúsculas (padrão operadoras / TISS). */
function pdfText(v: string | null | undefined): string {
    const t = s(v);
    return t ? t.toLocaleUpperCase("pt-BR") : "";
}

function onlyDigits(v: string, maxLen: number): string {
    return v.replace(/\D+/g, "").slice(0, maxLen);
}

function formatDateBr(d: Date | null | undefined): string {
    if (d == null || !isValid(d)) return "";
    return format(d, "dd/MM/yyyy", { locale: ptBR });
}

function careLetter(v: ExamGuidePrintContext["careType"]): string {
    if (v === "elective") return "E";
    if (v === "urgent_emergency") return "U";
    return "";
}

async function loadTemplateBytes(): Promise<Uint8Array> {
    const filePath = path.join(process.cwd(), SADT_TEMPLATE_PATH);
    const buf = await fs.readFile(filePath);
    return new Uint8Array(buf);
}

export async function fetchInsuranceLogoBytesForTemplate(
    absoluteHttpUrl: string | null | undefined
): Promise<Uint8Array | null> {
    if (!absoluteHttpUrl?.trim()) return null;
    try {
        const res = await fetch(absoluteHttpUrl.trim(), {
            cache: "no-store",
            signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) return null;
        return new Uint8Array(await res.arrayBuffer());
    } catch {
        return null;
    }
}

function drawTextField(
    page: PDFPage,
    font: PDFFont,
    value: string,
    field: SadtTextField
) {
    const text = pdfText(value);
    if (!text) return;
    page.drawText(text, {
        x: field.x,
        y: field.y,
        size: field.size ?? 8,
        font,
        color: rgb(0, 0, 0),
        maxWidth: field.maxWidth,
    });
}

function drawCharsInBoxes(
    page: PDFPage,
    font: PDFFont,
    value: string,
    field: SadtBoxField
) {
    const chars = pdfText(value).slice(0, field.maxChars ?? value.length);
    if (!chars) return;
    const gap = field.gap ?? 8.5;
    const size = field.size ?? 8;
    chars.split("").forEach((char, index) => {
        page.drawText(char, {
            x: field.x + index * gap,
            y: field.y,
            size,
            font,
            color: rgb(0, 0, 0),
        });
    });
}

async function drawInsuranceLogo(
    pdfDoc: PDFDocument,
    page: PDFPage,
    logoBytes: Uint8Array | null
) {
    if (!logoBytes?.length) return;
    const { x, y, maxWidth, maxHeight } = sadtFieldMap.logo;
    try {
        let image;
        try {
            image = await pdfDoc.embedPng(logoBytes);
        } catch {
            image = await pdfDoc.embedJpg(logoBytes);
        }
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        page.drawImage(image, {
            x,
            y,
            width: image.width * scale,
            height: image.height * scale,
        });
    } catch {
        // Logo inválida ou formato não suportado — mantém área do template.
    }
}

function fillGuideFields(page: PDFPage, font: PDFFont, ctx: ExamGuidePrintContext) {
    const f = sadtFieldMap;

    drawCharsInBoxes(page, font, onlyDigits(s(ctx.insuranceAnsCode), 6), f.registroAns);
    drawCharsInBoxes(page, font, onlyDigits(s(ctx.cardNumber), 20), f.numeroCarteira);
    drawTextField(page, font, s(ctx.patientName), f.nomeBeneficiario);
    drawCharsInBoxes(
        page,
        font,
        onlyDigits(s(ctx.clinicCnpj), 14),
        f.codigoOperadoraSolicitante
    );

    drawTextField(page, font, s(ctx.doctorName), f.nomeProfissionalSolicitante);

    drawCharsInBoxes(page, font, "06", f.conselhoProfissional);
    drawCharsInBoxes(page, font, onlyDigits(s(ctx.crm), 15), f.numeroConselho);
    drawCharsInBoxes(page, font, pdfText(s(ctx.crmState)).slice(0, 2), f.ufConselho);
    drawCharsInBoxes(page, font, onlyDigits(s(ctx.cboCode), 6), f.cbo);

    drawCharsInBoxes(page, font, formatDateBr(ctx.guideDateTime), f.dataSolicitacao);
    drawCharsInBoxes(page, font, careLetter(ctx.careType), f.caraterSolicitacao);
    drawTextField(page, font, s(ctx.clinicalIndication), f.indicacaoClinica);

    const procedures = ctx.procedures.length
        ? ctx.procedures
        : [{ tussCode: null, name: "", quantity: 0 }];

    for (let i = 0; i < f.procedureRows.length; i++) {
        const row = f.procedureRows[i];
        const proc = procedures[i];
        if (!proc) break;

        const code = onlyDigits(s(proc.tussCode), 10);
        const qty = proc.quantity > 0 ? String(proc.quantity) : "";

        drawCharsInBoxes(page, font, TUSS_TABELA_22, row.tabela);
        drawCharsInBoxes(page, font, code, row.codigo);
        drawTextField(page, font, proc.name, row.descricao);
        drawCharsInBoxes(page, font, qty, row.qtdSolic);
    }
}

/**
 * Gera PDF preenchendo o template oficial (`public/templates/guia-sadt.pdf`).
 */
export type GenerateSadtPdfOptions = {
    insuranceLogoGetUrl?: string | null;
};

export async function generateSadtPdfFromTemplate(
    context: ExamGuidePrintContext,
    options?: GenerateSadtPdfOptions
): Promise<Uint8Array> {
    const templateBytes = await loadTemplateBytes();
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const logoUrl = options?.insuranceLogoGetUrl?.trim();
    const logoBytes = logoUrl ? await fetchInsuranceLogoBytesForTemplate(logoUrl) : null;
    await drawInsuranceLogo(pdfDoc, page, logoBytes);
    fillGuideFields(page, font, context);

    return pdfDoc.save();
}
