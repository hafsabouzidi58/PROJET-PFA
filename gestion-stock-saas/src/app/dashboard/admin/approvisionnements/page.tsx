"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Search, Edit3, X, Save, Package, 
  Calendar, User, CheckCircle, AlertCircle, BellRing, ArrowRight 
} from "lucide-react";

interface Produit {
  id: number;
  nom: string;
  quantiteStock: number;
  stockMinimum: number; // Requis pour la vérification des alertes
  fournisseurId: number;
}

interface Fournisseur {
  id: number;
  nom: string;
}

interface Approvisionnement {
  id: number;
  fournisseurId: number;
  fournisseur: { nom: string };
  magasinier?: { nom: string };
  articles: any[]; 
  date_reception: string;
  etat: "EN_ATTENTE" | "TRAITE";
}

// --- FONCTION AUDIO : Génère un double bip de notification type "système" ---
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Premier bip (Note moyenne)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Ré5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.12);

    // Deuxième bip (Note plus aiguë et cristalline, décalée de 100ms)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // La5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.22);
    }, 100);

  } catch (error) {
    console.warn("L'audio n'a pas pu se déclencher (politique autoplay du navigateur) :", error);
  }
};

export default function ApprovisionnementPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [historique, setHistorique] = useState<Approvisionnement[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [fournisseurId, setFournisseurId] = useState("");
  const [selectedArticles, setSelectedArticles] = useState([
    { produitId: "", quantite: 1 }
  ]);

  // Remplace ta fonction refreshData par celle-ci :
const refreshData = async () => {
  try {
    const [resF, resP, resH] = await Promise.all([
      fetch("/api/fournisseurs"),
      fetch("/api/products"),
      fetch("/api/approvisionnements")
    ]);
    
    if (resF.ok) {
      const dataF = await resF.json();
      // Sécurité : Vérifie si c'vest un tableau direct ou encapsulé dans .data ou .fournisseurs
      if (Array.isArray(dataF)) {
        setFournisseurs(dataF);
      } else if (dataF.fournisseurs && Array.isArray(dataF.fournisseurs)) {
        setFournisseurs(dataF.fournisseurs);
      } else if (dataF.data && Array.isArray(dataF.data)) {
        setFournisseurs(dataF.data);
      }
    }
    
    if (resP.ok) setProduits(await resP.json());
    if (resH.ok) setHistorique(await resH.json());
  } catch (err) {
    console.error("Erreur de chargement", err);
  }
};
  // Chargement initial des données
  useEffect(() => { 
    refreshData(); 
  }, []);

  // --- EFFET ALERTE SONORE : Se déclenche si un produit passe sous le seuil ---
  useEffect(() => {
    if (produits.length > 0) {
      const aDesRuptures = produits.some(p => p.quantiteStock <= p.stockMinimum);
      if (aDesRuptures) {
        playNotificationSound();
      }
    }
  }, [produits]);

  // Liste dynamique des produits en rupture
  const alertProducts = produits.filter(p => p.quantiteStock <= p.stockMinimum);

  // Injection rapide d'un produit en alerte dans le formulaire
  const handleInjectAlert = (prod: Produit) => {
    setFournisseurId(prod.fournisseurId.toString());
    // Calcule une quantité suggérée intelligente (Seuil - Stock actuel + marge de 10 unités)
    const quantiteSuggeree = Math.max(1, (prod.stockMinimum - prod.quantiteStock) + 10);
    setSelectedArticles([{ produitId: prod.id.toString(), quantite: quantiteSuggeree }]);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleFournisseurChange = (id: string) => {
    setFournisseurId(id);
    setSelectedArticles([{ produitId: "", quantite: 1 }]);
  };

  // --- ACTIONS ---
  const handleValidateStock = async (id: number) => {
    if (!confirm("Confirmez-vous que les produits ont été bien reçus physiquement ? Cela mettra à jour le stock.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/approvisionnements/${id}`, { method: "PATCH" });
      if (res.ok) {
        setMessage({ type: "success", text: "Stock physique mis à jour avec succès !" });
        refreshData();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la validation." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (app: Approvisionnement) => {
    if (app.etat === "TRAITE") {
      alert("Impossible de modifier un approvisionnement déjà validé et traité.");
      return;
    }
    setEditId(app.id);
    setFournisseurId(app.fournisseurId.toString());
    setSelectedArticles(app.articles.map(a => ({
      produitId: a.produitId.toString(),
      quantite: a.quantite
    })));
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const addLine = () => setSelectedArticles([...selectedArticles, { produitId: "", quantite: 1 }]);
  
  const removeLine = (index: number) => {
    if (selectedArticles.length > 1) {
      setSelectedArticles(selectedArticles.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...selectedArticles];
    newLines[index] = { ...newLines[index], [field]: value };
    setSelectedArticles(newLines);
  };

  const resetForm = () => {
    setEditId(null);
    setFournisseurId("");
    setSelectedArticles([{ produitId: "", quantite: 1 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const articlesComplets = selectedArticles.map(art => {
      const p = produits.find(prod => prod.id === parseInt(art.produitId));
      return {
        produitId: parseInt(art.produitId),
        nom: p ? p.nom : "Produit",
        quantite: Math.max(1, parseInt(art.quantite.toString()))
      };
    });

    const payload = {
      fournisseurId: parseInt(fournisseurId),
      articles: articlesComplets,
    };

    try {
      const url = editId ? `/api/approvisionnements/${editId}` : "/api/approvisionnements";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: editId ? "Bon modifié avec succès !" : "Nouveau bon créé !" 
        });
        resetForm();
        refreshData();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erreur lors de l'enregistrement" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet enregistrement ? Si le stock a été mis à jour, il sera rectifié.")) return;
    try {
      const res = await fetch(`/api/approvisionnements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Suppression réussie." });
        refreshData();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur suppression." });
    }
  };

  const filteredHistory = historique.filter(app => 
    app.fournisseur?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900">
            <Package className="text-blue-600 w-8 h-8" />
            {editId ? "Modification du Bon" : "Approvisionnement & Stock"}
          </h1>
          <p className="text-gray-500 font-bold">Gérez vos arrivages et validez la réception physique</p>
        </div>
        {editId && (
          <button onClick={resetForm} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-red-100 border border-red-200">
            <X className="w-5 h-5" /> Annuler
          </button>
        )}
      </div>

      {/* --- BLOC ALERTES VISUELLES & CLIGNOTANTES --- */}
      {alertProducts.length > 0 && (
        <div className="bg-red-50 border-4 border-red-600 p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] text-black animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-4 border-b border-red-200 pb-2">
            <BellRing className="text-red-600 animate-bounce" size={24} />
            <h2 className="text-lg font-black uppercase tracking-tight text-red-900">
              Alertes Ruptures de Stock Critiques ({alertProducts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertProducts.map(p => (
              <div key={p.id} className="bg-white border-2 border-black rounded-xl p-3 flex justify-between items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.01] transition-transform">
                <div>
                  <p className="font-black text-sm uppercase truncate max-w-[180px]">{p.nom}</p>
                  <p className="text-xs font-bold text-red-600">
                    Stock : <span className="bg-red-100 px-1.5 py-0.5 rounded border border-red-300">{p.quantiteStock}</span> / Seuil : {p.stockMinimum}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleInjectAlert(p)}
                  className="bg-black text-white hover:bg-blue-600 p-2 rounded-lg transition-all flex items-center gap-1 group text-[10px] font-black uppercase"
                >
                  Commander <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-xl border-2 shadow-sm flex items-center gap-3 font-black ${message.type === "success" ? "bg-green-50 border-green-500 text-green-900" : "bg-red-50 border-red-500 text-red-900"}`}>
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
          {message.text}
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">Fournisseur</label>
            <select 
              required className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-bold outline-none focus:border-blue-500"
              value={fournisseurId} 
              onChange={(e) => handleFournisseurChange(e.target.value)}
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          
          <button type="submit" disabled={loading || !fournisseurId} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-lg shadow-lg disabled:bg-gray-400 transition-all flex justify-center items-center gap-2 uppercase tracking-tighter">
            <Save className="w-5 h-5" />
            {loading ? "Chargement..." : editId ? "Enregistrer" : "Créer le bon d'achat"}
          </button>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-black text-gray-800 uppercase">Détails des articles</h3>
            <button 
              type="button" 
              disabled={!fournisseurId} 
              onClick={addLine} 
              className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-blue-100 border border-blue-200 uppercase disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {selectedArticles.map((line, index) => (
              <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase">Produit</label>
                  <select 
                    required 
                    disabled={!fournisseurId} 
                    className="w-full p-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-900 disabled:bg-gray-100"
                    value={line.produitId} 
                    onChange={(e) => updateLine(index, "produitId", e.target.value)}
                  >
                    <option value="">
                      {!fournisseurId ? "Veuillez d'abord choisir un fournisseur..." : "Choisir un produit..."}
                    </option>
                    {produits
                      .filter(p => p.fournisseurId === parseInt(fournisseurId))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} (Stock actuel: {p.quantiteStock})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="w-28">
                  <label className="text-[10px] font-black text-gray-400 mb-1 block uppercase">Quantité</label>
                  <input 
                    type="number" min="1" required className="w-full p-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-black text-gray-900"
                    value={line.quantite} onChange={(e) => updateLine(index, "quantite", e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => removeLine(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* History Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-black flex items-center gap-2 text-gray-900">
            <Calendar className="text-blue-600" /> Historique & Réception Physique
          </h2>
          <div className="relative w-full md:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" placeholder="Filtrer par fournisseur..." className="w-full md:w-72 pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredHistory.map((app) => (
            <div key={app.id} className={`bg-white border-2 rounded-2xl p-5 transition-all shadow-sm ${app.etat === 'TRAITE' ? 'border-green-100 opacity-90' : 'border-blue-100 shadow-md'}`}>
              <div className="flex flex-wrap justify-between items-center gap-6">
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">BON #{app.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${app.etat === 'TRAITE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {app.etat === 'TRAITE' ? '✓ Stock Réceptionné' : '⚠ Attente Magasinier'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase leading-none mb-2">{app.fournisseur?.nom}</h3>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(app.date_reception).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {app.magasinier?.nom || "Système"}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Contenu du bon</p>
                  <div className="flex flex-wrap gap-2">
                    {app.articles.map((art: any, i: number) => (
                      <div key={i} className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg text-xs font-black text-gray-700">
                        {art.nom} <span className="text-blue-600 ml-1">x{art.quantite}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {app.etat !== "TRAITE" && (
                    <>
                     
                      <button onClick={() => handleEdit(app)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-200 transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(app.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Aucun enregistrement trouvé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}