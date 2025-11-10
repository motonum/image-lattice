import type { CellItem } from "@/types/cell";

export type CanvasHandle = {
	exportPNG: () => Promise<Blob>;
};

export type Dimensions = {
	colWidths: number[];
	rowHeights: number[];
};

export type LabelMode = "above" | "below" | "overlay";

export type DrawLabelsAndImagesParams = {
	ctx: CanvasRenderingContext2D;
	images: (HTMLImageElement | null)[];
	rows: number;
	cols: number;
	colWidths: number[];
	rowHeights: number[];
	cells: CellItem[];
	gap: number;
	fontSize: number;
	labelMode: LabelMode;
};
