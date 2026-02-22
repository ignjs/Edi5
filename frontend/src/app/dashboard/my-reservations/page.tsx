"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useRouter } from "next/navigation";
import { API_HOST } from "../../../config/api";
import Link from "next/link";

export default function MyReservationsPage() {
  const { user } = useAuth(); //
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.push("/login"); //
  }, [user, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const [resReserv, resResour] = await Promise.all([
          fetch(`${API_HOST}/api/reservations?user_id=${user.id}`),
          fetch(`${API_HOST}/api/resources`)
        ]);
        setReservations(await resReserv.json() || []);
        setResources(await resResour.json() || []);
      } catch (e) {
        console.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleCancel = async (id: number) => {
    if (!confirm("¿Deseas anular esta reserva?")) return;
    const res = await fetch(`${API_HOST}/api/reservations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReservations(prev => prev.filter(r => r.id !== id));
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-[#1A161D] flex items-center justify-center">
      <div className="text-[#7B5C7E] font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Sincronizando...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#1A161D] p-6 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 border-b border-[#362E3A] pb-6">
          <div>
            <Link href="/dashboard" className="text-[#7B5C7E] text-[10px] uppercase tracking-widest font-bold hover:text-[#C26B4E] transition-colors flex items-center gap-2 mb-4">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              Volver al Panel
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter text-[#EEEEEE]">Mis Reservas</h2>
          <p className="text-[#888888] text-[10px] uppercase tracking-widest mt-2 font-bold">Actividad de tu departamento</p>
        </header>



        {reservations.length === 0 ? (
          <div className="container-glass p-20 text-center border-dashed">
            <p className="text-[#888888] text-xs uppercase tracking-widest">No hay registros activos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(r => (
              <div key={r.id} className="container-glass p-6 flex flex-col sm:flex-row items-center justify-between hover:border-[#7B5C7E]/50 group">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1A161D] border border-[#362E3A] flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[#C26B4E] font-bold">ID</span>
                    <span className="text-sm font-bold">{r.id}</span>
                  </div>
                  <div>
                    <h4 className="text-[#EEEEEE] font-bold tracking-tight">
                      {resources.find(res => res.id === r.res_id)?.name || "Recurso"}
                    </h4>
                    <p className="text-[#888888] text-[10px] font-mono mt-1 italic">
                      {r.start_time} — {r.end_time}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-[#888888] uppercase tracking-tighter">Asistentes</p>
                    <p className="text-sm font-bold text-[#7B5C7E]">{r.attendees}</p>
                  </div>
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="py-2 px-6 rounded-lg bg-[#C26B4E]/10 border border-[#C26B4E]/20 text-[#C26B4E] text-[10px] uppercase tracking-widest font-bold hover:bg-[#C26B4E] hover:text-white transition-all"
                  >
                    Anular
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}