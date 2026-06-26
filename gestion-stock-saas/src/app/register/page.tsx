"use client";

import './register.css';  // ← Import du CSS

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, Lock, User, Eye, EyeOff,
  Loader2, Sparkles, ShieldCheck
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "VENDEUR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Veuillez accepter les conditions d'utilisation");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Particules flottantes */}
      <div className="register-particles">
        <div className="register-particle"></div>
        <div className="register-particle"></div>
        <div className="register-particle"></div>
      </div>

      <div className="register-card">
        {/* ===== SECTION GAUCHE - ILLUSTRATION ===== */}
        <div className="register-illustration">
          <div className="register-illustration-top">
            <div className="register-badge">
              <span className="dot"></span>
              <Sparkles className="register-badge-icon" style={{ width: '0.875rem', height: '0.875rem' }} />
              Nouvelle version
            </div>
            <h1>
              La <span className="highlight">meilleure</span> façon<br />
              de gérer votre équipe
            </h1>
            <p>
              Rejoignez des milliers de professionnels qui ont déjà adopté notre plateforme.
            </p>
          </div>
          <div className="register-stats">
            <div className="register-stat">
              <span className="register-stat-number">10K+</span>
              <span className="register-stat-label">Utilisateurs</span>
            </div>
            <div className="register-stat">
              <span className="register-stat-number">4.9★</span>
              <span className="register-stat-label">Note moyenne</span>
            </div>
            <div className="register-stat">
              <span className="register-stat-number">99.9%</span>
              <span className="register-stat-label">Disponibilité</span>
            </div>
          </div>
        </div>

        {/* ===== SECTION DROITE - FORMULAIRE ===== */}
        <div className="register-form-wrapper">
          <div className="register-form-header">
            <h2>Créer votre compte</h2>
            <p>Commencez gratuitement, sans engagement</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {error && (
              <div className="register-error">
                <span>{error}</span>
                <button 
                  type="button"
                  onClick={() => setError("")}
                  className="register-error-close"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="register-grid-2">
              <div className="register-field">
                <label>Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Jean"
                  className="register-field-input"
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
              </div>
              <div className="register-field">
                <label>Nom</label>
                <input
                  type="text"
                  required
                  placeholder="Dupont"
                  className="register-field-input"
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
              </div>
            </div>

            <div className="register-field">
              <label>Email professionnel</label>
              <input
                type="email"
                required
                placeholder="vous@entreprise.com"
                className="register-field-input"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="register-field">
              <label>Mot de passe</label>
              <div className="register-field-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="register-field-input"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-field-toggle"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label>Rôle</label>
              <div className="register-field-select-wrapper">
                <select
                  className="register-field-select"
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="VENDEUR">Vendeur</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MAGASINIER">Magasinier</option>
                  <option value="SAISIE">Agent de saisie</option>
                </select>
              </div>
            </div>

            <div className="register-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms">
                J'accepte les <a href="#">conditions</a> et la <a href="#">politique de confidentialité</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreeTerms}
              className="register-submit"
            >
              {loading ? (
                <Loader2 className="spinner" />
              ) : (
                <span>Créer mon compte →</span>
              )}
            </button>

            <div className="register-divider">
              <span>Ou continuer avec</span>
            </div>

            <button type="button" className="register-google">
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>

          <p className="register-form-footer">
            Déjà un compte ? <a href="/login">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  );
}