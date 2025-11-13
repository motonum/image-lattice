import {
	cellsAtom,
	clearCellAtom,
	hasAnyImageAtom,
	numberingStrategyAtom,
	previewCellsAtom,
	replaceCellsAtom,
} from "@/state/gridAtoms";
import type { CellItem } from "@/types/cell";
import { createStore } from "jotai";
import { describe, expect, test } from "vitest";
import { gridAtoms } from "../gridAtoms";

describe("gridAtoms", () => {
	const store = createStore();

	test("previewCellsAtom がLabelTypeに従う", () => {
		const items: CellItem[] = [
			{
				id: "0",
				src: "s1",
				fileName: "a.png",
				label: "a",
				width: 1,
				height: 1,
			},
			{
				id: "1",
				src: "s2",
				fileName: "b.png",
				label: "b",
				width: 1,
				height: 1,
			},
			{ id: "2" },
		];

		store.set(replaceCellsAtom, items);

		store.set(numberingStrategyAtom, "numeric");
		const numeric = store.get(previewCellsAtom);
		expect(numeric[0].label).toBe("(1)");
		expect(numeric[1].label).toBe("(2)");

		store.set(numberingStrategyAtom, "alpha");
		const alpha = store.get(previewCellsAtom);
		expect(alpha[0].label).toBe("(a)");
		expect(alpha[1].label).toBe("(b)");

		store.set(numberingStrategyAtom, "upper-alpha");
		const upper = store.get(previewCellsAtom);
		expect(upper[0].label).toBe("(A)");

		store.set(numberingStrategyAtom, "none");
		const none = store.get(previewCellsAtom);
		expect(none[0].label).toBeUndefined();

		store.set(numberingStrategyAtom, "user");
		const user = store.get(previewCellsAtom);
		expect(user[0].label).toBe("a");
	});

	test("hasAnyImageAtom と clearCellAtom の動作", () => {
		const items: CellItem[] = [{ id: "0", src: "s1" }, { id: "1" }];
		store.set(replaceCellsAtom, items);
		expect(store.get(hasAnyImageAtom)).toBe(true);
		store.set(clearCellAtom, 0);
		const cells = store.get(cellsAtom);
		expect(cells[0].src).toBeUndefined();
		expect(store.get(hasAnyImageAtom)).toBe(false);
	});

	test("デフォルト状態を正しく処理する", () => {
		const defaultState = store.get(gridAtoms.gapAtom);
		expect(defaultState).toBe(10); // Replace with actual default value
	});

	test("状態を正しく更新する", () => {
		store.set(gridAtoms.gapAtom, 20);
		const updatedState = store.get(gridAtoms.gapAtom);
		expect(updatedState).toBe(20);
	});
});
