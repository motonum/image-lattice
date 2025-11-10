import type { CellItem } from "@/types/cell";
import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
} from "react";

export type CanvasHandle = {
	exportPNG: () => Promise<Blob>;
};

type Props = {
	rows: number;
	cols: number;
	cells: CellItem[];
	gap: number;
	fontSize: number;
	preview?: boolean;
	/**
	 * CSS value for the preview canvas max-height (e.g. '70vh').
	 * When provided, the preview canvas will be constrained to this height and
	 * shrink proportionally so the dialog does not need to scroll vertically.
	 */
	previewMaxHeight?: string;
	/** CSS value for preview max-width (e.g. '90vw' or '960px') */
	previewMaxWidth?: string;
	labelMode?: "below" | "above" | "overlay";
};

const CanvasRenderer = forwardRef<CanvasHandle | null, Props>(
	(
		{
			rows,
			cols,
			cells,
			gap,
			fontSize,
			preview = false,
			previewMaxHeight,
			previewMaxWidth,
			labelMode = "overlay",
		},
		ref,
	) => {
		const canvasRef = useRef<HTMLCanvasElement | null>(null);

		useImperativeHandle(ref, () => ({
			exportPNG: async () => {
				const canvasBefore = canvasRef.current;
				if (!canvasBefore) return new Blob();
				await renderAll();
				return await new Promise<Blob>((resolve) =>
					canvasRef.current?.toBlob(
						(b) => resolve(b || new Blob()),
						"image/png",
					),
				);
			},
		}));

		const renderAll = useCallback(async () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const images: Array<HTMLImageElement | null> = new Array(
				rows * cols,
			).fill(null);
			const loadPromises: Array<Promise<void>> = [];
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

			const colWidths: number[] = new Array(cols).fill(0);
			const rowHeights: number[] = new Array(rows).fill(0);
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const idx = r * cols + c;
					const img = images[idx];
					if (img) {
						colWidths[c] = Math.max(colWidths[c], img.naturalWidth || 0);
						rowHeights[r] = Math.max(rowHeights[r], img.naturalHeight || 0);
					}
				}
			}

			if (labelMode !== "overlay") {
				const measureCanvas = document.createElement("canvas");
				const measureCtx = measureCanvas.getContext("2d");
				if (measureCtx) {
					measureCtx.font = `${fontSize}px sans-serif`;
					for (let r = 0; r < rows; r++) {
						for (let c = 0; c < cols; c++) {
							const idx = r * cols + c;
							const cell = cells[idx];
							if (cell?.label) {
								const metrics = measureCtx.measureText(cell.label);
								const labelWidth = Math.ceil(metrics.width) + 8; // small padding
								colWidths[c] = Math.max(colWidths[c], labelWidth);
							}
						}
					}
				}
			}

			const totalWidth =
				colWidths.reduce((a, b) => a + b, 0) + gap * Math.max(0, cols - 1);
			let labelReserve: number;
			if (labelMode === "overlay") {
				labelReserve = 0;
			} else if (labelMode === "above") {
				labelReserve = Math.ceil(fontSize) + 6;
			} else {
				labelReserve = Math.ceil(fontSize * 1.4) + 8;
			}
			const totalHeight =
				rowHeights.reduce((a, b) => a + b, 0) +
				gap * Math.max(0, rows - 1) +
				labelReserve * (labelMode === "overlay" ? 0 : rows);

			canvas.width = Math.max(1, totalWidth);
			canvas.height = Math.max(1, totalHeight);

			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			let y = 0;
			for (let r = 0; r < rows; r++) {
				let x = 0;
				for (let c = 0; c < cols; c++) {
					const idx = r * cols + c;
					const img = images[idx];
					const w = colWidths[c];
					const h = rowHeights[r];
					const cell = cells[idx];
					if (img) {
						try {
							if (labelMode === "above") {
								if (cell?.label) {
									ctx.fillStyle = "#000";
									ctx.font = `${fontSize}px sans-serif`;
									ctx.textBaseline = "top";
									const labelX = x + 2;
									const labelY = y + Math.max(2, labelReserve - fontSize - 2);
									ctx.fillText(cell.label, labelX, labelY);
									ctx.textBaseline = "alphabetic";
								}
								ctx.drawImage(
									img,
									x,
									y + labelReserve,
									img.naturalWidth || w,
									img.naturalHeight || h,
								);
							} else {
								ctx.drawImage(
									img,
									x,
									y,
									img.naturalWidth || w,
									img.naturalHeight || h,
								);

								if (cell?.label) {
									ctx.font = `${fontSize}px sans-serif`;
									if (labelMode === "below") {
										ctx.fillStyle = "#000";
										ctx.textBaseline = "top";
										const labelY = y + (img.naturalHeight || h) + 4;
										ctx.fillText(cell.label, x + 2, labelY);
										ctx.textBaseline = "alphabetic";
									} else if (labelMode === "overlay") {
										ctx.font = `${fontSize}px sans-serif`;
										ctx.textBaseline = "top";
										const metrics = ctx.measureText(cell.label || "");
										const textW = Math.ceil(metrics.width);
										const padding = 6;
										const rectX = x + 4;
										const rectY = y + 4;
										const rectW = textW + padding * 2;
										const rectH = fontSize + padding * 2;
										ctx.fillStyle = "#fff";
										ctx.fillRect(rectX, rectY, rectW, rectH);
										ctx.fillStyle = "#000";
										const textX = rectX + padding;
										const textY = rectY + padding;
										ctx.fillText(cell.label || "", textX, textY);
										ctx.textBaseline = "alphabetic";
									}
								}
							}
						} catch (e) {}
					}
					x += w + gap;
				}
				y += rowHeights[r] + gap + labelReserve;
			}
		}, [rows, cols, cells, gap, fontSize, labelMode]);

		useEffect(() => {
			renderAll();
		}, [renderAll]);

		return (
			<div className="relative h-full">
				<div style={{ display: preview ? "none" : "block" }} aria-hidden>
					<canvas ref={canvasRef} />
				</div>

				<div
					className="block mx-auto h-full"
					style={{
						display: preview ? "block" : "none",
						maxWidth: preview ? previewMaxWidth || "960px" : undefined,
					}}
				>
					<canvas
						ref={canvasRef}
						style={{
							width: "100%",
							height: "100%",
							maxWidth: previewMaxWidth || "960px",
							maxHeight: previewMaxHeight || undefined,
							border: "1px solid #ddd",
							display: "block",
							margin: "0 auto",
						}}
					/>
				</div>
			</div>
		);
	},
);

export default CanvasRenderer;
