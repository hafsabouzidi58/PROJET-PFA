"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Download, ClipboardList, User, RefreshCw, Pencil, X, Inbox, Truck, DollarSign } from "lucide-react";
import * as XLSX from "xlsx";

export default function ListeArrivages() {
  const { data: session } = useSession();
  const [arrivages, setArrivages] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreDate, setFiltreDate] = useState("");

  // --- ÉTATS POUR LE MODAL DE CORRECTION ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArrivageId, setSelectedArrivageId] = useState<number | null>(null);
  const [editProduitId, setEditProduitId] = useState("");
  const [editFournisseurId, setEditFournisseurId] = useState("");
  const [editQuantite, setEditQuantite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const roleUtilisateur = (session?.user as any)?.role || "SAISIE";
  const idUtilisateur = parseInt((session?.user as any)?.id || "0");
  
  const estAdminOuManager = roleUtilisateur === "ADMIN" || roleUtilisateur === "MANAGER";

  // Charger toutes les données nécessaires
// Remplace ta fonction loadInitialData par celle-ci dans ton composant :
const loadInitialData = async () => {
  setLoading(true);
  try {
    const [resArr, resProd, resFourn] = await Promise.all([
      fetch("/api/arrivages"),
      fetch("/api/products"),
      fetch("/api/fournisseurs")
    ]);

    if (resArr.ok) {
      const dataArr = await resArr.json();
      setArrivages(Array.isArray(dataArr) ? dataArr : []);
    } else {
      console.error("Erreur arrivages:", resArr.status);
    }

    if (resProd.ok) {
      const dataProd = await resProd.json();
      setProduits(Array.isArray(dataProd) ? dataProd : []);
    }

    if (resFourn.ok) {
      const dataFourn = await resFourn.json();
      setFournisseurs(Array.isArray(dataFourn) ? dataFourn : []);
    }
  } catch (err) {
    console.error("Erreur de chargement", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (session) loadInitialData();
  }, [session]);

  // 🟢 FILTRAGE PAR DATE REINTEGRE
  const donneesFiltrees = arrivages.filter((item) => {
    if (!filtreDate) return true;
    return new Date(item.dateArrivee).toISOString().split("T")[0] === filtreDate;
  });

  // 🟢 EXPORT EXCEL REINTEGRE
 // 🟢 EXPORT EXCEL CORRIGÉ (Un seul X !)
  const exporterVersExcel = () => {
    const donneesExcel = donneesFiltrees.map((item) => ({
      Référence: `#${item.id}`,
      "Date Réception": new Date(item.dateArrivee).toLocaleDateString("fr-FR"),
      Produit: item.produit?.nom || "Inconnu",
      Quantité: item.quantiteRecue,
      Fournisseur: item.fournisseur?.nom || "Inconnu",
      Opérateur: `${item.agent?.prenom || ""} ${item.agent?.nom || ""}`.trim() || "N/A",
    }));

    const feuille = XLSX.utils.json_to_sheet(donneesExcel);
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Arrivages");
    XLSX.writeFile(classeur, `Registre_Arrivages_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // 🟢 Déclencheur du Modal sans alerte
  const lancerLaFenetreCorrection = (arrivage: any) => {
    setSelectedArrivageId(arrivage.id);
    setEditProduitId(arrivage.produitId.toString());
    setEditFournisseurId(arrivage.fournisseurId.toString());
    setEditQuantite(arrivage.quantiteRecue.toString());
    setIsModalOpen(true); 
  };

  // 🟢 Envoi de la mise à jour (PUT)
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
        loadInitialData(); 
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

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans relative">
      
      {/* HEADER BAR AVEC EXPORT ET FILTRE DATE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <ClipboardList className="text-blue-600" size={32} /> Registre des Arrivages
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Barre de filtrage par date */}
          <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Calendar className="text-gray-400 mr-2" size={16} />
            <input
              type="date"
              value={filtreDate}
              onChange={(e) => setFiltreDate(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase outline-none text-gray-700"
            />
            {filtreDate && (
              <button onClick={() => setFiltreDate("")} className="ml-2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bouton Export Excel */}
          <button
            onClick={exporterVersExcel}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </header>

      {/* TABLEAU */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider">
                <th className="p-4 text-center">Réf</th>
                <th className="p-4">Date Réception</th>
                <th className="p-4">Produit</th>
                <th className="p-4 text-center">Quantité Reçue</th>
                <th className="p-4">Fournisseur</th>
                {estAdminOuManager && <th className="p-4">Opérateur</th>}
                <th className="p-4 text-center">Action / Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 font-bold text-gray-400 uppercase italic">
                    <RefreshCw className="animate-spin inline mr-2" size={14} /> Chargement...
                  </td>
                </tr>
              ) : donneesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12 font-bold text-gray-400 uppercase italic">Aucun arrivage trouvé</td>
                </tr>
              ) : donneesFiltrees.map((item) => {
                
                // 🟢 SECURITE 15 MINUTES ET VERIFICATION AGENT REINTEGRES
                const tempsEcouleMinutes = (new Date().getTime() - new Date(item.dateArrivee).getTime()) / 1000 / 60;
                const peutEncoreCorriger = item.agentId === idUtilisateur && tempsEcouleMinutes <= 15;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors font-medium text-gray-700">
                    <td className="p-4 text-center font-bold text-blue-600">#{item.id}</td>
                    <td className="p-4">{new Date(item.dateArrivee).toLocaleDateString("fr-FR")}</td>
                    <td className="p-4 font-black text-gray-900">{item.produit?.nom?.toUpperCase()}</td>
                    <td className="p-4 text-center font-black text-blue-600">{item.quantiteRecue} u</td>
                    <td className="p-4 text-gray-500">{item.fournisseur?.nom?.toUpperCase()}</td>
                    
                    {estAdminOuManager && (
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold text-[10px] uppercase">
                          {item.agent?.prenom} {item.agent?.nom}
                        </span>
                      </td>
                    )}

                    <td className="p-4 text-center">
                      {estAdminOuManager ? (
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Lecture Seule</span>
                      ) : peutEncoreCorriger ? (
                        <button
                          type="button"
                          onClick={() => lancerLaFenetreCorrection(item)}
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-xl border border-blue-200/50 text-[11px] transition-all shadow-sm"
                        >
                          <Pencil size={12} /> Corriger
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 uppercase italic">Verrouillé</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL POP-UP DE CORRECTION ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight italic text-gray-900">Correction Arrivage #{selectedArrivageId}</h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">Modifier les valeurs erronées</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 bg-gray-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Formulaire interne */}
            <form onSubmit={soumettreCorrection} className="space-y-4">
              
              <div>
                <label className="text-[11px] font-black uppercase text-gray-400 block mb-1">Article</label>
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
                <label className="text-[11px] font-black uppercase text-gray-400 block mb-1">Fournisseur</label>
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
                <label className="text-[11px] font-black uppercase text-gray-400 block mb-1">Quantité</label>
                <input type="number" min="1" required value={editQuantite} onChange={(e) => setEditQuantite(e.target.value)} className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Barre d'actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                  {submitting ? "Sauvegarde..." : "Enregistrer les modifications"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}