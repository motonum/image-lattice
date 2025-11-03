import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { Check } from "lucide-react";
import React, { useState, useRef } from "react";
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
	const [showPreview, setShowPreview] = useState<boolean>(false);
	const [cells, setCells] = useState<CellItem[]>([]);
	const canvasRef = useRef<CanvasHandle | null>(null);

	const initGrid = React.useCallback((r: number, c: number) => {
		const N = r * c;
		const items: CellItem[] = [];
		for (let i = 0; i < N; i++) items.push({ id: `${i}` });
		setCells(items);
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

	const indexToAlpha = (n: number) => {
		// 0 -> a, 25 -> z, 26 -> aa
		let i = n;
		let s = "";
		while (i >= 0) {
			s = String.fromCharCode((i % 26) + 97) + s;
			i = Math.floor(i / 26) - 1;
		}
		return s;
	};

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

		const newCells = [...cells];
		let counter = 1;
		for (let i = 0; i < newCells.length; i++) {
			if (newCells[i].src) {
				let label = "";
				if (newStrategy === "numeric") {
					label = `(${counter})`;
				} else if (newStrategy === "alpha") {
					label = `(${indexToAlpha(counter - 1)})`;
				} else if (newStrategy === "upper-alpha") {
					label = `(${indexToAlpha(counter - 1).toUpperCase()})`;
				}
				newCells[i] = { ...newCells[i], label };
				counter++;
			}
		}
		replaceCells(newCells);
		setNumberingStrategy(newStrategy);
	};

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
			<div className="flex min-h-screen grow">
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
					/>

					<CanvasRenderer
						ref={canvasRef}
						rows={rows}
						cols={cols}
						cells={cells}
						gap={gap}
						fontSize={fontSize}
						preview={showPreview}
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

							<div className="flex items-center">
								<Checkbox
									id="show-preview-checkbox"
									checked={showPreview}
									onCheckedChange={() => setShowPreview((p) => !p)}
								/>
								<Label htmlFor="show-preview-checkbox" className="ml-2">
									Show preview
								</Label>
							</div>

							<div className="flex gap-2">
								<Button type="button" onClick={handleDownload}>
									Download PNG
								</Button>
							</div>
						</section>
					</SidebarContent>
				</Sidebar>
			</div>
		</SidebarProvider>
	);
}
