"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Package, CheckCircle, ChevronDown, ChevronUp, Loader2, 
  ClipboardList, RefreshCw, Pencil, X, Inbox, Truck, 
  AlertTriangle, ArrowRight, Activity 
} from "lucide-react";

export default function MagasinierDashboard() {
  const { data: session } = useSession();
  const [arrivages, setArrivages] = useState<any[]>([]);
  const [bonsAttente, setBonsAttente] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  
  // États de chargement et d'interface
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBonId, setSelectedBonId] = useState<number | null>(null);

  // États pour le modal de correction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArrivageId, setSelectedArrivageId] = useState<number | null>(null);
  const [editProduitId, setEditProduitId] = useState("");
  const [editFournisseurId, setEditFournisseurId] = useState("");
  const [editQuantite, setEditQuantite] = useState("");

  const idUtilisateur = parseInt((session?.user as any)?.id || "0");

  // Charger toutes les données du magasin de façon synchronisée
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resArr, resAppro, resProd, resFourn] = await Promise.all([
        fetch("/api/arrivages"),
        fetch("/api/approvisionnements"),
        fetch("/api/products"),
        fetch("/api/fournisseurs")
      ]);

      if (resArr.ok) setArrivages(await resArr.json());
      if (resAppro.ok) {
        const approData = await resAppro.json();
        // Filtrer uniquement les bons en attente de traitement physique
        setBonsAttente(approData.filter((a: any) => a.etat === "EN_ATTENTE"));
      }
      if (resProd.ok) setProduits(await resProd.json());
      if (resFourn.ok) setFournisseurs(await resFourn.json());
    } catch (err) {
      console.error("Erreur globale de chargement magasin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadDashboardData();
  }, [session]);

  // 🟢 Validation et mise à jour du stock réel d'un bon
  const handleFinalValidate = async (id: number) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approvisionnements/${id}`, { method: "PATCH" });
      if (res.ok) {
        setSelectedBonId(null);
        await loadDashboardData();
      } else {
        alert("Erreur lors de la validation du bon d'achat.");
      }
    } catch (err) {
      alert("Erreur de connexion avec le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🟢 Préparation du Modal de correction d'un arrivage
  const ouvrirModalCorrection = (arrivage: any) => {
    setSelectedArrivageId(arrivage.id);
    setEditProduitId(arrivage.produitId.toString());
    setEditFournisseurId(arrivage.fournisseurId.toString());
    setEditQuantite(arrivage.quantiteRecue.toString());
    setIsModalOpen(true);
  };

  // 🟢 Envoi de la correction de l'arrivage (Modif Quantité)
  const soumettreCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArrivageId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/arrivages/${selectedArrivageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produitId: editProduitId,
          fournisseurId: editFournisseurId,
          quantiteRecue: editQuantite
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || "Une erreur est survenue");
      }
    } catch (err) {
      alert("Erreur de connexion serveur");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculés à la volée
  const produitsCritiques = produits.filter((p: any) => p.quantiteStock <= 5);

  if (loading && arrivages.length === 0) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <p className="animate-bounce font-black text-blue-600 tracking-widest">CHARGEMENT ATELIER & STOCKS...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-gray-900 font-sans">
      
      {/* HEADER PRINCIPAL */}
      <div className="border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-blue-600" size={36} /> Panel Magasinier
          </h1>
          <p className="text-slate-600 font-bold mt-2 italic">Flux logistiques, réceptions d'usines et contrôles des stocks.</p>
        </div>
        <button onClick={loadDashboardData} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* BLOCS DE STATISTIQUES LOGISTIQUES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white">
          <div className="flex justify-between items-center mb-4">
            <div className="p-4 rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
              <Truck size={24} />
            </div>
            <span className="text-xs font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full uppercase">Attente</span>
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Livraisons à vérifier</p>
          <p className="text-4xl font-black text-black mt-2">{bonsAttente.length} Bons</p>
        </div>

        

   
      </div>

      {/* SECTION 1 : CONFIRMATION PHYSIQUE DES BONS EN ATTENTE */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-white">
        <h2 className="text-2xl font-black flex items-center gap-3 text-black uppercase mb-6">
          <Package className="text-blue-600" size={28} /> 1. Arrivages en attente de vérification
        </h2>
        
        <div className="space-y-4">
          {bonsAttente.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 text-center rounded-2xl">
              <CheckCircle className="mx-auto text-emerald-500 mb-3" size={36} />
              <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Aucun bon d'approvisionnement en attente</p>
            </div>
          ) : (
            bonsAttente.map((app) => (
              <div key={app.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all">
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase shadow-sm">
                      BON #{app.id}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base uppercase">{app.fournisseur?.nom}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase">Attendu le : {new Date(app.date_reception || app.dateArrivee).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => setSelectedBonId(selectedBonId === app.id ? null : app.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {selectedBonId === app.id ? <><ChevronUp size={14}/> Fermer</> : <><ChevronDown size={14}/> Voir Articles</>}
                    </button>

                    {selectedBonId === app.id && (
                      <button 
                        disabled={submitting}
                        onClick={() => handleFinalValidate(app.id)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>}
                        Confirmer Réception
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste déroulante des articles du bon */}
                {selectedBonId === app.id && (
                  <div className="bg-white border-t border-slate-200 p-4 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Quantités à compter sur palette :</p>
                    {app.articles?.map((art: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                        <span className="font-bold text-gray-800 text-xs uppercase">{art.nom || `Produit #${art.produitId}`}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Quantité :</span>
                          <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-md font-black text-xs">{art.quantite} u</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>



      {/* ================= MODAL DE CONFIGURATION ET CORRECTION DE QUANTITÉ ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight italic text-gray-900">Rectifier l'Arrivage #{selectedArrivageId}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Mise en conformité des stocks</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1.5 bg-gray-50 rounded-xl">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={soumettreCorrection} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Désignation du Produit</label>
                <div className="relative">
                  <Inbox className="absolute left-3 top-3 text-gray-400" size={16} />
                  <select required value={editProduitId} onChange={(e) => setEditProduitId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2.5 pl-10 pr-4 rounded-xl font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>{p.nom.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fournisseur Externe</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3 text-gray-400" size={16} />
                  <select required value={editFournisseurId} onChange={(e) => setEditFournisseurId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2.5 pl-10 pr-4 rounded-xl font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Quantité Réelle Décomptée</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={editQuantite} 
                  onChange={(e) => setEditQuantite(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-4 rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider">
                  Fermer
                </button>
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-50">
                  {submitting ? "Correction en cours..." : "Valider les Quantités"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}