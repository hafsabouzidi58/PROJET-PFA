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
      setProducts(Array.isArray(productsData) ? productsData : []);
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
        setIsModalOpen(false);
        setFormData({ id: null, nom: "", description: "", prixAchat: "", prixVente: "", image: "", stock: "0", categorieId: "", fournisseurId: "" });
        await loadData();
      } else {
        const error = await res.json();
        alert("Erreur: " + (error.error || "Une erreur est survenue"));
      }
    } catch (error) {
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
    p.categorie?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-container" style={{ color: '#000000' }}>
      {/* ===== EN-TÊTE ===== */}
      <div className="products-header">
        <div className="products-header-left">
          <h1 className="text-black font-black" style={{ color: '#000000', fontWeight: '900', fontSize: '2rem' }}>Gestion des produits</h1>
          <p className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>{products.length} produit{products.length > 1 ? 's' : ''} au total</p>
        </div>

        <div className="products-header-actions">
          <div className="search-wrapper" style={{ border: '2px solid #000000', borderRadius: '12px' }}>
            <Search className="search-icon" style={{ color: '#000000' }} />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="search-input text-black font-semibold"
              style={{ color: '#000000', fontWeight: '600' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { 
              setFormData({ 
                id: null, nom: "", description: "", prixAchat: "", prixVente: "", image: "", stock: "0", categorieId: "", fournisseurId: "" 
              }); 
              setIsModalOpen(true); 
            }}
            className="btn-primary font-bold"
            style={{ fontWeight: '700' }}
          >
            <Plus /> Nouveau produit
          </button>
        </div>
      </div>

      {/* ===== GRILLE DES PRODUITS ===== */}
      <div className="products-grid">
        {loading ? (
          <div className="products-loading text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Chargement...</div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((p) => {
            const isLowStock = p.quantiteStock <= 5;
            return (
              <div key={p.id} className="product-card" style={{ border: '2px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                {/* Image du produit */}
                <div className="product-card-image" style={{ position: 'relative' }}>
                  {p.image ? (
                    <img src={p.image} alt={p.nom} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  ) : (
                    <div className="product-placeholder" style={{ background: '#f8fafc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package style={{ width: '48px', height: '48px', color: '#000000' }} />
                    </div>
                  )}
                  <span className={`product-card-badge-stock ${isLowStock ? 'low' : 'normal'}`} style={{ fontWeight: '800' }}>
                    {isLowStock ? '⚠ Stock bas' : '✓ En stock'}
                  </span>
                </div>

                {/* Corps de la carte */}
                <div className="product-card-body" style={{ padding: '20px', color: '#000000' }}>
                  <div className="product-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="product-card-name text-black font-black" style={{ color: '#000000', fontWeight: '900', fontSize: '1.25rem', margin: '0 0 4px 0' }}>{p.nom}</h3>
                    <div className="product-card-actions">
                      <button 
                        onClick={() => {
                          setFormData({ 
                            id: p.id, nom: p.nom, description: p.description || "", prixAchat: p.prixAchat.toString(), prixVente: p.prixVente.toString(), image: p.image || "", stock: p.quantiteStock.toString(), categorieId: p.categorieId.toString(), fournisseurId: p.fournisseurId.toString() 
                          });
                          setIsModalOpen(true);
                        }} 
                        className="btn-edit"
                        style={{ color: '#000000' }}
                        title="Modifier"
                      >
                        <Edit />
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)} 
                        className="btn-delete"
                        style={{ color: '#ef4444' }}
                        title="Supprimer"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  {/* Descriptif */}
                  <p className="text-black font-medium" style={{ color: '#111111', fontWeight: '500', fontSize: '0.875rem', margin: '6px 0 12px 0', lineHeight: '1.4', background: '#f8fafc', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #000' }}>
                    {p.description ? p.description : "Aucune description rédigée."}
                  </p>

                  <div className="product-card-supplier text-black font-bold" style={{ color: '#000000', fontWeight: '700', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Fournisseur:</span> {p.fournisseur?.nom || 'Sans fournisseur'}
                  </div>

                  <span className="product-card-category text-black font-extrabold" style={{ color: '#000000', fontWeight: '800', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', inlineSize: 'fit-content', display: 'inline-block', margin: '6px 0 12px 0', fontSize: '0.8rem' }}>
                    {p.categorie?.nom || 'Non catégorisé'}
                  </span>

                  <div className="product-card-prices" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', padding: '8px 0', borderTop: '1px solid #e2e8f0' }}>
                    <div className="product-card-price-buy text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>
                      Achat: <span style={{ color: '#000000' }}>{p.prixAchat} DH</span>
                    </div>
                    <div className="product-card-price-sell text-black font-black" style={{ color: '#000000', fontWeight: '900', fontSize: '1.2rem' }}>
                      {p.prixVente} DH
                    </div>
                  </div>

                  <div className="product-card-footer" style={{ marginTop: '10px' }}>
                    <span className="product-card-stock" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`stock-dot ${isLowStock ? 'low' : 'normal'}`} />
                      <span className={`stock-text ${isLowStock ? 'low' : 'normal'} text-black font-bold`} style={{ color: '#000000', fontWeight: '700' }}>
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
            <Package className="empty-icon" style={{ color: '#000000' }} />
            <h3 className="text-black font-black" style={{ color: '#000000', fontWeight: '900' }}>Aucun produit trouvé</h3>
            <p className="text-black font-semibold" style={{ color: '#000000', fontWeight: '600' }}>Commencez par ajouter votre premier produit</p>
          </div>
        )}
      </div>

      {/* ===== MODALE ===== */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" style={{ border: '2px solid #000', borderRadius: '24px' }}>
            <div className="modal-header">
              <h2 className="text-black font-black" style={{ color: '#000000', fontWeight: '900' }}>{formData.id ? "Modifier" : "Ajouter"} un produit</h2>
              <button onClick={() => setIsModalOpen(false)} className="modal-close" style={{ color: '#000000' }}>
                <X style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Upload d'image */}
              <div className="modal-upload" style={{ border: '2px dashed #000' }}>
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
                  <label className="upload-placeholder" style={{ color: '#000000' }}>
                    <Upload style={{ color: '#000000' }} />
                    <span className="font-bold">Cliquez pour importer une image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              <div className="modal-form-group">
                <label className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Nom du produit</label>
                <input 
                  type="text"
                  placeholder="ex: Ordinateur portable"
                  className="text-black font-bold"
                  style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                  value={formData.nom}
                  onChange={e => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Description</label>
                <textarea 
                  placeholder="Spécifications, détails du produit..."
                  className="text-black font-bold"
                  style={{ color: '#000000', fontWeight: '700', border: '2px solid #000', minHeight: '80px' }}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label className="label-buy font-bold" style={{ color: '#000000', fontWeight: '700' }}>Prix d'achat (DH)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="text-black font-bold"
                    style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                    value={formData.prixAchat} 
                    onChange={e => setFormData({...formData, prixAchat: e.target.value})}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label className="label-sell font-bold" style={{ color: '#000000', fontWeight: '700' }}>Prix de vente (DH)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="text-black font-bold"
                    style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                    value={formData.prixVente} 
                    onChange={e => setFormData({...formData, prixVente: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Catégorie</label>
                  <select 
                    className="text-black font-bold"
                    style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                    value={formData.categorieId} 
                    onChange={e => setFormData({...formData, categorieId: e.target.value})}
                    required
                  >
                    <option value="" style={{ color: '#000000' }}>Sélectionner...</option>
                    {categories.map(c => <option key={c.id} value={c.id} style={{ color: '#000000' }}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Fournisseur</label>
                  <select 
                    className="text-black font-bold"
                    style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                    value={formData.fournisseurId} 
                    onChange={e => setFormData({...formData, fournisseurId: e.target.value})}
                    required
                  >
                    <option value="" style={{ color: '#000000' }}>Sélectionner...</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id} style={{ color: '#000000' }}>{f.nom}</option>)}
                  </select>
                </div>
              </div>

              {/* ===== MASQUÉ UNIQUEMENT EN MODE MODIFICATION POUR PASSER PAR LES ENTRÉES/ARRIVAGES ===== */}
              {!formData.id && (
                <div className="modal-form-group">
                  <label className="text-black font-bold" style={{ color: '#000000', fontWeight: '700' }}>Quantité initiale en stock</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    className="text-black font-bold"
                    style={{ color: '#000000', fontWeight: '700', border: '2px solid #000' }}
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-submit font-black" style={{ background: '#000000', color: '#ffffff', fontWeight: '900', padding: '14px', borderRadius: '12px', width: '100%', fontSize: '1rem', marginTop: '10px' }}>
                {formData.id ? "Mettre à jour le produit" : "Créer le produit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}