"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Truck, Phone, User, AlertCircle, MapPin } from "lucide-react";

// Définition de l'interface pour TypeScript
interface Fournisseur {
  id: any;
  nom: string;
  contact?: string;
  telephone?: string;
  adresse?: string;
}

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Fournisseur>({ id: null, nom: "", contact: "", telephone: "", adresse: "" });

  const loadFournisseurs = async () => {
    try {
      const res = await fetch("/api/fournisseurs", { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur serveur lors de la récupération");
      
      const data = await res.json();
      const listeFournisseurs = Array.isArray(data) ? data : [];
      setFournisseurs([...listeFournisseurs]);
    } catch (err) {
      setError("Erreur de chargement des données");
    }
  };

  useEffect(() => { 
    loadFournisseurs(); 
  }, []);

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
        await loadFournisseurs(); 
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
        setError(data.error); 
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
          <h1 className="text-2xl font-bold text-black">Fournisseurs</h1>
          <p className="text-sm text-black font-medium">Gérez vos partenaires commerciaux.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 border border-black rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-black font-medium placeholder:text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setFormData({ id: null, nom: "", contact: "", telephone: "", adresse: "" }); setError(""); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* Alerte Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grille des fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((f) => (
          <div key={f.id} className="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-100 rounded-xl text-orange-700">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setFormData(f); setIsModalOpen(true); setError(""); }} 
                  className="p-2 text-black hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteFournisseur(f.id)} 
                  className="p-2 text-black hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-extrabold text-black text-xl mb-3">{f.nom}</h3>
            
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <User className="w-4 h-4 text-black" /> <span className="text-gray-500 font-medium mr-1">Contact:</span> {f.contact || "Pas de contact"}
              </div>
              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <Phone className="w-4 h-4 text-black" /> <span className="text-gray-500 font-medium mr-1">Tél:</span> {f.telephone || "Non renseigné"}
              </div>
              <div className="flex items-start gap-2 text-sm text-black font-semibold pt-1 border-t border-gray-100">
                <MapPin className="w-4 h-4 text-black mt-0.5 flex-shrink-0" /> 
                <div>
                  <span className="text-gray-500 font-medium block">Adresse / Desc:</span>
                  <p className="text-black font-medium mt-0.5 break-words">{f.adresse || "Aucune description fournie"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout/Modif */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-black">{formData.id ? "Modifier" : "Ajouter"} un fournisseur</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-black hover:text-gray-700 w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-black ml-1 uppercase tracking-wider">Nom entreprise</label>
                <input 
                  className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-black text-black font-semibold"
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black ml-1 uppercase tracking-wider">Contact</label>
                <input 
                  className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-black text-black font-semibold"
                  value={formData.contact || ""}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black ml-1 uppercase tracking-wider">Téléphone</label>
                <input 
                  className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-black text-black font-semibold"
                  value={formData.telephone || ""}
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-black ml-1 uppercase tracking-wider">Adresse / Description</label>
                <textarea 
                  className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl outline-none focus:border-black h-24 resize-none text-black font-semibold"
                  value={formData.adresse || ""}
                  onChange={e => setFormData({...formData, adresse: e.target.value})}
                />
              </div>
              <button className="w-full bg-black text-white py-4 rounded-xl font-black hover:bg-gray-900 transition-colors shadow-lg mt-4 tracking-wide text-base">
                Enregistrer le fournisseur
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}