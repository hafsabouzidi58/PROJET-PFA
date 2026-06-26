"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Truck, Phone, User, AlertCircle } from "lucide-react";

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ id: null, nom: "", contact: "", telephone: "", adresse: "" });

  const loadFournisseurs = async () => {
    try {
      const res = await fetch("/api/fournisseurs");
      const data = await res.json();
      setFournisseurs(data);
    } catch (err) {
      setError("Erreur de chargement des données");
    }
  };

  useEffect(() => { loadFournisseurs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id ? `/api/fournisseurs/${formData.id}` : "/api/fournisseurs";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, nom: "", contact: "", telephone: "", adresse: "" });
        loadFournisseurs();
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur");
    }
  };

  const deleteFournisseur = async (id: number) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    setError("");

    try {
      const res = await fetch(`/api/fournisseurs/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        loadFournisseurs();
      } else {
        setError(data.error); // Affiche l'erreur si le fournisseur est lié à des produits
      }
    } catch (err) {
      setError("Erreur lors de la suppression");
    }
  };

  const filtered = fournisseurs.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-sm text-gray-500">Gérez vos partenaires commerciaux.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-gray-900 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setFormData({ id: null, nom: "", contact: "", telephone: "", adresse: "" }); setError(""); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* Alerte Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grille des fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((f) => (
          <div key={f.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setFormData(f); setIsModalOpen(true); setError(""); }} 
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteFournisseur(f.id)} 
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{f.nom}</h3>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" /> {f.contact || "Pas de contact"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" /> {f.telephone || "Non renseigné"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout/Modif */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? "Modifier" : "Ajouter"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Nom entreprise</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder:text-gray-400"
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Contact</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder:text-gray-400"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Téléphone</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder:text-gray-400"
                  value={formData.telephone}
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Adresse</label>
                <textarea 
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none h-20 resize-none text-gray-900 placeholder:text-gray-400"
                  value={formData.adresse}
                  onChange={e => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
              <button className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-lg mt-2">
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}