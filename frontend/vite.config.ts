import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./app"),
		},
	},
	ssr: {
		noExternal: [
			"@rainbow-me/rainbowkit",
			"@vanilla-extract/css",
			"@vanilla-extract/sprinkles",
		],
	},
});
