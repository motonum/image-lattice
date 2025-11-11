import Cell from "@/components/Cell";
import {
	cellsAtom,
	colsAtom,
	replaceCellsAtom,
	rowsAtom,
} from "@/state/gridAtoms";
import {
	DndContext,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAtomValue, useSetAtom } from "jotai";
import type { CSSProperties, ReactNode } from "react";

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 9999 : "auto",
		boxShadow: isDragging ? "0 1px 2px rgba(0, 0, 0, 0.2)" : "none",
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="border border-dashed border-gray-300 p-1.5 min-h-[120px] bg-[#fafafa]"
			onDragOver={(e) => e.preventDefault()}
		>
			{children}
		</div>
	);
}

export default function Grid() {
	const rows = useAtomValue(rowsAtom);
	const cols = useAtomValue(colsAtom);
	const N = rows * cols;

	const cells = useAtomValue(cellsAtom);
	const replaceCells = useSetAtom(replaceCellsAtom);

	const sensors = useSensors(useSensor(PointerSensor));

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;
		const copy = [...cells];
		const oldIndex = copy.findIndex((c) => c.id === String(active.id));
		const newIndex = copy.findIndex((c) => c.id === String(over.id));
		if (oldIndex === -1 || newIndex === -1) return;
		if (oldIndex === newIndex) return;
		const moved = arrayMove(copy, oldIndex, newIndex);
		while (moved.length < N) moved.push({ id: crypto.randomUUID() });
		if (moved.length > N) moved.length = N;
		replaceCells(moved);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={onDragEnd}
		>
			<SortableContext
				items={cells.slice(0, N).map((c) => c.id)}
				strategy={rectSortingStrategy}
			>
				<div
					className="grid grid-cols-1 gap-2"
					style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
				>
					{cells.slice(0, N).map((cell, i) => (
						<SortableItem key={cell.id} id={cell.id}>
							<Cell i={i} id={cell.id} />
						</SortableItem>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
