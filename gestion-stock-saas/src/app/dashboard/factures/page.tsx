"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Download, FileText, RefreshCw, X, User, DollarSign, ShoppingBag } from "lucide-react";
import * as XLSX from "xlsx";

export default function GestionFactures() {
  const { data: session } = useSession();
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreDate, setFiltreDate] = useState("");

  const roleUtilisateur = (session?.user as any)?.role || "SAISIE";
  const estAdminOuManager = roleUtilisateur === "ADMIN" || roleUtilisateur === "MANAGER";

  // Charger les factures depuis l'API (avec ou sans filtre date)
  const chargerFactures = async (date?: string) => {
    setLoading(true);
    try {
      const url = date ? `/api/sales?date=${date}` : `/api/sales`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFactures(data);
      } else {
        console.error("Erreur lors de la récupération des factures");
      }
    } catch (err) {
      console.error("Erreur réseau", err);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les données dès que la session est prête ou que la date change
  useEffect(() => {
    if (session) {
      chargerFactures(filtreDate);
    }
  }, [session, filtreDate]);

  // Calculer le chiffre d'affaires total de la liste affichée
  const chiffreAffairesTotal = factures.reduce((sum, item) => sum + (item.total || 0), 0);
  const nombreVentes = factures.length;

  // Fonction d'exportation vers Excel
  const exporterVersExcel = () => {
    if (factures.length === 0) return;

    const donneesExcel = factures.map((item) => ({
      "N° Facture": `#FA-${item.id}`,
      "Date de Vente": new Date(item.date || item.createdAt).toLocaleString("fr-FR"),
      "Nombre d'articles": Array.isArray(item.articles) ? item.articles.length : 0,
      "Total TTC (DH)": item.total,
      "Vendeur / Opérateur": `${item.vendeur?.prenom || ""} ${item.vendeur?.nom || "Inconnu"}`.trim(),
    }));

    const feuille = XLSX.utils.json_to_sheet(donneesExcel);
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Factures_Ventes");
    XLSX.writeFile(classeur, `Registre_Factures_${filtreDate || "Global"}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      
      {/* BARRE D'ENTÊTE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <FileText className="text-blue-600" size={32} /> Journal des Factures
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1">
            {estAdminOuManager ? "Vue Administrateur — Toutes les transactions" : "Mes ventes de la journée"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Calendrier de filtrage */}
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
            disabled={factures.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Download size={14} /> Exporter Excel
          </button>
        </div>
      </header>

      {/* CARTES DE STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chiffre d'affaires {filtreDate ? "du jour" : "global"}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{chiffreAffairesTotal.toFixed(2)} DH</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Volume des factures</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{nombreVentes} transaction(s)</h3>
          </div>
          <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>

      {/* TABLEAU DES FACTURES */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider">
                <th className="p-4 text-center">N° Facture</th>
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Détails Articles</th>
                {estAdminOuManager && <th className="p-4">Vendeur / Agent</th>}
                <th className="p-4 text-right">Total Payé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 font-bold text-gray-400 uppercase italic">
                    <RefreshCw className="animate-spin inline mr-2" size={14} /> Chargement du journal...
                  </td>
                </tr>
              ) : factures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 font-bold text-gray-400 uppercase italic">
                    Aucune facture enregistrée {filtreDate ? "pour cette date" : ""}
                  </td>
                </tr>
              ) : (
                factures.map((facture) => {
                  return (
                    <tr key={facture.id} className="hover:bg-gray-50/60 transition-colors font-medium text-gray-700">
                      {/* Numéro facture */}
                      <td className="p-4 text-center font-bold text-blue-600">
                        #FA-{facture.id}
                      </td>
                      
                      {/* Date de transaction */}
                      <td className="p-4 text-gray-600">
                        {new Date(facture.date || facture.createdAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Aperçu ou JSON des articles */}
                      <td className="p-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {Array.isArray(facture.articles) ? (
                            facture.articles.map((art: any, index: number) => (
                              <span key={index} className="text-gray-900 font-bold block">
                                • {art.nom || `Produit #${art.produitId}`} <span className="text-blue-600 font-black">x{art.quantite}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Détails indisponibles</span>
                          )}
                        </div>
                      </td>

                      {/* Vendeur (Colonne réservée Admin/Manager) */}
                      {estAdminOuManager && (
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase border border-gray-200/40">
                            <User size={10} className="text-gray-400" />
                            {facture.vendeur?.prenom || ""} {facture.vendeur?.nom || "Inconnu"}
                          </span>
                        </td>
                      )}

                      {/* Montant Total */}
                      <td className="p-4 text-right font-black text-sm text-gray-900">
                        {facture.total?.toFixed(2)} DH
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}