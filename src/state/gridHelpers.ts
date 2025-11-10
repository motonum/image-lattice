import type { CellItem } from "@/types/cell";

export const newPlaceholder = (): CellItem => ({ id: crypto.randomUUID() });

// Helper: build a rows x cols matrix from a flat ordered `loaded` array.
// Preserves item ids when present; fills remaining slots with new placeholders.
export function buildMatrixFromLoaded(
	loaded: CellItem[],
	rows: number,
	cols: number,
): CellItem[][] {
	const matrix: CellItem[][] = [];
	let index = 0;
	for (let r = 0; r < rows; r++) {
		const row: CellItem[] = [];
		for (let c = 0; c < cols; c++) {
			const item = loaded[index];
			if (item?.src) {
				row.push({ ...item, id: item.id ?? crypto.randomUUID() });
			} else if (item && !item.src) {
				row.push({ id: item.id ?? crypto.randomUUID() });
			} else {
				row.push(newPlaceholder());
			}
			index++;
		}
		matrix.push(row);
	}
	return matrix;
}
