"use server";

import { auth } from "@/auth";
import { getClinicIdForAdmin } from "@/services/clinics";
import {
    createAppointmentIntegrationCredential,
    listAppointmentIntegrationCredentials,
    revokeAppointmentIntegrationCredential,
    rotateAppointmentIntegrationCredential,
} from "@/services/appointment-integrations";
import { createAppointmentIntegrationCredentialSchema } from "@/validations/integration-appointments";
import { revalidatePath } from "next/cache";

async function getAdminClinicId() {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
        return null;
    }

    return getClinicIdForAdmin(session.user.id);
}

export async function listAppointmentIntegrationCredentialsAction() {
    const clinicId = await getAdminClinicId();
    if (!clinicId) {
        return { error: "Não autorizado." };
    }

    const credentials = await listAppointmentIntegrationCredentials(clinicId);
    return { success: true, credentials };
}

export async function createAppointmentIntegrationCredentialAction(formData: FormData) {
    const clinicId = await getAdminClinicId();
    if (!clinicId) {
        return { error: "Não autorizado." };
    }

    const parsed = createAppointmentIntegrationCredentialSchema.safeParse({
        name: formData.get("name"),
    });

    if (!parsed.success) {
        const message =
            parsed.error.flatten().fieldErrors.name?.[0] ?? "Dados inválidos.";
        return { error: message };
    }

    const result = await createAppointmentIntegrationCredential(clinicId, parsed.data);
    revalidatePath("/conta");

    return {
        success: true,
        credential: result.credential,
        token: result.token,
    };
}

export async function revokeAppointmentIntegrationCredentialAction(
    credentialId: string
) {
    const clinicId = await getAdminClinicId();
    if (!clinicId) {
        return { error: "Não autorizado." };
    }

    const credential = await revokeAppointmentIntegrationCredential(
        clinicId,
        credentialId
    );

    if (!credential) {
        return { error: "Credencial não encontrada." };
    }

    revalidatePath("/conta");
    return { success: true, credential };
}

export async function rotateAppointmentIntegrationCredentialAction(
    credentialId: string
) {
    const clinicId = await getAdminClinicId();
    if (!clinicId) {
        return { error: "Não autorizado." };
    }

    const result = await rotateAppointmentIntegrationCredential(clinicId, credentialId);

    if (!result) {
        return { error: "Credencial não encontrada." };
    }

    revalidatePath("/conta");
    return {
        success: true,
        credential: result.credential,
        token: result.token,
    };
}
