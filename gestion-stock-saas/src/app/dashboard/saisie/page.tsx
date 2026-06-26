"use client";

import { useState, useEffect } from "react";
import { PackagePlus, Truck, Inbox, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default function AgentSaisieArrivage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  
  // États du formulaire
  const [produitId, setProduitId] = useState("");
  const [fournisseurId, setFournisseurId] = useState("");
  const [quantiteRecue, setQuantiteRecue] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Charger la liste des produits et des fournisseurs existants pour les <select>
  useEffect(() => {
    async function loadData() {
      try {
        const [resProd, resFourn] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/fournisseurs") // Assure-toi d'avoir cette API pour tes fournisseurs
        ]);
        if (resProd.ok) setProduits(await resProd.json());
        if (resFourn.ok) setFournisseurs(await resFourn.json());
      } catch (err) {
        console.error("Erreur de chargement des listes", err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/arrivages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produitId,
          fournisseurId,
          quantiteRecue        }),
      });

      if (res.ok) {
        setStatus({ type: "success", text: "L'arrivage a bien été enregistré ! Le stock est mis à jour." });
        // Réinitialiser le formulaire
        setProduitId("");
        setFournisseurId("");
        setQuantiteRecue("");
      } else {
        const errData = await res.json();
        setStatus({ type: "error", text: errData.error || "Une erreur est survenue." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Impossible de joindre le serveur." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        
        {/* BANNER HEADER */}
        <div className="mb-8 text-center">
          <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackagePlus size={28} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight italic">Espace Saisie Arrivages</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
            Enregistrement des nouvelles marchandises reçues au dépôt
          </p>
        </div>

        {/* FEEDBACK STATUS TOAST */}
        {status && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 font-bold text-sm ${
            status.type === "success" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{status.text}</span>
          </div>
        )}

        {/* FORMULAIRE DE SAISIE */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Sélectionner le Produit */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block">Sélectionner l'article</label>
            <div className="relative">
              <Inbox className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <select
                required
                value={produitId}
                onChange={(e) => setProduitId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-12 pr-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-700"
              >
                <option value="">-- Choisissez un produit --</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom.toUpperCase()} (Stock actuel : {p.quantiteStock})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sélectionner le Fournisseur */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block">Fournisseur d'origine</label>
            <div className="relative">
              <Truck className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <select
                required
                value={fournisseurId}
                onChange={(e) => setFournisseurId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-12 pr-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-700"
              >
                <option value="">-- Choisissez le fournisseur --</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantité et Prix Achat alignés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Quantité Reçue */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 block">Quantité Reçue</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Ex: 50"
                value={quantiteRecue}
                onChange={(e) => setQuantiteRecue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 py-3.5 px-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>



          </div>

          {/* Validation */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
          >
            {loading ? "Enregistrement en cours..." : "Valider l'Entrée de Stock"}
          </button>

        </form>
      </div>
    </div>
  );
}