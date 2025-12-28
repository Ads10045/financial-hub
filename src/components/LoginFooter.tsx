import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

export default function LoginFooter() {
    return (
        <footer className="w-full">
            {/* Top Blue Border */}
            <div className="h-1 bg-ibm-blue w-full" />

            {/* Main Dark Content */}
            <div className="bg-[#2d2926] text-white py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 justify-between">

                    {/* Spacer / Logo Left - In original image it's empty space or alignment helper */}
                    <div className="hidden lg:block w-1/12"></div>

                    {/* Columns Wrapper */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">

                        {/* Col 1: Sites du groupe */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-xs border-l-4 border-ibm-blue pl-3">
                                Sites du groupe
                            </h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Entreprises <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Professionnels <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">IBM <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Trouver une agence <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Cartes commerciales <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                            </ul>
                        </div>

                        {/* Col 2: En savoir plus */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-xs border-l-4 border-ibm-blue pl-3">
                                En savoir plus
                            </h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Fonds de Garantie des Dépôts.. <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Réglementation Loi Eckert <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Demande de résiliation <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Accessibilité : non conforme <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                                <li><a href="#" className="hover:text-white flex items-center gap-1 group">Schéma Pluriannuel.. <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span></a></li>
                            </ul>
                        </div>

                        {/* Col 3: Assistance */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-xs border-l-4 border-ibm-blue pl-3">
                                Assistance
                            </h4>
                            <div className="text-gray-400 space-y-2">
                                <p>Problème de connexion ? Mot de passe perdu ?</p>
                                <p>Contactez l'Assistance Digitale Entreprise :</p>
                            </div>

                            {/* Phone Box */}
                            <div className="rounded-lg overflow-hidden max-w-[280px]">
                                <div className="bg-ibm-blue text-white p-3 text-center">
                                    <div className="text-xl font-bold">+33 1 60 94 26 68</div>
                                </div>
                                <div className="bg-white text-gray-800 p-3 text-xs text-center">
                                    <p className="font-semibold">(Service gratuit + prix appel)</p>
                                    <p className="text-gray-500 mt-1">Du lundi au vendredi de 8h à 18h</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Legal Bar */}
            <div className="bg-white border-t border-gray-200 py-4 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {/* Simple Logo Placeholder or Text */}
                        <div className="flex items-center gap-2 text-ibm-blue font-bold text-lg">
                            <div className="w-8 h-8 bg-ibm-blue rounded flex items-center justify-center text-white">★</div>
                            IBM
                        </div>
                        <div className="h-4 w-px bg-gray-300 mx-2 hidden md:block"></div>
                        <span className="text-xs text-gray-500 italic hidden md:block">Smart Solutions for Banking</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-[10px] md:text-xs text-gray-500 font-medium">
                        <a href="#" className="hover:underline">Protection des données personnelles</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:underline">Mentions légales</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:underline">Politique cookies</a>
                        <span className="hidden md:inline">|</span>
                        <span>© IBM 2025</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
