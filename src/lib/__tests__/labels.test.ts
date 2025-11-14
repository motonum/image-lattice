import { indexToAlpha } from "@/lib/labels";

describe("indexToAlpha", () => {
	it("基本的なインデックスを変換する", () => {
		expect(indexToAlpha(0)).toBe("a");
		expect(indexToAlpha(1)).toBe("b");
		expect(indexToAlpha(25)).toBe("z");
		expect(indexToAlpha(26)).toBe("aa");
		expect(indexToAlpha(27)).toBe("ab");
		expect(indexToAlpha(51)).toBe("az");
		expect(indexToAlpha(52)).toBe("ba");
	});

	it("非整数や負の値を処理する", () => {
		expect(indexToAlpha(3.9)).toBe("d");
		expect(indexToAlpha(-1)).toBe("");
		expect(indexToAlpha(Number.NaN)).toBe("");
	});
});
