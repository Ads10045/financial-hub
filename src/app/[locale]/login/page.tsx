"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Smartphone, ShieldCheck, ArrowRight, CheckCircle2, QrCode, MessageSquare, Monitor, Mail } from "lucide-react"
import confetti from "canvas-confetti"
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from 'next-intl';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Cookies from "js-cookie"

import USERS_DATA from "@/data/users.json"
import LoginFooter from "@/components/LoginFooter"

// Mock Data Type
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    lastLogin: string;
}

const USERS: User[] = USERS_DATA;


export default function LoginPage() {
    const t = useTranslations('LoginPage');
    const locale = useLocale();
    const router = useRouter();
    const [step, setStep] = useState<"login" | "mfa" | "success">("login")
    const [mfaMethod, setMfaMethod] = useState<"app" | "sms" | "email">("app")
    const [loading, setLoading] = useState(false)
    const [secret, setSecret] = useState<string>("")
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [mfaError, setMfaError] = useState<boolean>(false)
    const [loginError, setLoginError] = useState<boolean>(false)
    const [smsSent, setSmsSent] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [loginTab, setLoginTab] = useState<"cle-digitale" | "password" | "sso" | "browser">("cle-digitale")
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [registerSuccess, setRegisterSuccess] = useState(false)
    const [browserLang, setBrowserLang] = useState<string>(locale)
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""))
    const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

    // Generate secret and session check
    useEffect(() => {
        // Check for existing session
        const session = Cookies.get("auth_token")
        if (session) {
            router.push(`/${locale}/dashboard`);
            return
        }
    }, [locale, router])

    // Helper: Mask phone
    const getMaskedPhone = (phone: string) => {
        if (!phone || phone.length < 4) return "** ** ** **";
        return `** ** ** ${phone.slice(-2)}`;
    }

    const handleLogin = async (e: React.FormEvent, method: "app" | "sms" | "email" = "app") => {
        e.preventDefault()
        setLoginError(false)
        setLoading(true)

        const subscriberInput = (document.querySelector('input[name="username"]') as HTMLInputElement)?.value;
        const passwordInput = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;

        // 1. SIMULATION / MOCK LOGIN
        const localUser = USERS.find(u => u.id === subscriberInput || u.email === subscriberInput);

        // A. DEMO USERS SCENARIO
        if (localUser && (localUser.id === "26626656" || localUser.id === "27727756")) {
            console.log("Using Mock/Demo Login for user", localUser.id);
            setTimeout(async () => {
                setLoading(false)
                setCurrentUser(localUser);

                // 1. Generate Secret Local (Option 1: Shared Secret)
                // This secret is used for BOTH App (QR Code) and Email (Server-generated TOTP)
                const newSecret = authenticator.generateSecret();
                setSecret(newSecret);

                // 2. Generate QRCode for App
                const otpauth = authenticator.keyuri(`Financial Hub: ${localUser.id}`, 'Financial Hub', newSecret);
                try {
                    const url = await QRCode.toDataURL(otpauth);
                    setQrCodeUrl(url);
                } catch (err) { console.error(err); }

                // 3. Generate CURRENT TOTP Token for Email
                // This ensures the email code matches what Google Auth displays at this moment
                authenticator.options = { window: 2 }; // Allow slight drift to account for email delay
                const currentToken = authenticator.generate(newSecret);
                console.log("Generated Unified TOTP Token:", currentToken);

                // Force layout to 'app' style (QR Code) but send email in background
                setMfaMethod("app");
                setStep("mfa");

                // 4. Send this specific TOTP code via email
                try {
                    const emailRes = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: localUser.email,
                            code: currentToken,
                            name: localUser.firstName
                        })
                    });

                    if (emailRes.ok) {
                        setEmailSent(true);
                    } else {
                        // Demo mode: continue even if email fails
                        setEmailSent(true);
                    }
                } catch (err) {
                    // Demo mode: continue even if email fails
                    setEmailSent(true);
                }
            }, 800);
            return;
        }

        // B. REAL / IBM LOGIN SCENARIO
        const usernameForIBM = localUser ? localUser.email : subscriberInput;
        try {
            const response = await fetch('/api/auth/ibm/direct-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameForIBM, password: passwordInput })
            });

            if (response.ok) {
                const ibmUser: User = {
                    id: subscriberInput,
                    firstName: localUser?.firstName || "Utilisateur",
                    lastName: localUser?.lastName || "IBM",
                    email: usernameForIBM,
                    phone: localUser?.phone || "06******",
                    role: "User",
                    status: "Active",
                    lastLogin: new Date().toISOString()
                };

                setCurrentUser(ibmUser);

                // 1. Generate Secret
                const newSecret = authenticator.generateSecret();
                setSecret(newSecret);

                // 2. Generate QR
                const otpauth = authenticator.keyuri(`Financial Hub: ${ibmUser.id}`, 'Financial Hub', newSecret);
                try {
                    const url = await QRCode.toDataURL(otpauth);
                    setQrCodeUrl(url);
                } catch (err) { console.error(err); }

                // 3. Generate Token
                authenticator.options = { window: 2 };
                const currentToken = authenticator.generate(newSecret);

                setMfaMethod("app");
                setLoading(false);
                setStep("mfa");

                // 4. Send Email
                try {
                    const emailRes = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: ibmUser.email,
                            code: currentToken,
                            name: ibmUser.firstName
                        })
                    });

                    if (emailRes.ok) {
                        setEmailSent(true);
                    }
                } catch (err) {
                    console.error("Email send failed", err);
                }
                return;
            }
        } catch (error) {
            console.error("IBM Direct Login Failed", error);
        }

        setLoading(false);
        setLoginError(true);
    }

    const handleIBMLogin = async () => {
        setLoading(true);
        setLoginError(false);
        const subscriberInput = (document.querySelector('input[name="username"]') as HTMLInputElement)?.value;

        // "Email ou Login" - Lookup logic
        const localUser = USERS.find(u => u.id === subscriberInput || u.email === subscriberInput);
        const usernameToSend = localUser ? localUser.email : subscriberInput;

        if (!usernameToSend) {
            setLoginError(true);
            setLoading(false);
            return;
        }

        try {
            // Verify with Backend (which checks IBM Cloud)
            const response = await fetch('/api/auth/ibm/direct-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameToSend, password: "" }) // Empty password triggers Verification Flow
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log("SSO Identification Verified by IBM:", data.user);
                const userId = localUser ? localUser.id : (data.user.id || usernameToSend);

                Cookies.set("auth_token", `ibm-direct-session-${userId}`, { expires: 1, path: '/' });

                // Success!
                setTimeout(() => {
                    router.push(`/${locale}/dashboard`);
                }, 500);
            } else {
                console.error("IBM Verification Failed:", data);
                setLoginError(true);
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoginError(true);
            setLoading(false);
        }
    }

    const handleMicrosoftLogin = () => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setStep("mfa")
        }, 1000)
    }

    const handleRegisterBrowser = async () => {
        setLoading(true)
        setRegisterSuccess(false)
        setLoginError(false)

        const subscriberInput = (document.querySelector('input[name="browser-username"]') as HTMLInputElement)?.value;
        const localUser = USERS.find(u => u.id === subscriberInput || u.email === subscriberInput);

        if (!localUser) {
            setLoading(false);
            setLoginError(true); // Re-using login error state for simplicity
            return;
        }

        try {
            // Mock Network Request
            setTimeout(() => {
                setRegisterSuccess(true);
                setLoading(false);

                // 1. Cookies (Persistent Auth & Locale) - 365 Days
                Cookies.set("auth_token", `persistent-session-${localUser.id}`, { expires: 365, path: '/' });
                Cookies.set("NEXT_LOCALE", browserLang, { expires: 365, path: '/' });

                // 2. LocalStorage (Theme & Preferences)
                localStorage.setItem("theme", "light"); // Defaulting to light for now, or could toggle
                localStorage.setItem("user_preferences", JSON.stringify({
                    lastUser: localUser.email,
                    version: "1.0.0",
                    language: browserLang
                }));

                // 3. SessionStorage (Session specific flags)
                sessionStorage.setItem("session_init", new Date().toISOString());
                sessionStorage.setItem("current_context", "secure_browser_flow");

                // Redirect after success animation
                setTimeout(() => {
                    router.push(`/${browserLang}/dashboard`);
                }, 1000);

            }, 800);
        } catch (error) {
            console.error(error);
            alert("Erreur réseau.");
            setLoading(false);
        }
    }

    const sendSmsCode = () => {
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setSmsSent(true)
            alert("Code SMS de simulation : 888888")
        }, 1500)
    }

    const handleMFA = (e: React.FormEvent) => {
        e.preventDefault()
        setMfaError(false)
        setLoading(true)

        const token = otpValues.join("");

        // Validation logic
        // We now primarily check against 'secret' which matches BOTH logic
        let isValid = false;

        // Ensure window is set for verification too
        authenticator.options = { window: 2 };
        isValid = authenticator.check(token, secret);

        // Fallback for hardcoded SMS demo if applicable, though we moved to Unified flow
        if (!isValid && mfaMethod === "sms" && token === "888888") {
            isValid = true;
        }

        setTimeout(() => {
            if (isValid) {
                setLoading(false)
                setStep("success")

                // Cookie Session : 10 seconds expiration
                const tenSeconds = new Date(new Date().getTime() + 10 * 1000);
                Cookies.set("auth_token", "valid-session", { expires: tenSeconds, path: '/' })

                // Cookie Language
                Cookies.set("NEXT_LOCALE", locale, { path: '/' });

                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#00915a', '#ffffff', '#f3f4f6'] // Green confetti
                })
                setTimeout(() => {
                    router.push(`/${locale}/dashboard`);
                }, 2500)
            } else {
                setLoading(false)
                setMfaError(true)
                setOtpValues(Array(6).fill(""))
                otpInputsRef.current[0]?.focus();
            }
        }, 800)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        let value = e.target.value;
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) {
            value = value.slice(-1);
        }
        const newOtp = [...otpValues];
        newOtp[index] = value;
        setOtpValues(newOtp);

        if (value && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!otpValues[index] && index > 0) {
                otpInputsRef.current[index - 1]?.focus();
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-ibm-blue rounded flex items-center justify-center text-white font-bold">
                        FH
                    </div>
                    <span className="text-xl font-bold text-ibm-blue-dark tracking-tight">Financial Hub</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:block text-sm font-medium text-gray-500">
                        Corporate Banking
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <a href="/fr/login" className="text-gray-900 hover:text-ibm-blue">FR</a>
                        <span className="text-gray-300">|</span>
                        <a href="/en/login" className="text-gray-500 hover:text-ibm-blue">EN</a>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 md:p-12 gap-8 items-start">

                {/* Left Column: Authentication */}
                <div className="w-full md:w-1/2 lg:w-5/12 space-y-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
                            <p className="text-gray-500">Sécurisez vos transactions avec notre portail dédié.</p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === "login" && (
                            <motion.div
                                key="login-step"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Tabs */}
                                    <div className="flex border-b border-gray-100 overflow-x-auto">
                                        <button
                                            onClick={() => setLoginTab("cle-digitale")}
                                            className={cn("flex-1 py-4 px-2 min-w-[80px] text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap", loginTab === "cle-digitale" ? "text-ibm-blue border-b-2 border-ibm-blue bg-green-50/50" : "text-gray-400 hover:text-gray-600 border-transparent")}
                                        >
                                            <Smartphone className="w-5 h-5 mx-auto mb-1" />
                                            Clé Digitale
                                        </button>
                                        <button
                                            onClick={() => setLoginTab("password")}
                                            className={cn("flex-1 py-4 px-2 min-w-[80px] text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap", loginTab === "password" ? "text-ibm-blue border-b-2 border-ibm-blue bg-green-50/50" : "text-gray-400 hover:text-gray-600 border-transparent")}
                                        >
                                            <Lock className="w-5 h-5 mx-auto mb-1" />
                                            Identifiants
                                        </button>
                                        <button
                                            onClick={() => setLoginTab("browser")}
                                            className={cn("flex-1 py-4 px-2 min-w-[80px] text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap", loginTab === "browser" ? "text-ibm-blue border-b-2 border-ibm-blue bg-green-50/50" : "text-gray-400 hover:text-gray-600 border-transparent")}
                                        >
                                            <Monitor className="w-5 h-5 mx-auto mb-1" />
                                            Navigateur
                                        </button>
                                        <button
                                            onClick={() => setLoginTab("sso")}
                                            className={cn("flex-1 py-4 px-2 min-w-[80px] text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap", loginTab === "sso" ? "text-ibm-blue border-b-2 border-ibm-blue bg-green-50/50" : "text-gray-400 hover:text-gray-600 border-transparent")}
                                        >
                                            <ShieldCheck className="w-5 h-5 mx-auto mb-1" />
                                            SSO
                                        </button>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        {/* 1. CLE DIGITALE */}
                                        {loginTab === "cle-digitale" && (
                                            <form onSubmit={(e) => handleLogin(e, "app")} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Votre Numéro d'abonné</label>
                                                    <Input
                                                        name="username"
                                                        placeholder="numéro d'abonné"
                                                        className={cn("bg-gray-50", loginError && "border-red-500 focus-visible:ring-red-500")}
                                                    />
                                                    {loginError && (
                                                        <p className="text-xs text-red-500 font-medium">Identifiant incorrect.</p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full text-base font-semibold py-6 rounded-full shadow-lg shadow-green-900/10 hover:shadow-green-900/20 transition-all"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Connexion..." : t('connect')}
                                                </Button>
                                            </form>
                                        )}

                                        {/* 2. PASSWORD */}
                                        {loginTab === "password" && (
                                            <form onSubmit={(e) => handleLogin(e, "app")} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">{t('subscriberId')}</label>
                                                    <Input
                                                        name="username"
                                                        placeholder="Ex: 26626656 ou email@domaine.com"
                                                        className={cn("bg-gray-50", loginError && "border-red-500 focus-visible:ring-red-500")}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">{t('password')}</label>
                                                    <Input name="password" type="password" placeholder="Votre mot de passe" className="bg-gray-50" />
                                                </div>
                                                {loginError && (
                                                    <p className="text-xs text-red-500 font-medium">Identifiants incorrects.</p>
                                                )}
                                                <Button
                                                    type="submit"
                                                    className="w-full text-base font-semibold py-6 rounded-full shadow-lg shadow-green-900/10 hover:shadow-green-900/20 transition-all"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Connexion..." : t('connect')}
                                                </Button>
                                            </form>
                                        )}

                                        {/* 4. BROWSER */}
                                        {loginTab === "browser" && (
                                            <div className="flex flex-col items-center justify-center space-y-6 py-6">
                                                <div className="p-4 bg-green-50 rounded-full">
                                                    <Monitor className="w-12 h-12 text-ibm-blue" />
                                                </div>
                                                <div className="text-center space-y-2">
                                                    <h3 className="text-lg font-bold text-gray-900">Navigateur de confiance</h3>
                                                    <p className="text-sm text-gray-500">
                                                        Identifiez-vous une fois pour enregistrer ce navigateur.
                                                    </p>
                                                </div>

                                                <div className="w-full space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Votre Numéro d'abonné</label>
                                                    <Input
                                                        name="browser-username"
                                                        placeholder="Ex: 26626656"
                                                        className={cn("bg-gray-50", loginError && "border-red-500 focus-visible:ring-red-500")}
                                                    />
                                                    {loginError && (
                                                        <p className="text-xs text-red-500 font-medium">Identifiant incorrect.</p>
                                                    )}
                                                </div>

                                                <div className="w-full space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Langue préférée</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => setBrowserLang('fr')}
                                                            className={cn(
                                                                "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                                                                browserLang === 'fr'
                                                                    ? "border-ibm-blue bg-green-50 text-ibm-blue"
                                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                                            )}
                                                        >
                                                            🇫🇷 Français
                                                        </button>
                                                        <button
                                                            onClick={() => setBrowserLang('en')}
                                                            className={cn(
                                                                "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                                                                browserLang === 'en'
                                                                    ? "border-ibm-blue bg-green-50 text-ibm-blue"
                                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                                            )}
                                                        >
                                                            🇬🇧 English
                                                        </button>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleRegisterBrowser}
                                                    disabled={loading || registerSuccess}
                                                    className={cn(
                                                        "w-full text-base font-semibold py-6 rounded-full transition-all",
                                                        registerSuccess ? "bg-green-600 hover:bg-green-700" : ""
                                                    )}
                                                >
                                                    {loading ? "Enregistrement..." : registerSuccess ? "Navigateur Enregistré !" : "Enregistrer ce navigateur"}
                                                </Button>

                                                {registerSuccess && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center w-full flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Navigateur ajouté aux appareils de confiance.
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {/* 5. SSO / Cloud */}
                                        {loginTab === "sso" && (
                                            <div className="space-y-6">
                                                <div className="text-center space-y-2">
                                                    <h3 className="font-semibold text-gray-900">Connexion Unique</h3>
                                                    <p className="text-sm text-gray-500">Utilisez votre identifiant d'entreprise pour vous connecter.</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Identifiant Client / Email</label>
                                                        <Input
                                                            name="username"
                                                            placeholder="Ex: 26626656 ou email@domaine.com"
                                                            className={cn("bg-gray-50", loginError && "border-red-500 focus-visible:ring-red-500")}
                                                        />
                                                        {loginError && (
                                                            <p className="text-xs text-red-500 font-medium">Email introuvable dans l'annuaire Cloud.</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={handleIBMLogin}
                                                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all group"
                                                        >
                                                            <svg className="w-8 h-8 text-[#052FAD] mb-2" viewBox="0 0 32 32" fill="currentColor">
                                                                <path d="M4 2v4h24V2H4zm0 24h24v-4H4v4zm0-8h4v-4H4v4zm8 0h4v-4h-4v4zm8 0h8v-4h-8v4zm-8-8h4V6h-4v4zm8 0h8V6h-8v4zM4 6v4h4V6H4z" />
                                                            </svg>
                                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">IBM Cloud</span>
                                                        </button>

                                                        <button
                                                            onClick={handleMicrosoftLogin}
                                                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                                        >
                                                            <svg className="w-8 h-8 mb-2" viewBox="0 0 21 21">
                                                                <path fill="#f35325" d="M1 1h9v9H1z" />
                                                                <path fill="#81bc06" d="M11 1h9v9h-9z" />
                                                                <path fill="#05a6f0" d="M1 11h9v9H1z" />
                                                                <path fill="#ffba08" d="M11 11h9v9h-9z" />
                                                            </svg>
                                                            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">Azure AD</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        )}



                        {step === "mfa" && (
                            <motion.div
                                key="mfa-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6 text-center">
                                    <div className="flex justify-center space-x-2 bg-gray-100 p-1 rounded-lg mb-6">
                                        <div className="w-full text-center text-sm font-bold text-gray-700 py-2">
                                            {/* Unified Header */}
                                            Validation Sécurisée
                                        </div>
                                    </div>

                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                                        <div className="flex -space-x-2">
                                            <ShieldCheck className="w-8 h-8 z-10" />
                                            {emailSent && <Mail className="w-8 h-8 text-green-600 z-0 opacity-80" />}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold text-gray-900">Double Authentification</h2>

                                        <div className="text-sm text-gray-600 space-y-3 bg-green-50 p-4 rounded-lg text-left">
                                            <p className="flex items-start gap-2">
                                                <span className="font-bold text-green-700">1.</span>
                                                <span>
                                                    Utilisez le code de votre application <b>Google Authenticator</b>.
                                                </span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <span className="font-bold text-green-700">2.</span>
                                                <span>
                                                    OU utilisez le code envoyé par <b>Email</b> à {currentUser?.email || "votre adresse"}.
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-500 italic mt-2 border-t pt-2 border-green-100">
                                                * Le même code fonctionne pour les deux méthodes (Synchronisation Serveur).
                                            </p>
                                        </div>
                                    </div>

                                    {/* QR Code Display Logic */}
                                    {qrCodeUrl && (
                                        <div className="text-center space-y-2">
                                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Configuration App</p>
                                            <div className="flex justify-center p-2 bg-gray-50 rounded-lg border border-gray-100 mx-auto w-fit">
                                                <Image src={qrCodeUrl} alt="MFA QR Code" width={120} height={120} />
                                            </div>
                                            <p className="text-[10px] text-gray-400">Scannez ce QR code si vous n'avez pas encore configuré l'app.</p>
                                        </div>
                                    )}

                                    {/* Code Input (Shared) */}
                                    <form onSubmit={handleMFA} className="space-y-6">
                                        <div className="flex justify-center gap-2">
                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                <input
                                                    key={index}
                                                    ref={(el) => { otpInputsRef.current[index] = el }}
                                                    data-index={index}
                                                    name="otp"
                                                    type="text"
                                                    value={otpValues[index]}
                                                    maxLength={1}
                                                    onChange={(e) => handleInputChange(e, index)}
                                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                                    className={cn(
                                                        "w-12 h-14 border rounded-lg text-center text-2xl font-bold outline-none transition-all",
                                                        mfaError
                                                            ? "border-red-300 focus:ring-2 focus:ring-red-200 text-red-600 bg-red-50"
                                                            : "border-gray-300 focus:ring-2 focus:ring-ibm-blue focus:border-ibm-blue"
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {mfaError && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-500 text-sm font-medium"
                                            >
                                                Code incorrect Ou Expiré (30s).
                                            </motion.p>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full py-6 text-base"
                                            disabled={loading}
                                        >
                                            {loading ? "Vérification..." : "Valider"}
                                        </Button>

                                        {emailSent && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Logic to resend email would go here (new secret generation needed ideally)
                                                    alert("Pour des raisons de sécurité, veuillez recommencer la procédure pour un nouveau code.")
                                                }}
                                                className="text-xs text-ibm-blue hover:underline"
                                            >
                                                Je n'ai pas reçu l'email
                                            </button>
                                        )}
                                    </form>

                                    <button
                                        onClick={() => setStep("login")}
                                        className="text-sm text-gray-400 hover:text-gray-600"
                                    >
                                        Retour à la connexion
                                    </button>
                                </div>
                            </motion.div>
                        )}



                        {step === "success" && (
                            <motion.div
                                key="success-step"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", duration: 0.6 }}
                                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                            >
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Connexion Réussie</h2>
                                <p className="text-gray-600 text-lg">
                                    Redirection vers votre espace sécurisé...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Dynamic Content */}
                <div className="w-full md:w-1/2 lg:w-7/12 mt-8 md:mt-0">
                    <Card className="bg-white border-none shadow-xl overflow-hidden min-h-[500px] flex flex-col relative group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                        <Image
                            src="/images/bank_ad.png"
                            alt="Business Meeting"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute bottom-0 left-0 p-8 z-20 text-white space-y-4 max-w-lg">
                            <div className="inline-block px-3 py-1 bg-ibm-blue text-white text-xs font-bold rounded uppercase tracking-wider">
                                International
                            </div>
                            <h3 className="text-3xl font-bold leading-tight">
                                Importateurs : découvrez l'option UPAS !
                            </h3>
                            <p className="text-gray-200">
                                La clause UPAS insérée dans vos crédits documentaires vous permet d'optimiser les conditions de paiement de vos importations.
                            </p>
                            <Button className="bg-white text-ibm-blue hover:bg-gray-100 border-none mt-4 w-auto self-start px-6">
                                En savoir plus <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2">La prévoyance Dirigeant</h4>
                            <p className="text-sm text-gray-500">Protégez ce qui vous est cher avec nos solutions sur mesure.</p>
                        </Card>
                        <Card className="bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mb-4" />
                            <h4 className="font-bold text-gray-900 mb-2">Signature Électronique</h4>
                            <p className="text-sm text-gray-500">Facilitez-vous la vie avec la signature électronique sécurisée.</p>
                        </Card>
                    </div>
                </div>
            </main >
            <LoginFooter />
        </div >
    )
}
