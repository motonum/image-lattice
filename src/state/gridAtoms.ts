import { loadImageFile, stripExt } from "@/lib/file";
import { indexToAlpha } from "@/lib/labels";
import type { CellItem } from "@/types/cell";
import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";
import { toast } from "sonner";

export type LabelMode = "below" | "above" | "overlay";
export type NumberingStrategy =
	| "user"
	| "numeric"
	| "alpha"
	| "upper-alpha"
	| "none";

export const gapAtom = atom<number>(10);
export const fontSizeAtom = atom<number>(72);
export const labelModeAtom = atom<LabelMode>("overlay");
export const numberingStrategyAtom = atom<NumberingStrategy>("user");

// Base matrix atom: rows x cols of CellItem (writable)
const defaultRows = 1;
const defaultCols = 2;
const initialMatrix: CellItem[][] = Array.from({ length: defaultRows }).map(
	(_, r) =>
		Array.from({ length: defaultCols }).map((_, c) => ({
			id: crypto.randomUUID(),
		})),
);
export const gridMatrixAtom = atomWithImmer<CellItem[][]>(initialMatrix);

// Helper: build a rows x cols matrix from a flat ordered `loaded` array.
// Preserves item ids when present; fills remaining slots with new placeholders.
function buildMatrixFromLoaded(
	loaded: CellItem[],
	rows: number,
	cols: number,
): CellItem[][] {
	const matrix: CellItem[][] = [];
	let k = 0;
	for (let r = 0; r < rows; r++) {
		const row: CellItem[] = [];
		for (let c = 0; c < cols; c++) {
			if (k < loaded.length) {
				row.push({ ...loaded[k], id: loaded[k].id ?? crypto.randomUUID() });
			} else {
				row.push({ id: crypto.randomUUID() });
			}
			k++;
		}
		matrix.push(row);
	}
	return matrix;
}

// Derived: rows and cols are writable atoms that resize the base matrix
export const rowsAtom = atom(
	(get) => get(gridMatrixAtom).length,
	(get, set, payload: { newRows: number; expand: boolean }) => {
		const { newRows, expand } = payload;
		const matrix = get(gridMatrixAtom);
		const cols = matrix[0]?.length ?? 0;
		const flat = matrix.flat();
		const loaded = flat.filter((c) => c?.src).map((c) => ({ ...c }));
		const newCols = expand
			? Math.min(Math.ceil(loaded.length / newRows), 10)
			: cols;
		const newMatrix = buildMatrixFromLoaded(loaded, newRows, newCols);
		set(gridMatrixAtom, newMatrix);
	},
);

export const colsAtom = atom(
	(get) => get(gridMatrixAtom)[0]?.length ?? 0,
	(get, set, payload: { newCols: number; expand: boolean }) => {
		const { newCols, expand } = payload;
		const matrix = get(gridMatrixAtom);
		const rows = matrix.length;
		const flat = matrix.flat();
		const loaded = flat.filter((c) => c?.src).map((c) => ({ ...c }));
		const newRows = expand
			? Math.min(Math.ceil(loaded.length / newCols), 10)
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

// Derived: preview cells according to numbering strategy
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
		const idx = payload.index;
		const r = Math.floor(idx / cols);
		const c = idx % cols;
		// update via immer draft for simplicity
		set(gridMatrixAtom, (draft) => {
			draft[r] = draft[r] ?? [];
			const prevItem = draft[r]?.[c] ?? { id: crypto.randomUUID() };
			draft[r][c] = { ...prevItem, ...payload.item, id: prevItem.id };
		});
	},
);

export const replaceCellsAtom = atom(null, (get, set, newCells: CellItem[]) => {
	// Map incoming flat array into the current grid matrix
	const rows = get(rowsAtom);
	const cols = get(colsAtom);
	const matrix: CellItem[][] = [];
	let k = 0;
	for (let r = 0; r < rows; r++) {
		const row: CellItem[] = [];
		for (let c = 0; c < cols; c++) {
			const cell = newCells[k];
			if (cell?.src) {
				row.push({ ...cell, id: cell.id ?? crypto.randomUUID() });
			} else {
				row.push({ id: crypto.randomUUID() });
			}
			k++;
		}
		matrix.push(row);
	}
	set(gridMatrixAtom, matrix);
});

export const initGridAtom = atom(
	null,
	(get, set, payload: { rows: number; cols: number }) => {
		const { rows, cols } = payload;
		// Capture current loaded cells (before changing addresses)
		const prevCells = get(cellsAtom);
		const N = rows * cols;
		const loaded = prevCells
			.filter((cell) => cell?.src)
			.map((cell) => ({ ...cell }));
		const keep = loaded.slice(0, N);
		// Build new matrix preserving loaded items in order
		const matrix: CellItem[][] = [];
		let k = 0;
		for (let r = 0; r < rows; r++) {
			const row: CellItem[] = [];
			for (let c = 0; c < cols; c++) {
				if (k < keep.length) {
					row.push({ ...keep[k], id: keep[k].id ?? crypto.randomUUID() });
				} else {
					row.push({ id: crypto.randomUUID() });
				}
				k++;
			}
			matrix.push(row);
		}
		set(gridMatrixAtom, matrix);
	},
);

export const handleFilesDropAtom = atom(
	null,
	async (get, set, files: FileList | File[]) => {
		const fileArray = Array.from(files as File[]);
		if (fileArray.length === 0) return;

		const cols = get(colsAtom);
		const rows = get(rowsAtom);

		// current cells and empty slots
		let cells = get(cellsAtom);
		let emptyIndices = cells
			.map((c, i) => ({ c, i }))
			.filter((x) => !x.c?.src)
			.map((x) => x.i);

		// If not enough empty slots, try to expand rows (max 10)
		if (fileArray.length > emptyIndices.length) {
			const needed = fileArray.length - emptyIndices.length;
			const rowsToAdd = Math.ceil(needed / cols);
			let newRows = rows + rowsToAdd;
			if (newRows > 10) newRows = 10;
			if (newRows > rows) {
				// preserve existing loaded images in order, then set new rows
				const loaded = cells.filter((c) => c?.src).map((c) => ({ ...c }));
				const N = newRows * cols;
				const keep = loaded.slice(0, N);
				// Build new matrix from keep
				const matrix: CellItem[][] = [];
				let k = 0;
				for (let r = 0; r < newRows; r++) {
					const row: CellItem[] = [];
					for (let c = 0; c < cols; c++) {
						if (k < keep.length) {
							row.push({ ...keep[k], id: keep[k].id ?? crypto.randomUUID() });
						} else {
							row.push({ id: crypto.randomUUID() });
						}
						k++;
					}
					matrix.push(row);
				}
				set(gridMatrixAtom, matrix);
				// refresh cells and emptyIndices
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
				// update matrix draft in-place
				set(gridMatrixAtom, (draft) => {
					draft[r] = draft[r] ?? [];
					const prevItem = draft[r][c] ?? { id: crypto.randomUUID() };
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
