import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token?.role as string) || "SAISIE";
    const urlPath = req.nextUrl.pathname;

    // ==============================================================
    // 🛡️ SECTION SÉCURITÉ BACK-END : PROTECTIONS DES ROUTES API & CSRF
    // ==============================================================
    if (urlPath.startsWith("/api/")) {
      // Nouvelle route Profil ajoutée pour éviter les blocages de rôles
      if (urlPath.startsWith("/api/profile")) {
        return NextResponse.next();
      }
      // 🚨 EXCLUSION OBLIGATOIRE : Laisser NextAuth gérer ses routes techniques
      if (urlPath.startsWith("/api/auth")) {
        return NextResponse.next();
      }

      // 🛑 BLOCAGE CSRF : Validation de l'origine pour POST, PUT, DELETE, PATCH
      if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");
        
        const host = req.headers.get("host");
        const protocol = req.nextUrl.protocol;
        const expectedOrigin = `${protocol}//${host}`;

        if (origin && origin !== expectedOrigin) {
          return NextResponse.json(
            { error: "Sécurité : Requête CSRF bloquée. Origine non autorisée." }, 
            { status: 403 }
          );
        }

        if (!origin && referer && !referer.startsWith(expectedOrigin)) {
          return NextResponse.json(
            { error: "Sécurité : Requête CSRF bloquée. Référent invalide." }, 
            { status: 403 }
          );
        }
      }
      
      // 1. Routes API Catégories
      if (urlPath.startsWith("/api/categories")) {
        if (req.method === "GET") {
          if (!["ADMIN", "MANAGER", "SAISIE"].includes(role)) {
            return NextResponse.json({ error: "Lecture API refusée." }, { status: 403 });
          }
        } else {
          if (role !== "ADMIN" && role !== "SAISIE") {
            return NextResponse.json({ error: "Modification API refusée." }, { status: 403 });
          }
        }
      }

      // 2. Routes API Fournisseurs
      if (urlPath.startsWith("/api/fournisseurs")) {
        if (req.method === "GET") {
          if (!["ADMIN", "MANAGER", "SAISIE"].includes(role)) {
            return NextResponse.json({ error: "Lecture API refusée." }, { status: 403 });
          }
        } else {
          if (role !== "ADMIN") {
            return NextResponse.json({ error: "Accès API refusé. Rôle ADMIN requis." }, { status: 403 });
          }
        }
      }

      // 3. Routes API Users
      if (urlPath.startsWith("/api/users")) {
        if (role !== "ADMIN") {
          return NextResponse.json({ error: "Accès API refusé. Rôle ADMIN requis." }, { status: 403 });
        }
      }

      // 4. Actions sur les produits
      if (urlPath.startsWith("/api/products")) {
        if (req.method === "PUT") {
          if (role !== "ADMIN" && role !== "MAGASINIER" && role !== "SAISIE" && role !== "MANAGER" ) {
            return NextResponse.json({ error: "Action API interdite pour votre rôle." }, { status: 403 });
          }
        }
        
        if (["POST", "DELETE"].includes(req.method)) {
          if (role !== "ADMIN" && role !== "SAISIE") {
            return NextResponse.json({ error: "Action API interdite pour votre rôle." }, { status: 403 });
          }
        }
      }

      // 5. API des Approvisionnements et Arrivages
      if (urlPath.startsWith("/api/approvisionnements") || urlPath.startsWith("/api/arrivages")) {
        if (req.method === "GET") {
          if (!["MANAGER", "ADMIN", "MAGASINIER", "SAISIE"].includes(role)) { 
            return NextResponse.json({ error: "Accès API restreint en lecture." }, { status: 403 });
          }
        } else {
          if (!["MANAGER", "ADMIN", "MAGASINIER", "SAISIE"].includes(role)) { 
            return NextResponse.json({ error: "Modification API restreinte." }, { status: 403 });
          }
        }
      }

      // 6. API des Ventes
      if (urlPath.startsWith("/api/sales")) {
        if (!["VENDEUR", "ADMIN", "MANAGER"].includes(role)) {
          return NextResponse.json({ error: "Accès API restreint." }, { status: 403 });
        }
      }

      return NextResponse.next();
    }

    // ==============================================================
    // 🎨 SECTION SÉCURITÉ FRONT-END : CONFIGURATION DE TES PAGES WEB
    // ==============================================================
    if (urlPath.startsWith("/dashboard/admin/approvisionnements")) {
      if (role !== "ADMIN" && role !== "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesAdminSeulement = [
      "/dashboard/admin/users",
      "/dashboard/admin/alert",
      "/dashboard/admin/fournisseurs"
    ];

    if (routesAdminSeulement.some(path => urlPath.startsWith(path)) || urlPath === "/dashboard/admin") {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesManagerSeulement = [
      "/dashboard/manager",
      "/dashboard/manager/promo",
    ];

    if (routesManagerSeulement.some(path => urlPath.startsWith(path))) {
      if (role !== "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesVendeurSeulement = [
      "/dashboard/vendeur",
      "/dashboard/vendeur/sales"
    ];

    if (routesVendeurSeulement.some(path => urlPath.startsWith(path))) {
      if (role !== "VENDEUR") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesmagasinierSeulement = [
      "/dashboard/magasinier",
      "/dashboard/magasinier/arrivages",
      "/dashboard/magasinier/produitmaga"
    ];

    if (routesmagasinierSeulement.some(path => urlPath.startsWith(path))) {
      if (role !== "MAGASINIER") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesSaisieSeulement = [
      "/dashboard/saisie"
    ];

    if (routesSaisieSeulement.some(path => urlPath.startsWith(path))) {
      if (role !== "SAISIE") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
      }
    }

    const routesManagement = [
      "/dashboard/admin/products",
      "/dashboard/admin/categories"
    ];

    if (routesManagement.some(path => urlPath.startsWith(path))) {
      if (role !== "ADMIN" && role !== "SAISIE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    const routesManagementh = [
      "/dashboard/statistique"
    ];

    if (routesManagementh.some(path => urlPath.startsWith(path))) {
      if (role !== "ADMIN" && role !== "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    const routesManagementhhh = [
      "/dashboard/factures"
    ];

    if (routesManagementhhh.some(path => urlPath.startsWith(path))) {
      if (role !== "ADMIN" && role !== "MANAGER" && role !== "VENDEUR") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    const routesManagementhh = [
      "/dashboard/arrivages"
    ];

    if (routesManagementhh.some(path => urlPath.startsWith(path))) {
      if (role !== "ADMIN" && role !== "MANAGER" && role !== "SAISIE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (urlPath.startsWith("/dashboard/stocks/inventaire")) {
      if (!["ADMIN", "MANAGER", "STOCKEUR"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // 🔓 ✅ LAISSER PASSER LES APIS PUBLIQUES SANS TOKEN
        if (path.startsWith("/api/register") || path.startsWith("/api/auth")) {
          return true;
        }

        // Pour toutes les autres routes d'API ou de Dashboard, le token est obligatoire
        if (!token && path.startsWith("/api/")) {
          return false;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/api/:path*", 
  ],
};