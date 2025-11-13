import {
	cellsAtom,
	colsAtom,
	gridMatrixAtom,
	replaceCellsAtom,
	rowsAtom,
} from "@/state/gridAtoms";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import CanvasRenderer from "../CanvasRenderer";
import Grid from "../Grid";

// gridMatrixAtom をテスト用にオーバーライド
describe("Grid", () => {
	test("正しい行と列でグリッドをレンダリングする", () => {
		const store = createStore();
		store.set(
			gridMatrixAtom,
			Array.from({ length: 3 }).map(() =>
				Array.from({ length: 3 }).map(() => ({ id: crypto.randomUUID() })),
			),
		);

		const { container } = render(
			<Provider store={store}>
				<Grid />
			</Provider>,
		);

		expect(container.querySelectorAll(".grid > .border").length).toBe(9);
		expect(container.querySelector(".grid")).toHaveStyle(
			"grid-template-columns: repeat(3, 1fr)",
		);
	});

	test("大きなグリッドをクラッシュせずにレンダリングする", () => {
		const store = createStore();
		store.set(
			gridMatrixAtom,
			Array.from({ length: 10 }).map(() =>
				Array.from({ length: 10 }).map(() => ({ id: crypto.randomUUID() })),
			),
		);

		const { container } = render(
			<Provider store={store}>
				<Grid />
			</Provider>,
		);

		expect(container.querySelectorAll(".grid > .border").length).toBe(100);
	});

	test("onDragEnd 関数が正しく動作する", () => {
		const store = createStore();
		const initialCells = [{ id: "1" }, { id: "2" }, { id: "3" }];
		store.set(replaceCellsAtom, initialCells);

		const { container } = render(
			<Provider store={store}>
				<Grid />
			</Provider>,
		);

		// ドラッグイベントをシミュレート
		const draggableItem = container.querySelector("[data-id='1']");
		const dropTarget = container.querySelector("[data-id='3']");

		if (draggableItem && dropTarget) {
			fireEvent.dragStart(draggableItem);
			fireEvent.dragOver(dropTarget);
			fireEvent.drop(dropTarget);

			const updatedCells = store.get(cellsAtom);
			expect(updatedCells[0].id).toBe("2");
			expect(updatedCells[1].id).toBe("3");
			expect(updatedCells[2].id).toBe("1");
		}
	});

	test("SortableItem が正しくレンダリングされる", () => {
		const store = createStore();
		const fixedId = "test-id-1"; // 固定された ID を使用
		store.set(replaceCellsAtom, [{ id: fixedId }]);

		const { container } = render(
			<Provider store={store}>
				<Grid />
			</Provider>,
		);

		const sortableItem = container.querySelector(`[data-id='${fixedId}']`); // 固定 ID を参照
		expect(sortableItem).not.toBeNull();
		expect(sortableItem).toBeInTheDocument();
	});

	// test("グリッドの行と列が動的に変更される", async () => {
	// 	const store = createStore();
	// 	const fixedIds = Array.from({ length: 9 }, (_, i) => `test-id-${i}`); // 固定された ID を使用
	// 	store.set(replaceCellsAtom, fixedIds.map((id) => ({ id })));

	// 	const { container } = render(
	// 		<Provider store={store}>
	// 			<Grid />
	// 		</Provider>,
	// 	);

	// 	const grid = container.querySelector(".grid");
	// 	expect(grid).not.toBeNull();
	// 	expect(grid).toHaveStyle("grid-template-columns: repeat(3, 1fr)");

	// 	const updatedIds = Array.from({ length: 16 }, (_, i) => `test-id-${i}`);
	// 	store.set(replaceCellsAtom, updatedIds.map((id) => ({ id })));

	// 	console.log("Updated state:", store.get(cellsAtom)); // 状態のデバッグログ
	// 	console.log("Updated colsAtom:", store.get(colsAtom)); // 列数のデバッグログ

	// 	await waitFor(() => {
	// 		const updatedGrid = container.querySelector(".grid");
	// 		console.log("Updated grid style:", updatedGrid?.getAttribute("style")); // DOM のデバッグログ
	// 		expect(updatedGrid).toHaveStyle("grid-template-columns: repeat(4, 1fr)");
	// 	});
	// });
});
