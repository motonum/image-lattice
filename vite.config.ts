import { URL, fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	plugins: [tailwindcss()],
	build: {
		rollupOptions: {
			onwarn(warning, defaultHandler) {
				if (
					warning.code === "MODULE_LEVEL_DIRECTIVE" &&
					typeof warning.message === "string" &&
					warning.message.includes('"use client"')
				) {
					return;
				}
				defaultHandler(warning);
			},
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/setupTests.ts"],
	},
});
