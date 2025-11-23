import { useAtomValue } from "jotai";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import {
	colsAtom,
	fontSizeAtom,
	gapAtom,
	labelModeAtom,
	previewCellsAtom,
	rowsAtom,
} from "@/state/gridAtoms";
import type { CanvasHandle } from "@/types/canvas";
import type { CellItem } from "@/types/cell";
import {
	calculateDimensions,
	initializeCanvas,
	loadImages,
} from "./canvas/CanvasUtils";

type Props = {
	preview?: boolean;
	previewMaxHeight?: string;
	previewMaxWidth?: string;
};

const CanvasRenderer = forwardRef<CanvasHandle | null, Props>(
	({ preview = false, previewMaxHeight, previewMaxWidth }, ref) => {
		const rows = useAtomValue(rowsAtom);
		const cols = useAtomValue(colsAtom);
		const gap = useAtomValue(gapAtom);
		const fontSize = useAtomValue(fontSizeAtom);
		const labelMode = useAtomValue(labelModeAtom);
		const cells = useAtomValue(previewCellsAtom);

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

		const drawLabelsAndImages = useCallback(
			(
				ctx: CanvasRenderingContext2D,
				images: (HTMLImageElement | null)[],
				rows: number,
				cols: number,
				colWidths: number[],
				rowHeights: number[],
				cells: CellItem[],
				gap: number,
				fontSize: number,
				labelMode: string,
			): void => {
				let y = 0;
				for (let r = 0; r < rows; r++) {
					let x = 0;
					for (let c = 0; c < cols; c++) {
						const idx = r * cols + c;
						const img = images[idx];
						const w = colWidths[c];
						const h =
							rowHeights[r] -
							(labelMode !== "overlay" ? Math.ceil(fontSize) + 6 : 0);

						const cell = cells[idx];
						if (img) {
							try {
								if (labelMode === "above" && cell?.label) {
									ctx.fillStyle = "#000";
									ctx.font = `${fontSize}px sans-serif`;
									ctx.textBaseline = "top";
									const labelX = x + 2;
									const labelY = y + 2;
									ctx.fillText(cell.label, labelX, labelY);
									ctx.textBaseline = "alphabetic";
									ctx.drawImage(
										img,
										x,
										y + Math.ceil(fontSize) + 6,
										img.naturalWidth || w,
										img.naturalHeight || h,
									);
								} else if (labelMode === "below" && cell?.label) {
									ctx.drawImage(
										img,
										x,
										y,
										img.naturalWidth || w,
										img.naturalHeight || h,
									);
									ctx.fillStyle = "#000";
									ctx.font = `${fontSize}px sans-serif`;
									ctx.textBaseline = "top";
									const labelY = y + h + 4;
									ctx.fillText(cell.label, x + 2, labelY);
									ctx.textBaseline = "alphabetic";
								} else {
									ctx.drawImage(
										img,
										x,
										y,
										img.naturalWidth || w,
										img.naturalHeight || h,
									);
									if (labelMode === "overlay" && cell?.label) {
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
							} catch (e) {
								console.error("Error drawing label or image: ", e);
							}
						}
						x += w + gap;
					}
					y += rowHeights[r] + gap;
				}
			},
			[],
		);

		const renderAll = useCallback(async () => {
			const images = await loadImages(cells, rows, cols);
			const { colWidths, rowHeights } = calculateDimensions(
				images,
				rows,
				cols,
				cells,
				gap,
				fontSize,
				labelMode,
			);
			const totalWidth =
				colWidths.reduce((sum, w) => sum + w, 0) + gap * (cols - 1);
			const totalHeight =
				rowHeights.reduce((sum, h) => sum + h, 0) + gap * (rows - 1);

			const ctx = canvasRef.current
				? initializeCanvas(canvasRef.current, totalWidth, totalHeight)
				: null;
			if (ctx) {
				drawLabelsAndImages(
					ctx,
					images,
					rows,
					cols,
					colWidths,
					rowHeights,
					cells,
					gap,
					fontSize,
					labelMode,
				);
			}
		}, [drawLabelsAndImages, cells, rows, cols, gap, fontSize, labelMode]);

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
