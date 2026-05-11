import { auth } from "@/auth";

export async function requireClinicServer() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autorizado. Usuário não autenticado.");
  }

  const { id, role, clinicId, clinicRole, doctorId } = session.user;

  if (!clinicId) {
    throw new Error("Clínica não encontrada no contexto do usuário.");
  }

  return {
    currentClinic: { id: clinicId },
    user: { id: id as string, role: role as string },
    clinicUser: {
      role: clinicRole as string,
      doctorId: doctorId as string | undefined,
    },
  };
}
