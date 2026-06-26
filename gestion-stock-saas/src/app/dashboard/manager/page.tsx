"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Folder, Package, Clock, ChevronRight, 
  AlertCircle, Search, BellRing, BarChart3, TrendingDown 
} from "lucide-react";

// --- FONCTION AUDIO : Émet une alarme continue pendant une durée définie ---
const playExtendedAlertSound = (durationMs: number = 5000) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Intervalle pour répéter le bip toutes les 600ms
    const intervalId = setInterval(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, audioCtx.currentTime); // Fréquence d'alerte nette
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }, 600);

    // Arrêt complet après le délai
    setTimeout(() => {
      clearInterval(intervalId);
      audioCtx.close();
    }, durationMs);

  } catch (error) {
    console.warn("L'audio n'a pas pu se déclencher (politique autoplay) :", error);
  }
};

export default function ManagerDashboardStock() {
  const [categories, setCategories] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Éviter les répétitions de sonnerie intempestives
  const hasAlertedRef = useRef(false);

  // Chargement des données (Catégories + Produits)
  const fetchData = async () => {
    try {
      const resCat = await fetch("/api/categories");
      if (resCat.ok) setCategories(await resCat.json());

      const resProd = await fetch("/api/products");
      if (resProd.ok) setProduits(await resProd.json());
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DECLENCHEMENT ALARME SONORE (5 Secondes) ---
  useEffect(() => {
    if (produits.length > 0 && !hasAlertedRef.current) {
      const aDesRuptures = produits.some(p => p.quantiteStock <= (p.stockMinimum || 0));
      if (aDesRuptures) {
        playExtendedAlertSound(5000); 
        hasAlertedRef.current = true;
      }
    }
  }, [produits]);

  // --- STATISTIQUES GLOBALES POUR LE MANAGER ---
  const totalProduits = produits.length;
  const produitsEnRuptureGlobaux = produits.filter(p => p.quantiteStock <= (p.stockMinimum || 0));
  const totalQuantiteStock = produits.reduce((acc, p) => acc + p.quantiteStock, 0);

  // Filtrage des produits pour l'affichage dynamique de la grille
  const produitsFiltres = produits.filter(p => {
    const matchesCategory = selectedCategorie ? p.categorieId === selectedCategorie.id : true;
    const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* COLONNE GAUCHE : LISTE DES CATÉGORIES */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 overflow-hidden">
        <div className="mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Folder className="text-blue-600" size={22} /> Catégories
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Filtre par secteurs</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <button
            onClick={() => setSelectedCategorie(null)}
            className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all font-bold text-sm uppercase ${
              selectedCategorie === null 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-gray-50 hover:bg-gray-100 text-gray-700"
            }`}
          >
            <span>Tous les produits</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategorie === null ? "bg-white text-blue-600" : "bg-gray-200 text-gray-600"}`}>
              {produits.length}
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategorie(cat)}
              className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all font-bold text-sm uppercase text-left ${
                selectedCategorie?.id === cat.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span className="truncate max-w-[160px]">{cat.nom}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategorie?.id === cat.id ? "bg-white text-blue-600" : "bg-gray-200 text-gray-600"}`}>
                  {cat._count?.produits || 0}
                </span>
                <ChevronRight size={16} className={selectedCategorie?.id === cat.id ? "text-white" : "text-gray-400"} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* COLONNE DROITE : GRILLE DE VUE & BLOCS DE STATISTIQUES */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight italic flex items-center gap-2">
              <BarChart3 className="text-blue-600 w-8 h-8" />
              Statistiques & Suivi des Stocks
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">
              {selectedCategorie ? `Catégorie active : ${selectedCategorie.nom}` : "Analyse en temps réel de l'état général des dépôts"}
            </p>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher un article..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* --- BLOCS DE STATISTIQUES ANALYTIQUES --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Références</p>
              <h3 className="text-3xl font-black mt-1 text-gray-900">{totalProduits}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center p-3">
              <Package size={24} />
            </div>
          </div>

          <div className={`border p-5 rounded-3xl shadow-sm flex items-center justify-between transition-all ${
            produitsEnRuptureGlobaux.length > 0 
              ? 'bg-red-50 border-red-300 text-red-900 ring-2 ring-red-600/10' 
              : 'bg-white border-gray-200'
          }`}>
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-70">Produits en Rupture</p>
              <h3 className="text-3xl font-black mt-1">{produitsEnRuptureGlobaux.length}</h3>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center p-3 ${
              produitsEnRuptureGlobaux.length > 0 ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <TrendingDown size={24} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Volume de Stock Global</p>
              <h3 className="text-3xl font-black mt-1 text-gray-900">{totalQuantiteStock} <span className="text-sm font-bold text-gray-400">Unités</span></h3>
            </div>
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center p-3">
              <Clock size={24} />
            </div>
          </div>
        </div>

        {/* --- BANDEAU D'ALERTE SONORE ET LISTE DES ALERTE EN RUPTURE --- */}
        {produitsEnRuptureGlobaux.length > 0 && (
          <div className="bg-red-50 border-4 border-red-600 p-5 rounded-3xl shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] text-black mb-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-3 border-b border-red-200 pb-2">
              <BellRing className="text-red-600 animate-bounce" size={20} />
              <h2 className="text-sm font-black uppercase tracking-tight text-red-900">
                Alerte Stock Critique Actif (Vérification requise)
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
              {produitsEnRuptureGlobaux.map(p => (
                <div key={p.id} className="bg-white border border-red-200 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs font-bold shadow-sm">
                  <span className="text-gray-900 uppercase font-black">{p.nom}</span>
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-black">
                    Stock: {p.quantiteStock} / Seuil Min: {p.stockMinimum || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GRILLE DE VISUALISATION SIMPLE DES PRODUITS FILTRÉS AVEC IMAGES */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
          {produitsFiltres.map((p) => {
            const estEnRupture = p.quantiteStock <= (p.stockMinimum || 0);

            return (
              <div 
                key={p.id} 
                className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${
                  estEnRupture ? 'border-red-300 bg-red-50/10' : 'border-gray-200'
                }`}
              >
                {/* Image du produit */}
                <div className="relative h-36 bg-gray-100">
                  {p.image ? (
                    <img 
                      src={p.image} 
                      alt={p.nom} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={40} />
                    </div>
                  )}
                  
                  {/* Badge d'alerte sur l'image */}
                  {estEnRupture && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <AlertCircle size={10} /> Rupture
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                      estEnRupture ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {estEnRupture ? '⚠ Stock critique' : '✓ Stock OK'}
                    </span>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-black text-sm uppercase tracking-tight truncate">
                    {p.nom}
                  </h3>
                  
                  <div className="flex flex-col gap-1 items-start mt-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      estEnRupture ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Stock Physique : {p.quantiteStock}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase px-2">
                      Seuil d'alerte : {p.stockMinimum || 0}
                    </span>
                  </div>

                  {/* Prix du produit */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prix de vente</p>
                    <p className="text-lg font-black text-gray-900">
                      {p.prixVente?.toFixed(2) || '0.00'} <span className="text-xs font-bold text-gray-500">DH</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {produitsFiltres.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
              <Package size={48} className="mb-2 opacity-40" />
              <p className="font-black uppercase text-sm italic">Aucun article trouvé</p>
              <p className="text-xs mt-1">Essayez de modifier votre recherche ou votre filtre</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}