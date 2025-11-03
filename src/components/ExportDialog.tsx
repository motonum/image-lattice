import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { CellItem } from "@/types/cell";
import React, { useRef } from "react";
import CanvasRenderer, { type CanvasHandle } from "./CanvasRenderer";

interface Props {
	rows: number;
	cols: number;
	previewCells: CellItem[];
	gap: number;
	fontSize: number;
	labelMode: "below" | "above" | "overlay";
	hasAnyImage: boolean;
}

export default function ExportDialog({
	rows,
	cols,
	previewCells,
	gap,
	fontSize,
	labelMode,
	hasAnyImage,
}: Props) {
	const exportRef = useRef<CanvasHandle | null>(null);

	const handleDownload = async () => {
		if (!exportRef.current) return;
		const blob = await exportRef.current.exportPNG();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "grid.png";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button type="button" disabled={!hasAnyImage} className="w-full">
					Export
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export preview</DialogTitle>
					<DialogDescription>
						Preview the generated image and download as PNG.
					</DialogDescription>
				</DialogHeader>

				<div className="p-4 w-full max-h-[70vh] overflow-auto flex justify-center items-center">
					{/* Visible preview: render a second CanvasRenderer with preview enabled (no ref) */}
					<CanvasRenderer
						rows={rows}
						cols={cols}
						cells={previewCells}
						gap={gap}
						fontSize={fontSize}
						preview={true}
						previewMaxHeight="70vh"
						previewMaxWidth="90vw"
						labelMode={labelMode}
					/>
				</div>

				{/* Offscreen renderer used for export */}
				<div style={{ display: "none" }} aria-hidden>
					<CanvasRenderer
						ref={exportRef}
						rows={rows}
						cols={cols}
						cells={previewCells}
						gap={gap}
						fontSize={fontSize}
						preview={false}
						labelMode={labelMode}
					/>
				</div>

				<DialogFooter>
					<div className="flex gap-2">
						<Button type="button" onClick={handleDownload}>
							Download PNG
						</Button>
						<DialogClose asChild>
							<Button variant="ghost">Close</Button>
						</DialogClose>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
