// Small file utilities shared across components
export function stripExt(name: string) {
	return name.replace(/\.[^.]+$/, "");
}

// Load a TIFF File using `utif` and return a data URL and dimensions.
export async function loadTiffFileToDataURL(file: File): Promise<{
	src: string;
	width: number;
	height: number;
}> {
	const name = file.name;
	const buffer = await file.arrayBuffer();
	const UTIF = (await import("utif")) as unknown as {
		decode: (
			b: ArrayBuffer | Uint8Array,
		) => Array<{ width?: number; height?: number }>;
		decodeImages: (b: ArrayBuffer | Uint8Array, ifds: unknown[]) => void;
		toRGBA8: (ifd: unknown) => Uint8Array;
	};
	const ifds = UTIF.decode(buffer);
	UTIF.decodeImages(buffer, ifds);
	const first = ifds[0] as { width?: number; height?: number } | undefined;
	const width = first?.width ?? 0;
	const height = first?.height ?? 0;
	const rgba = UTIF.toRGBA8(first as unknown);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");
	const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
	ctx.putImageData(imageData, 0, 0);
	const src = canvas.toDataURL();
	return { src, width, height };
}
