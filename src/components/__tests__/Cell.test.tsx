import type { CellItem } from "@/types/cell";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import Cell from "../Cell";

const DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

describe("Cell", () => {
	test("画像、ラベル入力、削除ボタンが表示されること", () => {
		const mockUpdate = vi.fn();
		const cells: CellItem[] = [
			{
				id: "0",
				src: DATA_URL,
				fileName: "a.png",
				label: "a",
				width: 1,
				height: 1,
			},
		];

		render(<Cell i={0} cells={cells} updateCell={mockUpdate} />);

		const img = screen.getByAltText("a.png");
		expect(img).toBeTruthy();

		const input = screen.getByDisplayValue("a");
		expect(input).toBeTruthy();

		const del = screen.getByText("Delete");
		expect(del).toBeTruthy();

		fireEvent.click(del);
		expect(mockUpdate).toHaveBeenCalledWith(0, {
			src: undefined,
			fileName: undefined,
			width: undefined,
			height: undefined,
			label: undefined,
		});
	});
});
