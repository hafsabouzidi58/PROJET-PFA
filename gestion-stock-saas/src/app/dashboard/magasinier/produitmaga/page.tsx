"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Package, Upload } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Reste uniquement la quantité (stock) ainsi que les métadonnées de l'article
  const [formData, setFormData] = useState({
    id: null, 
    nom: "", 
    description: "", 
    image: "", // Chaîne Base64
    stock: "0", 
    categorieId: "",
    fournisseurId: ""
  });

  // GESTION DU BUFFER DE L'IMAGE LOCALE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const loadData = async () => {
    try {
      const [resP, resC, resF] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/fournisseurs")
      ]);
      if (resP.ok) setProducts(await resP.json());
      if (resC.ok) setCategories(await resC.json());
      if (resF.ok) setFournisseurs(await resF.json());
    } catch (err) {
      console.error("Erreur lors du rechargement des stocks :", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id ? `/api/products/${formData.id}` : "/api/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ id: null, nom: "", description: "", image: "", stock: "0", categorieId: "", fournisseurId: "" });
      loadData();
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Supprimer définitivement ce produit du registre des stocks ?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  const filteredProducts = products.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categorie?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen font-sans text-gray-900">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black flex items-center gap-3">
            <Package className="text-blue-600" size={32} /> Inventaire des Volumes
          </h1>
          <p className="text-sm font-bold text-slate-500 italic mt-1">Ajustement exclusif des quantités en rayon et des références.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filtrer par article, catégorie..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
 
        </div>
      </div>

      {/* REPERTOIRE DESIGN - CARDE BLANCHE */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <th className="p-4">Désignation Produit</th>
                <th className="p-4">Famille / Catégorie</th>
                <th className="p-4 text-center">Quantité Physique Actuelle</th>
                <th className="p-4 text-right pr-6">Ajustements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors font-medium text-gray-700">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {p.image ? (
                        <img src={p.image} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-inner" alt={p.nom} />
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-xl text-slate-400"><Package className="w-5 h-5"/></div>
                      )}
                      <div>
                        <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{p.nom}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Origine : {p.fournisseur?.nom || "Non Spécifié"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-black uppercase tracking-wider">
                      {p.categorie?.nom}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className={`text-base font-black px-4 py-1 inline-block rounded-xl shadow-inner ${p.quantiteStock <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-900'}`}>
                      {p.quantiteStock} unités
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => {
                          setFormData({ 
                            id: p.id, nom: p.nom, description: p.description || "", 
                            image: p.image || "", stock: p.quantiteStock.toString(), 
                            categorieId: p.categorieId.toString(), fournisseurId: p.fournisseurId.toString() 
                          });
                          setIsModalOpen(true);
                        }} 
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4"/>
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIGURATION POP-UP - UNIQUEMENT DESIGN STOCKS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">{formData.id ? "Ajuster Quantités" : "Déclarer Fiche Produit"}</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Fiche de contrôle physique des stocks</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-black rounded-xl transition-colors"><X size={16}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              



              {/* CHAMP CENTRAL RECTIFIÉ : QUANTITÉ SEULE */}
              <div>
                <label className="text-[10px] font-black uppercase text-blue-600 block mb-1 ml-1">Quantité Initiale / Stock Physique en Rayon</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl font-black text-sm text-blue-700 outline-none focus:ring-2 focus:ring-blue-500/30" 
                  value={formData.stock} 
                  onChange={e => setFormData({...formData, stock: e.target.value})} 
                  required
                />
              </div>


              {/* ACTION BUTTON */}
              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors">
                  Annuler
                </button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                  {formData.id ? "Enregistrer Volume" : "Créer Référence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}