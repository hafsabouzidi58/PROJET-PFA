// src/app/not-found.tsx
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-950 font-sans">
      <div className="text-center max-w-md space-y-6">
        
        {/* Illustration / Icône */}
        <div className="inline-flex p-6 bg-blue-50 text-blue-600 rounded-full animate-bounce">
          <FileQuestion size={48} />
        </div>

        {/* Textes d'erreur */}
        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tighter text-gray-900">404</h1>
          <h2 className="text-xl font-bold uppercase tracking-tight text-gray-800">
            Page introuvable
          </h2>
          <p className="text-sm font-medium text-gray-400">
            L'URL demandée n'existe pas ou a été déplacée. Vérifie l'adresse ou retourne au tableau de bord.
          </p>
        </div>



      </div>
    </div>
  );
}