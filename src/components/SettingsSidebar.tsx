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

	const [rowsReset, setRowsReset] = React.useState(0);
	const [colsReset, setColsReset] = React.useState(0);

	// Helpers
	const countImages = React.useCallback(
		() => previewCells.filter((c) => !!c.src).length,
		[previewCells],
	);

	const calcRemovedForRows = (newRows: number) => {
		const keep = newRows * cols;
		return previewCells.slice(keep).filter((c) => !!c.src).length;
	};

	const calcRemovedForCols = (newCols: number) => {
		const keep = rows * newCols;
		return previewCells.slice(keep).filter((c) => !!c.src).length;
	};

	const requestChange = (type: "rows" | "cols", value: number) => {
		const removed =
			type === "rows" ? calcRemovedForRows(value) : calcRemovedForCols(value);
		if (removed > 0) {
			setPending({ type, newValue: value, removedCount: removed });
			setConfirmOpen(true);
		} else {
			if (type === "rows") setRows(value);
			else setCols(value);
		}
	};

	const applyPending = () => {
		if (!pending) return;
		if (pending.type === "rows") setRows(pending.newValue);
		else setCols(pending.newValue);
		setPending(null);
		setConfirmOpen(false);
	};

	const preserveByExpandingOther = () => {
		if (!pending) return;
		const images = countImages();
		if (pending.type === "cols") {
			const newCols = pending.newValue;
			let neededRows = Math.max(1, Math.ceil(images / newCols));
			if (neededRows > 10) {
				neededRows = 10;
			}
			setCols(newCols);
			setRows(neededRows);
		} else {
			const newRows = pending.newValue;
			let neededCols = Math.max(1, Math.ceil(images / newRows));
			if (neededCols > 10) {
				neededCols = 10;
			}
			setRows(newRows);
			setCols(neededCols);
		}
		setPending(null);
		setConfirmOpen(false);
	};
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
							setOuterState={(n: number) => requestChange("rows", n)}
							resetFlag={rowsReset}
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
							setOuterState={(n: number) => requestChange("cols", n)}
							resetFlag={colsReset}
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
							<DialogTitle>グリッドの変更を確認</DialogTitle>
							<DialogDescription>
								この変更により <strong>{pending?.removedCount ?? 0}</strong>{" "}
								個の画像が削除されます。
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									// cancel — reset the corresponding NumericInput display back to outerState
									if (pending) {
										if (pending.type === "rows") setRowsReset((s) => s + 1);
										else setColsReset((s) => s + 1);
									}
									setConfirmOpen(false);
									setPending(null);
								}}
							>
								キャンセル
							</Button>

							<Button
								variant="secondary"
								onClick={() => preserveByExpandingOther()}
							>
								画像を保持
							</Button>

							<Button onClick={() => applyPending()}>削除</Button>
						</DialogFooter>
						<DialogClose />
					</DialogContent>
				</Dialog>
			</SidebarContent>
		</Sidebar>
	);
}
