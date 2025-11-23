import { useAtomValue } from "jotai";
import { useRef } from "react";
import CanvasRenderer from "@/components/CanvasRenderer";
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
import { previewCellsAtom } from "@/state/gridAtoms";
import type { CanvasHandle } from "@/types/canvas";

export default function ExportDialog() {
	const previewCells = useAtomValue(previewCellsAtom);
	const hasAnyImage = previewCells.some((c) => !!c.src);
	const exportRef = useRef<CanvasHandle | null>(null);

	const handleDownload = async () => {
		if (!exportRef.current) return;
		const blob = await exportRef.current.exportPNG();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "lattice.png";
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
						preview={true}
						previewMaxHeight="70vh"
						previewMaxWidth="90vw"
					/>
				</div>

				{/* Offscreen renderer used for export */}
				<div style={{ display: "none" }} aria-hidden>
					<CanvasRenderer ref={exportRef} preview={false} />
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
