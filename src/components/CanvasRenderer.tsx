import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
} from "react";
import type { CellItem } from "../App";

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
				// ensure latest render completed
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

			// Load all images first so we can measure natural sizes reliably
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
							// @ts-ignore
							if (img.decode) await img.decode();
							else
								await new Promise<void>((res) => {
									img.onload = () => res();
									img.onerror = () => res();
								});
						} catch (e) {
							// ignore
						}
					})();
					images[i] = img;
					loadPromises.push(p);
				}
			}
			await Promise.all(loadPromises);

			// Compute column widths and row heights from loaded images (fallback to 0)
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

			// Measure label widths and expand column widths if label is wider than image
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
			// Reserve vertical space for labels. Use a smaller reserve for 'above' so label sits close to image.
			let labelReserve: number;
			if (labelMode === "overlay") {
				labelReserve = 0;
			} else if (labelMode === "above") {
				// keep label just above image with small padding
				labelReserve = Math.ceil(fontSize) + 6;
			} else {
				// 'below' - allow extra space for descenders
				labelReserve = Math.ceil(fontSize * 1.4) + 8;
			}
			// reserve label space per row (above/below); overlay requires no extra row reserve
			const totalHeight =
				rowHeights.reduce((a, b) => a + b, 0) +
				gap * Math.max(0, rows - 1) +
				labelReserve * (labelMode === "overlay" ? 0 : rows);

			canvas.width = Math.max(1, totalWidth);
			canvas.height = Math.max(1, totalHeight);

			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			// Do not fill with white — keep canvas background transparent so exported PNG has alpha
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw images now that we have measurements
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
								// draw label first at top of cell
								if (cell?.label) {
									ctx.fillStyle = "#000";
									ctx.font = `${fontSize}px sans-serif`;
									ctx.textBaseline = "top";
									// place label just above the image (small padding)
									const labelX = x + 2;
									const labelY = y + Math.max(2, labelReserve - fontSize - 2);
									ctx.fillText(cell.label, labelX, labelY);
									ctx.textBaseline = "alphabetic";
								}
								// then draw image below reserved label area
								ctx.drawImage(
									img,
									x,
									y + labelReserve,
									img.naturalWidth || w,
									img.naturalHeight || h,
								);
							} else {
								// 'below' or 'overlay'
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
										// draw white background rectangle then text on top-left of image
										ctx.font = `${fontSize}px sans-serif`;
										ctx.textBaseline = "top";
										const metrics = ctx.measureText(cell.label || "");
										const textW = Math.ceil(metrics.width);
										const padding = 6;
										const rectX = x + 4;
										const rectY = y + 4;
										const rectW = textW + padding * 2;
										const rectH = fontSize + padding * 2;
										// draw background
										ctx.fillStyle = "#fff";
										ctx.fillRect(rectX, rectY, rectW, rectH);
										// draw text inside with padding
										ctx.fillStyle = "#000";
										const textX = rectX + padding;
										const textY = rectY + padding;
										ctx.fillText(cell.label || "", textX, textY);
										// reset baseline
										ctx.textBaseline = "alphabetic";
									}
								}
							}
						} catch (e) {
							// ignore draw errors per-image
						}
					}
					x += w + gap;
				}
				y += rowHeights[r] + gap + labelReserve;
			}
		}, [rows, cols, cells, gap, fontSize, labelMode]);

		// Draw when props change
		useEffect(() => {
			renderAll();
		}, [renderAll]);

		return (
			<div>
				{/* Hidden canvas (kept for export) - still rendered but hidden when preview is off */}
				<div style={{ display: preview ? "none" : "none" }} aria-hidden>
					<canvas ref={canvasRef} />
				</div>

				{/* Preview area: visible when preview prop is true. We limit max width/height via props so
				   tall images scale down to fit the viewport rather than causing the dialog to scroll. */}
				<div
					className="mt-5 block mx-auto"
					style={{
						display: preview ? "block" : "none",
						maxWidth: preview ? previewMaxWidth || "960px" : undefined,
					}}
				>
					<canvas
						ref={canvasRef}
						style={{
							width: "100%", // scale to container's width (honors maxWidth on container)
							height: "auto",
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
