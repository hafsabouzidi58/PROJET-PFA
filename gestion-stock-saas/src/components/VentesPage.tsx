"use client";

import { useState, useEffect } from "react";
import { 
  Search, ShoppingCart, Trash2, CheckCircle, 
  History, Package, ArrowRight 
} from "lucide-react";

export default function VentesPage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [panier, setPanier] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [resP, resH] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/sales")
    ]);
    if (resP.ok) setProduits(await resP.json());
    if (resH.ok) setHistorique(await resH.json());
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE PANIER ---
  const addToCart = (p: any) => {
    const existing = panier.find(item => item.produitId === p.id);
    if (existing) {
      setPanier(panier.map(item => 
        item.produitId === p.id ? { ...item, quantite: item.quantite + 1 } : item
      ));
    } else {
      setPanier([...panier, { produitId: p.id, nom: p.nom, prix: p.prixVente, quantite: 1 }]);
    }
  };

  const totalGlobal = panier.reduce((acc, item) => acc + (item.prix * item.quantite), 0);

  const validerVente = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: panier, total: totalGlobal }),
      });
      if (res.ok) {
        setPanier([]);
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrage pour la recherche
  const filteredProducts = produits.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION RECHERCHE ET PRODUITS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher un produit (nom, catégorie...)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:border-blue-500 outline-none font-bold transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantiteStock <= 0}
                className="bg-white p-5 rounded-2xl border-2 border-white shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left group disabled:opacity-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <Package className="text-blue-500 w-5 h-5" />
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">Stock: {p.quantiteStock}</span>
                </div>
                <h3 className="font-black text-gray-900 uppercase truncate">{p.nom}</h3>
                <p className="text-blue-600 font-black text-lg">{p.prixVente} DH</p>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION PANIER */}
        <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl h-fit sticky top-6">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <ShoppingCart className="text-blue-400" /> VOTRE PANIER
          </h2>
          
          <div className="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2 custom-scrollbar">
            {panier.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center group">
                <div>
                  <p className="font-bold text-sm uppercase">{item.nom}</p>
                  <p className="text-xs text-gray-500 font-black">{item.quantite} x {item.prix} DH</p>
                </div>
                <button onClick={() => setPanier(panier.filter((_, i) => i !== idx))} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {panier.length === 0 && <p className="text-center text-gray-600 py-4 font-bold italic">Panier vide</p>}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-gray-500 uppercase">Total Net</span>
              <span className="text-3xl font-black text-blue-400">{totalGlobal.toFixed(2)} DH</span>
            </div>
            <button 
              onClick={validerVente}
              disabled={loading || panier.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 disabled:bg-gray-800 disabled:text-gray-600"
            >
              {loading ? "EN COURS..." : "VALIDER LA VENTE"}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* HISTORIQUE DES VENTES */}
      <div className="space-y-4 pt-8">
        <h2 className="text-2xl font-black flex items-center gap-2 text-gray-900">
          <History className="text-blue-600" /> Historique des Transactions
        </h2>
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-black text-gray-400 uppercase">ID</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase">Date</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase">Articles</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historique.map((v) => (
                <tr key={v.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-black text-xs">#{v.id}</td>
                  <td className="p-4 text-xs font-bold text-gray-500">{new Date(v.date_vente).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {v.articles.map((art: any, i: number) => (
                        <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-black">{art.nom} x{art.quantite}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right font-black text-blue-600">{v.total.toFixed(2)} DH</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}