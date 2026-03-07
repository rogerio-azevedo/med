"use client";

import { useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import { KanbanColumn } from "../KanbanColumn";
import { KanbanCard } from "../KanbanCard";
import { BoardSelector } from "../BoardSelector";
import { KanbanHeader } from "../KanbanHeader";
import { CreateCardModal } from "../CreateCardModal";
import { CardDetailsModal } from "../CardDetailsModal";
import { CategoryManager } from "../CategoryManager";
import { CreateColumnModal } from "../CreateColumnModal";
import { CreateBoardModal } from "../CreateBoardModal";
import { BoardFlowConfig } from "../BoardFlowConfig";
import { moveCardAction, reorderColumnsAction } from "@/app/actions/kanban";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function KanbanBoard({ initialData, clinicId, userId }: any) {
    const router = useRouter();
    const [boards, setBoards] = useState(initialData.allBoards ?? []);
    const [activeBoard] = useState(initialData.board);
    const [columns, setColumns] = useState(initialData.columns ?? []);
    const [cards, setCards] = useState(initialData.cards ?? []);
    const [categories, setCategories] = useState(initialData.categories ?? []);

    const [activeCard, setActiveCard] = useState<any>(null);
    const [activeColumn, setActiveColumn] = useState<any>(null);

    const [filters, setFilters] = useState({
        search: "",
        priority: "all",
        categoryId: "all",
        responsibleId: "all"
    });

    // Modal states
    const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [isFlowConfigOpen, setIsFlowConfigOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Anchor column IDs
    const firstCol = columns[0];
    const lastCol = columns[columns.length - 1];
    const doneColumnId = lastCol?.id ?? null;
    const sortableColumnIds = columns.slice(1, columns.length - 1).map((c: any) => c.id);

    function isFixed(col: any) {
        return col.id === firstCol?.id || col.id === lastCol?.id;
    }

    const openCreateCard = (columnId?: string) => {
        setSelectedColumnId(columnId || columns[0]?.id);
        setSelectedCard(null);
        setIsCreateCardOpen(true);
    };

    const openEditCard = (card: any) => {
        setSelectedCard(card);
        setIsCreateCardOpen(true);
        setIsDetailsOpen(false);
    };

    const openDetailsCard = (card: any) => {
        setSelectedCard(card);
        setIsDetailsOpen(true);
    };

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
        } else if (event.active.data.current?.type === "Card") {
            setActiveCard(event.active.data.current.card);
        }
    }

    async function onDragEnd(event: DragEndEvent) {
        setActiveCard(null);
        setActiveColumn(null);

        const { active, over } = event;

        const isActiveColumn = active.data.current?.type === "Column";

        if (isActiveColumn) {
            if (!over || active.id === over.id) return;
            const newColumns = arrayMove(
                columns,
                columns.findIndex((c: any) => c.id === active.id),
                columns.findIndex((c: any) => c.id === over.id)
            );
            setColumns(newColumns);
            const result = await reorderColumnsAction(activeBoard.id, newColumns.map((c: any) => c.id));
            if (result.error) toast.error("Erro ao salvar ordem das colunas");
            return;
        }

        // Card was dropped — determine target column
        // Strategy: check over.data for ColumnDrop > Column > Card, then fallback to post-onDragOver state
        let targetColumnId: string | null = null;
        let overCard: any = null;

        if (over) {
            const overType = over.data.current?.type;
            if (overType === "ColumnDrop") {
                // Dropped on the useDroppable zone (handles empty columns)
                targetColumnId = over.data.current?.column?.id ?? null;
            } else if (overType === "Column") {
                targetColumnId = over.data.current?.column?.id ?? null;
            } else if (overType === "Card") {
                overCard = over.data.current?.card;
                // After onDragOver, the card's kanbanColumnId is already updated in local state
                const stateCard = cards.find((c: any) => c.id === overCard?.id);
                targetColumnId = stateCard?.kanbanColumnId ?? overCard?.kanbanColumnId ?? null;
            }
        }

        // Absolute fallback: use the dragged card's current state after onDragOver updated it
        if (!targetColumnId) {
            const movedCard = cards.find((c: any) => c.id === String(active.id));
            targetColumnId = movedCard?.kanbanColumnId ?? null;
        }

        if (!targetColumnId) return; // Can't determine target, abort

        const targetCards = cards.filter((c: any) => c.kanbanColumnId === targetColumnId && c.id !== String(active.id));
        const newPosition = overCard
            ? targetCards.findIndex((c: any) => c.id === over?.id) + 1
            : targetCards.length + 1;

        const result = await moveCardAction({
            cardId: String(active.id),
            targetColumnId: String(targetColumnId),
            position: Math.max(1, newPosition),
        });
        if (result.error) {
            toast.error("Erro ao mover cartão: " + result.error);
        } else {
            // Sync server state in background so local state stays accurate
            router.refresh();
        }
    }


    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const isActiveCard = active.data.current?.type === "Card";
        const isOverCard = over.data.current?.type === "Card";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveCard) return;

        if (isOverCard) {
            setCards((prev: any[]) => {
                const ai = prev.findIndex((c) => c.id === active.id);
                const oi = prev.findIndex((c) => c.id === over.id);
                const next = [...prev];
                if (next[ai].kanbanColumnId !== next[oi].kanbanColumnId) {
                    next[ai] = { ...next[ai], kanbanColumnId: next[oi].kanbanColumnId };
                }
                return arrayMove(next, ai, oi);
            });
        } else if (isOverColumn || over.data.current?.type === "ColumnDrop") {
            // "Column" = column sortable handle | "ColumnDrop" = useDroppable zone (handles empty columns)
            const targetColId = over.data.current?.type === "ColumnDrop"
                ? over.data.current?.column?.id
                : over.id;
            if (!targetColId) return;
            setCards((prev: any[]) => {
                const ai = prev.findIndex((c) => c.id === active.id);
                if (ai === -1) return prev;
                const next = [...prev];
                next[ai] = { ...next[ai], kanbanColumnId: targetColId };
                return arrayMove(next, ai, ai);
            });
        }
    }

    function handleCategoryUpdate(created: any, deletedId?: string) {
        if (deletedId) {
            setCategories((prev: any[]) => prev.filter((c) => c.id !== deletedId));
        } else if (created) {
            setCategories((prev: any[]) => [...prev, created]);
        }
    }

    function handleColumnCreated(col: any) {
        setColumns((prev: any[]) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, prev.length - 1), col, last];
        });
    }

    function handleBoardCreated(board: any) {
        setBoards((prev: any[]) => [...prev, board]);
    }

    /** Called by CreateCardModal after a new card is saved — adds it to local state immediately */
    function handleCardCreated(newCard: any) {
        if (!newCard) return;
        setCards((prev: any[]) => [...prev, newCard]);
    }

    /** Called by CreateCardModal after editing — updates the card in local state */
    function handleCardUpdated(updatedCard: any) {
        if (!updatedCard) return;
        setCards((prev: any[]) =>
            prev.map((c: any) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c))
        );
    }

    return (
        <div className="flex flex-col h-full bg-background gap-2 overflow-hidden px-4 py-2">
            <header className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Tarefas</h1>
                    <p className="text-muted-foreground text-sm font-medium">Visualize e gerencie as etapas de cada processo da sua clínica.</p>
                </div>

                <BoardSelector
                    boards={boards}
                    activeBoardId={activeBoard?.id}
                    onNewBoard={() => setIsCreateBoardOpen(true)}
                    onConfigFlow={() => setIsFlowConfigOpen(true)}
                />

                <KanbanHeader
                    onNewCard={() => openCreateCard()}
                    onNewColumn={() => setIsCreateColumnOpen(true)}
                    onManageCategories={() => setIsCategoryManagerOpen(true)}
                    filters={filters}
                    onFilterChange={setFilters}
                    categories={categories}
                    clinicUsers={initialData.clinicUsers ?? []}
                />
            </header>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 mt-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <div className="flex gap-5 h-full min-w-max pb-2">
                        <SortableContext items={sortableColumnIds} strategy={horizontalListSortingStrategy}>
                            {columns.map((column: any) => {
                                const filteredCards = cards.filter((c: any) => {
                                    if (filters.search && !c.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
                                    if (filters.priority !== "all" && c.priority !== filters.priority) return false;
                                    if (filters.categoryId !== "all" && c.categoryId !== filters.categoryId) return false;
                                    if (filters.responsibleId !== "all" && c.responsibleId !== filters.responsibleId) return false;
                                    return c.kanbanColumnId === column.id;
                                });

                                return (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        categories={categories}
                                        cards={filteredCards}
                                        onAddCard={() => openCreateCard(column.id)}
                                        onCardClick={openDetailsCard}
                                        isFixed={isFixed(column)}
                                        doneColumnId={doneColumnId}
                                    />
                                );
                            })}
                        </SortableContext>
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: { active: { opacity: "0.5" } }
                        })
                    }}>
                        {activeColumn && (
                            <KanbanColumn
                                column={activeColumn}
                                cards={cards.filter((c: any) => c.kanbanColumnId === activeColumn.id)}
                                categories={categories}
                                isFixed={isFixed(activeColumn)}
                            />
                        )}
                        {activeCard && <KanbanCard card={activeCard} categories={categories} />}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Modals */}
            <CreateCardModal
                isOpen={isCreateCardOpen}
                onClose={() => setIsCreateCardOpen(false)}
                initialColumnId={selectedColumnId}
                cardToEdit={selectedCard}
                categories={categories}
                clinicUsers={initialData.clinicUsers ?? []}
                onCreated={handleCardCreated}
                onUpdated={handleCardUpdated}
            />

            <CardDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                card={selectedCard}
                onEdit={openEditCard}
            />

            <CategoryManager
                isOpen={isCategoryManagerOpen}
                onClose={() => setIsCategoryManagerOpen(false)}
                categories={categories}
                onUpdate={handleCategoryUpdate}
            />

            <CreateColumnModal
                isOpen={isCreateColumnOpen}
                onClose={() => setIsCreateColumnOpen(false)}
                boardId={activeBoard?.id}
                currentCount={columns.length}
                onCreated={handleColumnCreated}
            />

            <CreateBoardModal
                isOpen={isCreateBoardOpen}
                onClose={() => setIsCreateBoardOpen(false)}
                onCreated={handleBoardCreated}
            />

            <BoardFlowConfig
                isOpen={isFlowConfigOpen}
                onClose={() => setIsFlowConfigOpen(false)}
                currentBoard={activeBoard}
                allBoards={boards}
            />
        </div>
    );
}
