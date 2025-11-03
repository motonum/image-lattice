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
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarProvider,
} from "@/components/ui/sidebar";
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import CanvasRenderer, { type CanvasHandle } from "./components/CanvasRenderer";
import Grid from "./components/Grid";
import NumericInput from "./components/NumericInput";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";

type LabelMode = "below" | "above" | "overlay";
type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha";

export type CellItem = {
	id: string;
	src?: string; // object URL or data URL
	fileName?: string;
	width?: number;
	height?: number;
	label?: string;
};

export default function App() {
	const [rows, setRows] = useState<number>(1);
	const [cols, setCols] = useState<number>(2);
	const [gap, setGap] = useState<number>(10);
	const [fontSize, setFontSize] = useState<number>(72);
	const [labelMode, setLabelMode] = useState<LabelMode>("overlay");
	const [prevLabels, setPrevLabels] = useState<Array<
		string | undefined
	> | null>(null);
	// numberingStrategy: 'user' means leave labels as user-defined; 'numeric'/'alpha' trigger auto-numbering
	const [numberingStrategy, setNumberingStrategy] =
		useState<NumberingStrategy>("user");
	// preview is now shown inside an Export sheet/dialog; keep hidden canvas renderer available for export
	const [cells, setCells] = useState<CellItem[]>([]);
	const canvasRef = useRef<CanvasHandle | null>(null);

	// Minimal IFD shape for TIFF decoding
	type IfdMinimal = { width?: number; height?: number };

	// whether there is at least one loaded image to export
	const hasAnyImage = cells.some((c) => !!c.src);

	// Initialize or resize the grid while preserving images that still fit.
	// When shrinking, pack existing loaded images to the front (top-left) so
	// that as many images as possible are retained; any overflow beyond the
	// new capacity is discarded.
	const initGrid = React.useCallback((r: number, c: number) => {
		setCells((prev) => {
			const N = r * c;
			// collect existing loaded images in document order
			const loaded = prev
				.filter((cell) => cell?.src)
				.map((cell) => ({ ...cell }));
			// keep as many as fit
			const keep = loaded.slice(0, N);
			const newCells: CellItem[] = [];
			for (let i = 0; i < N; i++) {
				if (i < keep.length) {
					newCells.push({ ...keep[i], id: `${i}` });
				} else {
					newCells.push({ id: `${i}` });
				}
			}
			return newCells;
		});
	}, []);

	React.useEffect(() => {
		initGrid(rows, cols);
	}, [initGrid, rows, cols]);

	const updateCell = (index: number, item: Partial<CellItem>) => {
		setCells((prev) => {
			const copy = [...prev];
			copy[index] = { ...copy[index], ...item };
			return copy;
		});
	};

	const replaceCells = (newCells: CellItem[]) => setCells(newCells);

	const handleFileLoad = async (file: File, index: number) => {
		const name = file.name;
		const lower = name.toLowerCase();
		if (
			lower.endsWith(".tif") ||
			lower.endsWith(".tiff") ||
			file.type === "image/tiff"
		) {
			try {
				const buffer = await file.arrayBuffer();
				const UTIF = (await import("utif")) as unknown as {
					decode: (b: ArrayBuffer | Uint8Array) => IfdMinimal[];
					decodeImages: (
						b: ArrayBuffer | Uint8Array,
						ifds: IfdMinimal[],
					) => void;
					toRGBA8: (ifd: IfdMinimal) => Uint8Array;
				};
				const ifds = UTIF.decode(buffer);
				UTIF.decodeImages(buffer, ifds);
				const first = ifds[0];
				const width = first?.width ?? 0;
				const height = first?.height ?? 0;
				const rgba = UTIF.toRGBA8(first);
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				const imageData = new ImageData(
					new Uint8ClampedArray(rgba),
					width,
					height,
				);
				ctx.putImageData(imageData, 0, 0);
				const src = canvas.toDataURL();
				updateCell(index, {
					src,
					fileName: name,
					width,
					height,
					label: name.replace(/\.[^.]+$/, ""),
				});
			} catch (err) {
				console.error("TIF load error", err);
			}
		} else {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.src = url;
			img.onload = () => {
				updateCell(index, {
					src: url,
					fileName: name,
					width: img.naturalWidth,
					height: img.naturalHeight,
					label: name.replace(/\.[^.]+$/, ""),
				});
			};
		}
	};

	const handleFilesDrop = async (files: FileList) => {
		if (!files || files.length === 0) return;
		const fileArray = Array.from(files);

		// Find empty slots
		let emptyIndices = cells
			.map((c, i) => ({ c, i }))
			.filter((x) => !x.c?.src)
			.map((x) => x.i);

		// If not enough empty slots, add rows until we have capacity, but cap rows at 10
		if (fileArray.length > emptyIndices.length) {
			const needed = fileArray.length - emptyIndices.length;
			const rowsToAdd = Math.ceil(needed / cols);
			let newRows = rows + rowsToAdd;
			if (newRows > 10) newRows = 10;
			if (newRows > rows) {
				const newCells = [...cells];
				while (newCells.length < newRows * cols)
					newCells.push({ id: `${newCells.length}` });
				setRows(newRows);
				replaceCells(newCells);
				emptyIndices = newCells
					.map((c, i) => ({ c, i }))
					.filter((x) => !x.c?.src)
					.map((x) => x.i);
			}
		}

		// Insert as many files as we have empty slots; discard extras
		const count = Math.min(fileArray.length, emptyIndices.length);
		for (let k = 0; k < count; k++) {
			handleFileLoad(fileArray[k], emptyIndices[k]);
		}
		if (count < fileArray.length) {
			toast.warning(
				`グリッドが最大行数（10行）に達したため、${fileArray.length - count} 個のファイルは破棄されました。`,
			);
		}
	};

	const indexToAlpha = React.useCallback((n: number) => {
		// 0 -> a, 25 -> z, 26 -> aa
		let i = n;
		let s = "";
		while (i >= 0) {
			s = String.fromCharCode((i % 26) + 97) + s;
			i = Math.floor(i / 26) - 1;
		}
		return s;
	}, []);

	const handleNumberingStrategyChange = (newStrategy: NumberingStrategy) => {
		if (newStrategy === numberingStrategy) return;

		if (newStrategy === "user") {
			// revert to previously saved labels if available
			if (prevLabels) {
				const restored = cells.map((c, i) => ({ ...c, label: prevLabels[i] }));
				replaceCells(restored);
				setPrevLabels(null);
			}
			setNumberingStrategy("user");
			return;
		}

		// entering numeric/alpha mode: save previous labels if not already saved
		if (!prevLabels) setPrevLabels(cells.map((c) => c.label));

		// Do not mutate the canonical `cells` here. We compute preview/export labels
		// from `cells` on render. Save previous labels so we can restore them when
		// switching back to 'user'.
		setNumberingStrategy(newStrategy);
	};

	// Compute a derived cells array used for preview/export that applies
	// automatic numbering when `numberingStrategy` !== 'user'. This keeps the
	// canonical `cells` state untouched so cell inputs continue to show the
	// user's labels.
	const previewCells = React.useMemo(() => {
		if (numberingStrategy === "user") return cells;
		const next: CellItem[] = [];
		let counter = 1;
		for (let i = 0; i < cells.length; i++) {
			const cell = cells[i];
			if (cell?.src) {
				let label = "";
				if (numberingStrategy === "numeric") {
					label = `(${counter})`;
				} else if (numberingStrategy === "alpha") {
					label = `(${indexToAlpha(counter - 1)})`;
				} else if (numberingStrategy === "upper-alpha") {
					label = `(${indexToAlpha(counter - 1).toUpperCase()})`;
				}
				counter++;
				next.push({ ...cell, label });
			} else {
				next.push({ ...cell });
			}
		}
		return next;
	}, [cells, numberingStrategy, indexToAlpha]);

	const handleDownload = async () => {
		if (!canvasRef.current) return;
		const blob = await canvasRef.current.exportPNG();
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
		<SidebarProvider>
			<div
				className="flex min-h-screen grow"
				onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
				onDrop={async (e: React.DragEvent<HTMLDivElement>) => {
					e.preventDefault();
					await handleFilesDrop(e.dataTransfer.files);
				}}
			>
				<div className="mx-auto max-w-[1100px] w-full p-2">
					<header>
						<h1>Image Lattice</h1>
					</header>

					<Grid
						rows={rows}
						cols={cols}
						cells={cells}
						updateCell={updateCell}
						replaceCells={replaceCells}
						disableLabelInput={numberingStrategy !== "user"}
					/>

					{/* Hidden canvas renderer used for export; keep preview=false so canvas stays offscreen */}
					<CanvasRenderer
						ref={canvasRef}
						rows={rows}
						cols={cols}
						cells={previewCells}
						gap={gap}
						fontSize={fontSize}
						preview={false}
						labelMode={labelMode}
					/>
				</div>

				<Sidebar side="right" collapsible="none" className="w-72">
					<SidebarContent>
						<SidebarHeader>
							<h2 className="text-sm font-medium">Settings</h2>
						</SidebarHeader>

						<section className="flex flex-col gap-3 p-2">
							<div className="flex gap-2">
								<Label htmlFor="rows-input" className="flex items-center">
									<div>Rows:</div>
								</Label>
								<NumericInput
									id="rows-input"
									outerState={rows}
									setOuterState={setRows}
									disabled={false}
									className="w-16"
									rejectNegative
									integer
									min={1}
									max={10}
								/>
								<Label htmlFor="cols-input" className="flex items-center">
									<div>Cols:</div>
								</Label>
								<NumericInput
									id="cols-input"
									outerState={cols}
									setOuterState={setCols}
									disabled={false}
									className="w-16"
									rejectNegative
									integer
									min={1}
									max={10}
								/>
							</div>
							<div className="flex gap-2">
								<Label htmlFor="gap-input" className="flex items-center">
									<div>Gap:</div>
								</Label>
								<NumericInput
									id="gap-input"
									outerState={gap}
									setOuterState={setGap}
									disabled={false}
									className="w-16"
									rejectNegative
									integer
								/>
							</div>
							<div className="flex gap-2">
								<Label
									htmlFor="label-type-select"
									className="flex items-center"
								>
									<div>Label type:</div>
								</Label>
								<Select
									value={numberingStrategy}
									onValueChange={(e) =>
										handleNumberingStrategyChange(e as NumberingStrategy)
									}
								>
									<SelectTrigger id="label-type-select" className="w-36">
										<SelectValue placeholder="Label numbering" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">User defined</SelectItem>
										<SelectItem value="numeric">1,2,3,...</SelectItem>
										<SelectItem value="alpha">a,b,c,...</SelectItem>
										<SelectItem value="upper-alpha">A,B,C,...</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex gap-2">
								<Label htmlFor="fontsize-input" className="flex items-center">
									<div>Label font:</div>
								</Label>
								<Input
									type="number"
									id="fontsize-input"
									className="w-16"
									min={0}
									value={fontSize}
									onChange={(e) => setFontSize(Number(e.target.value))}
								/>
							</div>
							<div className="flex gap-2">
								<Label
									htmlFor="label-mode-select"
									className="flex items-center"
								>
									<div>Label mode:</div>
								</Label>
								<Select
									value={labelMode}
									onValueChange={(e) => setLabelMode(e as LabelMode)}
								>
									<SelectTrigger id="label-mode-select" className="w-36">
										<SelectValue placeholder="Label mode" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="overlay">Overlay</SelectItem>
										<SelectItem value="below">Below image</SelectItem>
										<SelectItem value="above">Above image</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Export flow: open sheet to preview and download */}
							<div className="flex gap-2">
								<Dialog>
									<DialogTrigger asChild>
										<Button
											type="button"
											disabled={!hasAnyImage}
											className="w-full"
										>
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
							</div>
						</section>
					</SidebarContent>
				</Sidebar>
			</div>
		</SidebarProvider>
	);
}
