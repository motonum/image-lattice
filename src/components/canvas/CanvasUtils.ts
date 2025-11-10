import type { CellItem } from "@/types/cell";

export const loadImages = async (
	cells: CellItem[],
	rows: number,
	cols: number,
): Promise<(HTMLImageElement | null)[]> => {
	const images: (HTMLImageElement | null)[] = new Array(rows * cols).fill(null);
	const loadPromises: Promise<void>[] = [];

	for (let i = 0; i < rows * cols; i++) {
		const cell = cells[i];
		if (cell?.src) {
			const img = new Image();
			img.src = cell.src;
			const p = (async () => {
				try {
					if (img.decode) await img.decode();
					else
						await new Promise<void>((res) => {
							img.onload = () => res();
							img.onerror = () => res();
						});
				} catch (e) {}
			})();
			images[i] = img;
			loadPromises.push(p);
		}
	}

	await Promise.all(loadPromises);
	return images;
};

export const calculateDimensions = (
	images: (HTMLImageElement | null)[],
	rows: number,
	cols: number,
	cells: CellItem[],
	gap: number,
	fontSize: number,
	labelMode: string,
): { colWidths: number[]; rowHeights: number[] } => {
	const colWidths: number[] = new Array(cols).fill(0);
	const rowHeights: number[] = new Array(rows).fill(0);

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const idx = r * cols + c;
			const img = images[idx];
			const cell = cells[idx];
			if (img) {
				colWidths[c] = Math.max(colWidths[c], img.naturalWidth || 0);
				rowHeights[r] = Math.max(rowHeights[r], img.naturalHeight || 0);
			}
			if (cell?.label && labelMode !== "overlay") {
				rowHeights[r] = Math.max(
					rowHeights[r],
					(img?.naturalHeight || 0) + Math.ceil(fontSize) + 6,
				);
			}
		}
	}

	return { colWidths, rowHeights };
};

export const initializeCanvas = (
	canvas: HTMLCanvasElement,
	totalWidth: number,
	totalHeight: number,
): CanvasRenderingContext2D | null => {
	canvas.width = Math.max(1, totalWidth);
	canvas.height = Math.max(1, totalHeight);

	const ctx = canvas.getContext("2d");
	if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

	return ctx;
};
