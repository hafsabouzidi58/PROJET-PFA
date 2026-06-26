"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Calendar, Download, RefreshCw, X, User, 
  DollarSign, ShoppingBag, BarChart3, TrendingUp, Award, 
  Layers, PieChart, BarChart, Users 
} from "lucide-react";
import * as XLSX from "xlsx";

export default function GestionFactures() {
  const { data: session } = useSession();
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreDate, setFiltreDate] = useState("");

  const roleUtilisateur = (session?.user as any)?.role || "SAISIE";
  const estAdminOuManager = roleUtilisateur === "ADMIN" || roleUtilisateur === "MANAGER";

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

  useEffect(() => {
    if (session) {
      chargerFactures(filtreDate);
    }
  }, [session, filtreDate]);

  // ==========================================
  // --- SYSTÈME ANALYTIQUE ET STRATIFICATION ---
  // ==========================================
  
  const chiffreAffairesTotal = factures.reduce((sum, item) => sum + (item.total || 0), 0);
  const nombreVentes = factures.length;
  const panierMoyen = nombreVentes > 0 ? chiffreAffairesTotal / nombreVentes : 0;
  
  const totalArticlesVendus = factures.reduce((sum, item) => {
    if (Array.isArray(item.articles)) {
      return sum + item.articles.reduce((aSum: number, art: any) => aSum + (art.quantite || 0), 0);
    }
    return sum;
  }, 0);

  // Graphique Vendeurs
  const statistiquesVendeurs = factures.reduce((acc: any, item) => {
    const nomVendeur = `${item.vendeur?.prenom || ""} ${item.vendeur?.nom || "Inconnu"}`.trim();
    if (!acc[nomVendeur]) {
      acc[nomVendeur] = { nom: nomVendeur, ca: 0, ventes: 0 };
    }
    acc[nomVendeur].ca += item.total || 0;
    acc[nomVendeur].ventes += 1;
    return acc;
  }, {});
  const topVendeurs = Object.values(statistiquesVendeurs).sort((a: any, b: any) => b.ca - a.ca);

  // Graphique Produits (Correction espace variable prixUnitaire incluse)
  const statistiquesProduits = factures.reduce((acc: any, item) => {
    if (Array.isArray(item.articles)) {
      item.articles.forEach((art: any) => {
        const nomProduit = art.nom || `Produit #${art.produitId}`;
        if (!acc[nomProduit]) {
          acc[nomProduit] = { nom: nomProduit, qte: 0, caGenere: 0 };
        }
        acc[nomProduit].qte += art.quantite || 0;
        acc[nomProduit].caGenere += (art.prixUnitaire || 0) * (art.quantite || 0);
      });
    }
    return acc;
  }, {});
  const topProduits = Object.values(statistiquesProduits).sort((a: any, b: any) => b.qte - a.qte).slice(0, 5);

  // Axe Chronologique
  const ventesParDate = factures.reduce((acc: any, item) => {
    const d = new Date(item.date || item.createdAt);
    const label = filtreDate 
      ? d.toLocaleTimeString("fr-FR", { hour: "2-digit" }) + "h"
      : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    acc[label] = (acc[label] || 0) + (item.total || 0);
    return acc;
  }, {});

  const donneesGraphiqueChrono = Object.entries(ventesParDate).map(([label, total]) => ({
    label,
    total: total as number
  })).reverse().slice(-6);

  // NOVEAU : Calcul des tranches de paniers pour le 4ème Graphique
  const tranchesPaniers = {
    "Petits paniers (< 100 DH)": 0,
    "Paniers Moyens (100 - 500 DH)": 0,
    "Grands paniers (500 - 1000 DH)": 0,
    "Paniers Premium (> 1000 DH)": 0,
  };

  factures.forEach((f) => {
    const t = f.total || 0;
    if (t < 100) tranchesPaniers["Petits paniers (< 100 DH)"]++;
    else if (t <= 500) tranchesPaniers["Paniers Moyens (100 - 500 DH)"]++;
    else if (t <= 1000) tranchesPaniers["Grands paniers (500 - 1000 DH)"]++;
    else tranchesPaniers["Paniers Premium (> 1000 DH)"]++;
  });

  const maxValeurChrono = Math.max(...donneesGraphiqueChrono.map(d => d.total), 1);
  const maxQteProduit = Math.max(...topProduits.map((p: any) => p.qte), 1);
  const maxCaVendeur = Math.max(...topVendeurs.map((v: any) => v.ca), 1);
  const maxVolumeTranche = Math.max(...Object.values(tranchesPaniers), 1);

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
    XLSX.writeFile(classeur, `Stats_Ventes_${filtreDate || "Global"}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} /> Visualisation Graphique & Analytique
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase mt-1">
            Indicateurs de performance basés sur le traitement de vos flux SQL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

          <button
            onClick={exporterVersExcel}
            disabled={factures.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Download size={14} /> Exporter Excel
          </button>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Chiffre d'affaires</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{chiffreAffairesTotal.toFixed(2)} DH</h3>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-2xl"><DollarSign size={24} /></div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Volume Transactions</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{nombreVentes} ord.</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><ShoppingBag size={24} /></div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Panier Moyen Émis</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{panierMoyen.toFixed(2)} DH</h3>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl"><TrendingUp size={24} /></div>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Articles Sortis</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{totalArticlesVendus} unités</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl"><Layers size={24} /></div>
        </div>
      </div>

      {/* BLOCS DE GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* GRAPHIQUE 1 : CHRONOLOGIQUE */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-tight text-gray-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" /> 
                
                
                 Tendance de l'Activité Financière
              </h3>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 uppercase">Axe CA</span>
            </div>

            {donneesGraphiqueChrono.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-xs font-bold uppercase">Aucun flux enregistré</div>
            ) : (
              <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-gray-100 px-2">
                {donneesGraphiqueChrono.map((data, index) => {
                  const pctHeight = (data.total / maxValeurChrono) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative justify-end h-full">
                      <div className="opacity-0 group-hover:opacity-100 bg-gray-900 text-white font-black text-[9px] px-2 py-1 rounded-lg absolute bottom-full mb-2 transition-all shadow-md z-10 whitespace-nowrap">
                        {data.total.toFixed(2)} DH
                      </div>
                      <div 
                        style={{ height: `${Math.max(pctHeight, 8)}%` }} 
                        className="w-full bg-gradient-to-t from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 rounded-t-xl transition-all shadow-sm"
                      ></div>
                      <span className="text-[9px] font-black uppercase text-gray-400 mt-2 text-center tracking-wider truncate max-w-full">
                        {data.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRAPHIQUE 2 : VOLUMES PRODUITS */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
              <BarChart size={16} className="text-amber-500" /> Volume unitaire par Produit
            </h3>
            
            <div className="space-y-4">
              {topProduits.length === 0 ? (
                <p className="text-xs italic text-gray-400">Aucune donnée de vente d'articles</p>
              ) : (
                topProduits.map((prod: any, idx) => {
                  const widthPct = (prod.qte / maxQteProduit) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-700 uppercase">
                        <span className="truncate max-w-[180px]">{prod.nom}</span>
                        <span className="font-black text-gray-900">{prod.qte} pcs</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${widthPct}%` }}
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* GRAPHIQUE 3 : PERFORMANCE VENDEURS */}
        {estAdminOuManager && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-1.5">
                <Users size={16} className="text-purple-600" /> Répartition du CA par Agent commercial / Vendeur
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topVendeurs.length === 0 ? (
                  <p className="text-xs italic text-gray-400 col-span-full">Aucun chiffre d'affaires rattaché</p>
                ) : (
                  topVendeurs.map((v: any, idx) => {
                    const ratioCa = (v.ca / (chiffreAffairesTotal || 1)) * 100;
                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-gray-800 uppercase truncate max-w-[160px]">{v.nom}</span>
                          <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            {ratioCa.toFixed(1)}% du CA
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                            <span>Chiffre Généré</span>
                            <span className="text-gray-900 font-black">{v.ca.toFixed(2)} DH</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${(v.ca / maxCaVendeur) * 100}%` }}
                              className="bg-purple-600 h-full rounded-full"
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          --- GRAPHIQUE 4 : REMPLACE L'ANCIEN TABLEAU HISTORIQUE ---
          ======================================================= */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 -mx-6 -mt-6 mb-6">
          <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
            <PieChart className="text-gray-700" size={16} />  Analyse de la Taille et Segmentation des Factures
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
            Répartition du volume total de transactions selon la valeur nette en DH de la facture
          </p>
        </div>

        {loading ? (
          <div className="text-center p-12 font-bold text-gray-400 uppercase italic">
            <RefreshCw className="animate-spin inline mr-2" size={14} /> Tri analytique des tranches...
          </div>
        ) : factures.length === 0 ? (
          <div className="text-center p-12 font-bold text-gray-400 uppercase italic">
            Aucune transaction enregistrée à analyser {filtreDate ? "pour cette date" : ""}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {Object.entries(tranchesPaniers).map(([nomTranche, volume], idx) => {
              const pctJauge = (volume / maxVolumeTranche) * 100;
              const pctGlobal = (volume / (nombreVentes || 1)) * 100;
              
              const gradients = [
                "from-emerald-500 to-teal-600",
                "from-blue-500 to-indigo-600",
                "from-amber-400 to-orange-500",
                "from-rose-500 to-red-600"
              ];

              return (
                <div key={idx} className="bg-gray-50/50 border border-gray-200/60 p-5 rounded-2xl flex flex-col justify-between group hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight max-w-[75%]">{nomTranche}</span>
                    <span className="text-xs font-black text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-xl shadow-sm">
                      {volume} fact.
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="w-full bg-gray-200/70 h-2.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.max(pctJauge, volume > 0 ? 5 : 0)}%` }}
                        className={`bg-gradient-to-r ${gradients[idx % gradients.length]} h-full rounded-full transition-all duration-500`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                      <span>Part relative</span>
                      <span className="text-gray-700 font-black">{pctGlobal.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}