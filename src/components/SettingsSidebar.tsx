import ExportDialog from "@/components/ExportDialog";
import NumericInput from "@/components/NumericInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarProvider,
} from "@/components/ui/sidebar";
import type { CellItem } from "@/types/cell";
import React from "react";

type LabelMode = "below" | "above" | "overlay";

type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha";

interface Props {
	rows: number;
	setRows: (n: number) => void;
	cols: number;
	setCols: (n: number) => void;
	gap: number;
	setGap: (n: number) => void;
	fontSize: number;
	setFontSize: (n: number) => void;
	labelMode: LabelMode;
	setLabelMode: (m: LabelMode) => void;
	numberingStrategy: NumberingStrategy;
	onNumberingStrategyChange: (s: NumberingStrategy) => void;
	previewCells: CellItem[];
	hasAnyImage: boolean;
	handleDownload: () => void; // Made optional to avoid breaking changes
}

export default function SettingsSidebar({
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
	onNumberingStrategyChange,
	previewCells,
	hasAnyImage,
	handleDownload, // Correctly destructured
}: Props) {
	return (
		<Sidebar side="right" collapsible="none" className="w-72">
			<SidebarContent>
				<SidebarHeader>
					<h2 className="text-sm font-medium">Settings</h2>
				</SidebarHeader>

				<section className="flex flex-col gap-3 p-2">
					<div className="flex gap-2">
						<Label htmlFor="rows-input" className="flex items-center">
							<div>Rows:</div>
						</Label>
						<NumericInput
							id="rows-input"
							outerState={rows}
							setOuterState={setRows}
							disabled={false}
							className="w-16"
							rejectNegative
							integer
							min={1}
							max={10}
						/>
						<Label htmlFor="cols-input" className="flex items-center">
							<div>Cols:</div>
						</Label>
						<NumericInput
							id="cols-input"
							outerState={cols}
							setOuterState={setCols}
							disabled={false}
							className="w-16"
							rejectNegative
							integer
							min={1}
							max={10}
						/>
					</div>
					<div className="flex gap-2">
						<Label htmlFor="gap-input" className="flex items-center">
							<div>Gap:</div>
						</Label>
						<NumericInput
							id="gap-input"
							outerState={gap}
							setOuterState={setGap}
							disabled={false}
							className="w-16"
							rejectNegative
							integer
						/>
					</div>
					<div className="flex gap-2">
						<Label htmlFor="label-type-select" className="flex items-center">
							<div>Label type:</div>
						</Label>
						<Select
							value={numberingStrategy}
							onValueChange={(e) =>
								onNumberingStrategyChange(e as NumberingStrategy)
							}
						>
							<SelectTrigger id="label-type-select" className="w-36">
								<SelectValue placeholder="Label numbering" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="user">User defined</SelectItem>
								<SelectItem value="numeric">1,2,3,...</SelectItem>
								<SelectItem value="alpha">a,b,c,...</SelectItem>
								<SelectItem value="upper-alpha">A,B,C,...</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<Label htmlFor="fontsize-input" className="flex items-center">
							<div>Label font:</div>
						</Label>
						<Input
							type="number"
							id="fontsize-input"
							className="w-16"
							min={0}
							value={fontSize}
							onChange={(e) => setFontSize(Number(e.target.value))}
						/>
					</div>
					<div className="flex gap-2">
						<Label htmlFor="label-mode-select" className="flex items-center">
							<div>Label mode:</div>
						</Label>
						<Select
							value={labelMode}
							onValueChange={(e) => setLabelMode(e as LabelMode)}
						>
							<SelectTrigger id="label-mode-select" className="w-36">
								<SelectValue placeholder="Label mode" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="overlay">Overlay</SelectItem>
								<SelectItem value="below">Below image</SelectItem>
								<SelectItem value="above">Above image</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Export flow: open sheet to preview and download */}
					<div className="flex gap-2">
						<ExportDialog
							rows={rows}
							cols={cols}
							previewCells={previewCells}
							gap={gap}
							fontSize={fontSize}
							labelMode={labelMode}
							hasAnyImage={hasAnyImage}
							handleDownload={handleDownload}
						/>
					</div>
				</section>
			</SidebarContent>
		</Sidebar>
	);
}
