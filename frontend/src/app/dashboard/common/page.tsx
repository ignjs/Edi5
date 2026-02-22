"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useRouter } from "next/navigation";
import { API_HOST } from "../../../config/api";
import Link from "next/link";

export default function CommonSpacesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deptId, setDeptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserveLoading, setReserveLoading] = useState(false);

  // Redirección de seguridad
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Carga de Recursos e Información del Usuario
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [resResources, resUser] = await Promise.all([
          fetch(`${API_HOST}/api/resources`),
          fetch(`${API_HOST}/api/users/${user.id}`)
        ]);
        
        const resourcesData = await resResources.json();
        const userData = await resUser.json();
        
        setResources(resourcesData.filter((r: any) => r.type !== 'GYM') || []);
        if (userData?.dept_id) setDeptId(userData.dept_id);
      } catch (e) {
        console.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleReserve = async () => {
    setMessage("");
    setError("");
    if (!selected || !date) {
      setError("Selecciona un espacio y una fecha.");
      return;
    }
    
    setReserveLoading(true);
    try {
      const res = await fetch(`${API_HOST}/api/reserve/common`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_id: selected, date, attendees, dept_id: deptId }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage("Solicitud de reserva enviada con éxito.");
        setSelected(null);
        setDate("");
      } else {
        setError(result.detail || "No disponible para la fecha seleccionada.");
      }
    } catch (e) {
      setError("Error de conexión.");
    } finally {
      setReserveLoading(false);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-[#1A161D] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C26B4E] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#1A161D] text-[#EEEEEE] p-6 sm:p-10 font-sans tracking-tight">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12">
          <Link href="/dashboard" className="text-[#7B5C7E] text-[10px] uppercase tracking-widest font-bold hover:text-[#C26B4E] transition-colors flex items-center gap-2 mb-4">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Volver al Panel
          </Link>
          <h1 className="text-4xl font-bold tracking-tighter">Espacios Comunes</h1>
          <p className="text-[#888888] text-sm mt-2 font-medium">Selecciona el área social que deseas reservar.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Selector de Recursos (Visual) */}
          <div className="lg:col-span-2 space-y-4">
            <label className="text-[10px] text-[#7B5C7E] uppercase tracking-[0.2em] font-bold block mb-4">Espacios Disponibles</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`p-6 rounded-2xl border transition-all duration-300 text-left group
                    ${selected === r.id 
                      ? "bg-[#251F29] border-[#C26B4E] shadow-[0_0_30px_rgba(194,107,78,0.1)]" 
                      : "bg-[#251F29] border-[#362E3A] hover:border-[#7B5C7E]"}`}
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-colors 
                    ${selected === r.id ? "bg-[#C26B4E]/20 text-[#C26B4E]" : "bg-[#1A161D] text-[#888888]"}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg tracking-tight mb-1">{r.name}</h3>
                  <p className="text-[10px] text-[#888888] uppercase tracking-widest font-bold">{r.type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de Detalles */}
          <aside className="lg:col-span-1">
            <div className="container-glass p-8 sticky top-10">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#C26B4E] font-bold mb-8">Detalles de Reserva</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-[#888888] uppercase tracking-widest font-bold block mb-2">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-sm text-[#EEEEEE] focus:outline-none focus:border-[#C26B4E] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#888888] uppercase tracking-widest font-bold block mb-2">Invitados aproximados</label>
                  <input
                    type="number"
                    min={1}
                    value={attendees}
                    onChange={e => setAttendees(Number(e.target.value))}
                    className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-sm text-[#EEEEEE] focus:outline-none focus:border-[#7B5C7E] transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleReserve}
                    disabled={!selected || !date || reserveLoading}
                    className="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] bg-gradient-to-r from-[#C26B4E] to-[#7B5C7E] text-white disabled:opacity-20 transition-all hover:shadow-[0_0_30px_rgba(194,107,78,0.2)] active:scale-[0.98]"
                  >
                    {reserveLoading ? "Procesando..." : "Confirmar Disponibilidad"}
                  </button>
                </div>

                {message && (
                  <div className="p-4 bg-[#C26B4E]/10 border border-[#C26B4E]/20 text-[#C26B4E] text-[10px] font-bold uppercase tracking-widest text-center rounded-xl animate-in fade-in slide-in-from-top-2">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest text-center rounded-xl animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}