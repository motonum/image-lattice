import { loadImageFile, revokeObjectUrlIfNeeded, stripExt } from "@/lib/file";
import type { CellItem } from "@/types/cell";
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
import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Minimal IFD shape we read from UTIF for our use (width/height). Keep conservative.
type IfdMinimal = {
	width?: number;
	height?: number;
};

function SortableItem({
	id,
	index,
	children,
}: { id: string; index: number; children: React.ReactNode }) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
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

type RenderCellProps = {
	i: number;
	cells: CellItem[];
	updateCell: (index: number, item: Partial<CellItem>) => void;
	disableLabelInput?: boolean;
};

const Cell = ({ i, cells, updateCell, disableLabelInput }: RenderCellProps) => {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const cell = cells[i];

	const handleRemove = (index: number) => {
		revokeObjectUrlIfNeeded(cell?.src);
		updateCell(index, {
			src: undefined,
			fileName: undefined,
			width: undefined,
			height: undefined,
			label: undefined,
		});
	};

	const handleFileLoad = async (file: File, index: number) => {
		const name = file.name;
		try {
			const { src, width, height } = await loadImageFile(file);
			updateCell(index, {
				src,
				fileName: name,
				width,
				height,
				label: stripExt(name),
			});
		} catch (err) {
			console.error("Image load error", err);
		}
	};

	const stripExt = (name: string) => name.replace(/\.[^.]+$/, "");

	const onFileDrop = async (e: React.DragEvent, index: number) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;
		// If multiple files dropped, insert them into empty cells in order.
		if (files.length > 1) {
			const fileArray = Array.from(files);
			const emptyIndices = cells
				.map((c, i) => ({ c, i }))
				.filter((x) => !x.c?.src)
				.map((x) => x.i);
			if (emptyIndices.length === 0) return;
			const count = Math.min(fileArray.length, emptyIndices.length);
			for (let k = 0; k < count; k++) {
				handleFileLoad(fileArray[k], emptyIndices[k]);
			}
			return;
		}
		const file = files[0];
		await handleFileLoad(file, index);
	};

	const onFileInput = async (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		const fileList = e.target.files;
		if (!fileList || fileList.length === 0) return;
		const files = Array.from(fileList);
		if (files.length > 1) {
			const emptyIndices = cells
				.map((c, i) => ({ c, i }))
				.filter((x) => !x.c?.src)
				.map((x) => x.i);
			if (emptyIndices.length === 0) return;
			const count = Math.min(files.length, emptyIndices.length);
			for (let k = 0; k < count; k++) {
				handleFileLoad(files[k], emptyIndices[k]);
			}
			return;
		}
		await handleFileLoad(files[0], index);
	};

	return (
		<SortableItem id={cell.id} index={i}>
			<div
				className="w-full h-full flex items-center justify-center"
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => onFileDrop(e, i)}
			>
				{cell?.src ? (
					<div className="flex flex-col gap-2">
						<img
							className="w-auto h-auto max-w-full max-h-[120px] object-contain block"
							src={cell.src}
							alt={cell.fileName}
							draggable={false}
						/>
						<Input
							className="w-full"
							value={cell.label ?? ""}
							onPointerDown={(e) => e.stopPropagation()}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateCell(i, { label: e.target.value })
							}
							disabled={disableLabelInput}
						/>
						<Button
							variant="destructive"
							size="sm"
							className="mt-1.5"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={() => handleRemove(i)}
						>
							Delete
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center gap-2">
						<div className="text-sm font-medium">Drop image or</div>
						<input
							type="file"
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onFileInput(e, i)
							}
							accept="image/*,.tif,.tiff"
							className="hidden"
							ref={fileInputRef}
						/>
						<Button
							className="w-full"
							variant="outline"
							onPointerDown={(e) => {
								// Prevent DnD-kit from intercepting the pointer and blocking the click
								e.stopPropagation();
								e.preventDefault();
								fileInputRef.current?.click();
							}}
						>
							Select File
						</Button>
					</div>
				)}
			</div>
		</SortableItem>
	);
};

type Props = {
	rows: number;
	cols: number;
	cells: CellItem[];
	updateCell: (index: number, item: Partial<CellItem>) => void;
	replaceCells: (newCells: CellItem[]) => void;
	disableLabelInput?: boolean;
};

export default function Grid({
	rows,
	cols,
	cells,
	updateCell,
	replaceCells,
	disableLabelInput,
}: Props) {
	const N = rows * cols;

	// DnD-kit setup for sortable grid
	const sensors = useSensors(useSensor(PointerSensor));

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;
		const copy = [...cells];
		// DnD-kit item ids are cell.id strings now; find their indices
		const oldIndex = copy.findIndex((c) => c.id === String(active.id));
		const newIndex = copy.findIndex((c) => c.id === String(over.id));
		if (oldIndex === -1 || newIndex === -1) return;
		if (oldIndex === newIndex) return;
		const moved = arrayMove(copy, oldIndex, newIndex);
		// Ensure length N
		while (moved.length < N) moved.push({ id: `${Math.random()}` });
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
						<Cell
							key={cell.id}
							i={i}
							cells={cells}
							updateCell={updateCell}
							disableLabelInput={disableLabelInput}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
