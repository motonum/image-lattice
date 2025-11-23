import { render } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import CanvasRenderer from "@/components/CanvasRenderer";
import { colsAtom, labelModeAtom, rowsAtom } from "@/state/gridAtoms";

describe("CanvasRenderer", () => {
	test("クラッシュせずにレンダリングされる", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 2, expand: false });
		store.set(colsAtom, { newCols: 2, expand: false });

		render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);
	});

	test("空の行と列を適切に処理する", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 1, expand: false });
		store.set(colsAtom, { newCols: 1, expand: false });

		render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);
	});

	test("有効な行と列でレンダリングされる", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 3, expand: false });
		store.set(colsAtom, { newCols: 3, expand: false });

		const { container } = render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);
		expect(container.querySelectorAll("canvas").length).toBe(2);
	});
});

describe("CanvasRenderer - 詳細テスト", () => {
	test("'above' モードでラベルを描画する", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 2, expand: false });
		store.set(colsAtom, { newCols: 2, expand: false });
		store.set(labelModeAtom, "above");

		const { container } = render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);

		expect(container.querySelectorAll("canvas").length).toBe(2);
	});

	test("'below' モードでラベルを描画する", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 2, expand: false });
		store.set(colsAtom, { newCols: 2, expand: false });
		store.set(labelModeAtom, "below");

		const { container } = render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);

		expect(container.querySelectorAll("canvas").length).toBe(2);
	});

	test("'overlay' モードでラベルを描画する", () => {
		const store = createStore();
		store.set(rowsAtom, { newRows: 2, expand: false });
		store.set(colsAtom, { newCols: 2, expand: false });
		store.set(labelModeAtom, "overlay");

		const { container } = render(
			<Provider store={store}>
				<CanvasRenderer />
			</Provider>,
		);

		expect(container.querySelectorAll("canvas").length).toBe(2);
	});
});
