import SettingsSidebar from "@/components/SettingsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useGrid from "@/hooks/useGrid";
import type React from "react";
import Grid from "./components/Grid";

export default function App() {
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

	// Download is handled inside ExportDialog now.

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
				/>
			</div>
		</SidebarProvider>
	);
}
