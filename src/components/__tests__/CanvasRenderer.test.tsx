import {
	colsAtom,
	gridMatrixAtom,
	labelModeAtom,
	rowsAtom,
} from "@/state/gridAtoms";
import { buildMatrixFromLoaded } from "@/state/gridHelpers";
import { act, render, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import React from "react";
import { afterEach } from "vitest";
import CanvasRenderer from "../CanvasRenderer";
import { DUMMY_IMAGE_BASE64 } from "./__mock__/mockImage";

afterEach(() => {
	// 必要に応じてクリーンアップ処理を追加
});

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
