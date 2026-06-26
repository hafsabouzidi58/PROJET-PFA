"use client";

import './products.css';

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, X, Package, Upload } from "lucide-react";

interface Product {
  id: number;
  nom: string;
  description: string;
  prixAchat: number;
  prixVente: number;
  image: string;
  quantiteStock: number;
  categorieId: number;
  fournisseurId: number;
  categorie?: { nom: string };
  fournisseur?: { nom: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null as number | null,
    nom: "", 
    description: "", 
    prixAchat: "", 
    prixVente: "",
    image: "",
    stock: "0", 
    categorieId: "",
    fournisseurId: ""
  });

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
      setLoading(true);
      const [resP, resC, resF] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/fournisseurs")
      ]);
      const productsData = await resP.json();
      console.log("Produits chargés:", productsData); // Debug
      setProducts(productsData);
      setCategories(await resC.json());
      setFournisseurs(await resF.json());
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug : Afficher les données avant envoi
    console.log("Données du formulaire:", {
      nom: formData.nom,
      description: formData.description,
      prixAchat: parseFloat(formData.prixAchat) || 0,
      prixVente: parseFloat(formData.prixVente) || 0,
      image: formData.image,
      quantiteStock: parseInt(formData.stock) || 0,
      categorieId: parseInt(formData.categorieId) || 0,
      fournisseurId: parseInt(formData.fournisseurId) || 0
    });

    const method = formData.id ? "PUT" : "POST";
    const url = formData.id ? `/api/products/${formData.id}` : "/api/products";

    const payload = {
      nom: formData.nom,
      description: formData.description,
      prixAchat: parseFloat(formData.prixAchat) || 0,
      prixVente: parseFloat(formData.prixVente) || 0,
      image: formData.image,
      quantiteStock: parseInt(formData.stock) || 0,
      categorieId: parseInt(formData.categorieId) || 0,
      fournisseurId: parseInt(formData.fournisseurId) || 0
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log("Résultat de l'API:", result);
        setIsModalOpen(false);
        setFormData({ id: null, nom: "", description: "", prixAchat: "", prixVente: "", image: "", stock: "0", categorieId: "", fournisseurId: "" });
        loadData();
      } else {
        const error = await res.json();
        console.error("Erreur API:", error);
        alert("Erreur: " + (error.error || "Une erreur est survenue"));
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion au serveur");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  };

  const filteredProducts = products.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categorie?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-container">
      {/* ===== EN-TÊTE ===== */}
      <div className="products-header">
        <div className="products-header-left">
          <h1>Gestion des produits</h1>
          <p>{products.length} produit{products.length > 1 ? 's' : ''} en stock</p>
        </div>

        <div className="products-header-actions">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { 
              setFormData({ 
                id: null, 
                nom: "", 
                description: "", 
                prixAchat: "", 
                prixVente: "", 
                image: "", 
                stock: "0",  // Valeur par défaut
                categorieId: "", 
                fournisseurId: "" 
              }); 
              setIsModalOpen(true); 
            }}
            className="btn-primary"
          >
            <Plus /> Nouveau produit
          </button>
        </div>
      </div>

      {/* ===== GRILLE DES PRODUITS EN CARTES ===== */}
      <div className="products-grid">
        {loading ? (
          <div className="products-loading">Chargement...</div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const isLowStock = p.quantiteStock <= 5;
            return (
              <div key={p.id} className="product-card">
                {/* Image du produit */}
                <div className="product-card-image">
                  {p.image ? (
                    <img src={p.image} alt={p.nom} />
                  ) : (
                    <div className="product-placeholder">
                      <Package />
                    </div>
                  )}
                  <span className={`product-card-badge-stock ${isLowStock ? 'low' : 'normal'}`}>
                    {isLowStock ? '⚠ Stock bas' : '✓ En stock'}
                  </span>
                </div>

                {/* Corps de la carte */}
                <div className="product-card-body">
                  <div className="product-card-top">
                    <h3 className="product-card-name">{p.nom}</h3>
                    <div className="product-card-actions">
                      <button 
                        onClick={() => {
                          setFormData({ 
                            id: p.id, 
                            nom: p.nom, 
                            description: p.description || "", 
                            prixAchat: p.prixAchat.toString(), 
                            prixVente: p.prixVente.toString(), 
                            image: p.image || "", 
                            stock: p.quantiteStock.toString(), 
                            categorieId: p.categorieId.toString(), 
                            fournisseurId: p.fournisseurId.toString() 
                          });
                          setIsModalOpen(true);
                        }} 
                        className="btn-edit"
                        title="Modifier"
                      >
                        <Edit />
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)} 
                        className="btn-delete"
                        title="Supprimer"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  <div className="product-card-supplier">
                    {p.fournisseur?.nom || 'Sans fournisseur'}
                  </div>

                  <span className="product-card-category">
                    {p.categorie?.nom || 'Non catégorisé'}
                  </span>

                  <div className="product-card-prices">
                    <div className="product-card-price-buy">
                      Achat: <span>{p.prixAchat} DH</span>
                    </div>
                    <div className="product-card-price-sell">
                      {p.prixVente} DH
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <span className="product-card-stock">
                      <span className={`stock-dot ${isLowStock ? 'low' : 'normal'}`} />
                      <span className={`stock-text ${isLowStock ? 'low' : 'normal'}`}>
                        {p.quantiteStock} unité{p.quantiteStock > 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="products-empty">
            <Package className="empty-icon" />
            <h3>Aucun produit trouvé</h3>
            <p>Commencez par ajouter votre premier produit</p>
          </div>
        )}
      </div>

      {/* ===== MODALE ===== */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{formData.id ? "Modifier" : "Ajouter"} un produit</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Upload d'image */}
              <div className="modal-upload">
                {formData.image ? (
                  <>
                    <img src={formData.image} className="upload-preview" alt="Aperçu" />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image: ""})}
                      className="upload-remove"
                    >
                      <X />
                    </button>
                  </>
                ) : (
                  <label className="upload-placeholder">
                    <Upload />
                    <span>Cliquez pour importer une image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              <div className="modal-form-group">
                <label>Nom du produit</label>
                <input 
                  type="text"
                  placeholder="ex: Ordinateur portable"
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea 
                  placeholder="Description du produit..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label className="label-buy">Prix d'achat</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formData.prixAchat} 
                    onChange={e => setFormData({...formData, prixAchat: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="label-sell">Prix de vente</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={formData.prixVente} 
                    onChange={e => setFormData({...formData, prixVente: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Catégorie</label>
                  <select 
                    value={formData.categorieId} 
                    onChange={e => setFormData({...formData, categorieId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Fournisseur</label>
                  <select 
                    value={formData.fournisseurId} 
                    onChange={e => setFormData({...formData, fournisseurId: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
              </div>

              {/* ===== CHAMP STOCK CORRIGÉ ===== */}
              <div className="modal-form-group">
                <label>Quantité en stock</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({...formData, stock: value});
                    console.log("Stock changé:", value); // Debug
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn-submit">
                {formData.id ? "Mettre à jour" : "Créer le produit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}