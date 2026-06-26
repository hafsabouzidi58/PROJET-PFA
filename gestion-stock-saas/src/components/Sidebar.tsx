"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Box, ShoppingCart, Users, Briefcase,
  ClipboardList, LogOut, Shield, FolderTree, Bell, Truck, FileText ,Tag,BarChart3
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Configuration des liens optimisée avec les bonnes icônes lucide-react
  const menuItems = [
    { name: "Gestion des users", icon: Users, href: "/dashboard/admin/users", roles: ["ADMIN"] },
    { name: "Tableau de Bord", icon: LayoutDashboard, href: "/dashboard/admin", roles: ["ADMIN"] },
    { name: "Tableau de Bord", icon: LayoutDashboard, href: "/dashboard/magasinier", roles: ["MAGASINIER"] },
    { name: "Tableau de Bord", icon: LayoutDashboard, href: "/dashboard/vendeur", roles: ["VENDEUR"] },
    { name: "Saisie de rapport ", icon: LayoutDashboard, href: "/dashboard/saisie", roles: ["SAISIE"] },
    { name: "Tableau de Bord", icon: LayoutDashboard, href: "/dashboard/manager", roles: ["MANAGER"] },
    { name: "Promotions", icon: Tag , href: "/dashboard/manager/promo", roles: ["MANAGER"] },
    { name: "Statistique", icon: BarChart3 , href: "/dashboard/statistique", roles: ["MANAGER","ADMIN"] },

    { name: "Approvisionnements", icon: Shield, href: "/dashboard/admin/approvisionnements", roles: ["MANAGER"] },
    { name: "Catégories", icon: FolderTree, href: "/dashboard/admin/categories", roles: ["ADMIN", "SAISIE"] },
    { name: "Produits", icon: Box, href: "/dashboard/admin/products", roles: ["ADMIN", "SAISIE"] },
    { name: "Fournisseurs", icon: Briefcase, href: "/dashboard/admin/fournisseurs", roles: ["ADMIN"] },
    { name: "Arrivages (Magasin)", icon: ClipboardList, href: "/dashboard/magasinier/arrivages", roles: ["MAGASINIER"] },
    { name: "Alertes Stock", icon: Bell, href: "/dashboard/admin/alert", roles: ["ADMIN"] },
    { name: "Ventes", icon: ShoppingCart, href: "/dashboard/vendeur/sales", roles: ["VENDEUR"] },
    { name: "Arrivages", icon: Truck, href: "/dashboard/arrivages", roles: ["ADMIN", "MANAGER", "SAISIE"] },
    { name: "Factures", icon: FileText, href: "/dashboard/factures", roles: ["ADMIN", "MANAGER", "VENDEUR"] },
      { name: "Produits", icon: Box, href: "/dashboard/magasinier/produitmaga", roles: ["MAGASINIER"] },

  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col p-4 shadow-xl">
      {/* BRANDING */}
      <div className="text-2xl font-black uppercase tracking-wider italic mb-8 text-blue-400 border-b border-slate-800 pb-4 flex items-center gap-2 px-2">
        <Box className="text-blue-500" size={24} /> COREFLOW
      </div>
      
      {/* NAVIGATION DYNAMIQUE */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const aAcces = item.roles.includes(role || "");
          
          return aAcces && (
            <Link 
              key={item.name} 
              href={item.href} 
              className="flex items-center px-4 py-3 text-sm font-bold tracking-wide text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all duration-200"
            >
              <item.icon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* BOUTON DE DECONNEXION */}
      <div className="border-t border-slate-800 pt-4">
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center px-4 py-3 text-sm font-black tracking-wider uppercase text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}