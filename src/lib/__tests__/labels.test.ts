import { indexToAlpha } from "@/lib/labels";

describe("indexToAlpha", () => {
	it("converts basic indices", () => {
		expect(indexToAlpha(0)).toBe("a");
		expect(indexToAlpha(1)).toBe("b");
		expect(indexToAlpha(25)).toBe("z");
		expect(indexToAlpha(26)).toBe("aa");
		expect(indexToAlpha(27)).toBe("ab");
		expect(indexToAlpha(51)).toBe("az");
		expect(indexToAlpha(52)).toBe("ba");
	});

	it("handles non-integers and negatives", () => {
		expect(indexToAlpha(3.9)).toBe("d");
		expect(indexToAlpha(-1)).toBe("");
		expect(indexToAlpha(Number.NaN)).toBe("");
	});
});
