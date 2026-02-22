"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => {
      router.push("/");
    }, 2500);
    return () => clearTimeout(timer);
  }, [logout, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1A161D] p-4 font-sans tracking-tight">
      <section className="w-full max-w-sm animate-in fade-in zoom-in duration-1000">
        <div className="container-glass p-12 text-center relative overflow-hidden border-[#362E3A]">
          {/* Reflejo de luz naranja en la parte superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-[#C26B4E]/50 to-transparent" />
          
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 rounded-2xl border border-[#362E3A] flex items-center justify-center bg-[#1A161D] shadow-inner">
              <svg className="w-6 h-6 text-[#C26B4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="text-[#EEEEEE] text-3xl font-bold tracking-tighter mb-2">Sesión Finalizada</h1>
          <p className="text-[#888888] text-xs mb-8">Gracias por usar el sistema Edi5.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => router.push("/")}
              className="w-full py-4 bg-gradient-to-r from-[#C26B4E] to-[#7B5C7E] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_25px_rgba(194,107,78,0.2)] transition-all duration-500 active:scale-[0.98]"
            >
              Volver a ingresar
            </button>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 bg-[#C26B4E] rounded-full animate-bounce" />
              <p className="text-[9px] text-[#4A3B4D] uppercase font-bold tracking-[0.2em]">
                Redirigiendo al acceso...
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}