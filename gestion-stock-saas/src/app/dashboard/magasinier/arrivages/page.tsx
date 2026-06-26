"use client";
import { useState, useEffect } from "react";
import { Package, CheckCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export default function ValidationArrivagePage() {
  const [attente, setAttente] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchArrivages = async () => {
    try {
      const res = await fetch("/api/approvisionnements");
      const data = await res.json();
      // On filtre pour ne garder que ceux en attente
      setAttente(data.filter((a: any) => a.etat === "EN_ATTENTE"));
    } catch (err) {
      console.error("Erreur fetch:", err);
    }
  };

  useEffect(() => { fetchArrivages(); }, []);

  const handleFinalValidate = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/approvisionnements/${id}`, { method: "PATCH" });
      if (res.ok) {
        alert("Succès : Le stock a été mis à jour et l'état est passé à 'TRAITÉ'");
        setSelectedId(null);
        fetchArrivages();
      }
    } catch (err) { 
      alert("Erreur lors de la validation"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="text-white" size={24} />
          </div>
          Vérification des Arrivages
        </h1>
        <p className="text-gray-500 font-medium mt-1">Espace Magasinier — Confirmez la réception des marchandises</p>
      </div>

      {/* Liste des Bons */}
      <div className="max-w-4xl mx-auto space-y-4">
        {attente.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center rounded-2xl shadow-sm">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-gray-600 font-bold">Tous les arrivages ont été traités !</p>
          </div>
        ) : (
          attente.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
              {/* Ligne principale */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-bold text-sm">
                    BON #{app.id}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase">{app.fournisseur?.nom}</h2>
                    <p className="text-xs text-gray-400 font-bold">DATE : {new Date(app.date_reception).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedId(selectedId === app.id ? null : app.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {selectedId === app.id ? <><ChevronUp size={18}/> Fermer</> : <><ChevronDown size={18}/> Détails</>}
                  </button>

                  {selectedId === app.id && (
                    <button 
                      disabled={loading}
                      onClick={() => handleFinalValidate(app.id)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                      {loading ? "Traitement..." : "Confirmer la Réception"}
                    </button>
                  )}
                </div>
              </div>

              {/* Détails déroulants */}
              {selectedId === app.id && (
                <div className="bg-gray-50 border-t border-gray-100 p-5">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Articles à vérifier :</h3>
                  <div className="grid gap-2">
                    {app.articles.map((art: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-700">{art.nom}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">Prévu:</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-black">{art.quantite}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 p-3 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Package size={14} />
                    Attention : En cliquant sur "Confirmer", vous incrémentez le stock réel de ces produits.
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}