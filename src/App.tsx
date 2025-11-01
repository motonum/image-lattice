import React, { useState, useRef } from "react";
import CanvasRenderer, { type CanvasHandle } from "./components/CanvasRenderer";
import Grid from "./components/Grid";

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
	const [rows, setRows] = useState<number>(2);
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

	const handleGenerate = () => {
		initGrid(rows, cols);
	};

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
		<div className="app">
			<header>
				<h1>Image Lattice</h1>
			</header>

			<section className="controls">
				<label>
					Rows:
					<input
						type="number"
						min={1}
						value={rows}
						onChange={(e) => setRows(Number(e.target.value))}
					/>
				</label>
				<label>
					Cols:
					<input
						type="number"
						min={1}
						value={cols}
						onChange={(e) => setCols(Number(e.target.value))}
					/>
				</label>
				<label>
					Gap (px):
					<input
						type="number"
						min={0}
						value={gap}
						onChange={(e) => setGap(Number(e.target.value))}
					/>
				</label>
				<label>
					Label font (px):
					<input
						type="number"
						min={8}
						max={72}
						value={fontSize}
						onChange={(e) => setFontSize(Number(e.target.value))}
					/>
				</label>
				<label>
					Label mode:
					<select
						value={labelMode}
						onChange={(e) => setLabelMode(e.target.value as LabelMode)}
					>
						<option value="below">Below image</option>
						<option value="above">Above image</option>
						<option value="overlay">Overlay (top-left)</option>
					</select>
				</label>
				<button type="button" onClick={handleGenerate}>
					Generate Grid
				</button>
				<button type="button" onClick={handleDownload}>
					Download PNG
				</button>
				<button type="button" onClick={() => setShowPreview((p) => !p)}>
					{showPreview ? "Hide Preview" : "Show Preview"}
				</button>
				<label>
					Label numbering:
					<select
						value={numberingStrategy}
						onChange={(e) =>
							handleNumberingStrategyChange(e.target.value as NumberingStrategy)
						}
					>
						<option value="user">User defined</option>
						<option value="numeric">1,2,3,...</option>
						<option value="alpha">a,b,c,...</option>
						<option value="upper-alpha">A,B,C,...</option>
					</select>
				</label>
			</section>

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
	);
}
