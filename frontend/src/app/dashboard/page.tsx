"use client";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen bg-[#1A161D]" />;

  return (
    <main className="min-h-screen bg-[#1A161D] text-[#EEEEEE] p-6 pb-24 sm:p-10 font-sans tracking-tight">
      <div className="max-w-6xl mx-auto">
        
        {/* Header con Botón de Salida */}
        <header className="flex justify-between items-end mb-12 border-b border-[#362E3A] pb-8">
          <div>
            <p className="text-[#7B5C7E] text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Residente</p>
            <h1 className="text-4xl font-bold tracking-tighter italic">Hola, {user.full_name.split(' ')[0]}</h1>
          </div>
          
          <Link href="/logout" className="group flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] text-[#888888] uppercase font-bold tracking-widest group-hover:text-[#C26B4E] transition-colors">Cerrar Sesión</p>
                <p className="text-[10px] text-[#333333] font-mono group-hover:text-[#888888]">Finalizar sesión</p>
             </div>
             <div className="w-10 h-10 rounded-xl border border-[#362E3A] flex items-center justify-center bg-[#251F29] group-hover:border-[#C26B4E] group-hover:bg-[#C26B4E]/10 transition-all">
                <svg className="w-5 h-5 text-[#888888] group-hover:text-[#C26B4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </div>
          </Link>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
          {/* Card Gimnasio */}
          <Link href="/dashboard/gym" className="md:col-span-4 row-span-2 group container-glass relative overflow-hidden flex flex-col justify-end p-8 border-[#362E3A] hover:border-[#C26B4E]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C26B4E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <span className="text-[#C26B4E] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 block">Área de Bienestar</span>
              <h2 className="text-5xl font-bold tracking-tighter mb-4">Gimnasio</h2>
              <p className="text-[#888888] max-w-xs text-sm leading-relaxed mb-6">Reserva tu turno de 60 minutos. Máximo 3 personas por bloque.</p>
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                Ir a reservar <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </Link>

          {/* Card Mis Reservas */}
          <Link href="/dashboard/my-reservations" className="md:col-span-2 row-span-1 container-glass p-8 flex flex-col justify-between border-[#362E3A] hover:border-[#7B5C7E] group">
            <h3 className="text-[#7B5C7E] text-[10px] uppercase tracking-widest font-bold">Mis Agendas</h3>
            <div>
              <p className="text-2xl font-bold tracking-tighter">Reservas</p>
              <p className="text-[#888888] text-[9px] uppercase mt-1 tracking-[0.2em]">Ver y Cancelar</p>
            </div>
          </Link>

          {/* Card Espacios Comunes */}
          <Link href="/dashboard/common" className="md:col-span-2 row-span-1 container-glass p-8 flex flex-col justify-between border-[#362E3A] hover:border-white/10 group">
            <h3 className="text-[#888888] text-[10px] uppercase tracking-widest font-bold">Social</h3>
            <div>
              <p className="text-2xl font-bold tracking-tighter">Zonas Comunes</p>
              <p className="text-[#888888] text-[9px] uppercase mt-1 tracking-[0.2em]">Quinchos y Salas</p>
            </div>
          </Link>
        </div>

        {/* Tab Bar Móvil */}
        <nav className="fixed bottom-0 left-0 w-full bg-[#1A161D]/90 border-t border-[#362E3A] flex justify-around py-4 z-50 backdrop-blur-md">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#C26B4E]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span className="text-[9px] uppercase font-bold">Panel</span>
          </Link>
          <Link href="/logout" className="flex flex-col items-center gap-1 text-[#4A3B4D]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-[9px] uppercase font-bold">Salir</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}