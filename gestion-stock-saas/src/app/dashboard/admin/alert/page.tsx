"use client";

import { useEffect, useState } from "react";
import { Settings2, Package, X, CheckCircle2 } from "lucide-react";

export default function ThresholdManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch((err) => console.error("Erreur chargement produits:", err));
  }, []);

  const handleUpdate = async (id: number) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/products/${id}/threshold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockMinimum: tempValue }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stockMinimum: tempValue } : p))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-black">
      {/* Header section */}
      <div className="flex items-center justify-between mb-10 border-b-4 border-black pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
            <Settings2 size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Configuration des Seuils</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Ajustez vos alertes critiques</p>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-4 border-black text-black uppercase text-sm font-black italic">
              <th className="pb-4 px-4 text-left">Produit</th>
              <th className="pb-4 px-4 text-center">État Stock</th>
              <th className="pb-4 px-4 text-right">Seuil d'alerte</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="group hover:bg-gray-50 transition-all">
                {/* Produit */}
                <td className="py-6 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg border border-black group-hover:bg-blue-50 transition-colors">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <span className="font-black text-lg uppercase tracking-tight">{p.nom}</span>
                  </div>
                </td>

                {/* État Stock */}
                <td className="py-6 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xl font-black px-5 py-1 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      p.quantiteStock <= p.stockMinimum ? "bg-red-500 text-white" : "bg-green-400 text-black"
                    }`}>
                      {p.quantiteStock}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Actuel</span>
                  </div>
                </td>

                {/* Action / Seuil */}
                <td className="py-6 px-4 text-right">
                  {editingId === p.id ? (
                    <div className="flex items-center justify-end gap-3 animate-in slide-in-from-right-4 duration-200">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-24 border-4 border-black rounded-xl px-3 py-2 font-black text-xl text-black bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                          autoFocus
                          value={tempValue}
                          onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
                          disabled={isUpdating}
                        />
                      </div>
                      <button
                        onClick={() => handleUpdate(p.id)}
                        disabled={isUpdating}
                        className="bg-green-500 text-white px-5 py-2 rounded-xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                      >
                        {isUpdating ? "..." : "OK"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-100 p-2 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-6">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-2xl text-slate-300 group-hover:text-black transition-colors">
                          {p.stockMinimum}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-gray-300">Minimun</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setTempValue(p.stockMinimum);
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black uppercase text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                      >
                        <Settings2 size={16} />
                        Modifier
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-center text-gray-400 italic text-sm">
        <p>Cliquez sur "Modifier" pour ajuster le seuil de chaque produit.</p>
        <CheckCircle2 size={18} />
      </div>
    </div>
  );
}