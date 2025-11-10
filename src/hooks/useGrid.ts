import { loadImageFile, stripExt } from "@/lib/file";
import {
	type NumberingStrategy,
	cellsAtom,
	handleFilesDropAtom,
	numberingStrategyAtom,
	previewCellsAtom,
	replaceCellsAtom,
	updateCellAtom,
} from "@/state/gridAtoms";
import type { CellItem } from "@/types/cell";
import { useAtom, useAtomValue } from "jotai";

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

	const [numberingStrategy, setNumberingStrategy] = useAtom(
		numberingStrategyAtom,
	);

	const handleFilesDrop = async (files: FileList) => {
		await setHandleFilesDrop(files);
	};

	const handleNumberingStrategyChange = (newStrategy: NumberingStrategy) => {
		if (newStrategy === numberingStrategy) return;
		setNumberingStrategy(newStrategy);
	};

	const previewCells = useAtomValue(previewCellsAtom);

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
