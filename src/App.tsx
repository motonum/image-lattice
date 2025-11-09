import Grid from "@/components/Grid";
import Header from "@/components/Header";
import SettingsSidebar from "@/components/SettingsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useGrid from "@/hooks/useGrid";
import { useAtom, useAtomValue } from "jotai";
import type React from "react";
import { numberingStrategyAtom } from "./state/gridAtoms";

export default function App() {
	const {
		cells,
		handleNumberingStrategyChange,
		previewCells,
		updateCell,
		replaceCells,
		handleFilesDrop,
		hasAnyImage,
	} = useGrid();

	return (
		<div className="flex flex-col min-h-screen max-h-screen">
			<SidebarProvider>
				<div className="flex flex-col w-full">
					<Header />
					<div
						className="flex grow min-h-0"
						onDragOver={(e: React.DragEvent<HTMLDivElement>) =>
							e.preventDefault()
						}
						onDrop={async (e: React.DragEvent<HTMLDivElement>) => {
							e.preventDefault();
							await handleFilesDrop(e.dataTransfer.files);
						}}
					>
						<div className="mx-auto max-w-[1100px] w-full p-2 overflow-scroll">
							<Grid
								cells={cells}
								updateCell={updateCell}
								replaceCells={replaceCells}
							/>
						</div>

						<SettingsSidebar
							onNumberingStrategyChange={handleNumberingStrategyChange}
							previewCells={previewCells}
							hasAnyImage={hasAnyImage}
						/>
					</div>
				</div>
			</SidebarProvider>
		</div>
	);
}
