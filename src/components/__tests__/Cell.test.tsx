import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider, useSetAtom, type WritableAtom } from "jotai";
import React from "react";
import { vi } from "vitest";
import Cell from "@/components/Cell";
import {
	type NumberingStrategy,
	numberingStrategyAtom,
	replaceCellsAtom,
} from "@/state/gridAtoms";
import type { CellItem } from "@/types/cell";

vi.mock("@/lib/file", () => ({
	loadImageFile: vi.fn(),
	revokeObjectUrlIfNeeded: vi.fn(),
	stripExt: (s: string) => s.replace(/\.[^.]+$/, ""),
}));
const DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

describe("Cell", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("画像、ラベル入力、削除ボタンが表示されること", async () => {
		const store = createStore();

		const Initializer: React.FC = () => {
			const set = useSetAtom(
				replaceCellsAtom as WritableAtom<null, [CellItem[]], void>,
			);
			React.useEffect(() => {
				const items: CellItem[] = [
					{
						id: "0",
						src: DATA_URL,
						fileName: "a.png",
						label: "a",
						width: 1,
						height: 1,
					},
					{ id: "placeholder-1" },
				];
				set(items);
			}, [set]);
			return null;
		};

		// set numbering strategy to user so label input is editable
		store.set(numberingStrategyAtom, "user" as NumberingStrategy);

		render(
			<Provider store={store}>
				<Initializer />
				<Cell i={0} id="0" />
			</Provider>,
		);

		await waitFor(() =>
			expect(screen.getByAltText("a.png")).toBeInTheDocument(),
		);
		expect(screen.getByDisplayValue("a")).toBeInTheDocument();
		expect(screen.getByText("Delete")).toBeInTheDocument();
	});

	test("Delete ボタンを押すとセルがクリアされること", async () => {
		const store = createStore();

		const Initializer: React.FC = () => {
			const set = useSetAtom(
				replaceCellsAtom as WritableAtom<null, [CellItem[]], void>,
			);
			React.useEffect(() => {
				const items: CellItem[] = [
					{
						id: "0",
						src: DATA_URL,
						fileName: "a.png",
						label: "a",
						width: 1,
						height: 1,
					},
					{ id: "placeholder-2" },
				];
				set(items);
			}, [set]);
			return null;
		};

		store.set(numberingStrategyAtom, "user" as NumberingStrategy);

		render(
			<Provider store={store}>
				<Initializer />
				<Cell i={0} id="0" />
			</Provider>,
		);

		await waitFor(() =>
			expect(screen.getByAltText("a.png")).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByText("Delete"));

		await waitFor(() => {
			expect(screen.queryByAltText("a.png")).toBeNull();
			expect(screen.getByText("Select File")).toBeInTheDocument();
		});
	});

	test("セルが外部から更新されると表示が変わること (ファイル入力の代替)", async () => {
		const store = createStore();

		// Initial empty grid
		const InitializerA: React.FC = () => {
			const set = useSetAtom(
				replaceCellsAtom as WritableAtom<null, [CellItem[]], void>,
			);
			React.useEffect(() => {
				const items: CellItem[] = [
					{ id: "placeholder-3" },
					{ id: "placeholder-4" },
				];
				set(items);
			}, [set]);
			return null;
		};

		// After mount, replace with a loaded image to simulate file load/update
		const InitializerB: React.FC = () => {
			const set = useSetAtom(
				replaceCellsAtom as WritableAtom<null, [CellItem[]], void>,
			);
			React.useEffect(() => {
				const items: CellItem[] = [
					{
						id: "0",
						src: DATA_URL,
						fileName: "b.png",
						label: "b",
						width: 1,
						height: 1,
					},
					{ id: "placeholder-5" },
				];
				set(items);
			}, [set]);
			return null;
		};

		store.set(numberingStrategyAtom, "user" as NumberingStrategy);

		render(
			<Provider store={store}>
				<InitializerA />
				<InitializerB />
				<Cell i={0} id="0" />
			</Provider>,
		);

		await waitFor(() =>
			expect(screen.getByAltText("b.png")).toBeInTheDocument(),
		);
		expect(screen.getByDisplayValue("b")).toBeInTheDocument();
	});
});
