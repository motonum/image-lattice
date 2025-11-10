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

describe("gridAtoms", () => {
	test("previewCellsAtom respects numbering strategies", () => {
		const store = createStore();

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

	test("hasAnyImageAtom and clearCellAtom behavior", () => {
		const store = createStore();
		const items: CellItem[] = [{ id: "0", src: "s1" }, { id: "1" }];
		store.set(replaceCellsAtom, items);
		expect(store.get(hasAnyImageAtom)).toBe(true);
		store.set(clearCellAtom, 0);
		const cells = store.get(cellsAtom);
		expect(cells[0].src).toBeUndefined();
		expect(store.get(hasAnyImageAtom)).toBe(false);
	});
});
