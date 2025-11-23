export function stripExt(name: string) {
	return name.replace(/\.[^.]+$/, "");
}

export async function loadTiffFileToDataURL(file: File): Promise<{
	src: string;
	width: number;
	height: number;
}> {
	const _name = file.name;
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

export async function loadImageFile(file: File): Promise<{
	src: string;
	width: number;
	height: number;
	isObjectUrl: boolean;
}> {
	const name = file.name;
	const lower = name.toLowerCase();
	if (
		lower.endsWith(".tif") ||
		lower.endsWith(".tiff") ||
		file.type === "image/tiff"
	) {
		const res = await loadTiffFileToDataURL(file);
		return { ...res, isObjectUrl: false };
	}

	const url = URL.createObjectURL(file);
	const img = new Image();
	img.src = url;
	await (async () => {
		try {
			if (img.decode) await img.decode();
			else
				await new Promise<void>((res) => {
					img.onload = () => res();
					img.onerror = () => res();
				});
		} catch (_e) {}
	})();
	return {
		src: url,
		width: img.naturalWidth || 0,
		height: img.naturalHeight || 0,
		isObjectUrl: true,
	};
}

export function revokeObjectUrlIfNeeded(src?: string) {
	try {
		if (src?.startsWith("blob:")) {
			URL.revokeObjectURL(src);
		}
	} catch (_e) {}
}
