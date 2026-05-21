/**
 * Coordenadas no sistema do PDF (paisagem ~842×595 pt, Rotate 0).
 * Template: `public/templates/guia-sadt.pdf`
 *
 * Calibrar com: `node scripts/sadt-calibrate.mjs preview|grid|sample|extract`
 */
export type SadtTextField = {
    x: number;
    y: number;
    size?: number;
    maxWidth?: number;
};

export type SadtBoxField = SadtTextField & {
    /** Espaçamento horizontal entre caracteres (quadradinhos). */
    gap?: number;
    maxChars?: number;
};

export type SadtProcedureRowField = {
    y: number;
    tabela: SadtBoxField;
    codigo: SadtBoxField;
    descricao: SadtTextField;
    qtdSolic: SadtBoxField;
};

export const SADT_TEMPLATE_PATH = "public/templates/guia-sadt.pdf";

export const sadtFieldMap = {
    logo: { x: 50, y: 547, maxWidth: 110, maxHeight: 40 },

    registroAns: { x: 63, y: 532, size: 8, gap: 9, maxChars: 6 },
    numeroCarteira: { x: 64, y: 485, size: 8, gap: 8.3, maxChars: 20 },

    nomeBeneficiario: { x: 70, y: 464, size: 8, maxWidth: 600 },
    codigoOperadoraSolicitante: { x: 65, y: 434, size: 8, gap: 8.2, maxChars: 14 },

    nomeProfissionalSolicitante: { x: 70, y: 415, size: 8, maxWidth: 400 },

    conselhoProfissional: { x: 288, y: 416, size: 8, gap: 9, maxChars: 2 },
    numeroConselho: { x: 322, y: 416, size: 8, gap: 8.5, maxChars: 15 },
    ufConselho: { x: 466, y: 416, size: 8, gap: 9, maxChars: 2 },
    cbo: { x: 494, y: 416, size: 8, gap: 8.2, maxChars: 6 },

    dataSolicitacao: { x: 106, y: 389, size: 8, gap: 8, maxChars: 10 },
    caraterSolicitacao: { x: 76, y: 387, size: 8, gap: 10, maxChars: 1 },
    indicacaoClinica: { x: 202, y: 386, size: 7, maxWidth: 380 },

    procedureRows: [
        {
            y: 366,
            tabela: { x: 69, y: 368, size: 8, gap: 9, maxChars: 2 },
            codigo: { x: 93, y: 368, size: 8, gap: 9, maxChars: 10 },
            descricao: { x: 187, y: 368, size: 7, maxWidth: 520 },
            qtdSolic: { x: 668, y: 368, size: 8, gap: 9, maxChars: 3 },
        },
        {
            y: 356,
            tabela: { x: 69, y: 359, size: 8, gap: 9, maxChars: 2 },
            codigo: { x: 93, y: 359, size: 8, gap: 9, maxChars: 10 },
            descricao: { x: 187, y: 359, size: 7, maxWidth: 520 },
            qtdSolic: { x: 668, y: 359, size: 8, gap: 9, maxChars: 3 },
        },
        {
            y: 347,
            tabela: { x: 69, y: 350, size: 8, gap: 9, maxChars: 2 },
            codigo: { x: 93, y: 350, size: 8, gap: 9, maxChars: 10 },
            descricao: { x: 187, y: 350, size: 7, maxWidth: 520 },
            qtdSolic: { x: 668, y: 350, size: 8, gap: 9, maxChars: 3 },
        },
        {
            y: 337,
            tabela: { x: 69, y: 340, size: 7.5, gap: 9, maxChars: 2 },
            codigo: { x: 93, y: 340, size: 7.5, gap: 9, maxChars: 10 },
            descricao: { x: 187, y: 340, size: 7, maxWidth: 520 },
            qtdSolic: { x: 668, y: 340, size: 8, gap: 9, maxChars: 3 },
        },
        {
            y: 328,
            tabela: { x: 69, y: 331, size: 8, gap: 9, maxChars: 2 },
            codigo: { x: 93, y: 331, size: 8, gap: 9, maxChars: 10 },
            descricao: { x: 187, y: 331, size: 7, maxWidth: 520 },
            qtdSolic: { x: 668, y: 331, size: 8, gap: 9, maxChars: 3 },
        },
    ] satisfies SadtProcedureRowField[],
} as const;
