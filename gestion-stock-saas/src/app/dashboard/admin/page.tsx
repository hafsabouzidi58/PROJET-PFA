"use client";
import { useEffect, useState } from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  ArrowRight 
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Erreur stats:", error);
      } finally {
        setLoading(false);
      }
    }
    getStats();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <p className="animate-bounce font-black text-blue-600">CHARGEMENT COREFLOW...</p>
    </div>
  );

 const cards = [
    { 
      label: "Chiffre d'Affaires", 
      value: `${stats?.caTotal?.toFixed(2) || "0.00"} DH`, 
      icon: DollarSign, 
      color: "text-blue-700", 
      bg: "bg-blue-100",
      desc: "Total des ventes brutes" 
    },
    { 
      label: "Bénéfice Réel (Marge)", 
      value: `${stats?.beneficeNet?.toFixed(2) || "0.00"} DH`, 
      icon: TrendingUp, // Importé depuis lucide-react
      color: stats?.beneficeNet >= 0 ? "text-emerald-700" : "text-red-700", 
      bg: stats?.beneficeNet >= 0 ? "bg-emerald-100" : "bg-red-100",
      desc: "Gain net (Ventes - Achats)" 
    },
    { 
      label: "Alertes Stock", 
      value: stats?.alertesStock || 0, 
      icon: AlertTriangle, 
      color: "text-red-700", 
      bg: "bg-red-100",
      desc: "Actions requises"
    },
  ];
  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-4xl font-black text-black uppercase tracking-tight">Vue d'ensemble</h1>
        <p className="text-slate-600 font-bold mt-2 italic">COREFLOW - Rapport d'activité en temps réel.</p>
      </div>

      {/* GRILLE DES CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white transition-all hover:shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} shadow-inner`}>
                <card.icon size={28} />
              </div>
              <div className="bg-slate-100 p-2 rounded-full">
                <TrendingUp className="text-slate-400" size={18} />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{card.label}</p>
              <p className="text-4xl font-black text-black mt-2 tracking-tight">{card.value}</p>
              <div className="mt-4 h-1 w-12 bg-slate-100 rounded-full"></div>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase italic">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ZONE CRITIQUE */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black flex items-center gap-4 text-black uppercase">
            <Package className="text-blue-600" size={32} /> Stocks Critiques
          </h2>
          {stats?.produitsCritiques?.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="animate-pulse bg-red-600 h-3 w-3 rounded-full"></span>
              <span className="text-red-600 text-xs font-black uppercase tracking-widest">Alerte Prioritaire</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {stats?.produitsCritiques?.length > 0 ? (
            stats.produitsCritiques.map((p: any) => {
              // 🟢 Détermination dynamique de la gravité selon le vrai seuil minimum configuré
              const estSousLeSeuil = p.quantiteStock <= (p.stockMinimum ?? 0);

              return (
                <div key={p.id} className="group flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-black text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                      {p.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-black text-lg uppercase tracking-tight">{p.nom}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        Ref: #{p.id} — Seuil Min: {p.stockMinimum ?? 0} u.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${estSousLeSeuil ? "text-red-600" : "text-amber-500"}`}>
                        {p.quantiteStock}
                      </p>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">Unités en stock</p>
                    </div>
                    <div className="bg-white p-3 rounded-full shadow-sm text-slate-300 group-hover:text-blue-500 transition-colors">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-[0.2em]">Aucun produit sous le seuil d'alerte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}