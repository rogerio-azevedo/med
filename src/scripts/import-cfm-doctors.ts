import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../db/index";
import { doctors, users, clinicDoctors, doctorSpecialties, specialties as specialtiesTable } from "../db/schema/index";
import bcrypt from "bcryptjs";
import fs from "fs";
import crypto from "crypto";

// Tipo esperado do payload extraído do site do CFM
interface CFMMedico {
    nome: string;
    crm: string;
    uf: string;
    situacao: string;
    inscricao: string;
    especialidades: string; // Ex: "PEDIATRIA & CIRURGIA GERAL"
}

const CLINIC_ID = "9be7cc53-c270-49aa-99f3-709f7ca9c0a9";
const JSON_FILE_PATH = "scripts/doctors.json";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function normalizeNameForEmail(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^a-z0-9]/g, ""); // remove espaços e caracteres especiais
}

async function main() {
    console.log(`Iniciando importação de médicos do arquivo '${JSON_FILE_PATH}'...`);

    if (!fs.existsSync(JSON_FILE_PATH)) {
        console.error(`Erro: Arquivo '${JSON_FILE_PATH}' não encontrado na raiz do projeto.`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(JSON_FILE_PATH, "utf-8");
    let medicosCFM: CFMMedico[] = [];

    try {
        medicosCFM = JSON.parse(fileContent);
    } catch (e) {
        console.error("Erro ao fazer parse do arquivo JSON:", e);
        process.exit(1);
    }

    console.log(`Total de registros no JSON: ${medicosCFM.length}`);

    // Hash padrão para a senha "102030"
    console.log("Gerando hash da senha padrão...");
    const hashedPassword = await bcrypt.hash("102030", 10);

    // Carregar especialidades do banco para fazer cache em memória
    console.log("Carregando especialidades do banco de dados...");
    const specialtiesInDb = await db.select().from(specialtiesTable);
    const specialtyMap = new Map<string, string>(); // nome formatado -> id

    for (const spec of specialtiesInDb) {
        const normalizedSpecName = spec.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        specialtyMap.set(normalizedSpecName, spec.id);
    }

    // Carregar CRMs já existentes para evitar requisições extras
    console.log("Carregando médicos existentes para verificação...");
    const existingDoctors = await db.select({ crm: doctors.crm, crmState: doctors.crmState }).from(doctors);
    const existingCrmSet = new Set<string>();
    for (const d of existingDoctors) {
        if (d.crm && d.crmState) {
            existingCrmSet.add(`${d.crm}-${d.crmState}`.toUpperCase());
        }
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const data of medicosCFM) {
        const crmKey = `${data.crm}-${data.uf}`.toUpperCase();

        if (existingCrmSet.has(crmKey)) {
            skippedCount++;
            continue;
        }

        try {
            // Gerar e-mail único adicionando CRM para evitar colisões
            const baseEmailPrefix = normalizeNameForEmail(data.nome);
            const generatedEmail = `${baseEmailPrefix}${data.crm.toLowerCase()}@mail.com`;

            // Criar UUIDs
            const userId = crypto.randomUUID();
            const doctorId = crypto.randomUUID();

            // 1. Inserir ou recuperar User
            let currentUserId = userId;
            const userExists = await db.query.users.findFirst({
                where: (u, { eq }) => eq(u.email, generatedEmail)
            });

            if (userExists) {
                currentUserId = userExists.id;
            } else {
                await db.insert(users).values({
                    id: currentUserId,
                    name: data.nome.trim(),
                    email: generatedEmail,
                    password: hashedPassword,
                    role: "doctor",
                });
            }

            // 2. Inserir Doctor (se ainda não existir, embora o existingCrmSet previna maioria)
            const doctorExists = await db.query.doctors.findFirst({
                where: (d, { and, eq }) => and(eq(d.crm, data.crm), eq(d.crmState, data.uf))
            });

            let currentDoctorId = doctorId;
            if (doctorExists) {
                currentDoctorId = doctorExists.id;
            } else {
                await db.insert(doctors).values({
                    id: currentDoctorId,
                    userId: currentUserId,
                    crm: data.crm,
                    crmState: data.uf,
                });
            }

            // 3. Vincular Doctor a Clinic (como Partner)
            try {
                await db.insert(clinicDoctors).values({
                    doctorId: currentDoctorId,
                    clinicId: CLINIC_ID,
                    relationshipType: "partner",
                    isActive: true,
                    joinedAt: new Date(),
                });
            } catch (e) {
                // ignora se já tiver vinculado
            }

            // 4. Mapear e Inserir Especialidades
            if (data.especialidades && data.especialidades.trim() !== "") {
                const specsArray = data.especialidades.split("&").map(s => s.trim()).filter(s => s.length > 0);

                for (const specRawName of specsArray) {
                    const normalizedRaw = specRawName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const specId = specialtyMap.get(normalizedRaw);

                    if (specId) {
                        try {
                            await db.insert(doctorSpecialties).values({
                                doctorId: currentDoctorId,
                                specialtyId: specId,
                            });
                        } catch (e) {
                            // ignora duplicação de especialidade
                        }
                    }
                }
            }

            insertedCount++;
            existingCrmSet.add(crmKey); // Atualizar o Set para evitar duplicidade no próprio arquivo

            if (insertedCount % 50 === 0) {
                console.log(`Progresso: ${insertedCount} processados...`);
            }

            // Pausa de 35ms para evitar Rate Limit (Conexões recusadas) do banco Severless Neon
            await delay(35);
        } catch (err: any) {
            console.error(`Erro ao inserir médico ${data.nome} (CRM: ${data.crm}-${data.uf}):`, err.message || err);
            // Não para a execução, apenas pula pro próximo
        }
    }

    console.log("-----------------------------------------");
    console.log("Importação Finalizada!");
    console.log(`Registros pulados (já existentes): ${skippedCount}`);
    console.log(`Registros novos inseridos: ${insertedCount}`);
    console.log("-----------------------------------------");
}

main().catch(console.error);
