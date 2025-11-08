import { loadImageFile, stripExt } from "@/lib/file";
import type { CellItem } from "@/types/cell";
import { atom } from "jotai";
import { toast } from "sonner";

export type LabelMode = "below" | "above" | "overlay";
export type NumberingStrategy =
	| "user"
	| "numeric"
	| "alpha"
	| "upper-alpha"
	| "none";

export const rowsAtom = atom<number>(1);
export const colsAtom = atom<number>(2);
export const gapAtom = atom<number>(10);
export const fontSizeAtom = atom<number>(72);
export const labelModeAtom = atom<LabelMode>("overlay");
export const numberingStrategyAtom = atom<NumberingStrategy>("user");

export const imagesAtom = atom<Map<string, CellItem>>(
	new Map<string, CellItem>(),
);

type Address = {
	id: string;
	row: number;
	col: number;
};

export const cellAddressAtom = atom<Address[]>((get) => {
	const rows = get(rowsAtom);
	const cols = get(colsAtom);
	const addresses: Address[] = Array.from({ length: rows }).flatMap((_, r) =>
		Array.from({ length: cols }).map((_, c) => {
			const id = crypto.randomUUID();
			return { id, row: r, col: c };
		}),
	);
	return addresses;
});

export const cellsAtom = atom<CellItem[]>((get) => {
	const cellAddresses = get(cellAddressAtom);
	const images = get(imagesAtom);
	return cellAddresses.map((addr) => {
		const cell = images.get(addr.id);
		if (cell) return cell;
		return { id: addr.id };
	});
});

// Derived: preview cells according to numbering strategy
export const previewCellsAtom = atom((get) => {
	const cells = get(cellsAtom);
	const numberingStrategy = get(numberingStrategyAtom);

	const indexToAlpha = (n: number) => {
		let i = n;
		let s = "";
		while (i >= 0) {
			s = String.fromCharCode((i % 26) + 97) + s;
			i = Math.floor(i / 26) - 1;
		}
		return s;
	};

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
		const addresses = get(cellAddressAtom);
		const addr = addresses[payload.index];
		if (!addr) return;
		const images = get(imagesAtom);
		const copy = new Map(images);
		const prevItem = copy.get(addr.id) ?? { id: addr.id };
		copy.set(addr.id, { ...prevItem, ...payload.item });
		set(imagesAtom, copy);
	},
);

export const replaceCellsAtom = atom(null, (get, set, newCells: CellItem[]) => {
	// Map incoming array to the current cell addresses and replace imagesAtom accordingly
	const addresses = get(cellAddressAtom);
	const copy = new Map<string, CellItem>();
	for (let i = 0; i < addresses.length; i++) {
		const addr = addresses[i];
		const cell = newCells[i];
		if (cell?.src) {
			copy.set(addr.id, { ...cell, id: addr.id });
		}
	}
	set(imagesAtom, copy);
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
		// Update grid dimensions (this will change cellAddressAtom ids)
		set(rowsAtom, rows);
		set(colsAtom, cols);
		// Build new images map that maps the preserved items to the new addresses in order
		const addresses = get(cellAddressAtom);
		const newMap = new Map<string, CellItem>();
		for (let i = 0; i < addresses.length; i++) {
			if (i < keep.length)
				newMap.set(addresses[i].id, { ...keep[i], id: addresses[i].id });
		}
		set(imagesAtom, newMap);
	},
);

export const handleFilesDropAtom = atom(
	null,
	async (get, set, files: FileList | File[]) => {
		const fileArray = Array.from(files as File[]);
		if (fileArray.length === 0) return;

		const cols = get(colsAtom);
		let rows = get(rowsAtom);

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
				set(rowsAtom, newRows);
				rows = newRows;
				// After changing rowsAtom, cellAddressAtom will produce new ids
				const addresses = get(cellAddressAtom);
				const newMap = new Map<string, CellItem>();
				for (let i = 0; i < addresses.length; i++) {
					if (i < keep.length)
						newMap.set(addresses[i].id, { ...keep[i], id: addresses[i].id });
				}
				set(imagesAtom, newMap);
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
				// determine address id for this index
				const addresses = get(cellAddressAtom);
				const idx = emptyIndices[k];
				const addr = addresses[idx];
				if (!addr) continue;
				set(imagesAtom, (prev) => {
					const copy = new Map(prev);
					const prevItem = copy.get(addr.id) ?? { id: addr.id };
					copy.set(addr.id, {
						...prevItem,
						src,
						fileName: file.name,
						width,
						height,
						label: stripExt(file.name),
					});
					return copy;
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
