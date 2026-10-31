import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "staff-management",
		compatibilityDate: "2026-10-23",
		entrypoint,
		env: {
			DB: bindings.d1({ id: "2074d1ad-6a79-43c2-8bce-61bb19484545" }),
			AUTH_PIN: bindings.text("4635"),
		},
	},
});
