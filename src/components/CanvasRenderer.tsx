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
import { useAtomValue } from "jotai";
import React, {
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
} from "react";
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
				// EXPORT PNG の手順：
				// 1) 描画を最新化するために renderAll() を呼ぶ
				// 2) canvas.toBlob() で PNG Blob を生成して返す
				await renderAll();
				return await new Promise<Blob>((resolve) =>
					canvasRef.current?.toBlob((b) => resolve(b || new Blob()), "image/png"),
				);
			},
		}));

		// Helper: draw a single cell (image + label) at x,y with w,h
		// - ctx.save()/restore() で描画ステートをローカルに保つ
		// - labelMode によって描画順や領域の扱いが変わる（above/below/overlay）
		const drawCell = (
			ctx: CanvasRenderingContext2D,
			img: HTMLImageElement | null,
			cell: CellItem | undefined,
			x: number,
			y: number,
			w: number,
			h: number,
			fontSize: number,
			labelMode: string,
		) => {
			if (!img) return;
			// STEP: セル描画開始（コンテキストの状態を保存）
			ctx.save();
			try {
				// CASE: ラベルを画像の上に置く
				// - ラベルを先に描画してから、下に画像を描く
				if (labelMode === "above" && cell?.label) {
					ctx.fillStyle = "#000";
					ctx.font = `${fontSize}px sans-serif`;
					ctx.textBaseline = "top";
					ctx.fillText(cell.label, x + 2, y + 2);
					ctx.textBaseline = "alphabetic";
					// ラベル分だけ y を下げて画像を描画
					ctx.drawImage(img, x, y + Math.ceil(fontSize) + 6, img.naturalWidth || w, img.naturalHeight || h);
			} else if (labelMode === "below" && cell?.label) {
				// CASE: ラベルを画像の下に置く
				// - 画像を描画してから、その下にラベルを描く
				ctx.drawImage(img, x, y, img.naturalWidth || w, img.naturalHeight || h);
				ctx.fillStyle = "#000";
				ctx.font = `${fontSize}px sans-serif`;
				ctx.textBaseline = "top";
				ctx.fillText(cell.label, x + 2, y + h + 4);
				ctx.textBaseline = "alphabetic";
			} else {
				// CASE: overlay（画像の上に重ねる） または ラベル無し
				// - 画像を描画
				ctx.drawImage(img, x, y, img.naturalWidth || w, img.naturalHeight || h);
				if (labelMode === "overlay" && cell?.label) {
					// - 白背景の矩形を描いてから文字を描画（読みやすさのため）
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
					ctx.fillText(cell.label || "", rectX + padding, rectY + padding);
					ctx.textBaseline = "alphabetic";
				}
			}
			} catch (e) {
				console.error("Error drawing cell:", e);
			} finally {
				ctx.restore();
			}
		};

		const renderAll = useCallback(async () => {
			// STEP 1: 画像を全セル分読み込む（非同期）
			const images = await loadImages(cells, rows, cols);
			// STEP 2: 読み込んだ画像と設定値から各列幅・行高を算出
			const { colWidths, rowHeights } = calculateDimensions(images, rows, cols, cells, gap, fontSize, labelMode);
			// STEP 3: キャンバス全体の幅と高さを計算（セル幅合計 + ギャップ）
			const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + gap * (cols - 1);
			const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + gap * (rows - 1);

			// STEP 4: canvas を初期化して 2D コンテキストを取得（内部で canvas.width/height を設定）
			const ctx = canvasRef.current ? initializeCanvas(canvasRef.current, totalWidth, totalHeight) : null;
			if (!ctx) return; // canvas が存在しない場合は描画中断

			// STEP 5: 各行・各列を走査してセルごとに描画する
			let y = 0;
			for (let r = 0; r < rows; r++) {
				let x = 0;
				for (let c = 0; c < cols; c++) {
					const idx = r * cols + c;
					const img = images[idx];
					const w = colWidths[c];
					// STEP 5.1: overlay 以外はラベル分の高さを画像高さから差し引く
					const h = rowHeights[r] - (labelMode !== "overlay" ? Math.ceil(fontSize) + 6 : 0);
					// STEP 5.2: 実際のセル描画（drawCell が内部でラベルの描画位置を扱う）
					drawCell(ctx, img, cells[idx], x, y, w, h, fontSize, labelMode);
					x += w + gap; // 次の列の X 座標へ移動
				}
				y += rowHeights[r] + gap; // 次の行の Y 座標へ移動
			}
		}, [cells, rows, cols, gap, fontSize, labelMode]);

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
