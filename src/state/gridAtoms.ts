import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";
import { atomWithImmer } from "jotai-immer";
import { toast } from "sonner";
import { loadImageFile, revokeObjectUrlIfNeeded, stripExt } from "@/lib/file";
import { indexToAlpha } from "@/lib/labels";
import { DEFAULT_COLS, DEFAULT_ROWS, MAX_ROWS } from "@/state/gridConstants";
import { buildMatrixFromLoaded, newPlaceholder } from "@/state/gridHelpers";
import type { CellItem } from "@/types/cell";

// Config

export type LabelMode = "below" | "above" | "overlay";
export type NumberingStrategy =
	| "user"
	| "numeric"
	| "alpha"
	| "upper-alpha"
	| "none";

export const gapAtom = atomWithStorage<number>("gap", 10);
export const fontSizeAtom = atomWithStorage<number>("fontSize", 72);
export const labelModeAtom = atomWithStorage<LabelMode>("labelMode", "overlay");
export const numberingStrategyAtom = atomWithStorage<NumberingStrategy>(
	"numberingStrategy",
	"user",
);

// Base matrix atom: rows x cols of CellItem (writable)
const initialMatrix: CellItem[][] = Array.from({ length: DEFAULT_ROWS }).map(
	() => Array.from({ length: DEFAULT_COLS }).map(() => newPlaceholder()),
);

export const gridMatrixAtom = atomWithImmer<CellItem[][]>(initialMatrix);

export const cellAddressFamilyAtom = atomFamily((id: string) =>
	atom((get) => {
		const matrix = get(gridMatrixAtom);
		return matrix.reduce(
			(acc, currRow, r) => {
				if (acc.row !== -1) return acc;
				const col = currRow.findIndex((c) => c.id === id);
				const row = col !== -1 ? r : -1;
				return { row, col };
			},
			{ row: -1, col: -1 },
		);
	}),
);

export const cellFamilyAtom = atomFamily((id: string) =>
	atom(
		(get) => {
			const matrix = get(gridMatrixAtom);
			const cell = matrix.flat().find((c) => c.id === id);
			return cell;
		},
		(get, set, item: Partial<CellItem>) => {
			const { row, col } = get(cellAddressFamilyAtom(id));
			set(gridMatrixAtom, (draft) => {
				if (row === -1 || col === -1) return;
				draft[row][col] = { ...draft[row][col], ...item, id };
			});
		},
	),
);

export const loadedCellsAtom = atom<CellItem[]>((get) => {
	const matrix = get(gridMatrixAtom);
	return matrix
		.flat()
		.filter((c) => c?.src)
		.map((c) => ({ ...c }));
});

export const rowsAtom = atom(
	(get) => get(gridMatrixAtom).length,
	(get, set, payload: { newRows: number; expand: boolean }) => {
		const { newRows, expand } = payload;
		const cols = get(colsAtom);
		const loaded = get(loadedCellsAtom);
		const newCols = expand
			? Math.min(Math.ceil(loaded.length / newRows), MAX_ROWS)
			: cols;
		const newMatrix = buildMatrixFromLoaded(loaded, newRows, newCols);
		set(gridMatrixAtom, newMatrix);
	},
);

export const colsAtom = atom(
	(get) => get(gridMatrixAtom)[0]?.length ?? 1,
	(get, set, payload: { newCols: number; expand: boolean }) => {
		const { newCols, expand } = payload;
		const rows = get(rowsAtom);
		const loaded = get(loadedCellsAtom);
		const newRows = expand
			? Math.min(Math.ceil(loaded.length / newCols), MAX_ROWS)
			: rows;
		const newMatrix = buildMatrixFromLoaded(loaded, newRows, newCols);
		set(gridMatrixAtom, newMatrix);
	},
);

type Address = { id: string; row: number; col: number };

export const cellAddressAtom = atom<Address[]>((get) => {
	const matrix = get(gridMatrixAtom);
	const addresses: Address[] = [];
	for (let r = 0; r < matrix.length; r++) {
		for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
			addresses.push({ id: matrix[r][c].id, row: r, col: c });
		}
	}
	return addresses;
});

export const cellsAtom = atom<CellItem[]>((get) => get(gridMatrixAtom).flat());

export const previewCellsAtom = atom((get) => {
	const cells = get(cellsAtom);
	const numberingStrategy = get(numberingStrategyAtom);

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
});

export const hasAnyImageAtom = atom((get) =>
	get(cellsAtom).some((c) => !!c.src),
);

// Actions
export const updateCellAtom = atom(
	null,
	(get, set, payload: { index: number; item: Partial<CellItem> }) => {
		const cols = get(colsAtom);
		const index = payload.index;
		const r = Math.floor(index / cols);
		const c = index % cols;
		set(gridMatrixAtom, (draft) => {
			const prevItem = draft[r]?.[c] ?? newPlaceholder();
			draft[r][c] = { ...prevItem, ...payload.item, id: prevItem.id };
		});
	},
);

export const replaceCellsAtom = atom(null, (get, set, newCells: CellItem[]) => {
	const rows = get(rowsAtom);
	const cols = get(colsAtom);
	const matrix = buildMatrixFromLoaded(newCells, rows, cols);
	set(gridMatrixAtom, matrix);
});

export const clearCellAtom = atom(null, (get, set, index: number) => {
	const cols = get(colsAtom);
	const r = Math.floor(index / cols);
	const c = index % cols;
	const matrix = get(gridMatrixAtom);
	const prev = matrix[r]?.[c];
	if (prev?.src) revokeObjectUrlIfNeeded(prev.src);
	set(gridMatrixAtom, (draft) => {
		draft[r] = draft[r] ?? [];
		draft[r][c] = newPlaceholder();
	});
});

export const insertFilesAtIndexAtom = atom(
	null,
	async (get, set, payload: { files: FileList | File[]; index: number }) => {
		const fileArray = Array.from(payload.files as File[]);
		if (fileArray.length === 0) return;

		const cols = get(colsAtom);
		const _rows = get(rowsAtom);

		const cells = get(cellsAtom);
		const emptyIndices = cells
			.map((c, i) => ({ c, i }))
			.filter((x) => !x.c?.src)
			.map((x) => x.i);

		if (fileArray.length === 1) {
			const file = fileArray[0];
			try {
				const { src, width, height } = await loadImageFile(file);
				const idx = payload.index;
				const r = Math.floor(idx / cols);
				const c = idx % cols;
				set(gridMatrixAtom, (draft) => {
					draft[r] = draft[r] ?? [];
					const prevItem = draft[r][c] ?? newPlaceholder();
					draft[r][c] = {
						...prevItem,
						src,
						fileName: file.name,
						width,
						height,
						label: stripExt(file.name),
					};
				});
			} catch (err) {
				console.error("Image load error", err);
			}
			return;
		}

		if (emptyIndices.length === 0) return;
		const count = Math.min(fileArray.length, emptyIndices.length);
		for (let k = 0; k < count; k++) {
			const file = fileArray[k];
			try {
				const { src, width, height } = await loadImageFile(file);
				const idx = emptyIndices[k];
				const r = Math.floor(idx / cols);
				const c = idx % cols;
				set(gridMatrixAtom, (draft) => {
					draft[r] = draft[r] ?? [];
					const prevItem = draft[r][c] ?? newPlaceholder();
					draft[r][c] = {
						...prevItem,
						src,
						fileName: file.name,
						width,
						height,
						label: stripExt(file.name),
					};
				});
			} catch (err) {
				console.error("Image load error", err);
			}
		}
	},
);

export const handleFilesDropAtom = atom(
	null,
	async (get, set, files: FileList | File[]) => {
		const fileArray = Array.from(files as File[]);
		if (fileArray.length === 0) return;

		const cols = get(colsAtom);
		const rows = get(rowsAtom);

		let cells = get(cellsAtom);
		let emptyIndices = cells
			.map((c, i) => ({ c, i }))
			.filter((x) => !x.c?.src)
			.map((x) => x.i);

		if (fileArray.length > emptyIndices.length) {
			const needed = fileArray.length - emptyIndices.length;
			const rowsToAdd = Math.ceil(needed / cols);
			let newRows = rows + rowsToAdd;
			if (newRows > MAX_ROWS) newRows = MAX_ROWS;
			if (newRows > rows) {
				const loaded = cells.filter((c) => c?.src).map((c) => ({ ...c }));
				const N = newRows * cols;
				const keep = loaded.slice(0, N);
				const matrix = buildMatrixFromLoaded(keep, newRows, cols);
				set(gridMatrixAtom, matrix);
				cells = get(cellsAtom);
				emptyIndices = cells
					.map((c, i) => ({ c, i }))
					.filter((x) => !x.c?.src)
					.map((x) => x.i);
			}
		}

		const count = Math.min(fileArray.length, emptyIndices.length);
		for (let k = 0; k < count; k++) {
			const file = fileArray[k];
			try {
				const { src, width, height } = await loadImageFile(file);
				const idx = emptyIndices[k];
				const r = Math.floor(idx / cols);
				const c = idx % cols;
				set(gridMatrixAtom, (draft) => {
					draft[r] = draft[r] ?? [];
					const prevItem = draft[r][c] ?? newPlaceholder();
					draft[r][c] = {
						...prevItem,
						src,
						fileName: file.name,
						width,
						height,
						label: stripExt(file.name),
					};
				});
			} catch (err) {
				console.error("Image load error", err);
			}
		}

		if (count < fileArray.length) {
			toast.warning(
				`グリッドが最大行数（10行）に達したため、${fileArray.length - count} 個のファイルは破棄されました。`,
			);
		}
	},
);

export const gridAtoms = {
	gapAtom,
	fontSizeAtom,
	labelModeAtom,
	numberingStrategyAtom,
	gridMatrixAtom,
	cellAddressFamilyAtom,
};
