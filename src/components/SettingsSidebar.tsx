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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
} from "@/components/ui/sidebar";
import {
	colsAtom,
	fontSizeAtom,
	gapAtom,
	labelModeAtom,
	numberingStrategyAtom,
	previewCellsAtom,
	rowsAtom,
} from "@/state/gridAtoms";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

type LabelMode = "below" | "above" | "overlay";

type NumberingStrategy = "user" | "numeric" | "alpha" | "upper-alpha" | "none";

export default function SettingsSidebar() {
	const [rows, setRows] = useAtom(rowsAtom);
	const [cols, setCols] = useAtom(colsAtom);
	const [gap, setGap] = useAtom(gapAtom);
	const [fontSize, setFontSize] = useAtom(fontSizeAtom);
	const [labelMode, setLabelMode] = useAtom(labelModeAtom);
	const [numberingStrategy, setNumberingStrategy] = useAtom(
		numberingStrategyAtom,
	);
	const previewCells = useAtomValue(previewCellsAtom);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [pending, setPending] = React.useState<{
		type: "rows" | "cols";
		newValue: number;
		removedCount: number;
	} | null>(null);

	const [rowsReset, setRowsReset] = React.useState(0);
	const [colsReset, setColsReset] = React.useState(0);

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
			if (type === "rows") setRows({ newRows: value, expand: false });
			else setCols({ newCols: value, expand: false });
		}
	};

	const applyPendingWithExpand = (expand: boolean) => {
		if (!pending) return;
		if (pending.type === "rows") setRows({ newRows: pending.newValue, expand });
		else setCols({ newCols: pending.newValue, expand });
		setPending(null);
		setConfirmOpen(false);
	};

	return (
		<Sidebar side="right" collapsible="none" className="w-72 flex-none p-4">
			<SidebarContent>
				<SidebarHeader>
					<h2 className="text-sm font-medium">Settings</h2>
					<Separator />
				</SidebarHeader>

				<section className="flex flex-col gap-4 p-2">
					{/* Grid group */}
					<div>
						<h3 className="text-sm font-medium mb-2">Grid</h3>
						<div className="pl-4 flex flex-col gap-3">
							<div className="flex gap-2">
								<Label htmlFor="rows-input" className="flex items-center">
									<div>Rows:</div>
								</Label>
								<NumericInput
									id="rows-input"
									outerState={rows}
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
								<div className="flex items-center text-sm font-medium">
									<div>px</div>
								</div>
							</div>
						</div>
					</div>

					<Separator className="my-2" />

					{/* Label group */}
					<div>
						<h3 className="text-sm font-medium mb-2">Label</h3>
						<div className="pl-4 flex flex-col gap-3">
							<div className="flex gap-2">
								<Label
									htmlFor="label-type-select"
									className="flex items-center"
								>
									<div>Type:</div>
								</Label>
								<Select
									value={numberingStrategy}
									onValueChange={(e) =>
										setNumberingStrategy(e as NumberingStrategy)
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
									<div>Font size:</div>
								</Label>
								<NumericInput
									id="fontsize-input"
									outerState={fontSize}
									setOuterState={setFontSize}
									disabled={false}
									className="w-16"
									rejectNegative
									integer
									min={0}
									defaultValue={72}
								/>
								<div className="flex items-center text-sm font-medium">
									<div>px</div>
								</div>
							</div>
							<div className="flex gap-2">
								<Label
									htmlFor="label-mode-select"
									className="flex items-center"
								>
									<div>Position:</div>
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
						</div>
					</div>

					<Separator className="my-2" />

					{/* Export flow: open sheet to preview and download */}
					<div className="flex gap-2">
						<ExportDialog />
					</div>
				</section>
				<Dialog
					open={confirmOpen}
					onOpenChange={(v) => {
						if (!v) {
							if (pending) {
								if (pending.type === "rows") setRowsReset((s) => s + 1);
								else setColsReset((s) => s + 1);
							}
							setPending(null);
						}
						setConfirmOpen(v);
					}}
				>
					<DialogContent
						onPointerDownOutside={(e) => e.preventDefault()}
						className="w-96"
					>
						<DialogHeader>
							<DialogTitle>グリッドの変更を確認</DialogTitle>
							<DialogDescription>
								セルの数が画像の数を下回るため、
								<strong>{pending?.removedCount ?? 0}</strong>
								個の画像が削除されます。 「画像を保持」を選択すると、
								{pending && pending.type === "rows" ? "列" : "行"}
								を拡張し、画像を保持します。
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									if (pending) {
										if (pending.type === "rows") setRowsReset((s) => s + 1);
										else setColsReset((s) => s + 1);
									}
									setPending(null);
									setConfirmOpen(false);
								}}
							>
								キャンセル
							</Button>

							<Button
								variant="secondary"
								onClick={() => applyPendingWithExpand(true)}
							>
								画像を保持
							</Button>

							<Button onClick={() => applyPendingWithExpand(false)}>
								削除
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</SidebarContent>
		</Sidebar>
	);
}
