const API_URL = 'http://localhost:3000/api/tickets';
let totalTicketsPrevio = 0; 
const sonidoAlerta = new Audio('Notificacion1.mp3');
let filtroActual = 'todos';
let idTicketSeleccionado = null;
let textoBusqueda = ''; 
window.estaEscribiendoNota = false;
let ticketIdAenviar = null;

function sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

async function verificarAcceso() {
    const token = localStorage.getItem('adminToken');
    const role = parseInt(localStorage.getItem('userRole'));
    const paginaActual = window.location.pathname;

    if (!token) {
        window.location.replace("login.html");
        return false;
    }

    if (paginaActual.includes('admin.html') && role !== 1) {
        window.location.replace(role === 2 ? "dashboard.html" : "index.html");
        return false;
    }

    if (paginaActual.includes('dashboard.html') && role !== 2 && role !== 1) {
        window.location.replace("index.html");
        return false;
    }

    return true; 
}

if (!verificarAcceso()) {
    throw new Error("Acceso no autorizado: Redirigiendo...");
} else {

    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('admin.html')) {
            cargarTickets();
        }
    });
}
verificarAcceso();

const form = document.getElementById('ticketForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketData = {
            usuario: document.getElementById('usuario').value,
            prioridad: document.getElementById('prioridad').value,
            red: document.getElementById('red').value,
            categoria: document.getElementById('categoria').value,
            descripcion: document.getElementById('descripcion').value
        };
 
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });
 
            if (res.ok) {
                form.reset();
                document.getElementById('mensajeExito').style.display = 'block';
                setTimeout(() => document.getElementById('mensajeExito').style.display = 'none', 5000);
            } else {
                alert("Error al enviar el ticket. Intenta de nuevo.");
            }
        } catch (error) {
            alert("No se pudo conectar con el servidor.");
            console.error(error);
        }
    });
}
function protegerPagina() {
    const token = localStorage.getItem('adminToken');
    const role = parseInt(localStorage.getItem('userRole'));
    const path = window.location.pathname;

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    
    if (path.includes('admin.html') && role !== 1) {
        alert("Acceso exclusivo para Sistemas");
        window.location.replace("index.html");
    }
    
    if (path.includes('dashboard.html') && (role !== 2 && role !== 1)) {
        alert("Acceso para Administradores");
        window.location.replace("index.html");
    }
}
protegerPagina();

async function cargarTickets() {
    const lista = document.getElementById('listaTickets');
    if (!lista) return; 
 
    try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
 
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            window.location.href = "login.html";
            return;
        }
 
        if (!res.ok) throw new Error("Error en el servidor");
 
        let tickets = await res.json();
        tickets.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        document.getElementById('count-abiertos').innerText = tickets.filter(t => t.estado === 'Pendiente').length;
        document.getElementById('count-proceso').innerText = tickets.filter(t => t.estado === 'En Proceso').length;
        document.getElementById('count-resueltos').innerText = tickets.filter(t => t.estado === 'Resuelto').length;
 
        if (tickets.length > totalTicketsPrevio && totalTicketsPrevio !== 0) {
            sonidoAlerta.play().catch(e => console.log("Error sonido"));
            mostrarNotificacionVisual(tickets[0]);
        }
        totalTicketsPrevio = tickets.length;
 
        if (filtroActual !== 'todos') {
            tickets = tickets.filter(t => t.estado === filtroActual);
        }
 
        if (textoBusqueda !== '') {
            const busqueda = textoBusqueda.toLowerCase();
            tickets = tickets.filter(t => 
                (t.usuario || "").toLowerCase().includes(busqueda) || 
                (t.red || "").toLowerCase().includes(busqueda) || 
                (t.descripcion || "").toLowerCase().includes(busqueda)
            );
        }
 
        renderizarTickets(tickets);
 
    } catch (err) {
        console.error("Error cargando tickets:", err);
    }
}
function renderizarTickets(tickets) {
    const lista = document.getElementById('listaTickets');
    lista.innerHTML = '';
 
    tickets.forEach(t => {
        const div = document.createElement('div');
        const clasePrioridad = `prioridad-${(t.prioridad || 'baja').toLowerCase()}`;
        div.className = `ticket-item ${clasePrioridad}`;
 
        let notasHTML = '';
        if (t.notas && t.notas.length > 0) {
            notasHTML = `<div class="notas-contenedor">`;
            t.notas.forEach(n => {
                notasHTML += `<div class="nota-item"><small>[${sanitize(n.fecha)}]:</small> ${sanitize(n.texto)}</div>`;
            });
            notasHTML += `</div>`;
        }
 
        let botones = '';
        if (t.estado === 'Pendiente') {
            botones = `<button onclick="cambiarEstado('${t._id}', 'En Proceso')" class="btn-atender">Atender</button>`;
        } else if (t.estado === 'En Proceso') {
            botones = `<button onclick="finalizarTicket('${t._id}')" class="btn-resolver">Finalizar</button>`;
        }
 
        div.innerHTML = `
            <div style="flex: 1;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <strong>${sanitize(t.usuario)}</strong>
                    <span class="badge-prioridad">${sanitize(t.prioridad)}</span>
                </div>
                <div class="ticket-meta">
                    <span>📍 ${sanitize(t.red) || 'Sin Red'}</span> | <span>💻 ${sanitize(t.categoria) || 'Gral'}</span> | <small>${sanitize(t.fecha)}</small>
                </div>
                <div class="ticket-desc">${sanitize(t.descripcion)}</div>
                ${notasHTML}
                ${t.estado !== 'Resuelto' ? `
                    <div class="nota-input-group">
                        <input type="text" id="inputNota-${t._id}" placeholder="Nota de avance..." 
    onfocus="window.estaEscribiendoNota=true" 
    onblur="window.estaEscribiendoNota=false">
                        <button onclick="agregarNota('${t._id}')">➕</button>
                    </div>` : ''}
                ${t.estado === 'Resuelto' ? `
                    <div class="solucion-final">
                        <strong>✅ Solución:</strong> ${sanitize(t.solucion)} <br>
                        <small>Causa: ${sanitize(t.causaRaiz)} | ${sanitize(t.fechaCierre)}</small>
                    </div>` : ''}
            </div>
            <div class="ticket-acciones">
                <span class="status-badge ${t.estado.toLowerCase().replace(' ', '-')}">${sanitize(t.estado)}</span>
                <div style="margin-top:10px;">${botones}</div>
            </div>
        `;
        lista.appendChild(div);
    });
}

window.cambiarEstado = async (id, nuevoEstado) => {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.ok) {
            await cargarTickets(); 
        }
    } catch (error) {
        console.error("Error al cambiar estado:", error);
    }
};
 
window.finalizarTicket = (id) => {
    ticketIdAenviar = id;
    document.getElementById('modalFinalizar').style.display = 'flex';
};
 
window.cerrarModal = () => {
    const modal = document.getElementById('modalFinalizar');
    modal.style.display = 'none';
    document.getElementById('inputSolucion').value = '';
    document.getElementById('selectCausa').selectedIndex = 0;
    ticketIdAenviar = null;
};

window.enviarFinalizacion = async () => {
    const solucion = document.getElementById('inputSolucion').value;
    const causa = document.getElementById('selectCausa').value;
 
    if (!solucion.trim()) return alert("Por favor describe la solución");
 
    const token = localStorage.getItem('adminToken');
 
    try {
        const res = await fetch(`${API_URL}/${ticketIdAenviar}/finalizar`, {
            method: 'PATCH',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ solucion, causa })
        });
 
        if (res.ok) {
            cerrarModal();
            cargarTickets();
        } else {
            alert("Error al guardar la solución en el servidor");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor");
    }
};
 
window.cambiarFiltro = (estado, btn) => {
    filtroActual = estado;
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cargarTickets();
}; 

document.addEventListener('DOMContentLoaded', async () => {
    const accesoPermitido = await verificarAcceso();
    if (!accesoPermitido) return;

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const btnDark = document.getElementById('btnDarkMode');
    if (btnDark) btnDark.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
 
    const btnGuardar = document.getElementById('btnGuardarResolucion');
    if (btnGuardar) {
        btnGuardar.onclick = async () => {
            const nota = document.getElementById('textoResolucion').value;
            if (nota.trim().length < 10) {
                alert("⚠️ La nota es muy corta. Por favor detalle la solución.");
                return;
            }
            const token = localStorage.getItem('adminToken');
            try {
                await fetch(`${API_URL}/${idTicketSeleccionado}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: 'Resuelto', nota })
                });
                cerrarModal();
                cargarTickets();
            } catch (err) {
                console.error("Error al guardar resolución:", err);
                alert("No se pudo conectar con el servidor.");
            }
        };
    }
    const pagina = window.location.pathname;

    if (pagina.includes('admin.html')) {
        cargarTickets();
        setInterval(() => {
            if (!window.estaEscribiendoNota && textoBusqueda === '') {
                cargarTickets();
            }
        }, 10000);
    }

    if (pagina.includes('dashboard.html')) {
        
        setTimeout(() => {
            generarGraficas();
        }, 300);
        
        setInterval(generarGraficas, 60000); 
    }
    if (document.getElementById('listaTickets')) {
        verificarAcceso();
        cargarTickets();
        setInterval(() => {
            if (!window.estaEscribiendoNota && textoBusqueda === '') {
                cargarTickets();
            }
        }, 10000);
    }
 
    const inputBusqueda = document.getElementById('busquedaRealTime');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            textoBusqueda = e.target.value;
            cargarTickets();
        });
    }
 
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    } 
});
window.agregarNota = async (id) => {
    const input = document.getElementById(`inputNota-${id}`);
    const textoNota = input.value.trim();
    if (!textoNota) return;
 
    const token = localStorage.getItem('adminToken');
 
    try {
        const res = await fetch(`${API_URL}/${id}/notas`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ nota: textoNota })
        });
 
        if (res.ok) {
            input.value = '';
            cargarTickets();
        } else if (res.status === 401 || res.status === 403) {
            alert("Tu sesión ha expirado. Por favor, vuelve a entrar.");
            window.location.href = "login.html";
        } else {
            alert("Error en el servidor al guardar la nota");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor");
    }
};
window.exportarExcel = async () => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(API_URL, {
        headers: { 'Authorization': token }
    });
    const tickets = await res.json();
 
    if (tickets.length === 0) {
        alert("No hay tickets para exportar.");
        return;
    }
 
    const datosExcel = tickets.map(t => {
        const notasTexto = t.bitacora ? t.bitacora.map(n => `[${n.fecha}] ${n.texto}`).join(' | ') : 'Sin notas';
        return {
            "Fecha Creación": t.fecha || 'N/A',
            "Usuario": t.usuario,
            "Red / Sede": t.red || 'Sin Red',
            "Categoría": t.categoria || 'General',
            "Descripción": t.descripcion,
            "Estado Actual": t.estado,
            "Bitácora de Seguimiento": notasTexto,
            "Solución Final": t.solucion || 'Pendiente',
            "Causa Raíz": t.causaRaiz || 'N/A',
            "Fecha de Cierre": t.fechaCierre || 'N/A'
        };
    });
 
    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte de Tickets");
    const nombreArchivo = `Reporte_Sistemas_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(libro, nombreArchivo);
};
function mostrarNotificacionVisual(ticket) { 
    if (Notification.permission === 'granted') {
        const iconUrl = 'https://cdn-icons-png.flaticon.com/512/2242/2242209.png';
        const n = new Notification(`🎫 Nuevo Ticket: ${ticket.usuario}`, {
            body: `Sede: ${ticket.red}\nAsunto: ${ticket.descripcion}`,
            icon: iconUrl
        });

        n.onclick = () => {
            window.focus();
            n.close();
        };
    }
}
window.toggleDarkMode = () => {
    const body = document.documentElement;
    const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('btnDarkMode').innerText = newTheme === 'dark' ? '☀️' : '🌙';
};
window.cerrarSesion = () => {

    if (confirm("¿Estás seguro de que deseas salir del sistema?")) {

        localStorage.removeItem('adminToken');
        localStorage.setItem('userRole', 0); 
        window.location.replace("login.html");
    }
};

let graficoEstados = null;
let graficoCategorias = null;

async function generarGraficas() {
    const token = localStorage.getItem('adminToken');
    
    try {
        const res = await fetch(API_URL, {
            method: 'GET',
            headers: { 
                'Authorization': token, 
                'Content-Type': 'application/json' 
            }
        });

        if (!res.ok) {
            console.error("Error 403 o similar: Revisa permisos en server.js");
            return;
        }

        const tickets = await res.json();

        if (!Array.isArray(tickets) || tickets.length === 0) {
            console.log("Sin datos para graficar.");
            return;
        }

        const conteoEstados = { "Pendiente": 0, "En Proceso": 0, "Resuelto": 0 };
        tickets.forEach(t => {
            if (conteoEstados.hasOwnProperty(t.estado)) conteoEstados[t.estado]++;
        });

        const conteoCats = {};
        tickets.forEach(t => {
            const cat = t.categoria || "General";
            conteoCats[cat] = (conteoCats[cat] || 0) + 1;
        });

        dibujarGraficaDona(conteoEstados);
        dibujarGraficaBarras(conteoCats);

    } catch (error) {
        console.error("Error al procesar datos:", error);
    }
}

function dibujarGraficaDona(datos) {
    const ctx = document.getElementById('chartEstados').getContext('2d');
    if (window.graficoEstados) window.graficoEstados.destroy();
    
    window.graficoEstados = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(datos),
            datasets: [{
                data: Object.values(datos),
                backgroundColor: ['#ff4757', '#ffa502', '#2ed573']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarGraficaBarras(datos) {
    const ctx = document.getElementById('chartCategorias').getContext('2d');
    if (window.graficoCategorias) window.graficoCategorias.destroy();
    
    window.graficoCategorias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(datos),
            datasets: [{
                label: 'Tickets por Categoría',
                data: Object.values(datos),
                backgroundColor: '#15305d'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}
