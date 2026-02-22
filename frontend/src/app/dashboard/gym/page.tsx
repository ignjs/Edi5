"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useRouter } from "next/navigation";
import { API_HOST } from "../../../config/api";
import Link from "next/link";

const BLOCKS = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
  "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00",
];

export default function GymPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [attendees, setAttendees] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  
  const [availability, setAvailability] = useState<{ [block: string]: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deptId, setDeptId] = useState<number | null>(null);

  const fetchAvailability = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_HOST}/api/reserve/gym?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch (e) {
      console.error("Error de sincronización");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, 20000);
    return () => clearInterval(interval);
  }, [fetchAvailability]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchDeptId() {
      if (!user) return;
      const res = await fetch(`${API_HOST}/api/users/${user.id}`);
      const data = await res.json();
      if (data?.dept_id) setDeptId(data.dept_id);
    }
    fetchDeptId();
  }, [user]);

  const handleReserve = async () => {
    setReserveLoading(true);
    setMessage("");
    setError("");
    
    try {
      const res = await fetch(`${API_HOST}/api/reserve/gym`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block: selectedBlock, attendees, dept_id: deptId }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setMessage("Reserva confirmada exitosamente.");
        await fetchAvailability();
      } else {
        setError(result.detail || "El cupo ha cambiado. Intenta con otro bloque.");
        await fetchAvailability();
      }
    } catch (e) {
      setError("Error de red.");
    } finally {
      setReserveLoading(false);
    }
  };

  if (authLoading || availability === null) {
    return (
      <div className="min-h-screen bg-[#1A161D] flex flex-col items-center justify-center text-[#7B5C7E] font-sans">
        <div className="w-6 h-6 border-2 border-[#C26B4E] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Verificando Aforo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A161D] text-[#EEEEEE] p-6 sm:p-10 font-sans tracking-tight">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 flex justify-between items-start">
          <div>
            <Link href="/dashboard" className="text-[#7B5C7E] text-[10px] uppercase tracking-widest font-bold hover:text-[#C26B4E] transition-colors flex items-center gap-2 mb-4">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              Volver al Panel
            </Link>
            <h1 className="text-4xl font-bold tracking-tighter text-[#EEEEEE]">Gimnasio</h1>
            <p className="text-[#888888] text-sm mt-1">Aforo máximo: 3 personas simultáneas.</p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#251F29] border border-[#362E3A] text-[9px] uppercase tracking-widest font-bold text-[#888888]">
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-[#C26B4E]'}`}></div>
            {isSyncing ? 'Actualizando' : 'En Vivo'}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Grilla de Bloques */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {BLOCKS.map(block => {
              const count = availability[block] ?? 0;
              const availableSlots = 3 - count;
              const isFull = availableSlots <= 0;
              const isSelected = selectedBlock === block;

              return (
                <button
                  key={block}
                  disabled={isFull}
                  onClick={() => setSelectedBlock(block)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden
                    ${isFull ? "bg-[#141116] border-[#251F29] text-zinc-600 opacity-40 cursor-not-allowed" 
                             : isSelected ? "bg-[#251F29] border-[#C26B4E] shadow-[0_0_20px_rgba(194,107,78,0.1)]" 
                                          : "bg-[#251F29] border-[#362E3A] hover:border-[#7B5C7E]"}`}
                >
                  <span className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isSelected ? "text-[#C26B4E]" : "text-[#888888]"}`}>
                    {block}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tighter">{availableSlots}</span>
                    <span className="text-[10px] text-[#888888] uppercase font-bold tracking-widest">Cupos</span>
                  </div>
                  
                  {/* Indicador visual de carga/disponibilidad */}
                  {!isFull && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#362E3A]">
                      <div 
                        className={`h-full transition-all duration-500 ${isSelected ? "bg-[#C26B4E]" : "bg-[#7B5C7E]/40"}`}
                        style={{ width: `${(availableSlots / 3) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel de Acción */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="container-glass p-6 sticky top-10">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#C26B4E] font-bold mb-6">Confirmar Reserva</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] text-[#888888] uppercase block mb-4 font-bold tracking-widest">Personas</label>
                  <div className="flex bg-[#1A161D] border border-[#362E3A] rounded-xl p-1">
                    {[1, 2].map(n => (
                      <button 
                        key={n}
                        onClick={() => setAttendees(n)}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${attendees === n ? 'bg-[#C26B4E] text-white shadow-lg' : 'text-[#888888] hover:text-[#EEEEEE]'}`}
                      >{n} {n === 1 ? 'Persona' : 'Personas'}</button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={!selectedBlock || reserveLoading}
                    onClick={handleReserve}
                    className="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] bg-gradient-to-r from-[#C26B4E] to-[#7B5C7E] text-white disabled:opacity-20 disabled:grayscale transition-all hover:shadow-[0_0_30px_rgba(194,107,78,0.2)] active:scale-[0.98]"
                  >
                    {reserveLoading ? "Procesando..." : "Finalizar Reserva"}
                  </button>
                </div>

                {(error || message) && (
                  <div className={`p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2
                    ${error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-[#C26B4E]/10 border-[#C26B4E]/20 text-[#C26B4E]"}`}>
                    {error || message}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border border-[#362E3A] rounded-2xl bg-transparent">
              <p className="text-[9px] text-[#888888] leading-relaxed uppercase tracking-widest">
                Importante: Las reservas son por bloque de 60 min. Favor llegar puntualmente y sanitizar máquinas al finalizar.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}