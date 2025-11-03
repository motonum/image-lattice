import type { CellItem } from "@/types/cell";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LabelMode = "below" | "above" | "overlay";
type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha";

// Minimal IFD shape for TIFF decoding
type IfdMinimal = { width?: number; height?: number };

export default function useGrid() {
	const [rows, setRows] = useState<number>(1);
	const [cols, setCols] = useState<number>(2);
	const [gap, setGap] = useState<number>(10);
	const [fontSize, setFontSize] = useState<number>(72);
	const [labelMode, setLabelMode] = useState<LabelMode>("overlay");
	const [prevLabels, setPrevLabels] = useState<Array<
		string | undefined
	> | null>(null);
	const [numberingStrategy, setNumberingStrategy] =
		useState<NumberingStrategy>("user");
	const [cells, setCells] = useState<CellItem[]>([]);

	const initGrid = useCallback((r: number, c: number) => {
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
	}, []);

	useEffect(() => {
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
