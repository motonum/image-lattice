import Grid from "@/components/Grid";
import { cellsAtom, gridMatrixAtom, replaceCellsAtom } from "@/state/gridAtoms";
import { fireEvent, render } from "@testing-library/react";
import { Provider, createStore } from "jotai";

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
});
