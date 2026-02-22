from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from passlib.context import CryptContext

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
from contextlib import contextmanager

# Configuración de conexión a PostgreSQL
 
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)

@contextmanager
def get_db():
    conn = engine.raw_connection()
    try:
        yield conn
    finally:
        conn.close()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"]
)


# Modelos CRUD
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    dept_id: int
    is_admin: Optional[bool] = False

class UserUpdate(BaseModel):
    full_name: Optional[str]
    dept_id: Optional[int]
    is_admin: Optional[bool]
    password: Optional[str]

class DepartmentCreate(BaseModel):
    id: int
    floor: int
    access_code: str

class DepartmentUpdate(BaseModel):
    id: Optional[int]
    floor: Optional[int]
    access_code: Optional[str]

class ResourceCreate(BaseModel):
    name: str
    type: str

class ResourceUpdate(BaseModel):
    name: Optional[str]
    type: Optional[str]

class ReservationCreate(BaseModel):
    res_id: int
    dept_id: int
    start_time: str
    end_time: str
    attendees: int

class ReservationUpdate(BaseModel):
    start_time: Optional[str]
    end_time: Optional[str]
    attendees: Optional[int]

    # Endpoint de login
class LoginRequest(BaseModel):
    email: str
    password: str

class GymReservationRequest(BaseModel):
    dept_id: int
    block: str  # formato '08:00-09:00'
    attendees: int


class CommonReservationRequest(BaseModel):
    dept_id: int
    resource_id: int
    date: str  # formato 'YYYY-MM-DD'
    attendees: int



@app.post("/api/login")
def login(req: LoginRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, password_hash, full_name, is_admin FROM users WHERE email=%s", (req.email,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
            user_id, email, password_hash, full_name, is_admin = user
            if not pwd_context.verify(req.password, password_hash):
                raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
            return {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "is_admin": is_admin
            }


# CRUD Usuarios
@app.get("/api/users")
def list_users():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, full_name, dept_id, is_admin FROM users ORDER BY full_name")
            return [
                {"id": r[0], "email": r[1], "full_name": r[2], "dept_id": r[3], "is_admin": r[4]}
                for r in cur.fetchall()
            ]
        
# CRUD Usuarios
@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, email, full_name, dept_id, is_admin FROM users WHERE id=%s", (user_id,))
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            return {"id": r[0], "email": r[1], "full_name": r[2], "dept_id": r[3], "is_admin": r[4]}

@app.post("/api/users")
def create_user(user: UserCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            from uuid import uuid4
            user_id = str(uuid4())
            if len(user.password.encode('utf-8')) > 72:
                raise HTTPException(status_code=400, detail="La contraseña no puede superar los 72 caracteres.")
            try:
                password_hash = pwd_context.hash(user.password)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Error al procesar la contraseña: {e}")
            cur.execute(
                """
                INSERT INTO users (id, email, password_hash, full_name, dept_id, is_admin)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, email, full_name, dept_id, is_admin
                """,
                (user_id, user.email, password_hash, user.full_name, user.dept_id, user.is_admin),
            )
            conn.commit()
            r = cur.fetchone()
            return {"id": r[0], "email": r[1], "full_name": r[2], "dept_id": r[3], "is_admin": r[4]}

@app.put("/api/users/{user_id}")
def update_user(user_id: str, user: UserUpdate):
    with get_db() as conn:
        with conn.cursor() as cur:
            fields = []
            values = []
            if user.full_name:
                fields.append("full_name=%s")
                values.append(user.full_name)
            if user.dept_id:
                fields.append("dept_id=%s")
                values.append(user.dept_id)
            if user.is_admin is not None:
                fields.append("is_admin=%s")
                values.append(user.is_admin)
            if user.password:
                fields.append("password_hash=%s")
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                values.append(pwd_context.hash(user.password))
            if not fields:
                raise HTTPException(status_code=400, detail="Nada para actualizar")
            values.append(user_id)
            cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=%s RETURNING id, email, full_name, dept_id, is_admin", tuple(values))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            return {"id": r[0], "email": r[1], "full_name": r[2], "dept_id": r[3], "is_admin": r[4]}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM users WHERE id=%s RETURNING id", (user_id,))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            return {"id": r[0]}

# CRUD Departamentos
@app.get("/api/departments")
def list_departments():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, floor, access_code FROM departments ORDER BY id")
            return [
                {"id": r[0], "floor": r[1], "access_code": r[2]}
                for r in cur.fetchall()
            ]

@app.post("/api/departments")
def create_department(dep: DepartmentCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO departments (id, floor, access_code)
                VALUES (%s, %s, %s)
                RETURNING id, floor, access_code
                """,
                (dep.id, dep.floor, dep.access_code),
            )
            conn.commit()
            r = cur.fetchone()
            return {"id": r[0], "floor": r[1], "access_code": r[2]}
        
@app.put("/api/departments/{dep_id}")
def update_department(dep_id: int, dep: DepartmentUpdate):
    with get_db() as conn:
        with conn.cursor() as cur:
            fields = []
            values = []
            if dep.number:
                fields.append("number=%s")
                values.append(dep.number)
            if dep.floor:
                fields.append("floor=%s")
                values.append(dep.floor)
            if dep.access_code:
                fields.append("access_code=%s")
                values.append(dep.access_code)
            if not fields:
                raise HTTPException(status_code=400, detail="Nada para actualizar")
            values.append(dep_id)
            cur.execute(f"UPDATE departments SET {', '.join(fields)} WHERE id=%s RETURNING id, number, floor, access_code", tuple(values))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Departamento no encontrado")
            return {"id": r[0], "floor": r[2], "access_code": r[3]}

@app.delete("/api/departments/{dep_id}")
def delete_department(dep_id: int):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM departments WHERE id=%s RETURNING id", (dep_id,))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Departamento no encontrado")
            return {"id": r[0]}

# CRUD Recursos
@app.get("/api/resources")
def list_resources():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, type FROM resources ORDER BY name")
            return [
                {"id": r[0], "name": r[1], "type": r[2]}
                for r in cur.fetchall()
            ]

@app.post("/api/resources")
def create_resource(res: ResourceCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO resources (name, type)
                VALUES (%s, %s)
                RETURNING id, name, type
                """,
                (res.name, res.type),
            )
            conn.commit()
            r = cur.fetchone()
            return {"id": r[0], "name": r[1], "type": r[2]}

@app.put("/api/resources/{res_id}")
def update_resource(res_id: int, res: ResourceUpdate):
    with get_db() as conn:
        with conn.cursor() as cur:
            fields = []
            values = []
            if res.name:
                fields.append("name=%s")
                values.append(res.name)
            if res.type:
                fields.append("type=%s")
                values.append(res.type)
            if not fields:
                raise HTTPException(status_code=400, detail="Nada para actualizar")
            values.append(res_id)
            cur.execute(f"UPDATE resources SET {', '.join(fields)} WHERE id=%s RETURNING id, name, type", tuple(values))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Recurso no encontrado")
            return {"id": r[0], "name": r[1], "type": r[2]}

@app.delete("/api/resources/{res_id}")
def delete_resource(res_id: int):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM resources WHERE id=%s RETURNING id", (res_id,))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Recurso no encontrado")
            return {"id": r[0]}

# CRUD Reservas
@app.get("/api/reservations")
def list_reservations():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, res_id, dept_id, start_time, end_time, attendees FROM reservations ORDER BY start_time DESC")
            return [
                {"id": r[0], "res_id": r[1], "dept_id": r[2], "start_time": r[3], "end_time": r[4], "attendees": r[5]}
                for r in cur.fetchall()
            ]

@app.post("/api/reservations")
def create_reservation(res: ReservationCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO reservations (res_id, dept_id, start_time, end_time, attendees)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, res_id, dept_id, start_time, end_time, attendees
                """,
                (res.res_id, res.dept_id, res.start_time, res.end_time, res.attendees),
            )
            conn.commit()
            r = cur.fetchone()
            return {"id": r[0], "res_id": r[1], "dept_id": r[2], "start_time": r[3], "end_time": r[4], "attendees": r[5]}

@app.put("/api/reservations/{resv_id}")
def update_reservation(resv_id: int, res: ReservationUpdate):
    with get_db() as conn:
        with conn.cursor() as cur:
            fields = []
            values = []
            if res.start_time:
                fields.append("start_time=%s")
                values.append(res.start_time)
            if res.end_time:
                fields.append("end_time=%s")
                values.append(res.end_time)
            if res.attendees:
                fields.append("attendees=%s")
                values.append(res.attendees)
            if not fields:
                raise HTTPException(status_code=400, detail="Nada para actualizar")
            values.append(resv_id)
            cur.execute(f"UPDATE reservations SET {', '.join(fields)} WHERE id=%s RETURNING id, res_id, dept_id, start_time, end_time, attendees", tuple(values))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Reserva no encontrada")
            return {"id": r[0], "res_id": r[1], "dept_id": r[2], "start_time": r[3], "end_time": r[4], "attendees": r[5]}

@app.delete("/api/reservations/{resv_id}")
def delete_reservation(resv_id: int):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM reservations WHERE id=%s RETURNING id", (resv_id,))
            conn.commit()
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="Reserva no encontrada")
            return {"id": r[0]}

# GET: Listar reservas de gimnasio por fecha
@app.get("/api/reserve/gym")
def get_gym_reservations(
    date: Optional[str] = Query(None, description="Fecha YYYY-MM-DD")
):
    with get_db() as conn:
        with conn.cursor() as cur:
            if not date:
                from datetime import date as dt

                date = dt.today().isoformat()
            start = f"{date}T00:00:00"
            end = f"{date}T23:59:59"
            cur.execute(
                """
                SELECT id, dept_id, start_time, end_time, attendees FROM reservations
                WHERE res_id=1 AND start_time >= %s AND start_time <= %s
                ORDER BY start_time
                """,
                (start, end),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "dept_id": r[1],
                    "start_time": r[2],
                    "end_time": r[3],
                    "attendees": r[4],
                }
                for r in rows
            ]


# GET: Listar reservas de espacios comunes por fecha y recurso
@app.get("/api/reserve/common")
def get_common_reservations(
    date: Optional[str] = Query(None, description="Fecha YYYY-MM-DD"),
    resource_id: Optional[int] = Query(None),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            if not date:
                from datetime import date as dt

                date = dt.today().isoformat()
            start = f"{date}T00:00:00"
            end = f"{date}T23:59:59"
            query = "SELECT id, res_id, dept_id, start_time, end_time, attendees FROM reservations WHERE start_time >= %s AND start_time <= %s"
            params = [start, end]
            if resource_id:
                query += " AND res_id=%s"
                params.append(resource_id)
            query += " ORDER BY res_id, start_time"
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "res_id": r[1],
                    "dept_id": r[2],
                    "start_time": r[3],
                    "end_time": r[4],
                    "attendees": r[5],
                }
                for r in rows
            ]


@app.get("/")
def read_root():
    return {"message": "Bienvenido a BuildingFlow API"}


@app.post("/api/reserve/gym")
def reserve_gym(req: GymReservationRequest):
    # Validación de bloque horario
    try:
        start, end = req.block.split("-")
        date = req.block_date if hasattr(req, "block_date") else None
        if not date:
            from datetime import date as dt

            date = dt.today().isoformat()
        start_time = f"{date}T{start}:00"
        end_time = f"{date}T{end}:00"
    except Exception:
        raise HTTPException(status_code=400, detail="Bloque horario inválido")
    if req.attendees < 1 or req.attendees > 2:
        raise HTTPException(
            status_code=400, detail="Máximo 2 personas por departamento"
        )
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                conn.autocommit = False
                # 1. Total de personas en el bloque
                cur.execute(
                    """
                    SELECT COALESCE(SUM(attendees),0) FROM reservations
                    WHERE start_time=%s AND res_id=1
                    """,
                    (start_time,),
                )
                total = cur.fetchone()[0]
                # 2. Personas de este depto en el bloque
                cur.execute(
                    """
                    SELECT COALESCE(SUM(attendees),0) FROM reservations
                    WHERE start_time=%s AND res_id=1 AND dept_id=%s
                    """,
                    (start_time, req.dept_id),
                )
                dept_total = cur.fetchone()[0]
                if total + req.attendees > 3:
                    raise HTTPException(
                        status_code=400, detail="Aforo total del bloque superado"
                    )
                if dept_total + req.attendees > 2:
                    raise HTTPException(
                        status_code=400,
                        detail="Máximo 2 personas por departamento en este bloque",
                    )
                # Insertar reserva
                cur.execute(
                    """
                    INSERT INTO reservations (res_id, dept_id, start_time, end_time, attendees)
                    VALUES (1, %s, %s, %s, %s)
                    """,
                    (req.dept_id, start_time, end_time, req.attendees),
                )
                conn.commit()
                return {"ok": True}
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=500, detail=f"Error al reservar: {e}")


@app.post("/api/reserve/common")
def reserve_common(req: CommonReservationRequest):
    # Reserva de quinchos/salas
    if req.attendees < 1:
        raise HTTPException(status_code=400, detail="Debe haber al menos 1 persona")
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                conn.autocommit = False
                # Validar si ya tiene reserva para ese recurso ese día
                cur.execute(
                    """
                    SELECT id FROM reservations
                    WHERE res_id=%s AND dept_id=%s
                    AND start_time >= %s AND start_time < %s
                    """,
                    (
                        req.resource_id,
                        req.dept_id,
                        f"{req.date}T00:00:00",
                        f"{req.date}T23:59:59",
                    ),
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Solo una reserva por día para este recurso",
                    )
                # Validar exclusividad del recurso
                cur.execute(
                    """
                    SELECT id FROM reservations
                    WHERE res_id=%s AND start_time >= %s AND start_time < %s
                    """,
                    (req.resource_id, f"{req.date}T00:00:00", f"{req.date}T23:59:59"),
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Este recurso ya está reservado todo el día",
                    )
                # Insertar reserva
                cur.execute(
                    """
                    INSERT INTO reservations (res_id, dept_id, start_time, end_time, attendees)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        req.resource_id,
                        req.dept_id,
                        f"{req.date}T00:00:00",
                        f"{req.date}T23:59:59",
                        req.attendees,
                    ),
                )
                conn.commit()
                return {"ok": True}
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=500, detail=f"Error al reservar: {e}")
