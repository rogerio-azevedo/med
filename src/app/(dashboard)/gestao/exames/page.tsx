import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { GestaoComingSoon } from "@/components/gestao/GestaoComingSoon";

export default async function GestaoExamesPage() {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/dashboard");
    }

    const allowed = await can("consultations", "can_read");
    if (!allowed) redirect("/dashboard");

    return (
        <GestaoComingSoon
            headerTitle="Gestão · Exames"
            headerDescription="Solicitações de exame vinculadas às consultas."
            cardTitle="Exames"
            cardDescription="Esta tela listará solicitações de exames do prontuário."
        />
    );
}
