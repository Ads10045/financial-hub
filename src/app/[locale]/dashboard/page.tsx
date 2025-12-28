"use client"

import { useState } from "react"
import {
    X,
    Filter,
    Settings,
    Printer,
    Download,
    ChevronUp,
    MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
    const t = useTranslations('DashboardPage');
    const [showBanner, setShowBanner] = useState(true)

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <span>{t('home')}</span>
                <span className="mx-2">›</span>
                <span className="text-ibm-blue font-semibold">{t('accountList')}</span>
            </div>

            {/* Promo Banner */}
            {showBanner && (
                <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg text-white p-8 md:p-12">
                    <button
                        onClick={() => setShowBanner(false)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="relative z-10 max-w-2xl space-y-4">
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            {t('maBanque')}
                        </div>
                        <h2 className="text-3xl font-bold">{t('promoTitle')}</h2>
                        <p className="text-gray-300 max-w-lg">
                            {t('promoText')}
                        </p>
                        <Button className="mt-4 bg-ibm-blue hover:bg-green-600 border-none text-white">
                            {t('knowMore')}
                        </Button>
                    </div>

                    {/* Abstract decorative circles */}
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 bg-green-500 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>
            )}

            {/* Accounts List */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden bg-white">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50 rounded-full px-6">
                        {t('modifyGroup')}
                    </Button>

                    <div className="flex items-center gap-2">
                        <ToolButton icon={<Filter className="w-4 h-4" />} />
                        <ToolButton icon={<Settings className="w-4 h-4" />} />
                        <ToolButton icon={<Printer className="w-4 h-4" />} />
                        <ToolButton icon={<Download className="w-4 h-4" />} />
                    </div>
                </div>

                {/* Table Header */}
                <div className="bg-gray-50/50 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <div className="col-span-4">{t('labelNumber')}</div>
                    <div className="col-span-3 text-right">{t('balanceDate')}</div>
                    <div className="col-span-3 text-right">{t('futureBalance')}</div>
                    <div className="col-span-1 text-center">{t('currency')}</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-50">
                    {/* Group Header */}
                    <div className="p-4 bg-green-50/30 flex justify-between items-center text-sm font-semibold text-ibm-blue">
                        <span>{t('currentAccounts')} (1)</span>
                        <div className="flex items-center gap-8 pr-12">
                            <span className="text-gray-900">+ 23 358,97</span>
                            <span className="text-gray-900">+ 22 959,17</span>
                            <span className="text-gray-500">EUR</span>
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Row 1 */}
                    <AccountRow
                        name="Compte Principal Lib123"
                        iban="FR76 3000 4000 8300 0100 5528 163"
                        balance={-1621.33}
                        futureBalance={-1621.33}
                    />
                    <AccountRow
                        name="Compte Épargne Entreprise"
                        iban="FR76 3000 4030 9900 0122 3344 555"
                        balance={25430.50}
                        futureBalance={25430.50}
                    />
                    <AccountRow
                        name="Compte Carte Affaires"
                        iban="FR76 3000 4050 8800 0199 8877 666"
                        balance={-450.20}
                        futureBalance={-850.00}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-12 font-bold text-gray-800 pr-24">
                    <span>{t('totalBalance')} :</span>
                    <span className="text-gray-900">+ 23 358,97</span>
                    <span className="text-gray-900">+ 22 959,17</span>
                    <span>EUR</span>
                </div>
            </Card>

            <div className="flex justify-end">
                <button className="text-ibm-blue hover:underline text-sm font-medium flex items-center">
                    {t('topOfPage')} <div className="ml-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-ibm-blue"></div>
                </button>
            </div>
        </div>
    )
}

function AccountRow({ name, iban, balance, futureBalance }: { name: string, iban: string, balance: number, futureBalance: number }) {
    const isNegative = balance < 0

    return (
        <div className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors group">
            <div className="col-span-4">
                <div className="font-semibold text-gray-900">{name}</div>
                <div className="text-xs text-gray-400 font-mono mt-1">{iban}</div>
            </div>

            <div className={cn("col-span-3 text-right font-medium font-mono", isNegative ? "text-red-600" : "text-gray-900")}>
                {balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>

            <div className={cn("col-span-3 text-right font-medium font-mono", isNegative ? "text-red-600" : "text-gray-900")}>
                {futureBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
            </div>

            <div className="col-span-1 text-center text-gray-500 text-sm">EUR</div>

            <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-ibm-blue rounded-full border border-gray-200">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

function ToolButton({ icon }: { icon: any }) {
    return (
        <button className="p-2 text-ibm-blue hover:bg-green-50 rounded-full border border-green-200 transition-colors">
            {icon}
        </button>
    )
}

// Add variant/size support to Button if not present or just use className
// Mocking Button variant for this snippet if strict typing issues arise, but assuming the `Button` component created previously handles props.
