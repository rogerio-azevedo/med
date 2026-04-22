import { config } from "dotenv";
config();

import { db } from "../index";
import { icd10Codes } from "../schema/specialties";

async function seedCID10() {
    console.log("🚀 Iniciando seed do CID-10...");

    // 1. Verificar se já existem dados ou se forçamos o reset
    const forceReset = process.env.FORCE_RESET === "true";

    if (forceReset) {
        console.log("🗑️ Reset forçado: deletando dados existentes...");
        await db.delete(icd10Codes);
    } else {
        const existing = await db.select({ count: icd10Codes.id }).from(icd10Codes).limit(1);
        if (existing.length > 0) {
            console.log("⚠️ CID-10 já parece estar populado. Pulando...");
            return;
        }
    }

    // 2. Definir subset de CIDs comuns para garantir que o sistema funcione 
    // enquanto o download do completo acontece (ou se falhar)
    const commonCIDs = [
        { code: "Z00.0", description: "Exame médico geral" },
        { code: "U07.1", description: "COVID-19, vírus identificado" },
        { code: "I10", description: "Hipertensão essencial (primária)" },
        { code: "E11.9", description: "Diabetes mellitus não-insulinodependente - sem complicações" },
        { code: "J06.9", description: "Infecção aguda das vias aéreas superiores, não especificada" },
        { code: "M54.5", description: "Dor lombar baixa" },
        { code: "N39.0", description: "Infecção do trato urinário de localização não especificada" },
        { code: "R51", description: "Cefaleia" },
        { code: "R52.9", description: "Dor não especificada" },
        { code: "F41.1", description: "Ansiedade generalizada" },
        { code: "F32.9", description: "Episódio depressivo não especificado" },
    ];

    console.log(`📦 Inserindo ${commonCIDs.length} CIDs iniciais...`);
    for (const cid of commonCIDs) {
        await db.insert(icd10Codes).values({
            code: cid.code,
            description: cid.description,
            category: cid.code.split('.')[0],
            isActive: true,
        }).onConflictDoNothing();
    }

    // 3. Tentar baixar a lista completa do CID-10 (DATASUS via GitHub mirror)
    const FULL_CID_URL = "https://raw.githubusercontent.com/cleytonferrari/CidDataSus/master/CIDImport/Repositorio/Resources/CID-10-SUBCATEGORIAS.CSV";

    try {
        console.log("📥 Baixando lista completa do CID-10 (pode demorar um pouco)...");
        const response = await fetch(FULL_CID_URL);
        if (!response.ok) throw new Error("Falha ao baixar CSV do CID-10");

        // DATASUS CSV is typically ISO-8859-1 (Latin1)
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder("iso-8859-1");
        const text = decoder.decode(buffer);
        const lines = text.split('\n');

        console.log(`📄 Processando ${lines.length} linhas...`);

        const BATCH_SIZE = 100;
        let batch = [];
        let count = 0;

        // Pular o cabeçalho se existir (checar se a primeira linha tem "SUBCAT")
        const startIdx = lines[0].includes("SUBCAT") ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Formato: SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO;...
            const parts = line.split(';');
            if (parts.length < 5) continue;

            const code = parts[0].trim();
            const description = parts[4].trim();

            if (code && description) {
                batch.push({
                    code,
                    description: description.substring(0, 500),
                    category: code.substring(0, 3),
                    isActive: true,
                });
            }

            if (batch.length >= BATCH_SIZE) {
                await db.insert(icd10Codes).values(batch).onConflictDoNothing();
                count += batch.length;
                process.stdout.write(`\r✅ Inseridos: ${count}`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await db.insert(icd10Codes).values(batch).onConflictDoNothing();
            count += batch.length;
        }

        console.log(`\n🎉 Seed finalizado! Total de ${count} CIDs processados.`);

    } catch (error) {
        console.error("\n❌ Erro ao baixar ou processar lista completa:", error);
        console.log("ℹ️ O sistema continuará com os CIDs básicos inseridos anteriormente.");
    }
}

seedCID10()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("💥 Erro fatal no seed:", err);
        process.exit(1);
    });
