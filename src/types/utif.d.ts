declare module "utif" {
	type IFD = unknown;

	export function decode(buffer: ArrayBuffer | Uint8Array): IFD[];
	export function decodeImages(
		buffer: ArrayBuffer | Uint8Array,
		ifds: IFD[],
	): void;
	export function toRGBA8(ifd: IFD): Uint8Array;

	const UTIF: {
		decode: typeof decode;
		decodeImages: typeof decodeImages;
		toRGBA8: typeof toRGBA8;
	};

	export default UTIF;
}
