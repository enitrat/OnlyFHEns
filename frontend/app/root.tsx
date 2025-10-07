import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { TranslationProvider } from "~/lib/i18n";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "~/lib/wallet";
import { useZamaSDK } from "~/lib/useZamaSDK";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				{/* Ethers v6 UMD for browser usage */}
				<script src="https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js" />
			</head>
			<body>
				{children}
				<Toaster position="top-right" toastOptions={{ duration: 4000 }} />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function ZamaSDKProvider({ children }: { children: React.ReactNode }) {
	useZamaSDK();
	return <>{children}</>;
}

export default function App() {
	return (
		<TranslationProvider>
			<WalletProvider>
				<ZamaSDKProvider>
					<Outlet />
				</ZamaSDKProvider>
			</WalletProvider>
		</TranslationProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
