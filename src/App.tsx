import SettingsSidebar from "@/components/SettingsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useGrid from "@/hooks/useGrid";
import type React from "react";
import { useRef } from "react";
import CanvasRenderer, { type CanvasHandle } from "./components/CanvasRenderer";
import Grid from "./components/Grid";

export default function App() {
	const canvasRef = useRef<CanvasHandle | null>(null);

	const {
		rows,
		setRows,
		cols,
		setCols,
		gap,
		setGap,
		fontSize,
		setFontSize,
		labelMode,
		setLabelMode,
		numberingStrategy,
		handleNumberingStrategyChange,
		cells,
		previewCells,
		updateCell,
		replaceCells,
		handleFilesDrop,
		hasAnyImage,
	} = useGrid();

	const handleDownload = async () => {
		if (!canvasRef.current) return;
		const blob = await canvasRef.current.exportPNG();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "grid.png";
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<SidebarProvider>
			<div
				className="flex min-h-screen grow"
				onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
				onDrop={async (e: React.DragEvent<HTMLDivElement>) => {
					e.preventDefault();
					await handleFilesDrop(e.dataTransfer.files);
				}}
			>
				<div className="mx-auto max-w-[1100px] w-full p-2">
					<header>
						<h1>Image Lattice</h1>
					</header>

					<Grid
						rows={rows}
						cols={cols}
						cells={cells}
						updateCell={updateCell}
						replaceCells={replaceCells}
						// label editing is driven from inside the hook/Settings UI; Grid stays dumb
						disableLabelInput={false}
					/>

					{/* Hidden canvas renderer used for export; keep preview=false so canvas stays offscreen */}
					<CanvasRenderer
						ref={canvasRef}
						rows={rows}
						cols={cols}
						cells={previewCells}
						gap={gap}
						fontSize={fontSize}
						preview={false}
						labelMode={labelMode}
					/>
				</div>

				<SettingsSidebar
					rows={rows}
					setRows={setRows}
					cols={cols}
					setCols={setCols}
					gap={gap}
					setGap={setGap}
					fontSize={fontSize}
					setFontSize={setFontSize}
					labelMode={labelMode}
					setLabelMode={setLabelMode}
					numberingStrategy={numberingStrategy}
					onNumberingStrategyChange={handleNumberingStrategyChange}
					previewCells={previewCells}
					hasAnyImage={hasAnyImage}
					handleDownload={handleDownload}
				/>
			</div>
		</SidebarProvider>
	);
}
