"use client";

import { useState, useEffect } from "react";
import { 
  Search, ShoppingCart, Trash2, CheckCircle, 
  Package, LogOut, User, Printer, X 
} from "lucide-react";

export default function VendeurPOS() {
  const [produits, setProduits] = useState<any[]>([]);
  const [panier, setPanier] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // État pour stocker les infos de la facture à afficher
  const [factureData, setFactureData] = useState<any | null>(null);

  // Chargement initial des produits disponibles en stock
  const fetchProduits = async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProduits(await res.json());
  };

  useEffect(() => { fetchProduits(); }, []);

  // Gestion du panier : ajout ou incrémentation
  const addToCart = (p: any) => {
    const existing = panier.find(item => item.produitId === p.id);
    if (existing) {
      if (existing.quantite < p.quantiteStock) {
        setPanier(panier.map(item => 
          item.produitId === p.id ? { ...item, quantite: item.quantite + 1 } : item
        ));
      }
    } else {
      setPanier([...panier, { 
        produitId: p.id, 
        nom: p.nom, 
        prix: p.prixVente, 
        quantite: 1 
      }]);
    }
  };

  const totalGlobal = panier.reduce((acc, item) => acc + (item.prix * item.quantite), 0);

  // Validation de la vente avec gestion des erreurs
  const validerVente = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: panier, total: totalGlobal }),
      });

      if (res.ok) {
        // 1. On stocke d'abord les données pour afficher la facture
        setFactureData({
          ticketId: Math.floor(100000 + Math.random() * 900000),
          date: new Date().toLocaleString(),
          articles: [...panier],
          total: totalGlobal
        });

        // 2. On nettoie le panier et recharge les stocks
        setPanier([]);
        await fetchProduits();
      } else {
        const errorText = await res.text();
        alert(`Erreur serveur (${res.status}): ${errorText || "Impossible de valider la vente"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion : le serveur API n'a pas répondu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = produits.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 relative">
      
      {/* SECTION GAUCHE : PRODUITS ET RECHERCHE */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden print:hidden">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Interface Vendeur</h1>
            <p className="text-xs font-bold text-gray-500 uppercase">Session Active : Poste de Caisse #1</p>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.quantiteStock <= 0}
              className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left border-2 border-transparent hover:border-blue-500 disabled:opacity-40 group"
            >
              <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <Package className="text-blue-600 group-hover:text-white w-5 h-5" />
              </div>
              <h3 className="font-black text-sm uppercase mb-1 truncate">{p.nom}</h3>
              <p className="text-blue-600 font-black text-lg mb-2">{p.prixVente} DH</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.quantiteStock < 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  STOCK: {p.quantiteStock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION DROITE : PANIER (DARK MODE) */}
      <div className="w-[400px] bg-gray-900 flex flex-col shadow-2xl print:hidden">
        <div className="p-8 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-6">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <ShoppingCart className="text-white w-6 h-6" />
            </div>
            <h2 className="text-white text-xl font-black uppercase tracking-tight">Panier Client</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {panier.map((item, idx) => (
              <div key={idx} className="bg-gray-800/50 p-4 rounded-2xl flex justify-between items-center group border border-transparent hover:border-gray-700 transition-all">
                <div>
                  <p className="text-white font-bold text-sm uppercase">{item.nom}</p>
                  <p className="text-blue-400 font-black text-xs">{item.quantite} x {item.prix} DH</p>
                </div>
                <button 
                  onClick={() => setPanier(panier.filter((_, i) => i !== idx))}
                  className="p-2 bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {panier.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-white">
                <ShoppingCart size={64} className="mb-4" />
                <p className="font-black uppercase italic">En attente d'articles...</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total à encaisser</p>
                <p className="text-4xl font-black text-white">{totalGlobal.toFixed(2)} <span className="text-sm text-blue-500">DH</span></p>
              </div>
            </div>

            <button 
              onClick={validerVente}
              disabled={loading || panier.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:bg-gray-800 disabled:text-gray-600"
            >
              {loading ? "ENCOURS..." : "PAYER MAINTENANT"}
              <CheckCircle size={24} />
            </button>
          </div>
        </div>

        {/* FOOTER UTILISATEUR */}
        <div className="p-6 bg-gray-950 flex items-center justify-between border-t border-gray-800">
           <div className="flex items-center gap-3">
              <div className="bg-gray-800 p-2 rounded-xl text-gray-400"><User size={20}/></div>
              <span className="text-white font-bold text-xs uppercase tracking-widest">hafsa hafsa</span>
           </div>
           <button className="text-gray-600 hover:text-white transition-colors"><LogOut size={20}/></button>
        </div>
      </div>

      {/* --- MODALE DE FACTURE (S'AFFICHE PAR-DESSUS TOUT EN FIXED) --- */}
      {factureData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white text-black p-6 rounded-3xl w-80 shadow-2xl flex flex-col border border-gray-200 print:shadow-none print:border-none print:w-full">
            
            {/* Header Facture */}
            <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-4 relative">
              <button 
                onClick={() => setFactureData(null)} 
                className="absolute -top-2 -right-2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 print:hidden"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">COREFLOW</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ticket de Caisse</p>
              <p className="text-[11px] font-bold text-gray-600 mt-2">N° : #{factureData.ticketId}</p>
              <p className="text-[10px] text-gray-400 font-medium">{factureData.date}</p>
            </div>

            {/* Liste des Articles */}
            <div className="py-4 space-y-3 border-b border-dashed border-gray-300 max-h-60 overflow-y-auto print:max-h-none">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                <span>Article</span>
                <span>Total</span>
              </div>
              {factureData.articles.map((art: any, index: number) => (
                <div key={index} className="flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold uppercase text-gray-800">{art.nom}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{art.quantite} x {art.prix.toFixed(2)} DH</p>
                  </div>
                  <span className="font-black text-gray-900">{(art.prix * art.quantite).toFixed(2)} DH</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">TOTAL</span>
                <span className="text-2xl font-black text-blue-600">{factureData.total.toFixed(2)} DH</span>
              </div>

              <div className="bg-gray-50 p-2 text-center text-[10px] font-bold text-gray-400 rounded-lg print:hidden">
                Merci de votre confiance !
              </div>

              <button 
                onClick={handlePrint}
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 tracking-wider transition-all print:hidden"
              >
                <Printer size={16} /> Imprimer le ticket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}