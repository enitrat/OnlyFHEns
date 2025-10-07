import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	{ path: "register", file: "routes/register.tsx" },
	{ path: "tip", file: "routes/tip.tsx" },
	{ path: "dashboard", file: "routes/dashboard.tsx" },
	{ path: "mint", file: "routes/mint.tsx" },
] satisfies RouteConfig;
