import type React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
	RainbowKitProvider,
	getDefaultConfig,
	type Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import merge from "lodash.merge";

const queryClient = new QueryClient();

// Configure chains and transports
const transports: Record<number, ReturnType<typeof http>> = {
	[sepolia.id]: http(),
	[hardhat.id]: http("http://127.0.0.1:8545"),
};

const projectId = (import.meta as any).env?.VITE_WC_PROJECT_ID || "SET_ME";

const config = getDefaultConfig({
	appName: "OnlyFHEn",
	projectId,
	chains: [sepolia, hardhat],
	transports,
	ssr: true,
});

const customTheme: Theme = {
	blurs: {
		modalOverlay: "blur(8px)",
	},
	colors: {
		accentColor: "#0DAB0D", // Lime Green
		accentColorForeground: "#FFFFFF",
		actionButtonBorder: "rgba(13, 171, 13, 0.2)",
		actionButtonBorderMobile: "rgba(13, 171, 13, 0.2)",
		actionButtonSecondaryBackground: "#F5F0D0",
		closeButton: "#4a6356",
		closeButtonBackground: "#FFFFFF",
		connectButtonBackground: "#FFFADB", // Pine Green
		connectButtonBackgroundError: "#d32f2f",
		connectButtonInnerBackground: "#FFFFFF",
		connectButtonText: "#003D29", // White Argile
		connectButtonTextError: "#003D29",
		connectionIndicator: "#0DAB0D",
		downloadBottomCardBackground:
			"linear-gradient(to bottom, #F5F0D0, #FFFADB)",
		downloadTopCardBackground: "#FFFFFF",
		error: "#d32f2f",
		generalBorder: "#d4cba4", // Beige border
		generalBorderDim: "rgba(212, 203, 164, 0.5)",
		menuItemBackground: "#F5F0D0",
		modalBackdrop: "rgba(0, 61, 41, 0.4)",
		modalBackground: "#FFFADB", // White Argile
		modalBorder: "#d4cba4",
		modalText: "#003D29", // Pine Green
		modalTextDim: "#4a6356",
		modalTextSecondary: "#4a6356",
		profileAction: "#FFFFFF",
		profileActionHover: "#F5F0D0",
		profileForeground: "#FFFFFF",
		selectedOptionBorder: "#0DAB0D",
		standby: "#FF7500", // Carrot Orange
	},
	fonts: {
		body: "Inter, ui-sans-serif, system-ui, sans-serif",
	},
	radii: {
		actionButton: "0.625rem", // 10px
		connectButton: "0.625rem",
		menuButton: "0.625rem",
		modal: "0.875rem", // 14px
		modalMobile: "0.875rem",
	},
	shadows: {
		connectButton: "0 8px 30px rgba(0, 61, 41, 0.12)",
		dialog: "0 12px 40px rgba(0, 61, 41, 0.15)",
		profileDetailsAction: "0 2px 8px rgba(0, 61, 41, 0.08)",
		selectedOption: "0 0 0 2px rgba(13, 171, 13, 0.3)",
		selectedWallet: "0 8px 32px rgba(13, 171, 13, 0.15)",
		walletLogo: "0 2px 8px rgba(0, 61, 41, 0.08)",
	},
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider theme={customTheme} modalSize="compact">
					{children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
