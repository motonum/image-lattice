import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revokeObjectUrlIfNeeded } from "@/lib/file";
import {
	cellFamilyAtom,
	clearCellAtom,
	handleFilesDropAtom,
	insertFilesAtIndexAtom,
	numberingStrategyAtom,
	updateCellAtom,
} from "@/state/gridAtoms";

type RenderCellProps = {
	i: number;
	id: string;
};

export default function Cell({ i, id }: RenderCellProps) {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [cell, _setCell] = useAtom(cellFamilyAtom(id));
	const numberingStrategy = useAtomValue(numberingStrategyAtom);
	const updateCell = useSetAtom(updateCellAtom);
	const clearCell = useSetAtom(clearCellAtom);
	const insertFiles = useSetAtom(insertFilesAtIndexAtom);
	const handleFilesDrop = useSetAtom(handleFilesDropAtom);

	const handleRemove = useCallback(
		(index: number) => {
			revokeObjectUrlIfNeeded(cell?.src);
			clearCell(index);
		},
		[cell?.src, clearCell],
	);

	const onFileDrop = useCallback(
		async (e: React.DragEvent, index: number) => {
			const files = e.dataTransfer.files;
			if (!files || files.length === 0) return;
			if (files.length === 1) insertFiles({ files, index });
			else handleFilesDrop(files);
		},
		[insertFiles, handleFilesDrop],
	);

	const onFileInput = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
			const fileList = e.target.files;
			if (!fileList || fileList.length === 0) return;
			if (fileList.length === 1)
				insertFiles({ files: Array.from(fileList), index });
			else handleFilesDrop(fileList);
		},
		[insertFiles, handleFilesDrop],
	);

	return (
		<div
			data-id={id} // Add data-id attribute for testability
			className="w-full h-full flex items-center justify-center"
			onDragOver={(e) => e.preventDefault()}
			onDrop={(e) => {
				e.stopPropagation();
				e.preventDefault();
				onFileDrop(e, i);
			}}
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
							updateCell({ index: i, item: { label: e.target.value } })
						}
						disabled={numberingStrategy !== "user"}
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
						multiple
					/>
					<Button
						className="w-full"
						variant="outline"
						onPointerDown={(e) => {
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
	);
}
