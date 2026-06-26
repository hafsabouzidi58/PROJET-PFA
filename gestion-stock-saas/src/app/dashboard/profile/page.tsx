"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Mail, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export default function ProfilUtilisateur() {
  const { data: session, update } = useSession();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // États pour les notifications de retour
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pré-remplir les données au chargement de la session
  useEffect(() => {
    if (session?.user) {
      setNom((session.user as any).nom || "");
      setPrenom((session.user as any).prenom || "");
      setEmail(session.user?.email || "");
    }
  }, [session]);

  const soumettreProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, email, password })
      });

      const result = await res.json();

      if (res.ok) {
        setSuccessMsg("Profil mis à jour avec succès ! Certains changements nécessitent une reconnexion.");
        setPassword(""); // Vider le champ mot de passe après succès
        
        // Optionnel : Met à jour la session NextAuth côté client à la volée
        if (typeof update === "function") {
          await update({
            ...session,
            user: { ...session?.user, name: `${prenom} ${nom}`, email }
          });
        }
      } else {
        setErrorMsg(result.error || "Une erreur est survenue lors de la mise à jour.");
      }
    } catch (err) {
      setErrorMsg("Impossible de communiquer avec le serveur de sécurité.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      
      {/* HEADER DE LA PAGE */}
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
          <User className="text-blue-600" size={32} /> Mon Profil Personnel
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
          Gérer et modifier vos informations de connexion et d'identité
        </p>
      </header>

      {/* ZONE CENTRALE */}
      <div className="max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-sm p-6 md:p-8">
        
        {/* Messages d'alerte / Succès */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold uppercase">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-bold uppercase">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={soumettreProfil} className="space-y-6">
          
          {/* Section Identité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black uppercase text-gray-400 block mb-1.5">Prénom</label>
              <input 
                type="text" 
                required 
                value={prenom} 
                onChange={(e) => setPrenom(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-xl font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-gray-400 block mb-1.5">Nom de famille</label>
              <input 
                type="text" 
                required 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 py-3 px-4 rounded-xl font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
          </div>

          {/* Section Email */}
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400 block mb-1.5">Adresse Email Active</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
          </div>

          {/* Section Mot de passe sécurisé */}
          <div className="border-t border-gray-100 pt-6">
            <label className="text-[11px] font-black uppercase text-gray-400 block mb-1.5">Modifier le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="password" 
                placeholder="LAISSER VIDE POUR NE PAS CHANGER" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-[10px] placeholder:tracking-wider placeholder:font-black" 
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic font-medium">
              * Sécurité : Minimum 6 caractères si vous décidez d'actualiser votre mot de passe.
            </p>
          </div>

          {/* Bouton de Soumission */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading} 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> Sauvegarde...
                </>
              ) : (
                "Mettre à jour mon compte"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}