"use client";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { API_HOST } from "../config/api";

export default function Home() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_HOST}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const usuario = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          is_admin: data.is_admin,
        };
        localStorage.setItem("user", JSON.stringify(usuario));
        setUser(usuario);
        router.push(data.is_admin ? "/admin" : "/dashboard");
      } else {
        setError(data.detail || "Credenciales incorrectas.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 font-sans tracking-tight">
      <section className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
        
        {/* Identidad Visual Inspirada en el Ocaso */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-[#C26B4E] to-[#4A3B4D] rounded-2xl rotate-3 mb-4 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(194,107,78,0.2)]">
            <span className="text-white font-bold text-2xl -rotate-3 italic tracking-tighter">E5</span>
          </div>
          <h1 className="text-[#EEEEEE] text-3xl font-bold tracking-tighter">Edi5</h1>
          <p className="text-[#888888] text-[10px] mt-2 uppercase tracking-[0.3em] font-bold">Gestión Residencial</p>
        </div>

        {/* Contenedor Glass con Reflejo Naranja */}
        <div className="container-glass p-8 relative overflow-hidden">
          {/* Sutil línea de luz superior */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C26B4E]/50 to-transparent"></div>
          
          <h2 className="text-[#EEEEEE] text-xl font-bold tracking-tight mb-8">Ingresar al Sistema</h2>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="text-[#888888] text-[10px] uppercase tracking-[0.2em] font-bold block mb-2 px-1">
                Correo Electronico
              </label>
              <input
                id="email"
                type="text"
                autoFocus
                required
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl px-4 py-3 text-[#EEEEEE] transition-all duration-300 focus:outline-none focus:border-[#C26B4E] focus:ring-1 focus:ring-[#C26B4E]/20 placeholder:text-[#333333] font-medium"
                placeholder="ej: usuario@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-[#888888] text-[10px] uppercase tracking-[0.2em] font-bold block mb-2 px-1">
                Clave de Acceso
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full bg-[#0A0A0A] border border-[#262626] rounded-xl px-4 py-3 text-[#EEEEEE] transition-all duration-300 focus:outline-none focus:border-[#4A3B4D] focus:ring-1 focus:ring-[#4A3B4D]/20 placeholder:text-[#333333]"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-widest font-bold p-3 rounded-lg text-center animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`
                w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-500 mt-4
                ${isLoading 
                  ? "bg-[#262626] text-[#888888] cursor-not-allowed" 
                  : "bg-gradient-to-r from-[#C26B4E] to-[#4A3B4D] text-white hover:shadow-[0_0_25px_rgba(194,107,78,0.3)] active:scale-[0.98] border border-white/10"}
              `}
            >
              {isLoading ? "Validando..." : "Acceder"}
            </button>
          </form>
        </div>

        {/* Footer Minimalista */}
        <footer className="mt-12 text-center">
          <p className="text-[#333333] text-[9px] uppercase tracking-[0.4em] font-bold leading-relaxed">
            &copy; 2026 Edi5 System <br/> 
            <span className="opacity-50">High Performance Control</span>
          </p>
        </footer>
      </section>
    </main>
  );
}