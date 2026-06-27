"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, ShoppingCart, Trash2, CheckCircle, 
  Edit3, Package, History, X 
} from "lucide-react";

export default function VentesPage() {
  const { data: session } = useSession();
  const [produits, setProduits] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [panier, setPanier] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchData = async () => {
    const [resP, resH] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/sales")
    ]);
    if (resP.ok) setProduits(await resP.json());
    if (resH.ok) setHistorique(await resH.json());
  };

  useEffect(() => { fetchData(); }, []);

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

  const handleSubmit = async () => {
    const rawId = (session?.user as any)?.id;
    
    if (!rawId) {
      alert("Erreur : Reconnectez-vous pour rafraîchir votre session.");
      return;
    }

    setLoading(true);
    try {
      const url = editId ? `/api/sales/${editId}` : "/api/sales";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: panier, 
          total: totalGlobal,
          vendeurId: parseInt(rawId) 
        }),
      });

      if (res.ok) {
        setPanier([]);
        setEditId(null);
        fetchData();
        alert(editId ? "Vente modifiée !" : "Vente enregistrée !");
      } else {
        const err = await res.json();
        alert("Erreur serveur : " + err.error);
      }
    } catch (error) {
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette vente ?")) return;
    const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleEdit = (vente: any) => {
    setEditId(vente.id);
    setPanier(vente.articles);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CATALOGUE PRODUITS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Correction de la barre de recherche (border claire + text-gray-900) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search className="text-gray-400 w-5 h-5 shrink-0" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="w-full outline-none font-bold text-gray-900 bg-transparent placeholder-gray-400 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {produits.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())).map(p => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)}
                disabled={p.quantiteStock <= 0}
                className="bg-white p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm text-left transition-all disabled:opacity-50"
              >
                <p className="font-black text-gray-900 uppercase text-sm truncate">{p.nom}</p>
                <p className="text-blue-600 font-black">{p.prixVente} DH</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Stock: {p.quantiteStock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PANIER / CAISSE */}
        <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-xl h-fit sticky top-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black flex items-center gap-2 text-lg">
              <ShoppingCart /> {editId ? "MODIFIER VENTE" : "CAISSE"}
            </h2>
            {editId && (
              <button onClick={() => {setEditId(null); setPanier([]);}} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {panier.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-gray-700/50">
                <span className="text-xs font-bold uppercase truncate w-32">{item.nom}</span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-400 font-black text-xs">x{item.quantite}</span>
                  <button onClick={() => setPanier(panier.filter((_, i) => i !== idx))}>
                    <Trash2 size={14} className="text-gray-500 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            ))}
            {panier.length === 0 && <p className="text-center text-gray-500 text-xs italic py-4">Panier vide</p>}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-[10px] font-black text-gray-500 uppercase">Total</p>
            <p className="text-3xl font-black mb-6 text-white">{totalGlobal.toFixed(2)} DH</p>
            <button 
              onClick={handleSubmit}
              disabled={loading || panier.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black transition-all disabled:bg-gray-800 disabled:text-gray-600 text-white"
            >
              {loading ? "EN COURS..." : editId ? "METTRE À JOUR" : "VALIDER LA VENTE"}
            </button>
          </div>
        </div>
      </div>

      {/* TABLEAU HISTORIQUE */}
      <div className="space-y-4">
        <h2 className="text-xl font-black flex items-center gap-2 text-gray-900"><History /> DERNIÈRES VENTES</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Vendeur</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historique.map((v) => (
                <tr key={v.id} className="text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500">#{v.id}</td>
                  <td className="p-4 uppercase">{v.vendeur?.nom || "Inconnu"}</td>
                  <td className="p-4 text-blue-600 font-black">{v.total} DH</td>
                  <td className="p-4 text-right flex justify-end gap-1">
                    <button onClick={() => handleEdit(v)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier"><Edit3 size={16}/></button>
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Supprimer"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}