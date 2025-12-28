"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import {
    CreditCard,
    LayoutDashboard,
    ArrowLeftRight,
    ArrowRight,
    PieChart,
    FileText,
    Settings,
    LogOut,
    Menu,
    Bell,
    Search,
    HelpCircle,
    ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

import USERS_DATA from "@/data/users.json"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<{ name: string, email: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        const checkSession = () => {
            const session = Cookies.get("auth_token")
            if (!session) {
                router.push("/login")
                return null
            }
            return session
        }

        // Initial check
        let session = checkSession()

        // Interval check every 1s
        const interval = setInterval(() => {
            checkSession()
        }, 1000)

        if (session) {
            let userId = "";
            if (session.startsWith("ibm-direct-session-")) {
                userId = session.replace("ibm-direct-session-", "");
            } else if (session === "valid-session") {
                userId = "26626656";
            }

            const foundUser = USERS_DATA.find((u: any) => u.id === userId || u.email === userId);
            if (foundUser) {
                setUser({
                    name: `${foundUser.firstName} ${foundUser.lastName}`,
                    email: foundUser.email
                });
            } else {
                setUser({ name: "Utilisateur", email: userId || "Invité" });
            }
        }

        return () => clearInterval(interval)
    }, [router])

    const handleLogout = () => {
        Cookies.remove("auth_token")
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-ibm-blue-dark text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50",
                    sidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="h-16 flex items-center px-4 border-b border-green-800">
                    <div className="bg-white text-ibm-blue font-bold p-1 rounded mr-3">FH</div>
                    {sidebarOpen && <span className="font-bold tracking-wide">MA BANQUE</span>}
                </div>

                <nav className="flex-1 py-6 space-y-1">
                    <NavLink icon={<LayoutDashboard />} label="Comptes" active isOpen={sidebarOpen} />
                    <NavLink icon={<ArrowLeftRight />} label="Opérations" isOpen={sidebarOpen} />
                    <NavLink icon={<CreditCard />} label="Cartes Corporate" isOpen={sidebarOpen} />
                    <NavLink icon={<PieChart />} label="Financements" isOpen={sidebarOpen} />
                    <NavLink icon={<FileText />} label="E-Documents" isOpen={sidebarOpen} />
                    <NavLink icon={<Settings />} label="Administration" isOpen={sidebarOpen} />
                </nav>

                <div className="p-4 border-t border-green-800 space-y-4">
                    {/* Language Toggle */}
                    <div className="flex items-center justify-center">
                        <div className="flex items-center bg-white rounded-full p-1 border border-green-800/30 shadow-sm">
                            <button className="flex items-center px-3 py-1 bg-ibm-blue text-white text-xs font-bold rounded-full transition-all">
                                <span className="mr-1">✓</span> FR
                            </button>
                            <button className="px-3 py-1 text-gray-500 text-xs font-bold hover:text-ibm-blue transition-colors">
                                EN
                            </button>
                        </div>
                    </div>


                </div>
            </aside>

            {/* Main Content */}
            <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="ml-4 flex items-center bg-gray-100 rounded-full px-4 py-1.5 border border-gray-200">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Rechercher..." className="bg-transparent border-none focus:outline-none ml-2 text-sm text-gray-600 w-48" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="flex items-center text-gray-500 hover:text-gray-700">
                            <HelpCircle className="w-5 h-5" />
                            <span className="hidden md:inline ml-2 text-sm">Assistance</span>
                        </button>

                        <div className="relative">
                            <Bell className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">6</span>
                        </div>

                        <div className="flex items-center text-sm font-medium text-gray-700 gap-2 cursor-pointer pl-4 border-l border-gray-200">
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user?.name ? user.name.charAt(0) : "U"}
                            </div>
                            <div className="hidden md:block text-right">
                                <div className="leading-none">{user?.name || "Mon Profil"}</div>
                                <div className="text-xs text-gray-400 font-normal">{user?.email || "Utilisateur"}</div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Déconnexion"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 md:p-8 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

function NavLink({ icon, label, isOpen, active = false }: { icon: any, label: string, isOpen: boolean, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center py-3 px-4 cursor-pointer border-l-4 transition-colors",
            active
                ? "border-ibm-blue bg-green-900/30 text-white"
                : "border-transparent text-green-100 hover:bg-green-800 hover:text-white"
        )}>
            <div className="w-6 h-6 flex items-center justify-center">
                {icon}
            </div>
            {isOpen && <span className="ml-3 text-sm font-medium whitespace-nowrap">{label}</span>}
            {isOpen && !active && <div className="flex-1" />}
            {isOpen && !active && <div className="text-green-400/50"><ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-50" /></div>}
        </div>
    )
}
