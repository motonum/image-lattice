import { loadImageFile, stripExt } from "@/lib/file";
import type { CellItem } from "@/types/cell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LabelMode = "below" | "above" | "overlay";
type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha" | "none";

// Minimal IFD shape for TIFF decoding
type IfdMinimal = { width?: number; height?: number };

export function useGridLayout() {
	const [rows, setRows] = useState<number>(1);
	const [cols, setCols] = useState<number>(2);
	const [gap, setGap] = useState<number>(10);
	const [fontSize, setFontSize] = useState<number>(72);

	return {
		rows,
		setRows,
		cols,
		setCols,
		gap,
		setGap,
		fontSize,
		setFontSize,
	};
}

export function useGridCells() {
	const [cells, setCells] = useState<CellItem[]>([]);

	const updateCell = (index: number, item: Partial<CellItem>) => {
		setCells((prev) => {
			const copy = [...prev];
			copy[index] = { ...copy[index], ...item };
			return copy;
		});
	};

	const replaceCells = (newCells: CellItem[]) => setCells(newCells);

	return {
		cells,
		setCells,
		updateCell,
		replaceCells,
	};
}

export default function useGrid() {
	const { rows, setRows, cols, setCols, gap, setGap, fontSize, setFontSize } =
		useGridLayout();
	const { cells, setCells, updateCell, replaceCells } = useGridCells();

	const [labelMode, setLabelMode] = useState<LabelMode>("overlay");
	const [prevLabels, setPrevLabels] = useState<Array<
		string | undefined
	> | null>(null);
	const [numberingStrategy, setNumberingStrategy] =
		useState<NumberingStrategy>("user");

	const initGrid = useCallback(
		(r: number, c: number) => {
			setCells((prev) => {
				const N = r * c;
				const loaded = prev
					.filter((cell) => cell?.src)
					.map((cell) => ({ ...cell }));
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
		},
		[setCells],
	);

	useEffect(() => {
		initGrid(rows, cols);
	}, [initGrid, rows, cols]);

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

	const handleFilesDrop = async (files: FileList) => {
		if (!files || files.length === 0) return;
		const fileArray = Array.from(files);

		let emptyIndices = cells
			.map((c, i) => ({ c, i }))
			.filter((x) => !x.c?.src)
			.map((x) => x.i);

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

	const indexToAlpha = useCallback((n: number) => {
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
			if (prevLabels) {
				const restored = cells.map((c, i) => ({ ...c, label: prevLabels[i] }));
				replaceCells(restored);
				setPrevLabels(null);
			}
			setNumberingStrategy("user");
			return;
		}

		// For non-user strategies (including "none") save previous labels
		if (!prevLabels) setPrevLabels(cells.map((c) => c.label));
		setNumberingStrategy(newStrategy);
	};

	const previewCells = useMemo(() => {
		if (numberingStrategy === "user") return cells;
		const next: CellItem[] = [];
		let counter = 1;
		for (let i = 0; i < cells.length; i++) {
			const cell = cells[i];
			if (cell?.src) {
				let label: string | undefined = "";
				if (numberingStrategy === "numeric") {
					label = `(${counter})`;
				} else if (numberingStrategy === "alpha") {
					label = `(${indexToAlpha(counter - 1)})`;
				} else if (numberingStrategy === "upper-alpha") {
					label = `(${indexToAlpha(counter - 1).toUpperCase()})`;
				} else if (numberingStrategy === "none") {
					label = undefined;
				}
				counter++;
				next.push({ ...cell, label });
			} else {
				next.push({ ...cell });
			}
		}
		return next;
	}, [cells, numberingStrategy, indexToAlpha]);

	const hasAnyImage = cells.some((c) => !!c.src);

	return {
		rows,
		setRows,
		cols,
		setCols,
		gap,
		setGap,
		fontSize,
		setFontSize,
		labelMode,
		setLabelMode,
		numberingStrategy,
		handleNumberingStrategyChange,
		cells,
		previewCells,
		updateCell,
		replaceCells,
		handleFilesDrop,
		hasAnyImage,
	};
}
