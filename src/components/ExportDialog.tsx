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
import React from "react";
import CanvasRenderer from "./CanvasRenderer";

interface Props {
	rows: number;
	cols: number;
	previewCells: CellItem[];
	gap: number;
	fontSize: number;
	labelMode: "below" | "above" | "overlay";
	hasAnyImage: boolean;
	handleDownload: () => void;
}

export default function ExportDialog({
	rows,
	cols,
	previewCells,
	gap,
	fontSize,
	labelMode,
	hasAnyImage,
	handleDownload,
}: Props) {
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

				<div className="p-4">
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
