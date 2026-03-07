import { auth } from "@/auth";
import { getBoardPageData } from "@/services/kanban";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/tarefas/KanbanBoard";

export default async function TarefasPage({
    searchParams,
}: {
    searchParams: Promise<{ boardId?: string; responsible?: string; category?: string; start?: string; end?: string }>;
}) {
    const session = await auth();
    const clinicId = session?.user?.clinicId;

    if (!clinicId) {
        redirect("/login");
    }

    const params = await searchParams;

    // If no boardId is provided, we need to fetch all boards and redirect to the first one
    // or the service getBoardPageData will handle a default board lookup if boardId is missing?
    // Let's refine the logic: if boardId is missing, we fetch boards first.

    // For now, let's assume we pass undefined boardId to the service and it might need it.
    // Actually, it's better to fetch boards first if boardId is missing.

    let boardId = params.boardId;

    const data = await getBoardPageData(boardId || "", clinicId, params);

    // If no boardId was provided and we found boards, redirect to the first one
    if (!boardId && data.allBoards.length > 0) {
        redirect(`/tarefas?boardId=${data.allBoards[0].id}`);
    }

    // If no boards exist at all, we might need a "Create your first board" state
    // But getBoardPageData handles default column creation for a board, not board creation itself.
    // We'll handle the empty state in the KanbanBoard component or here.

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <KanbanBoard
                key={data.board?.id}
                initialData={data}
                clinicId={clinicId}
                userId={session.user.id}
            />
        </div>
    );
}
