#!/usr/bin/env node
/**
 * Calibração da Guia SADT (pdf-lib + template em public/templates/guia-sadt.pdf)
 *
 * Uso:
 *   node scripts/sadt-calibrate.mjs extract   → lista rótulos/caixas do PDF (pdfjs)
 *   node scripts/sadt-calibrate.mjs grid        → PDF com grade de coordenadas
 *   node scripts/sadt-calibrate.mjs preview     → PDF com marcadores nos campos do mapa atual
 *   node scripts/sadt-calibrate.mjs sample      → PDF de amostra com dados fictícios
 *
 * Como ajudar no alinhamento:
 * 1. Rode `preview` e abra public/templates/guia-sadt-calibration-preview.pdf
 * 2. Cada marcador vermelho mostra o nome do campo (ex.: registroAns) na posição (x,y) do mapa
 * 3. Rode `grid` para ver coordenadas a cada 25pt
 * 4. Anote: "nomeBeneficiario precisa ir +40 em X" e ajuste src/lib/medical-document/sadt-field-map.ts
 * 5. Rode `sample` e compare com o template em branco
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(ROOT, "public/templates/guia-sadt.pdf");
const OUT_DIR = path.join(ROOT, "public/templates");

/** Espelha sadt-field-map.ts — mantenha sincronizado ao calibrar. */
const FIELD_MAP = {
    logo: { x: 67, y: 538, label: "logo" },
    registroAns: { x: 62, y: 530, gap: 8.5, sample: "123456", label: "registroAns" },
    numeroCarteira: { x: 64, y: 483, gap: 8.3, sample: "12345678901234567890", label: "numeroCarteira" },
    nomeBeneficiario: { x: 120, y: 466, sample: "NOME DO BENEFICIARIO", label: "nomeBeneficiario" },
    codigoOperadoraSolicitante: { x: 65, y: 434, gap: 8.2, sample: "12345678901234", label: "codigoOperadora13" },
    nomeContratado: { x: 285, y: 442, sample: "CLINICA SOLICITANTE LTDA", label: "nomeContratado" },
    nomeProfissionalSolicitante: { x: 200, y: 420, sample: "DR. MEDICO SOLICITANTE", label: "nomeProfissional" },
    conselhoProfissional: { x: 288, y: 411, gap: 9, sample: "06", label: "conselho" },
    numeroConselho: { x: 322, y: 411, gap: 8.2, sample: "123456", label: "numeroConselho" },
    ufConselho: { x: 468, y: 411, gap: 9, sample: "SP", label: "uf" },
    cbo: { x: 494, y: 411, gap: 8.2, sample: "225125", label: "cbo" },
    dataSolicitacao: { x: 106, y: 384, gap: 8.5, sample: "20052026", label: "dataSolicitacao" },
    caraterSolicitacao: { x: 76, y: 387, gap: 10, sample: "E", label: "carater" },
    indicacaoClinica: { x: 233, y: 384, sample: "INDICACAO CLINICA DE TESTE", label: "indicacaoClinica" },
    numeroGuiaPrestador: { x: 678, y: 570, gap: 8.2, sample: "12345678901234567890", label: "numeroGuiaPrestador" },
    procedureRows: [
        { y: 366, tabela: { x: 66, y: 366, gap: 9 }, codigo: { x: 92, y: 366, gap: 8.2 }, descricao: { x: 130, y: 366 }, qtdSolic: { x: 668, y: 366, gap: 9 } },
        { y: 356, tabela: { x: 66, y: 356, gap: 9 }, codigo: { x: 92, y: 356, gap: 8.2 }, descricao: { x: 130, y: 356 }, qtdSolic: { x: 668, y: 356, gap: 9 } },
        { y: 347, tabela: { x: 66, y: 347, gap: 9 }, codigo: { x: 92, y: 347, gap: 8.2 }, descricao: { x: 130, y: 347 }, qtdSolic: { x: 668, y: 347, gap: 9 } },
        { y: 337, tabela: { x: 66, y: 337, gap: 9 }, codigo: { x: 92, y: 337, gap: 8.2 }, descricao: { x: 130, y: 337 }, qtdSolic: { x: 668, y: 337, gap: 9 } },
        { y: 328, tabela: { x: 66, y: 328, gap: 9 }, codigo: { x: 92, y: 328, gap: 8.2 }, descricao: { x: 130, y: 328 }, qtdSolic: { x: 668, y: 328, gap: 9 } },
    ],
};

async function loadTemplate() {
    const bytes = fs.readFileSync(TEMPLATE);
    return PDFDocument.load(bytes);
}

function drawChars(page, font, value, x, y, gap = 8.5, size = 8, color = rgb(0.8, 0, 0)) {
    value.split("").forEach((ch, i) => {
        page.drawText(ch, { x: x + i * gap, y, size, font, color });
    });
}

async function cmdGrid() {
    const pdf = await loadTemplate();
    const page = pdf.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const step = 25;
    for (let x = 0; x <= width; x += step) {
        page.drawLine({
            start: { x, y: 0 },
            end: { x, y: height },
            thickness: 0.2,
            color: rgb(0.9, 0.9, 0.9),
        });
    }
    for (let y = 0; y <= height; y += step) {
        page.drawLine({
            start: { x: 0, y },
            end: { x: width, y },
            thickness: 0.2,
            color: rgb(0.9, 0.9, 0.9),
        });
        for (let x = 0; x < width; x += step) {
            page.drawText(`${x},${y}`, {
                x: x + 2,
                y: y + 2,
                size: 5,
                font,
                color: rgb(0.75, 0.75, 0.75),
            });
        }
    }
    page.drawText(`Pagina ${Math.round(width)} x ${Math.round(height)} pt — origem canto inferior esquerdo`, {
        x: 10,
        y: height - 14,
        size: 7,
        font,
        color: rgb(0.2, 0.2, 0.2),
    });
    const out = path.join(OUT_DIR, "guia-sadt-calibration-grid.pdf");
    fs.writeFileSync(out, await pdf.save());
    console.log("Gravado:", out);
}

async function cmdPreview() {
    const pdf = await loadTemplate();
    const page = pdf.getPages()[0];
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = font;

    for (const [key, field] of Object.entries(FIELD_MAP)) {
        if (key === "procedureRows") continue;
        const { x, y, label } = field;
        page.drawCircle({ x, y: y + 4, size: 3, color: rgb(0.9, 0, 0), borderColor: rgb(0.6, 0, 0), borderWidth: 0.5 });
        page.drawText(label ?? key, { x: x + 6, y: y + 8, size: 6, font: bold, color: rgb(0.7, 0, 0) });
        page.drawText(`(${x},${y})`, { x: x + 6, y: y - 2, size: 5, font, color: rgb(0.5, 0, 0) });
    }

    FIELD_MAP.procedureRows.forEach((row, i) => {
        for (const part of ["tabela", "codigo", "descricao", "qtdSolic"]) {
            const f = row[part];
            page.drawCircle({ x: f.x, y: f.y + 4, size: 2, color: rgb(0, 0, 0.8) });
            page.drawText(`p${i + 1}.${part}`, { x: f.x + 4, y: f.y + 6, size: 5, font, color: rgb(0, 0, 0.6) });
        }
    });

    const out = path.join(OUT_DIR, "guia-sadt-calibration-preview.pdf");
    fs.writeFileSync(out, await pdf.save());
    console.log("Gravado:", out);
    console.log("Abra o PDF: marcadores vermelhos = posicao atual de cada campo no mapa.");
}

async function cmdSample() {
    const pdf = await loadTemplate();
    const page = pdf.getPages()[0];
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const black = rgb(0, 0, 0);

    for (const [key, field] of Object.entries(FIELD_MAP)) {
        if (key === "procedureRows") continue;
        const { x, y, sample, gap } = field;
        if (!sample) continue;
        if (gap) drawChars(page, font, sample, x, y, gap, 8, black);
        else page.drawText(sample, { x, y, size: 8, font, color: black, maxWidth: 500 });
    }

    const procSample = { tabela: "22", codigo: "40701144", desc: "CINTILOGRAFIA TESTE", qtd: "01" };
    FIELD_MAP.procedureRows.forEach((row) => {
        drawChars(page, font, procSample.tabela, row.tabela.x, row.tabela.y, row.tabela.gap, 8, black);
        drawChars(page, font, procSample.codigo, row.codigo.x, row.codigo.y, row.codigo.gap, 8, black);
        page.drawText(procSample.desc, { x: row.descricao.x, y: row.descricao.y, size: 7, font, color: black, maxWidth: 520 });
        drawChars(page, font, procSample.qtd, row.qtdSolic.x, row.qtdSolic.y, row.qtdSolic.gap, 8, black);
    });

    const out = path.join(OUT_DIR, "guia-sadt-calibration-sample.pdf");
    fs.writeFileSync(out, await pdf.save());
    console.log("Gravado:", out);
}

async function cmdExtract() {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(fs.readFileSync(TEMPLATE));
    const doc = await getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1 });
    console.log("Viewport:", Math.round(vp.width), "x", Math.round(vp.height));

    const content = await page.getTextContent();
    const items = content.items
        .filter((i) => "str" in i && i.str.trim())
        .map((i) => ({
            str: i.str.trim(),
            x: Math.round(i.transform[4]),
            y: Math.round(i.transform[5]),
        }));

    const labels = [
        "1 - Registro ANS",
        "8 - Número da Carteira",
        "10 - Nome",
        "13 - Código na Operadora",
        "14 - Nome do Contratado",
        "15 - Nome do Profissional",
        "16 - Conselho",
        "22 - Data da Solicitação",
        "23 - Indicação Clínica",
        "24-Tabela",
        "Guia no Prestador",
        "Logo da Empresa",
    ];

    console.log("\n--- Rotulos (pdfjs) ---");
    for (const lab of labels) {
        const hit = items.find((i) => i.str.includes(lab) || i.str === lab);
        if (hit) console.log(`${lab.padEnd(42)} label @ ${hit.x}, ${hit.y}`);
    }

    console.log("\n--- Caixas |___| (primeiras por faixa Y) ---");
    const boxes = items.filter((i) => i.str.includes("|___"));
    const ys = [...new Set(boxes.map((b) => Math.round(b.y / 10) * 10))].sort((a, b) => b - a);
    for (const y of ys.slice(0, 25)) {
        const row = boxes
            .filter((b) => Math.abs(b.y - y) < 12)
            .sort((a, b) => a.x - b.x)
            .slice(0, 8)
            .map((b) => `${b.x},${b.y}`)
            .join("  ");
        if (row) console.log(`y~${y}: ${row}`);
    }

    console.log("\nDica: use os Y das linhas de procedimento (330-370) e X 66/92/130/668 no sadt-field-map.ts");
}

const cmd = process.argv[2] ?? "preview";
const handlers = { extract: cmdExtract, grid: cmdGrid, preview: cmdPreview, sample: cmdSample };

if (!handlers[cmd]) {
    console.error("Comando invalido. Use: extract | grid | preview | sample");
    process.exit(1);
}

await handlers[cmd]();
