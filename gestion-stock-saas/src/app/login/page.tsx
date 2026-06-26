"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";

// PAS BESOIN D'IMPORTER login.css ICI

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setLoading(false);
        
        if (res.error.includes("COMPTE_INACTIF")) {
          setError("Votre compte a été désactivé par l'administrateur. Veuillez contacter le support.");
        } else {
          setError("Email ou mot de passe incorrect.");
        }
        
      } else {
        const session = await getSession();
        const role = session?.user?.role;

        switch (role) {
          case "ADMIN":
            router.push("/dashboard/admin");
            break;
          case "MANAGER":
            router.push("/dashboard/manager");
            break;
          case "MAGASINIER":
            router.push("/dashboard/magasinier");
            break;
          case "VENDEUR":
            router.push("/dashboard/vendeur");
            break;
          case "SAISIE":
            router.push("/dashboard/saisie");
            break;
          default:
            router.push("/dashboard");
        }
        
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      setError("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  };

  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0a0a'
      }}>
        <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="login-container" suppressHydrationWarning>
      <div className="login-particles">
        <div className="login-particle"></div>
        <div className="login-particle"></div>
        <div className="login-particle"></div>
      </div>

      <div className="login-card">
        <div className="login-illustration">
          <div className="login-illustration-top">
            <div className="login-badge">
              <span className="dot"></span>
              <Sparkles className="login-badge-icon" style={{ width: '0.875rem', height: '0.875rem' }} />
              Connexion sécurisée
            </div>
            <h1>
              Bienvenue <span className="highlight">retour</span><br />
              sur votre tableau de bord
            </h1>
            <p>
              Connectez-vous pour accéder à vos données et gérer votre stock en temps réel.
            </p>
          </div>
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-number">24/7</span>
              <span className="login-stat-label">Disponible</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-number">SSL</span>
              <span className="login-stat-label">Sécurisé</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-number">✓</span>
              <span className="login-stat-label">Connexion rapide</span>
            </div>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Se connecter</h2>
            <p>Accédez à votre espace de travail</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <span>{error}</span>
                <button 
                  type="button"
                  onClick={() => setError("")}
                  className="login-error-close"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="login-field">
              <label>Email professionnel</label>
              <input
                type="email"
                required
                placeholder="vous@entreprise.com"
                className="login-field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-field">
              <label>Mot de passe</label>
              <div className="login-field-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="login-field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-field-toggle"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-forgot-link">
              <a href="/forgot-password">Mot de passe oublié ?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading ? (
                <Loader2 className="spinner" />
              ) : (
                <span>Se connecter →</span>
              )}
            </button>

            <div className="login-divider">
              <span>Ou continuer avec</span>
            </div>

            <button 
              type="button" 
              className="login-google"
              onClick={() => signIn("google")}
            >
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>

          <p className="login-form-footer">
            Pas encore de compte ? <a href="/register">S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  );
}