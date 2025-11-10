export function indexToAlpha(n: number): string {
	const num = Math.floor(Number(n));
	if (!Number.isFinite(num) || num < 0) return "";

	const chars: string[] = [];
	for (let i = num; i >= 0; i = Math.floor(i / 26) - 1) {
		chars.push(String.fromCharCode((i % 26) + 97));
	}
	return chars.reverse().join("");
}

export default indexToAlpha;
