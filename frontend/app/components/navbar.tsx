import { Link, useLocation, useNavigate } from "react-router";
import {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuLink,
} from "~/components/ui/navigation-menu";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Home,
	UserPlus,
	Heart,
	LayoutDashboard,
	Wallet,
	Coins,
	Globe,
	Menu,
	X,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "~/lib/i18n";
import { CustomConnectButton } from "~/components/CustomConnectButton";
import { useAccount } from "wagmi";
import { getContract } from "~/lib/eth";
import OnlyFHEnArtifact from "../../../artifacts/contracts/OnlyFHEn.sol/OnlyFHEn.json";
import { useNetwork } from "~/lib/useNetwork";

interface NavLinkProps {
	to: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}

function NavLink({ to, icon, children }: NavLinkProps) {
	const loc = useLocation();
	const active = loc.pathname === to;
	return (
		<NavigationMenuLink asChild>
			<Link
				to={to}
				className={
					active
						? "bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors font-medium"
						: "px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-muted transition-colors"
				}
			>
				{icon}
				{children}
			</Link>
		</NavigationMenuLink>
	);
}

export function Navbar() {
	const { t, language, setLanguage } = useTranslation();
	const setLang = (lang: "en" | "fr") => () => setLanguage(lang);
	const { address, isConnected } = useAccount();
	const { contractAddress } = useNetwork();
	const [isRegistered, setIsRegistered] = React.useState(false);
	const [checkingRegistration, setCheckingRegistration] = React.useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
	const prevConnectedRef = React.useRef(isConnected);
	const navigate = useNavigate();

	React.useEffect(() => {
		let cancelled = false;
		const checkRegistration = async () => {
			if (!isConnected || !address) {
				setIsRegistered(false);
				return;
			}

			try {
				setCheckingRegistration(true);

				if (!contractAddress) {
					setIsRegistered(false);
					return;
				}

				const contract = await getContract<any>(
					contractAddress,
					OnlyFHEnArtifact.abi,
					false,
				);
				const registered = await contract.isRegistered(address);

				if (!cancelled) {
					setIsRegistered(registered);

					// Only redirect if user just connected (transition from disconnected to connected)
					const justConnected = !prevConnectedRef.current && isConnected;
					if (registered && justConnected) {
						navigate("/dashboard");
					}
				}
			} catch (error) {
				if (!cancelled) {
					setIsRegistered(false);
				}
			} finally {
				if (!cancelled) {
					setCheckingRegistration(false);
				}
			}
		};

		checkRegistration();
		prevConnectedRef.current = isConnected;

		return () => {
			cancelled = true;
		};
	}, [address, isConnected, navigate, contractAddress]);

	const showDashboard = isConnected && isRegistered;

	return (
		<>
			<header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/80">
				<div className="container mx-auto px-4 h-full flex items-center justify-between gap-2 md:gap-4 relative">
					{/* Left - Logo */}
					<div className="flex items-center shrink-0">
						<Link
							to="/"
							className="text-lg md:text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"
						>
							<img
								src="/logo.png"
								alt="OnlyFHEn"
								className="size-7 md:size-8 rounded-sm"
							/>
							<span className="hidden xs:inline">{t("navbar.brand")}</span>
						</Link>
					</div>

					{/* Center - Desktop Navigation (absolutely centered) */}
					<div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem>
									<NavLink to="/" icon={<Home className="size-4" />}>
										{t("navbar.home")}
									</NavLink>
								</NavigationMenuItem>
								{showDashboard ? (
									<NavigationMenuItem>
										<NavLink
											to="/dashboard"
											icon={<LayoutDashboard className="size-4" />}
										>
											{t("navbar.dashboard")}
										</NavLink>
									</NavigationMenuItem>
								) : (
									<NavigationMenuItem>
										<NavLink
											to="/register"
											icon={<UserPlus className="size-4" />}
										>
											{t("navbar.register")}
										</NavLink>
									</NavigationMenuItem>
								)}
								<NavigationMenuItem>
									<NavLink to="/tip" icon={<Heart className="size-4" />}>
										{t("navbar.tip")}
									</NavLink>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavLink to="/mint" icon={<Coins className="size-4" />}>
										{t("navbar.mint")}
									</NavLink>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>

					{/* Right - Wallet & Language */}
					<div className="flex items-center gap-2 md:gap-3 shrink-0">
						<div className="hidden sm:block">
							<CustomConnectButton />
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									size="sm"
									variant="outline"
									className="gap-2 border-border/60"
									aria-label={t("navbar.languageLabel")}
								>
									<Globe className="size-4" />
									<span className="hidden sm:inline">
										{t("navbar.languageShort." + language)}
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={setLang("en")}
									className={language === "en" ? "bg-accent" : ""}
								>
									{t("navbar.languageSwitch.en")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={setLang("fr")}
									className={language === "fr" ? "bg-accent" : ""}
								>
									{t("navbar.languageSwitch.fr")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Mobile Menu Button */}
						<Button
							size="sm"
							variant="ghost"
							className="md:hidden"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? (
								<X className="size-5" />
							) : (
								<Menu className="size-5" />
							)}
						</Button>
					</div>
				</div>
			</header>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border/60 bg-background/95 backdrop-blur-md shadow-lg">
					<nav className="container mx-auto px-4 py-4 space-y-2">
						<Link
							to="/"
							className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
							onClick={() => setMobileMenuOpen(false)}
						>
							<Home className="size-4" />
							<span>{t("navbar.home")}</span>
						</Link>
						{showDashboard ? (
							<Link
								to="/dashboard"
								className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<LayoutDashboard className="size-4" />
								<span>{t("navbar.dashboard")}</span>
							</Link>
						) : (
							<Link
								to="/register"
								className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<UserPlus className="size-4" />
								<span>{t("navbar.register")}</span>
							</Link>
						)}
						<Link
							to="/tip"
							className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
							onClick={() => setMobileMenuOpen(false)}
						>
							<Heart className="size-4" />
							<span>{t("navbar.tip")}</span>
						</Link>
						<Link
							to="/mint"
							className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
							onClick={() => setMobileMenuOpen(false)}
						>
							<Coins className="size-4" />
							<span>{t("navbar.mint")}</span>
						</Link>
						<div className="sm:hidden pt-2 border-t border-border/60">
							<CustomConnectButton />
						</div>
					</nav>
				</div>
			)}
		</>
	);
}
