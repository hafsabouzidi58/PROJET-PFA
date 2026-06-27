"use client";

import { useState, useEffect } from "react";
import { 
  UserPlus, Search, Edit, Trash2, 
  Loader2, X, Check, AlertCircle, UserX, ShieldCheck
} from "lucide-react";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  actif: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // État pour le formulaire (Ajout/Modif)
  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    role: "VENDEUR",
    actif: true
  });

  // 1. CHARGER (READ)
  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // 2. AJOUTER ou MODIFIER (CREATE / UPDATE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/users/${formData.id}` : "/api/users";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, nom: "", prenom: "", email: "", motDePasse: "", role: "VENDEUR", actif: true });
        loadUsers();
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  // 3. SUPPRIMER / DÉSACTIVER (SOFT DELETE)
  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment désactiver ce collaborateur ? Il ne pourra plus se connecter.")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      alert("Erreur lors de la désactivation");
    }
  };

  // 4. RECHERCHER (SEARCH)
  const filteredUsers = users.filter(user => 
    `${user.nom} ${user.prenom} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header & Recherche */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un collaborateur..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500/20 text-gray-900 outline-none transition-all text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setFormData({ id: null, nom: "", prenom: "", email: "", motDePasse: "", role: "VENDEUR", actif: true }); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase">Utilisateur</th>
                <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase">Rôle</th>
                <th className="p-4 text-left text-xs font-bold text-gray-400 uppercase">Statut</th>
                <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" /> Chargement des collaborateurs...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">Aucun collaborateur trouvé.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.actif ? "opacity-60 bg-gray-50/30" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${user.actif ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                        {user.prenom[0]}{user.nom[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {user.prenom} {user.nom}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.actif ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 flex items-center gap-1 w-fit">
                        <UserX className="w-3 h-3" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button 
                      onClick={() => { setFormData({...user, motDePasse: ""}); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.actif && (
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Désactiver l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE AJOUT / MODIF */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {formData.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Prénom</label>
                  <input 
                    type="text"
                    placeholder="Prénom" 
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-medium transition-all"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Nom</label>
                  <input 
                    type="text"
                    placeholder="Nom" 
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 w-full font-medium transition-all"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Adresse Email</label>
                <input 
                  type="email" 
                  placeholder="Email professionnel" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>

              {!formData.id && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Mot de passe</label>
                  <input 
                    type="password" 
                    placeholder="Mot de passe de sécurité" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                    onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                    required 
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Rôle assigné</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="VENDEUR" className="text-gray-900">Vendeur</option>
                  <option value="ADMIN" className="text-gray-900">Administrateur</option>
                  <option value="MANAGER" className="text-gray-900">Manager</option>
                  <option value="MAGASINIER" className="text-gray-900">Magasinier</option>
                  <option value="SAISIE" className="text-gray-900">Saisie</option>
                </select>
              </div>

              {/* 🔄 Interrupteur visible UNIQUEMENT en modification */}
              {formData.id && (
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl mt-2">
                  <span className="text-sm text-gray-700 font-semibold">Compte actif</span>
                  <input 
                    type="checkbox"
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer transition-all"
                    checked={formData.actif ?? true} 
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all mt-4 shadow-sm">
                {formData.id ? "Enregistrer les modifications" : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}