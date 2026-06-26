"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag, Layers, X, Search } from "lucide-react";

interface Categorie {
  id: number;
  nom: string;
  description: string | null;
  est_active: boolean;
  _count?: { produits: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // État pour la recherche
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null as number | null, nom: "", description: "" });

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id ? `/api/categories/${formData.id}` : "/api/categories";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ id: null, nom: "", description: "" });
      loadCategories();
    }
  };

  const deleteCategorie = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    loadCategories();
  };

  // Logique de filtrage
  const filteredCategories = categories.filter((cat) =>
    cat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500">Organisez votre catalogue produit.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Barre de recherche */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 text-sm transition-all"
            />
          </div>

          <button 
            onClick={() => { setFormData({ id: null, nom: "", description: "" }); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>
      </div>

      {/* Liste filtrée */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setFormData({ id: cat.id, nom: cat.nom, description: cat.description || "" }); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteCategorie(cat.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{cat.nom}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{cat.description || "Aucune description."}</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full">
                <Layers className="w-3 h-3" />
                {cat._count?.produits || 0} Produits
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400 font-medium">
            Aucune catégorie ne correspond à votre recherche.
          </div>
        )}
      </div>

      {/* Modale */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              {/* Ajout de text-gray-900 pour éviter le titre invisible */}
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? "Modifier" : "Ajouter"} une catégorie</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Nom de la catégorie</label>
                <input 
                  type="text"
                  placeholder="ex: Électronique" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400 font-medium transition-all"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea 
                  placeholder="Ajoutez une description ici..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 h-32 resize-none text-gray-900 placeholder-gray-400 font-medium transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-colors shadow-sm mt-4">
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}