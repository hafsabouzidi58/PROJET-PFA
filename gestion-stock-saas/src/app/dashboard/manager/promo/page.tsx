"use client";

import { useState, useEffect } from "react";
import { 
  Folder, Package, Percent, Clock, 
  ChevronRight, AlertCircle, CheckCircle, Search 
} from "lucide-react";
import './products.css'; // Import du CSS partagé

interface Product {
  id: number;
  nom: string;
  description: string;
  prixAchat: number;
  prixVente: number;
  image: string;
  quantiteStock: number;
  categorieId: number;
  fournisseurId: number;
  categorie?: { nom: string };
  fournisseur?: { nom: string };
  enPromotion?: boolean;
  dateFinPromo?: string;
  prixPromotionnel?: number;
}

export default function ManagerCategoriesPromo() {
  const [categories, setCategories] = useState<any[]>([]);
  const [produits, setProduits] = useState<Product[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedProductForPromo, setSelectedProductForPromo] = useState<Product | null>(null);
  const [tauxPromo, setTauxPromo] = useState<number>(10);
  const [dureeJours, setDureeJours] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const resCat = await fetch("/api/categories");
      if (resCat.ok) setCategories(await resCat.json());

      const resProd = await fetch("/api/products");
      if (resProd.ok) {
        const productsData = await resProd.json();
        console.log("Produits chargés:", productsData); // Debug
        setProduits(productsData);
      }
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const produitsFiltres = produits.filter(p => {
    const matchesCategory = selectedCategorie ? p.categorieId === selectedCategorie.id : true;
    const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const appliquerPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForPromo) return;

    setLoading(true);
    setMessage(null);

    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + dureeJours);

    try {
      const rabais = (selectedProductForPromo.prixVente * tauxPromo) / 100;
      const nouveauPrixPromo = selectedProductForPromo.prixVente - rabais;

      const res = await fetch(`/api/products/${selectedProductForPromo.id}/promo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prixPromotionnel: nouveauPrixPromo,
          dateFinPromo: dateExpiration.toISOString(),
          enPromotion: true
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Promotion de ${tauxPromo}% appliquée avec succès !` });
        setSelectedProductForPromo(null);
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de l'application de la promotion." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur réseau ou serveur inaccessible." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* COLONNE GAUCHE : LISTE DES CATÉGORIES */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col p-6 overflow-hidden">
        <div className="mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Folder className="text-blue-600" size={22} /> Catégories
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase mt-1">Sélectionnez pour voir les stocks</p>
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

      {/* COLONNE DROITE : GRILLE DES PRODUITS */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight italic">
              {selectedCategorie ? selectedCategorie.nom : "Tous les produits"}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">
              {selectedCategorie ? selectedCategorie.description || "Aucune description" : "Vue globale du stock manager"}
            </p>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher dans cette catégorie..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 font-bold text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* GRILLE DES PRODUITS AVEC IMAGES */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
          {produitsFiltres.map((p) => {
            const aUnePromoActive = p.enPromotion && p.dateFinPromo && new Date(p.dateFinPromo) > new Date();
            const isLowStock = p.quantiteStock <= 5;

            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                {/* Image du produit */}
                <div className="relative h-40 bg-gray-100">
                  {p.image ? (
                    <img 
                      src={p.image} 
                      alt={p.nom} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={48} />
                    </div>
                  )}
                  
                  {aUnePromoActive && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Clock size={10} /> PROMO
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                      isLowStock ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {isLowStock ? '⚠ Stock bas' : '✓ Stock OK'}
                    </span>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-sm uppercase tracking-tight truncate flex-1">
                      {p.nom}
                    </h3>
                    <button
                      onClick={() => setSelectedProductForPromo(p)}
                      className="ml-2 p-1.5 bg-gray-100 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                      title="Appliquer une promotion"
                    >
                      <Percent size={14} className="text-gray-600 group-hover:text-blue-600" />
                    </button>
                  </div>

                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase self-start">
                    {p.categorie?.nom || 'Non catégorisé'}
                  </span>
                  
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prix</p>
                      <p className="text-lg font-black text-gray-900">
                        {aUnePromoActive && p.prixPromotionnel ? (
                          <>
                            <span className="text-amber-500">{p.prixPromotionnel.toFixed(2)}</span>
                            <span className="text-xs text-gray-400 line-through ml-2">{p.prixVente.toFixed(2)} DH</span>
                          </>
                        ) : (
                          <>
                            {p.prixVente.toFixed(2)} <span className="text-xs font-bold text-gray-500">DH</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stock</p>
                      <p className={`text-xs font-bold ${isLowStock ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.quantiteStock} unité{p.quantiteStock > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {aUnePromoActive && p.dateFinPromo && (
                    <div className="mt-1 text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded-lg text-center">
                      ⏱️ Jusqu'au {new Date(p.dateFinPromo).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {produitsFiltres.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
              <Package size={48} className="mb-2 opacity-40" />
              <p className="font-black uppercase text-sm italic">Aucun produit trouvé</p>
              <p className="text-xs mt-1">Essayez de modifier votre recherche</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALE PROMOTION */}
      {selectedProductForPromo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Appliquer une Promotion</h3>
                <p className="text-xs text-blue-600 font-bold uppercase mt-0.5 truncate max-w-[280px]">
                  Produit : {selectedProductForPromo.nom}
                </p>
              </div>
              <button 
                onClick={() => setSelectedProductForPromo(null)}
                className="text-gray-400 hover:text-gray-900 font-bold uppercase text-xs tracking-wider"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={appliquerPromotion} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">Pourcentage de Remise (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="number" 
                    min="1" 
                    max="99"
                    required
                    value={tauxPromo}
                    onChange={(e) => setTauxPromo(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-12 pr-4 rounded-2xl font-black text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 block">Durée de Validité (Jours)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="number" 
                    min="1" 
                    required
                    value={dureeJours}
                    onChange={(e) => setDureeJours(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-12 pr-4 rounded-2xl font-black text-base focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: 15"
                  />
                </div>
                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg mt-1">
                  💡 Après {dureeJours} jours, le produit reprendra son prix normal
                </p>
              </div>

              <div className="bg-gray-900 text-white p-4 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
                  <span>Prix d'origine :</span>
                  <span>{selectedProductForPromo.prixVente.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between text-xs text-red-400 font-bold uppercase">
                  <span>Économie client :</span>
                  <span>- {((selectedProductForPromo.prixVente * tauxPromo) / 100).toFixed(2)} DH</span>
                </div>
                <div className="border-t border-gray-800 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-400">Nouveau prix :</span>
                  <span className="text-xl font-black text-blue-400">
                    {(selectedProductForPromo.prixVente - (selectedProductForPromo.prixVente * tauxPromo) / 100).toFixed(2)} DH
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {loading ? "Application en cours..." : "Valider et Activer la Promo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}