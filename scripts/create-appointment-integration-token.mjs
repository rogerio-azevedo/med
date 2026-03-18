import crypto from "node:crypto";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signHs256(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function signAppointmentIntegrationToken({
  integrationId,
  clinicId,
  scope,
  jti,
  secret,
}) {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: integrationId,
      clinicId,
      scope,
      jti,
      type: "integration",
      iat: Math.floor(Date.now() / 1000),
    })
  );

  const signature = signHs256(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

async function main() {
  const clinicId = process.argv[2];
  const credentialName = process.argv[3] ?? "Teste Insomnia";
  const databaseUrl = process.env.DATABASE_URL;
  const jwtSecret =
    process.env.APPOINTMENT_INTEGRATION_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!clinicId) {
    console.error("Uso: pnpm integration:token <clinicId> [nome-da-credencial]");
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error("DATABASE_URL não configurada.");
    process.exit(1);
  }

  if (!jwtSecret) {
    console.error(
      "Configure APPOINTMENT_INTEGRATION_JWT_SECRET ou NEXTAUTH_SECRET antes de gerar o token."
    );
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    prepare: false,
  });

  try {
    const clinic = await sql`
      select id, name
      from clinics
      where id = ${clinicId}
      limit 1
    `;

    if (clinic.length === 0) {
      console.error(`Clínica não encontrada para o id ${clinicId}.`);
      process.exit(1);
    }

    const tokenJti = crypto.randomUUID();

    const credentialRows = await sql`
      insert into appointment_integration_credentials (
        clinic_id,
        name,
        scope,
        token_jti,
        is_active,
        created_at,
        updated_at
      )
      values (
        ${clinicId},
        ${credentialName},
        ${"appointments:write"},
        ${tokenJti},
        true,
        now(),
        now()
      )
      returning id, clinic_id, name, scope, created_at
    `;

    const credential = credentialRows[0];

    const token = signAppointmentIntegrationToken({
      integrationId: credential.id,
      clinicId: credential.clinic_id,
      scope: credential.scope,
      jti: tokenJti,
      secret: jwtSecret,
    });

    console.log("Credencial criada com sucesso.");
    console.log(`clinicName: ${clinic[0].name}`);
    console.log(`credentialId: ${credential.id}`);
    console.log(`clinicId: ${credential.clinic_id}`);
    console.log(`name: ${credential.name}`);
    console.log(`scope: ${credential.scope}`);
    console.log("");
    console.log("JWT para uso no Insomnia:");
    console.log(token);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("Falha ao gerar token de integração.");
  console.error(error);
  process.exit(1);
});
