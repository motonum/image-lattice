import { HelpCircle } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

export default function Header() {
	return (
		<header className="bg-white/90 backdrop-blur-sm border-b">
			<div className="w-full px-4 py-3 flex items-center justify-between">
				<h1 className="text-lg font-semibold">Image Lattice</h1>

				{/* Help button on the right */}
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" size="sm" aria-label="Help">
							<HelpCircle className="h-4 w-4" />
							<span className="hidden sm:inline">Help</span>
						</Button>
					</DialogTrigger>

					<DialogContent>
						<DialogHeader>
							<DialogTitle>使い方 — Image Lattice</DialogTitle>
							<DialogDescription>
								このアプリでは行数・列数を指定してグリッドを作成し、各セルに画像を追加できます。画像はドラッグ＆ドロップまたはファイル選択で追加し、セル内でラベルを編集できます。セルをドラッグして並べ替えたり、複数の画像を一度にドロップして空セルへ順次配置することも可能です。
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-3 pt-2">
							<div>
								<h3 className="font-medium">基本操作</h3>
								<ul className="list-disc list-inside text-sm text-muted-foreground">
									<li>
										セルへ画像をドラッグ＆ドロップ、または「Select File」で追加
									</li>
									<li>画像下の入力でラベルを編集</li>
									<li>セルをドラッグして順序を入れ替え</li>
									<li>複数ファイルをドロップすると空セルへ順に配置</li>
								</ul>
							</div>

							<div>
								<h3 className="font-medium">エクスポート</h3>
								<p className="text-sm text-muted-foreground">
									エクスポートダイアログからグリッドを合成して PNG
									としてダウンロードできます。
								</p>
							</div>

							<div>
								<h3 className="font-medium">注意点</h3>
								<ul className="list-disc list-inside text-sm text-muted-foreground">
									<li>大きな TIFF や多数の画像はメモリを消費します。</li>
									<li>
										不要になった blob URL は自動で revoke
										していますが、長時間のセッションで注意してください。
									</li>
								</ul>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</header>
	);
}
