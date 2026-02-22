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
  const [userReservation, setUserReservation] = useState<any | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!deptId) return;
    setIsSyncing(true);
    try {
      // Usamos el nuevo endpoint de disponibilidad optimizado
      const res = await fetch(`${API_HOST}/api/reserve/gym/availability?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
      
      // Consultamos las reservas del departamento
      const resUser = await fetch(`${API_HOST}/api/reservations?dept_id=${deptId}`);
      if (resUser.ok) {
        const reservations = await resUser.json();
        const activeGymRes = reservations.find((r: any) => 
          r.res_id === 1 || r.resource_name?.toLowerCase().includes('gym')
        );
        
        if (activeGymRes) {
          setUserReservation(activeGymRes);
          // La API nos devuelve start_time como "2023-10-10T08:00:00"
          // Mapeamos de vuelta al formato del bloque "08:00-09:00"
          const timePart = activeGymRes.start_time.split('T')[1].substring(0, 5);
          const foundBlock = BLOCKS.find(b => b.startsWith(timePart));
          
          if (foundBlock) {
            setSelectedBlock(foundBlock);
            setAttendees(activeGymRes.attendees);
          }
        } else {
          setUserReservation(null);
        }
      }
    } catch (e) {
      console.error("Error de sincronización");
    } finally {
      setIsSyncing(false);
    }
  }, [deptId]);

  useEffect(() => {
    async function init() {
      if (!user) return;
      const res = await fetch(`${API_HOST}/api/users/${user.id}`);
      const data = await res.json();
      if (data?.dept_id) setDeptId(data.dept_id);
    }
    if (!authLoading && user) init();
  }, [user, authLoading]);

  useEffect(() => {
    if (deptId) {
      fetchAvailability();
      const interval = setInterval(fetchAvailability, 20000);
      return () => clearInterval(interval);
    }
  }, [deptId, fetchAvailability]);

  const handleReserve = async () => {
    if (!selectedBlock || !deptId) return;
    setReserveLoading(true);
    setMessage("");
    setError("");
    
    // De acuerdo a la nueva API, el POST maneja tanto la creación como la actualización 
    // si el bloque coincide, pero el frontend prefiere ser explícito.
    try {
      const res = await fetch(`${API_HOST}/api/reserve/gym`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            block: selectedBlock, 
            attendees: attendees, 
            dept_id: deptId 
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setMessage(result.message || "Operación realizada con éxito.");
        await fetchAvailability();
      } else {
        setError(result.detail || "No se pudo procesar la reserva.");
        // Si hay error, refrescamos para asegurar que el estado visual sea real
        await fetchAvailability();
      }
    } catch (e) {
      setError("Error de red al intentar conectar con la API.");
    } finally {
      setReserveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userReservation || !confirm("¿Eliminar tu reserva para liberar el cupo?")) return;
    setReserveLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/reservations/${userReservation.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUserReservation(null);
        setSelectedBlock(null);
        setAttendees(1);
        setMessage("Reserva cancelada exitosamente.");
        await fetchAvailability();
      } else {
          setError("No se pudo eliminar la reserva.");
      }
    } catch (e) {
      setError("Error de conexión.");
    } finally {
      setReserveLoading(false);
    }
  };

  if (authLoading || availability === null) return (
    <div className="min-h-screen bg-[#1A161D] flex items-center justify-center">
        <div className="text-[#C26B4E] font-bold animate-pulse tracking-widest uppercase text-xs">Sincronizando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A161D] text-[#EEEEEE] p-6 sm:p-10 font-sans tracking-tight">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <Link href="/dashboard" className="text-[#7B5C7E] text-[10px] uppercase font-bold flex items-center gap-2 mb-4 hover:text-[#C26B4E] transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tighter italic text-white">Gimnasio</h1>
            {userReservation && (
              <div className="flex items-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full bg-[#C26B4E] animate-ping"></span>
                <p className="text-[10px] text-[#C26B4E] font-bold uppercase tracking-widest">
                  Reserva activa: {selectedBlock} ({userReservation.attendees} {userReservation.attendees === 1 ? 'pers.' : 'pers.'})
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#251F29] border border-[#362E3A] text-[9px] uppercase tracking-widest font-bold text-[#888888]">
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-[#C26B4E]'}`}></div>
            {isSyncing ? 'Actualizando' : 'Live'}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {BLOCKS.map(block => {
              const occupied = availability[block] ?? 0;
              const isSelected = selectedBlock === block;
              const isFull = (3 - occupied) <= 0 && !isSelected;
              
              // RESTRICCIÓN: Si ya hay reserva, bloqueamos visualmente el resto
              const isLocked = userReservation && !isSelected;

              return (
                <button
                  key={block}
                  disabled={isFull || isLocked || reserveLoading}
                  onClick={() => setSelectedBlock(block)}
                  className={`group relative p-5 rounded-2xl border transition-all duration-500 text-left
                    ${isLocked ? "opacity-10 grayscale cursor-not-allowed border-transparent" : ""}
                    ${isFull ? "bg-[#141116] border-[#251F29] text-zinc-700 opacity-40" 
                             : isSelected ? "bg-[#251F29] border-[#C26B4E] shadow-[0_0_20px_rgba(194,107,78,0.2)]" 
                                          : "bg-[#251F29] border-[#362E3A] hover:border-[#7B5C7E]"}`}
                >
                  <span className={`block text-[10px] font-bold uppercase mb-3 ${isSelected ? "text-[#C26B4E]" : "text-[#888888]"}`}>
                    {block}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tighter">
                        {3 - occupied}
                    </span>
                    <span className="text-[10px] text-[#888888] uppercase font-bold">Cupos</span>
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="lg:col-span-1">
            <div className="container-glass p-6 sticky top-10 border border-white/5 bg-[#251F29]/50 backdrop-blur-xl rounded-3xl">
              <h3 className="text-[10px] uppercase tracking-widest text-[#C26B4E] font-bold mb-6">Gestión de Cupos</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-[#888888] uppercase block mb-3 font-bold">¿Cuántos asisten?</label>
                  <div className="flex bg-[#120F14] border border-[#362E3A] rounded-xl p-1">
                    {[1, 2].map(n => (
                      <button 
                        key={n}
                        onClick={() => setAttendees(n)}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all ${attendees === n ? 'bg-[#C26B4E] text-white shadow-lg' : 'text-[#888888] hover:text-[#EEEEEE]'}`}
                      >{n} {n === 1 ? 'Persona' : 'Personas'}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Botón Reservar/Actualizar: solo se muestra si no hay reserva o si se quiere cambiar el número de personas */}
                  {(!userReservation || (userReservation && userReservation.attendees !== attendees)) && (
                    <button
                      disabled={!selectedBlock || reserveLoading}
                      onClick={handleReserve}
                      className="w-full py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-gradient-to-br from-[#C26B4E] to-[#7B5C7E] text-white disabled:opacity-20 transition-all hover:brightness-110 active:scale-95"
                    >
                      {userReservation ? "Guardar Cambios" : "Confirmar Reserva"}
                    </button>
                  )}

                  {userReservation && (
                    <button
                      onClick={handleDelete}
                      disabled={reserveLoading}
                      className="w-full py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>

                {(error || message) && (
                  <div className={`p-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest text-center animate-pulse
                    ${error ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-[#C26B4E]/5 border-[#C26B4E]/20 text-[#C26B4E]"}`}>
                    {error || message}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}