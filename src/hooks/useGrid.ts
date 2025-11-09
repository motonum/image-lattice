import { loadImageFile, stripExt } from "@/lib/file";
import {
	cellsAtom,
	colsAtom,
	fontSizeAtom,
	gapAtom,
	handleFilesDropAtom,
	numberingStrategyAtom,
	replaceCellsAtom,
	rowsAtom,
	updateCellAtom,
} from "@/state/gridAtoms";
import type { CellItem } from "@/types/cell";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LabelMode = "below" | "above" | "overlay";
type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha" | "none";

export function useGridCells() {
	const cells = useAtomValue(cellsAtom);
	const [, setUpdateCell] = useAtom(updateCellAtom);
	const [, setReplaceCells] = useAtom(replaceCellsAtom);

	const updateCell = (index: number, item: Partial<CellItem>) => {
		setUpdateCell({ index, item });
	};

	const replaceCells = (newCells: CellItem[]) => setReplaceCells(newCells);

	return {
		cells,
		updateCell,
		replaceCells,
	};
}

export default function useGrid() {
	const { cells, updateCell, replaceCells } = useGridCells();
	const [, setHandleFilesDrop] = useAtom(handleFilesDropAtom);

	const [prevLabels, setPrevLabels] = useState<Array<
		string | undefined
	> | null>(null);
	const [numberingStrategy, setNumberingStrategy] = useAtom(
		numberingStrategyAtom,
	);

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
		// delegate to atom action which handles expansion and loading
		await setHandleFilesDrop(files);
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
