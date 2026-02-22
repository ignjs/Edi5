"use client";

import { API_HOST } from "../../config/api";
import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const { user, logout } = useAuth(); // Extraemos logout del contexto
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'reservations' | 'departments' | 'resources'>('users');
  const [loading, setLoading] = useState(true);

  // Estados de Datos
  const [reservations, setReservations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Estados de Formularios
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', dept_id: '', is_admin: false });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ number: '', floor: '', access_code: '' });
  const [editingDept, setEditingDept] = useState<any>(null);
  const [resForm, setResForm] = useState({ name: '', type: 'GYM' });
  const [editingRes, setEditingRes] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  // --- PROTECCIÓN DE RUTA Y LOGOUT ---
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (!user.is_admin) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const fetchData = async () => {
    try {
      const [resv, depts, res, us] = await Promise.all([
        fetch(`${API_HOST}/api/reservations`).then(r => r.json()),
        fetch(`${API_HOST}/api/departments`).then(r => r.json()),
        fetch(`${API_HOST}/api/resources`).then(r => r.json()),
        fetch(`${API_HOST}/api/users`).then(r => r.json()),
      ]);
      setReservations(resv || []);
      setDepartments(depts || []);
      setResources(res || []);
      setUsers(us || []);
    } catch (e) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.is_admin) fetchData(); 
  }, [user]);

  // --- HANDLERS ---
  const handleDelete = async (endpoint: string, id: any) => {
    if (!confirm('¿Confirmas la eliminación permanente?')) return;
    const resp = await fetch(`${API_HOST}/api/${endpoint}/${id}`, { method: 'DELETE' });
    if (resp.ok) fetchData();
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${API_HOST}/api/users/${editingUser.id}` : `${API_HOST}/api/users`;
    const payload = { ...userForm };
    if (editingUser && !payload.password) delete payload.password;

    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      setUserForm({ email: '', password: '', full_name: '', dept_id: '', is_admin: false });
      setEditingUser(null);
      fetchData();
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDept ? 'PUT' : 'POST';
    const url = editingDept ? `${API_HOST}/api/departments/${editingDept.id}` : `${API_HOST}/api/departments`;
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptForm)
    });
    if (resp.ok) {
      setDeptForm({ number: '', floor: '', access_code: '' });
      setEditingDept(null);
      fetchData();
    }
  };

  const handleResSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingRes ? 'PUT' : 'POST';
    const url = editingRes ? `${API_HOST}/api/resources/${editingRes.id}` : `${API_HOST}/api/resources`;
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resForm)
    });
    if (resp.ok) {
      setResForm({ name: '', type: 'GYM' });
      setEditingRes(null);
      fetchData();
    }
  };

  const getDeptLabel = (id: any) => {
    const d = departments.find(d => d.id === Number(id));
    return d ? d.number : 'N/A';
  };

  if (loading || !user || !user.is_admin) return <div className="min-h-screen bg-[#1A161D]" />;

  return (
    <main className="min-h-screen bg-[#1A161D] text-[#EEEEEE] p-6 sm:p-10 font-sans tracking-tight">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
               <span className="text-[#C26B4E] text-[10px] font-bold uppercase tracking-widest border border-[#C26B4E]/30 px-2 py-1 rounded">Modo Administrador</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter italic">Panel de Control</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex bg-[#251F29] p-1 rounded-xl border border-[#362E3A]">
              {(['users', 'reservations', 'departments', 'resources'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#C26B4E] text-white shadow-lg' : 'text-[#888888]'}`}
                >
                  {tab === 'users' ? 'Usuarios' : tab === 'reservations' ? 'Reservas' : tab === 'departments' ? 'Deptos' : 'Recursos'}
                </button>
              ))}
            </nav>
            <button 
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl border border-red-500/20 transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* TAB USUARIOS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="container-glass p-8">
                <h3 className="text-[10px] uppercase tracking-widest text-[#C26B4E] font-bold mb-6">{editingUser ? 'Editar Registro' : 'Nuevo Usuario'}</h3>
                <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Email</label>
                    <input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Nombre</label>
                    <input value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Clave</label>
                    <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" required={!editingUser} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Depto</label>
                    <select value={userForm.dept_id} onChange={e => setUserForm({...userForm, dept_id: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]">
                      <option value="">Seleccionar...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.number}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="py-3 bg-[#C26B4E] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                </form>
              </div>

              <div className="container-glass overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A161D] text-[#7B5C7E] font-bold uppercase tracking-widest border-b border-[#362E3A]">
                    <tr><th className="p-4">Nombre / Email</th><th className="p-4">Depto</th><th className="p-4">Rol</th><th className="p-4 text-right">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#362E3A]">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span className="font-bold block">{u.full_name}</span>
                          <span className="text-[9px] text-[#888888]">{u.email}</span>
                        </td>
                        <td className="p-4 font-mono">{getDeptLabel(u.dept_id)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-[4px] text-[8px] font-bold uppercase ${u.is_admin ? 'bg-[#7B5C7E]/20 text-[#7B5C7E]' : 'bg-[#362E3A] text-[#888888]'}`}>
                            {u.is_admin ? 'Administrador' : 'Residente'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-3">
                          <button onClick={() => { setEditingUser(u); setUserForm({...u, password: ''}); }} className="text-[#888888] hover:text-white uppercase text-[9px] font-bold">Editar</button>
                          <button onClick={() => handleDelete('users', u.id)} className="text-red-500/40 hover:text-red-500 uppercase text-[9px] font-bold">Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB RESERVAS */}
          {activeTab === 'reservations' && (
            <div className="container-glass overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A161D] text-[#7B5C7E] font-bold uppercase tracking-widest border-b border-[#362E3A]">
                  <tr><th className="p-4">Bloque Horario</th><th className="p-4">Espacio</th><th className="p-4">Depto</th><th className="p-4 text-right">Acción</th></tr>
                </thead>
                <tbody className="divide-y divide-[#362E3A]">
                  {reservations.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-[#888888] uppercase text-[9px] tracking-[0.2em]">Sin registros actuales</td></tr>
                  ) : (
                    reservations.map(r => (
                      <tr key={r.id} className="hover:bg-red-500/5 transition-colors">
                        <td className="p-4 font-bold">{r.start_time} - {r.end_time}</td>
                        <td className="p-4 text-[#C26B4E] font-bold uppercase tracking-tight">{resources.find(res => res.id === r.res_id)?.name || 'Cargando...'}</td>
                        <td className="p-4 font-mono">{getDeptLabel(r.dept_id)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete('reservations', r.id)} className="bg-red-500/10 text-red-500 px-3 py-1 rounded-md text-[8px] font-bold uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Cancelar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB DEPARTAMENTOS */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="container-glass p-8">
                <h3 className="text-[10px] uppercase tracking-widest text-[#C26B4E] font-bold mb-6">{editingDept ? 'Modificar Departamento' : 'Añadir Unidad'}</h3>
                <form onSubmit={handleDeptSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">N° Unidad</label>
                    <input value={deptForm.number} onChange={e => setDeptForm({...deptForm, number: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" placeholder="101" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Piso</label>
                    <input value={deptForm.floor} onChange={e => setDeptForm({...deptForm, floor: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" placeholder="1" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">PIN de Acceso</label>
                    <input value={deptForm.access_code} onChange={e => setDeptForm({...deptForm, access_code: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" placeholder="4455" required />
                  </div>
                  <button type="submit" className="py-3 bg-[#C26B4E] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">Guardar</button>
                </form>
              </div>
              <div className="container-glass overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A161D] text-[#7B5C7E] uppercase tracking-widest">
                    <tr><th className="p-4">Número</th><th className="p-4">Nivel</th><th className="p-4">Código</th><th className="p-4 text-right">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#362E3A]">
                    {departments.map(d => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold">Depto {d.number}</td>
                        <td className="p-4 text-[#888888]">Piso {d.floor}</td>
                        <td className="p-4 font-mono text-[#C26B4E]">{d.access_code}</td>
                        <td className="p-4 text-right space-x-4">
                          <button onClick={() => { setEditingDept(d); setDeptForm(d); }} className="text-[#888888] hover:text-white text-[9px] font-bold uppercase">Editar</button>
                          <button onClick={() => handleDelete('departments', d.id)} className="text-red-500/40 hover:text-red-500 text-[9px] font-bold uppercase">Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB RECURSOS */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="container-glass p-8">
                <h3 className="text-[10px] uppercase tracking-widest text-[#C26B4E] font-bold mb-6">Administrar Instalaciones</h3>
                <form onSubmit={handleResSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Nombre</label>
                    <input value={resForm.name} onChange={e => setResForm({...resForm, name: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-[#888888] font-bold">Tipo de Área</label>
                    <select value={resForm.type} onChange={e => setResForm({...resForm, type: e.target.value})} className="w-full bg-[#1A161D] border border-[#362E3A] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#C26B4E]">
                      <option value="GYM">GYM</option>
                      <option value="QUINCHO">QUINCHO</option>
                      <option value="SALA">SALA</option>
                    </select>
                  </div>
                  <button type="submit" className="py-3 bg-[#C26B4E] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">Agregar Espacio</button>
                </form>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map(r => (
                  <div key={r.id} className="container-glass p-6 flex justify-between items-center group border border-white/5 hover:border-[#C26B4E]/30 transition-all">
                    <div>
                      <p className="text-[8px] text-[#7B5C7E] font-bold uppercase mb-1 tracking-widest">{r.type}</p>
                      <h4 className="font-bold text-lg tracking-tighter">{r.name}</h4>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingRes(r); setResForm(r); }} className="text-[9px] font-bold text-[#888888] hover:text-[#C26B4E] uppercase">Editar</button>
                      <button onClick={() => handleDelete('resources', r.id)} className="text-[9px] font-bold text-red-500/40 hover:text-red-500 uppercase">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}