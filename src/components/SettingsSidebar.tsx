import ExportDialog from "@/components/ExportDialog";
import NumericInput from "@/components/NumericInput";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha" | "none";

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
}: Props) {
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [pending, setPending] = React.useState<{
		type: "rows" | "cols";
		newValue: number;
		removedCount: number;
	} | null>(null);
	return (
		<Sidebar side="right" collapsible="none" className="w-80">
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
							// intercept row changes to confirm if images would be removed
							setOuterState={(n: number) => {
								const newN = n * cols;
								const removed = previewCells
									.slice(newN)
									.filter((c) => !!c.src).length;
								if (removed > 0) {
									setPending({
										type: "rows",
										newValue: n,
										removedCount: removed,
									});
									setConfirmOpen(true);
								} else {
									setRows(n);
								}
							}}
							disabled={false}
							className="w-16"
							rejectNegative
							integer
							min={1}
							max={10}
							defaultValue={1}
						/>
						<Label htmlFor="cols-input" className="flex items-center">
							<div>Cols:</div>
						</Label>
						<NumericInput
							id="cols-input"
							outerState={cols}
							// intercept col changes to confirm if images would be removed
							setOuterState={(n: number) => {
								const newN = rows * n;
								const removed = previewCells
									.slice(newN)
									.filter((c) => !!c.src).length;
								if (removed > 0) {
									setPending({
										type: "cols",
										newValue: n,
										removedCount: removed,
									});
									setConfirmOpen(true);
								} else {
									setCols(n);
								}
							}}
							disabled={false}
							className="w-16"
							rejectNegative
							integer
							min={1}
							max={10}
							defaultValue={1}
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
							defaultValue={10}
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
								<SelectItem value="none">None</SelectItem>
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
						/>
					</div>
				</section>
				{/* Confirmation dialog when reducing grid would remove images */}
				<Dialog
					open={confirmOpen}
					onOpenChange={(v) => {
						if (!v) {
							setPending(null);
						}
						setConfirmOpen(v);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Confirm grid change</DialogTitle>
							<DialogDescription>
								この変更により {pending?.removedCount ?? 0}{" "}
								個の画像がグリッドから削除されます。よろしいですか？
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									// cancel
									setConfirmOpen(false);
									setPending(null);
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									if (!pending) return;
									if (pending.type === "rows") {
										setRows(pending.newValue);
									} else {
										setCols(pending.newValue);
									}
									setConfirmOpen(false);
									setPending(null);
								}}
							>
								Confirm
							</Button>
						</DialogFooter>
						<DialogClose />
					</DialogContent>
				</Dialog>
			</SidebarContent>
		</Sidebar>
	);
}
