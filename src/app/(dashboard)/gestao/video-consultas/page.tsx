import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { GestaoComingSoon } from "@/components/gestao/GestaoComingSoon";

export default async function GestaoVideoConsultasPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("consultations", "can_read");
    if (!allowed) redirect("/dashboard");

    return (
        <GestaoComingSoon
            headerTitle="Gestão · Video Consultas"
            headerDescription="Atendimentos remotos e teleconsulta."
            cardTitle="Video Consultas"
            cardDescription="Esta tela reunirá consultas por vídeo quando o modelo de dados estiver definido."
        />
    );
}
