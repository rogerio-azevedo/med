import "dotenv/config";
import { db } from "./index";
import { users, specialties } from "./schema";
import { hash } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

const MEDICAL_SPECIALTIES = [
    "Acupuntura",
    "Alergia e Imunologia",
    "Anestesiologia",
    "Angiologia",
    "Cancerologia",
    "Cardiologia",
    "Cirurgia Cardiovascular",
    "Cirurgia da Mão",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral",
    "Cirurgia Pediátrica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Clínica Médica",
    "Coloproctologia",
    "Dermatologia",
    "Endocrinologia e Metabologia",
    "Endoscopia",
    "Gastroenterologia",
    "Genética Médica",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia e Hemoterapia",
    "Homeopatia",
    "Infectologia",
    "Mastologia",
    "Medicina de Emergência",
    "Medicina de Família e Comunidade",
    "Medicina do Trabalho",
    "Medicina de Tráfego",
    "Medicina Esportiva",
    "Medicina Física e Reabilitação",
    "Medicina Intensiva",
    "Medicina Legal e Perícia Médica",
    "Medicina Nuclear",
    "Medicina Preventiva e Social",
    "Nefrologia",
    "Neurocirurgia",
    "Neurologia",
    "Nutrologia",
    "Oftalmologia",
    "Oncologia Clínica",
    "Ortopedia e Traumatologia",
    "Otorrinolaringologia",
    "Patologia",
    "Patologia Clínica / Medicina Laboratorial",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Radiologia e Diagnóstico por Imagem",
    "Radioterapia",
    "Reumatologia",
    "Urologia"
];

async function main() {
    console.log("Seeding database...");

    // 1. SuperAdmin Seeding
    const email = "admin@med.com";
    const password = "password123";
    const hashedPassword = await hash(password, 10);

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        console.log("SuperAdmin user already exists.");
        await db.update(users)
            .set({ role: "super_admin", password: hashedPassword })
            .where(eq(users.email, email));
        console.log("SuperAdmin user updated.");
    } else {
        await db.insert(users).values({
            email,
            password: hashedPassword,
            name: "Super Admin",
            role: "super_admin",
            emailVerified: new Date(),
        });
        console.log("SuperAdmin user created.");
    }

    // 2. Medical Specialties Seeding
    console.log(`Seeding ${MEDICAL_SPECIALTIES.length} medical specialties...`);

    for (const specialtyName of MEDICAL_SPECIALTIES) {
        const existing = await db.query.specialties.findFirst({
            where: eq(specialties.name, specialtyName)
        });

        if (!existing) {
            await db.insert(specialties).values({
                name: specialtyName,
            });
            console.log(`- Added: ${specialtyName}`);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
