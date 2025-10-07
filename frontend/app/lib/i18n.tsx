import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { db } from "~/lib/db";

export type Language = "en" | "fr";

type TranslationDict = Record<string, any>;

const translations: Record<Language, TranslationDict> = {
  en: {
    mockCreators: {
      influencer: "Influencer",
      racing: "Racing",
      podcast: "Podcast",
      writing: "Writing",
    },
    common: {
      txLabel: "Transaction: ",
      viewExplorer: "View on explorer",
      notConfigured: "not configured",
      transaction: {
        submitted: "Transaction submitted",
        waiting: "Waiting for confirmation…",
        success: "Transaction successful",
        error: "Transaction failed",
      },
      max: "Max",
      loading: {
        checkingOperator: "Checking operator permissions...",
        operatorGranted: "Operator permission granted",
        operatorAlreadySet: "Operator already set",
        encrypting: "Encrypting amount...",
        encrypted: "Amount encrypted",
        submittingTx: "Submitting transaction...",
        txSubmitted: "Transaction submitted",
        confirmingTx: "Waiting for transaction confirmation...",
        processing: "Processing...",
        decrypting: "Decrypting...",
      },
      errors: {
        missingContract: "Enter OnlyFHEn address",
        missingToken: "Enter token address",
        missingAmount: "Enter amount",
        missingCreator: "Enter creator address",
        genericError: "An error occurred. Please try again.",
        userRejected: "Transaction cancelled by user",
        insufficientFunds:
          "Insufficient funds to cover transaction cost and gas fees",
        gasEstimationFailed:
          "Failed to estimate gas. The transaction may fail or require manual gas limit",
        nonceTooLow:
          "Transaction nonce too low. A transaction with this nonce was already processed",
        replacementUnderpriced:
          "Replacement transaction underpriced. Increase gas price to replace pending transaction",
        transactionUnderpriced:
          "Transaction underpriced. Increase gas price to process faster",
        executionReverted:
          "Transaction reverted. The contract rejected this transaction",
        networkError: "Network error. Check your connection and try again",
        invalidParams: "Invalid transaction parameters. Check all input values",
        chainMismatch:
          "Wrong network. Please switch to the correct network in your wallet",
        contractError:
          "Smart contract error. The operation was rejected by the contract logic",
      },
    },
    navbar: {
      brand: "OnlyFHEn",
      home: "Home",
      register: "Become a creator",
      tip: "Send tip",
      dashboard: "Creator dashboard",
      balance: "Balance",
      mint: "Mint (dev)",
      network: "Network: {network}{chainSuffix}",
      chainSuffix: " (chainId {chainId})",
      tokenMissing: "Token: not set",
      balanceLabel: "Balance: {value}",
      languageLabel: "Language",
      languageShort: {
        en: "EN",
        fr: "FR",
      },
      languageSwitch: {
        en: "Switch to English",
        fr: "Switch to French",
      },
    },
    landing: {
      heroBadge: "OnlyFHEn for creators",
      heroLineStart: "TO",
      heroLineHighlight: "SUPPORT",
      heroLineCreators: "THE CREATORS",
      heroLineLove: "WE LOVE",
      heroSubheadlinePrefix: "With ",
      heroSubheadlineHighlight: "complete privacy",
      heroBadgeLabel: "End-to-end encryption",
      ctaCreator: "I am a creator",
      ctaSupport: "Support creators",
      carouselTitle: "Discover creators",
      carouselSubtitle:
        "Support your favourite artists, musicians, developers, and creators with full privacy.",
      carouselViewAll: "Browse all creators",
      carouselSupport: "Support",
    },
    register: {
      heroBadge: "OnlyFHEn for creators",
      heroTitle: "Fund your content with complete privacy",
      heroSubtitle:
        "Powered by your community. Tip amounts stay private on-chain.",
      ctaPrimary: "Become a creator",
      ctaSecondary: "Advanced settings",
      status: {
        pending: "Registering… confirm in wallet.",
        success: "Creator registered successfully.",
        error: "Registration failed.",
      },
      loading: {
        checkingRegistration: "Checking registration status...",
        alreadyRegistered: "Already registered, redirecting...",
        readyToRegister: "Ready to register",
        submittingRegistration: "Submitting registration transaction...",
      },
      advanced: {
        contractLabel: "OnlyFHEn contract address",
        defaultLabel: "Default: {value}",
      },
      reasons: {
        title: "Why become a creator?",
        subtitle:
          "A platform designed for privacy, simplicity, and security—powered by Zama FHE.",
      },
      features: {
        confidentiality: {
          title: "Full confidentiality",
          desc: "Tip amounts stay encrypted—only you can decrypt them.",
        },
        simplicity: {
          title: "Frictionless for fans",
          desc: "A smooth tipping flow on desktop and mobile.",
        },
        withdrawals: {
          title: "Secure withdrawals",
          desc: "Request payouts with attested approvals.",
        },
        control: {
          title: "You stay in control",
          desc: "Keep ownership of your keys and permissions.",
        },
      },
      defaultNotConfigured: "not configured",
      errors: {
        missingContract: "Enter OnlyFHEn contract address",
      },
      profile: {
        title: "Your Public profile",
        description: "Help your fans find you.",
        fields: {
          name: "Display name",
          x: "X (Twitter) handle",
          instagram: "Instagram handle",
        },
        placeholders: {
          name: "e.g. Alice",
          x: "e.g. @alice",
          instagram: "e.g. @alice_ig",
        },
        saved: "Profile saved.",
        errors: {
          nameRequired: "Name is required",
        },
      },
    },
    tip: {
      heroBadge: "Support creators privately",
      heroTitle: "Send a confidential tip",
      heroSubtitle:
        "Encrypt your amount in seconds and celebrate the creators you love.",
      operatorTitle: "1) Grant operator (optional)",
      operatorDescription:
        "Required if the token needs operator approval for transferFrom.",
      loading: {
        encryptingTip: "Encrypting tip amount...",
        submittingTip: "Submitting tip transaction...",
      },
      fields: {
        token: "Confidential token address",
        contract: "OnlyFHEn contract address",
        expiry: "Operator expiry (unix seconds)",
        creator: "Creator address",
        amount: "Amount ",
        handle: "Supporter handle (optional)",
      },
      placeholders: {
        contract: "0x...",
        token: "0x...",
        expiry: "e.g. 1700000000",
        creator: "0x...",
        amount: "e.g. 100",
        handle: "e.g. @fan123",
      },
      buttons: {
        grant: "Grant operator",
        submit: "Send tip",
      },
      status: {
        operatorPending: "Granting operator… confirm in wallet.",
        operatorSuccess: "Operator granted to OnlyFHEn.",
        operatorError: "Operator grant failed.",
        tipPending: "Sending tip… confirm in wallet.",
        tipSuccess: "Tip sent successfully.",
        tipError: "Tipping failed.",
      },
      tx: {
        label: "Transaction: ",
        link: "View on explorer",
      },
      errors: {
        missingToken: "Enter token address",
        missingContract: "Enter OnlyFHEn address",
        missingCreator: "Enter creator address",
        missingAmount: "Enter amount",
      },
      title: "2) Send tip",
      savedCreators: {
        title: "Saved creators",
        empty: "No saved creators yet.",
        select: "Select",
      },
      creatorsDropdown: {
        search: "Search creators",
        noResults: "No matching creators",
        choose: "Choose a creator",
      },
    },
    dashboard: {
      heroBadge: "Creator console",
      heroTitle: "Your encrypted earnings in one place",
      heroSubtitle:
        "Decrypt balances, manage withdrawals, and stay in control of your data.",
      welcome: "Welcome, {name}",
      balanceCard: {
        title: "Encrypted balance",
        description:
          "Decrypt your confidential tips. Only you can view the totals.",
        button: "Decrypt my balance",
      },
      withdrawCard: {
        title: "Request a withdrawal",
        description:
          "Choose an amount to withdraw from your confidential balance.",
      },
      advanced: {
        toggle: "Advanced settings",
        contractLabel: "OnlyFHEn contract address",
        defaultLabel: "Default: {value}",
      },
      notRegistered:
        "You need to register as a creator before accessing the dashboard.",
      redirecting: "Redirecting to creator registration…",
    },
    withdraw: {
      title: "Request withdrawal",
      description: "Withdraw confidential tokens",
      fields: {
        contract: "OnlyFHEn contract address",
        amount: "Amount ",
      },
      placeholders: {
        contract: "0x...",
        amount: "e.g. 50",
      },
      button: "Withdraw",
      status: {
        pending: "Requesting withdrawal… confirm in wallet.",
        success: "Withdrawal requested (transfer executed if allowed).",
        error: "Withdrawal failed.",
      },
      loading: {
        encryptingAmount: "Encrypting withdrawal amount...",
        submittingRequest: "Submitting withdrawal request...",
        requestSubmitted: "Withdrawal request submitted",
      },
      tx: {
        label: "Transaction: ",
        link: "View on explorer",
      },
      helper: {
        available: "Available amount: {value}",
      },
      errors: {
        missingContract: "Enter OnlyFHEn address",
        missingAmount: "Enter amount",
      },
    },
    balance: {
      title: "Decrypt balance",
      description: "Fetch and decrypt your encrypted balance",
      fields: {
        contract: "OnlyFHEn contract address",
        creator: "Creator address (optional)",
      },
      placeholders: {
        contract: "0x...",
        creator: "Defaults to connected wallet",
      },
      button: "Check balance",
      status: {
        fetching: "Fetching encrypted balance…",
        localDecrypt: "Requesting local user decryption…",
        prepare: "Preparing user decryption…",
        sign: "Sign typed data to authorize decryption…",
        submit: "Submitting user decrypt request…",
        success: "Balance decrypted successfully.",
        error: "Failed to decrypt balance.",
      },
      loading: {
        fetchingBalance: "Fetching encrypted balance...",
        balanceRetrieved: "Encrypted balance retrieved",
        decryptingLocally: "Decrypting balance locally...",
        preparingRequest: "Preparing decryption request...",
        requestPrepared: "Request prepared",
        waitingSignature: "Waiting for signature...",
        requestSigned: "Request signed",
        decryptingBalance: "Decrypting balance...",
        decryptionSuccess: "Balance decrypted successfully",
      },
      decryptedLabel: "Decrypted balance: {value}",
      errors: {
        missingContract: "Enter OnlyFHEn address",
      },
    },
    mint: {
      title: "Mint confidential tokens",
      description: "Mint to your own wallet address",
      fields: {
        token: "Token address",
        amount: "Amount ",
      },
      placeholders: {
        token: "0x...",
        amount: "e.g. 1000",
      },
      button: "Mint",
      status: {
        pending: "Minting… confirm in wallet.",
        success: "Minted successfully.",
        error: "Mint failed.",
      },
      noteSepolia:
        "Note: On Sepolia, mint may be restricted depending on the deployed token contract.",
      tx: {
        label: "Transaction: ",
        link: "View on explorer",
      },
      errors: {
        missingToken: "Enter token address",
        missingAmount: "Enter amount",
      },
    },
    localFHE: {
      command: "bun run local-fhe",
      active: "Local FHE helper running",
      activeWithNetwork: "Local FHE helper running ({network})",
      inactive: "Local FHE helper not reachable. Start it with: {command}",
    },
  },
  fr: {
    mockCreators: {
      influencer: "Influenceur",
      racing: "Course automobile",
      podcast: "Podcast",
      writing: "Écriture",
    },
    common: {
      txLabel: "Tx : ",
      viewExplorer: "Voir sur l'explorateur",
      notConfigured: "non configuré",
      transaction: {
        submitted: "Transaction soumise",
        waiting: "En attente de confirmation…",
        success: "Transaction réussie",
        error: "Transaction échouée",
      },
      max: "Max",
      loading: {
        checkingOperator: "Vérification des permissions opérateur...",
        operatorGranted: "Permission opérateur accordée",
        operatorAlreadySet: "Opérateur déjà configuré",
        encrypting: "Chiffrement du montant...",
        encrypted: "Montant chiffré",
        submittingTx: "Soumission de la transaction...",
        txSubmitted: "Transaction soumise",
        confirmingTx: "En attente de la confirmation...",
        processing: "Traitement...",
        decrypting: "Déchiffrement...",
      },
      errors: {
        missingContract: "Saisissez l'adresse du contrat OnlyFHEn",
        missingToken: "Saisissez l'adresse du jeton",
        missingAmount: "Saisissez un montant",
        missingCreator: "Saisissez l'adresse du créateur",
        genericError: "Une erreur est survenue. Veuillez réessayer.",
        userRejected: "Transaction annulée par l'utilisateur",
        insufficientFunds:
          "Fonds insuffisants pour couvrir le coût de la transaction et les frais de gaz",
        gasEstimationFailed:
          "Échec de l'estimation du gaz. La transaction peut échouer ou nécessiter une limite de gaz manuelle",
        nonceTooLow:
          "Nonce de transaction trop bas. Une transaction avec ce nonce a déjà été traitée",
        replacementUnderpriced:
          "Prix de remplacement trop bas. Augmentez le prix du gaz pour remplacer la transaction en attente",
        transactionUnderpriced:
          "Transaction sous-évaluée. Augmentez le prix du gaz pour un traitement plus rapide",
        executionReverted:
          "Transaction annulée. Le contrat a rejeté cette transaction",
        networkError: "Erreur réseau. Vérifiez votre connexion et réessayez",
        invalidParams:
          "Paramètres de transaction invalides. Vérifiez toutes les valeurs saisies",
        chainMismatch:
          "Mauvais réseau. Veuillez basculer vers le réseau correct dans votre wallet",
        contractError:
          "Erreur du smart contract. L'opération a été rejetée par la logique du contrat",
      },
    },
    navbar: {
      brand: "OnlyFHEn",
      home: "Accueil",
      register: "Devenir créateur",
      tip: "Envoyer un pourboire",
      dashboard: "Tableau de bord",
      balance: "Solde",
      mint: "Mint (dev)",
      network: "Réseau : {network}{chainSuffix}",
      chainSuffix: " (chainId {chainId})",
      tokenMissing: "Jeton : non défini",
      balanceLabel: "Solde : {value}",
      decryptButton: "Déchiffrer le solde",
      decrypting: "Déchiffrement…",
      languageLabel: "Langue",
      languageShort: {
        en: "EN",
        fr: "FR",
      },
      languageSwitch: {
        en: "Passer en anglais",
        fr: "Passer en français",
      },
    },
    landing: {
      heroBadge: "OnlyFHEn pour créateurs",
      heroLineStart: "POUR",
      heroLineHighlight: "SOUTENIR",
      heroLineCreators: "LES CRÉATEURS",
      heroLineLove: "QU'ON AIME",
      heroSubheadlinePrefix: "Avec une ",
      heroSubheadlineHighlight: "confidentialité totale",
      heroBadgeLabel: "Chiffrement de bout en bout",
      ctaCreator: "Je suis créateur",
      ctaSupport: "Soutenir des créateurs",
      carouselTitle: "Découvrez les créateurs",
      carouselSubtitle:
        "Soutenez vos artistes, musiciens, développeurs et créateurs préférés en toute confidentialité",
      carouselViewAll: "Découvrir tous les créateurs",
      carouselSupport: "Soutenir",
    },
    register: {
      heroBadge: "OnlyFHEn pour créateurs",
      heroTitle: "Financez vos contenus en toute confidentialité",
      heroSubtitle:
        "Grâce au soutien de votre communauté. Les montants restent privés sur la blockchain.",
      ctaPrimary: "Devenir créateur",
      ctaSecondary: "Paramètres avancés",
      status: {
        pending: "Inscription… confirmez dans votre wallet.",
        success: "Créateur enregistré avec succès.",
        error: "Échec de l'inscription.",
      },
      loading: {
        checkingRegistration: "Vérification du statut d'inscription...",
        alreadyRegistered: "Déjà inscrit, redirection...",
        readyToRegister: "Prêt à s'inscrire",
        submittingRegistration: "Soumission de l'inscription...",
      },
      advanced: {
        contractLabel: "Adresse du contrat OnlyFHEn",
        defaultLabel: "Par défaut : {value}",
      },
      reasons: {
        title: "Pourquoi devenir créateur ?",
        subtitle:
          "Une plateforme pensée pour la confidentialité, la simplicité et la sécurité — alimentée par Zama FHE.",
      },
      features: {
        confidentiality: {
          title: "Confidentialité totale",
          desc: "Les montants restent chiffrés — visibles uniquement par vous.",
        },
        simplicity: {
          title: "Simplicité pour vos fans",
          desc: "Un flux de pourboires fluide, sur desktop et mobile.",
        },
        withdrawals: {
          title: "Retraits sécurisés",
          desc: "Demandez vos retraits en toute sécurité (KMS/attestation).",
        },
        control: {
          title: "Contrôle de vos données",
          desc: "Vous gardez la main sur vos clés et autorisations.",
        },
      },
      defaultNotConfigured: "non configuré",
      errors: {
        missingContract: "Saisissez l'adresse du contrat OnlyFHEn",
      },
      profile: {
        title: "Profil public",
        description: "Enregistré.",
        fields: {
          name: "Nom d'affichage",
          x: "Pseudo X (Twitter)",
          instagram: "Pseudo Instagram",
        },
        placeholders: {
          name: "ex: Alice",
          x: "ex: @alice",
          instagram: "ex: @alice_ig",
        },
        saved: "Profil créé.",
        errors: {
          nameRequired: "Le nom est requis",
        },
      },
    },
    tip: {
      heroBadge: "Soutenez en toute discrétion",
      heroTitle: "Envoyer un pourboire confidentiel",
      heroSubtitle:
        "Chiffrez votre montant en quelques secondes et célébrez vos créateurs favoris.",
      operatorTitle: "1) Autoriser l'opérateur (optionnel)",
      operatorDescription:
        "Nécessaire si le jeton exige une approbation d'opérateur pour transferFrom.",
      loading: {
        encryptingTip: "Chiffrement du pourboire...",
        submittingTip: "Soumission du pourboire...",
      },
      fields: {
        token: "Adresse du jeton confidentiel",
        contract: "Adresse du contrat OnlyFHEn",
        expiry: "Expiration de l'autorisation (secondes Unix)",
        creator: "Adresse du créateur",
        amount: "Montant ",
        handle: "Pseudo (optionnel)",
      },
      placeholders: {
        contract: "0x...",
        token: "0x...",
        expiry: "ex: 1700000000",
        creator: "0x...",
        amount: "ex: 100",
        handle: "ex: @fan123",
      },
      buttons: {
        grant: "Accorder l'autorisation",
        submit: "Envoyer",
      },
      status: {
        operatorPending:
          "Attribution de l'autorisation… confirmez dans votre wallet.",
        operatorSuccess: "Autorisation accordée à OnlyFHEn.",
        operatorError: "Échec de l'autorisation d'opérateur.",
        tipPending: "Envoi du tip... confirmez dans votre wallet.",
        tipSuccess: "Pourboire envoyé avec succès.",
        tipError: "Échec de l'envoi du pourboire.",
      },
      tx: {
        label: "Tx : ",
        link: "Voir sur l'explorateur",
      },
      errors: {
        missingToken: "Saisissez l'adresse du jeton",
        missingContract: "Saisissez l'adresse du contrat OnlyFHEn",
        missingCreator: "Saisissez l'adresse du créateur",
        missingAmount: "Saisissez un montant",
      },
      title: "2) Envoyer un pourboire",
    },
    dashboard: {
      heroBadge: "Dashboard créateur",
      heroTitle: "Vos gains chiffrés, en un coup d'œil",
      heroSubtitle:
        "Déchiffrez votre solde, demandez des retraits et gardez la main sur vos données.",
      welcome: "Bienvenue, {name}",
      balanceCard: {
        title: "Solde chiffré",
        description:
          "Déchiffrez vos pourboires confidentiels. Vous seul pouvez voir les montants.",
        button: "Déchiffrer mon solde",
      },
      withdrawCard: {
        title: "Demander un retrait",
        description:
          "Choisissez le montant à retirer de votre solde confidentiel.",
      },
      advanced: {
        toggle: "Paramètres avancés",
        contractLabel: "Adresse du contrat OnlyFHEn",
        defaultLabel: "Par défaut : {value}",
      },
      notRegistered:
        "Vous devez vous inscrire en tant que créateur avant d'accéder au tableau de bord.",
      redirecting: "Redirection vers l'inscription créateur…",
    },
    withdraw: {
      title: "Demander un retrait",
      description: "Retrait de jetons confidentiels",
      fields: {
        contract: "Adresse du contrat OnlyFHEn",
        amount: "Montant ",
      },
      placeholders: {
        contract: "0x...",
        amount: "ex: 50",
      },
      button: "Retirer",
      status: {
        pending: "Demande de retrait… confirmez dans votre wallet.",
        success: "Retrait demandé (transfert exécuté si autorisé).",
        error: "Échec du retrait.",
      },
      loading: {
        encryptingAmount: "Chiffrement du montant de retrait...",
        submittingRequest: "Soumission de la demande de retrait...",
        requestSubmitted: "Demande de retrait soumise",
      },
      tx: {
        label: "Tx : ",
        link: "Voir sur l'explorateur",
      },
      helper: {
        available: "Montant disponible : {value}",
      },
      errors: {
        missingContract: "Saisissez l'adresse du contrat OnlyFHEn",
        missingAmount: "Saisissez un montant",
      },
      savedCreators: {
        title: "Créateurs enregistrés",
        empty: "Aucun créateur enregistré.",
        select: "Sélectionner",
      },
      creatorsDropdown: {
        search: "Rechercher des créateurs",
        noResults: "Aucun créateur correspondant",
        choose: "Choisir un créateur",
      },
    },
    balance: {
      title: "Déchiffrer le solde",
      description: "Récupérez et déchiffrez votre solde chiffré",
      fields: {
        contract: "Adresse du contrat OnlyFHEn",
        creator: "Adresse du créateur (optionnel)",
      },
      placeholders: {
        contract: "0x...",
        creator: "Par défaut : votre wallet",
      },
      button: "Consulter mon solde",
      status: {
        fetching: "Récupération du solde chiffré…",
        localDecrypt: "Demande de déchiffrement local…",
        prepare: "Préparation du déchiffrement utilisateur…",
        sign: "Signez la demande pour autoriser le déchiffrement…",
        submit: "Envoi de la demande de déchiffrement…",
        success: "Solde déchiffré.",
        error: "Échec du déchiffrement du solde.",
      },
      loading: {
        fetchingBalance: "Récupération du solde chiffré...",
        balanceRetrieved: "Solde chiffré récupéré",
        decryptingLocally: "Déchiffrement local du solde...",
        preparingRequest: "Préparation de la demande de déchiffrement...",
        requestPrepared: "Demande préparée",
        waitingSignature: "En attente de la signature...",
        requestSigned: "Demande signée",
        decryptingBalance: "Déchiffrement du solde...",
        decryptionSuccess: "Solde déchiffré avec succès",
      },
      decryptedLabel: "Solde déchiffré : {value}",
      errors: {
        missingContract: "Saisissez l'adresse du contrat OnlyFHEn",
      },
    },
    mint: {
      title: "Obtenir des jetons confidentiels",
      description: "Dev uniquement — mint sur votre adresse",
      fields: {
        token: "Adresse du jeton",
        amount: "Montant ",
      },
      placeholders: {
        token: "0x...",
        amount: "ex: 1000",
      },
      button: "Minter",
      status: {
        pending: "Mint en cours… confirmez dans votre wallet.",
        success: "Mint réussi.",
        error: "Échec du mint.",
      },
      noteSepolia:
        "Note : sur Sepolia, le mint peut être restreint selon le contrat déployé.",
      tx: {
        label: "Tx : ",
        link: "Voir sur l'explorateur",
      },
      errors: {
        missingToken: "Saisissez l'adresse du jeton",
        missingAmount: "Saisissez un montant",
      },
    },
    localFHE: {
      command: "bun run local-fhe",
      active: "Serveur FHE local actif",
      activeWithNetwork: "Serveur FHE local actif ({network})",
      inactive: "Serveur FHE local indisponible. Lancez : {command}",
    },
  },
};

const I18nContext = createContext<
  | {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
  }
  | undefined
>(undefined);

const STORAGE_KEY = "onlyfhen:lang";

function resolvePreferredLanguage(stored: string | null): Language {
  if (stored === "en" || stored === "fr") return stored;
  if (typeof window !== "undefined") {
    const nav = window.navigator?.language?.toLowerCase();
    if (nav?.startsWith("fr")) return "fr";
  }
  return "en";
}

function getValue(dict: TranslationDict, key: string) {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as TranslationDict)) {
      return (acc as TranslationDict)[part];
    }
    return undefined;
  }, dict);
}

function format(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [key, value]) =>
      acc.replace(new RegExp(`{${key}}`, "g"), String(value)),
    template,
  );
}

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return resolvePreferredLanguage(stored);
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const resolved = resolvePreferredLanguage(stored);
        if (mounted) {
          setLanguageState(resolved);
        }
      } catch (error) {
        console.error("Failed to load language preference:", error);
      }
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template =
        (getValue(translations[language], key) as string | undefined) ??
        (getValue(translations.en, key) as string | undefined) ??
        key;
      if (typeof template !== "string") return key;
      return format(template, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translate,
    }),
    [language, setLanguage, translate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx)
    throw new Error("useTranslation must be used within TranslationProvider");
  return ctx;
}

export const availableLanguages: Language[] = ["en", "fr"];
