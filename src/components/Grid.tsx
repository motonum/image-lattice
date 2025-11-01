import type React from "react";
import type { CellItem } from "../App";

// Minimal IFD shape we read from UTIF for our use (width/height). Keep conservative.
type IfdMinimal = {
	width?: number;
	height?: number;
};

type Props = {
	rows: number;
	cols: number;
	cells: CellItem[];
	updateCell: (index: number, item: Partial<CellItem>) => void;
	replaceCells: (newCells: CellItem[]) => void;
};

export default function Grid({
	rows,
	cols,
	cells,
	updateCell,
	replaceCells,
}: Props) {
	const N = rows * cols;

	const handleRemove = (index: number) => {
		const cell = cells[index];
		if (cell?.src?.startsWith?.("blob:")) {
			try {
				URL.revokeObjectURL(cell.src);
			} catch (e) {
				// ignore
			}
		}
		updateCell(index, {
			src: undefined,
			fileName: undefined,
			width: undefined,
			height: undefined,
			label: undefined,
		});
	};

	const onFileDrop = async (e: React.DragEvent, index: number) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;
		// If multiple files dropped, insert them into empty cells in order.
		if (files.length > 1) {
			const fileArray = Array.from(files);
			const emptyIndices = cells
				.map((c, i) => ({ c, i }))
				.filter((x) => !x.c?.src)
				.map((x) => x.i);
			if (emptyIndices.length === 0) return;
			const count = Math.min(fileArray.length, emptyIndices.length);
			for (let k = 0; k < count; k++) {
				handleFileLoad(fileArray[k], emptyIndices[k]);
			}
			return;
		}
		const file = files[0];
		await handleFileLoad(file, index);
	};

	const onFileInput = async (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number,
	) => {
		const fileList = e.target.files;
		if (!fileList || fileList.length === 0) return;
		const files = Array.from(fileList);
		if (files.length > 1) {
			const emptyIndices = cells
				.map((c, i) => ({ c, i }))
				.filter((x) => !x.c?.src)
				.map((x) => x.i);
			if (emptyIndices.length === 0) return;
			const count = Math.min(files.length, emptyIndices.length);
			for (let k = 0; k < count; k++) {
				handleFileLoad(files[k], emptyIndices[k]);
			}
			return;
		}
		await handleFileLoad(files[0], index);
	};

	const handleFileLoad = async (file: File, index: number) => {
		const name = file.name;
		const lower = name.toLowerCase();
		if (
			lower.endsWith(".tif") ||
			lower.endsWith(".tiff") ||
			file.type === "image/tiff"
		) {
			// use utif to decode tiff
			try {
				const buffer = await file.arrayBuffer();
				const UTIF = (await import("utif")) as unknown as {
					decode: (b: ArrayBuffer | Uint8Array) => IfdMinimal[];
					decodeImages: (
						b: ArrayBuffer | Uint8Array,
						ifds: IfdMinimal[],
					) => void;
					toRGBA8: (ifd: IfdMinimal) => Uint8Array;
				};
				const ifds = UTIF.decode(buffer);
				UTIF.decodeImages(buffer, ifds);
				const first = (ifds as IfdMinimal[])[0];
				const width = first?.width ?? 0;
				const height = first?.height ?? 0;
				const rgba = UTIF.toRGBA8(first); // Uint8Array RGBA
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				const imageData = new ImageData(
					new Uint8ClampedArray(rgba),
					width,
					height,
				);
				ctx.putImageData(imageData, 0, 0);
				const src = canvas.toDataURL();
				updateCell(index, {
					src,
					fileName: name,
					width,
					height,
					label: stripExt(name),
				});
			} catch (err) {
				console.error("TIF load error", err);
			}
		} else {
			const url = URL.createObjectURL(file);
			const img = new Image();
			img.src = url;
			img.onload = () => {
				updateCell(index, {
					src: url,
					fileName: name,
					width: img.naturalWidth,
					height: img.naturalHeight,
					label: stripExt(name),
				});
			};
		}
	};

	const stripExt = (name: string) => name.replace(/\.[^.]+$/, "");

	// Dragging between cells (HTML5 drag)
	const onDragStart = (e: React.DragEvent, index: number) => {
		e.dataTransfer.setData("text/plain", String(index));
	};

	const onDropToCell = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		const srcIndexStr = e.dataTransfer.getData("text/plain");
		if (!srcIndexStr) return;
		const srcIndex = Number(srcIndexStr);
		if (Number.isNaN(srcIndex)) return;
		setAndShift(srcIndex, targetIndex);
	};

	const setAndShift = (srcIndex: number, targetIndex: number) => {
		const copy = [...cells];
		const item = copy[srcIndex];
		// remove src
		copy.splice(srcIndex, 1);
		// insert at targetIndex
		copy.splice(targetIndex, 0, item);
		// Ensure length N
		while (copy.length < N) copy.push({ id: `${Math.random()}` });
		if (copy.length > N) copy.length = N;
		replaceCells(copy);
	};

	const onDragOver = (e: React.DragEvent) => e.preventDefault();

	const renderCell = (i: number) => {
		const cell = cells[i];
		return (
			<div
				key={i}
				className="cell"
				onDragOver={onDragOver}
				onDrop={(e) => onDropToCell(e, i)}
			>
				<div
					className="drop-area"
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => onFileDrop(e, i)}
				>
					{cell?.src ? (
						<div
							className="thumb"
							draggable
							onDragStart={(e) => onDragStart(e, i)}
						>
							<img src={cell.src} alt={cell.fileName} />
							<input
								type="text"
								value={cell.label ?? ""}
								onChange={(e) => updateCell(i, { label: e.target.value })}
							/>
							<button
								type="button"
								className="remove-btn"
								onClick={() => handleRemove(i)}
							>
								削除
							</button>
						</div>
					) : (
						<div className="placeholder">
							<div>Drop image or</div>
							<input
								type="file"
								accept="image/*,.tif,.tiff"
								multiple
								onChange={(e) => onFileInput(e, i)}
							/>
						</div>
					)}
				</div>
			</div>
		);
	};

	const cellsToRender = [];
	for (let i = 0; i < N; i++) cellsToRender.push(renderCell(i));

	return (
		<div
			className="grid"
			style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
		>
			{cellsToRender}
		</div>
	);
}
