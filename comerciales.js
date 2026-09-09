// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://prueba-operaciones-ca707-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Objeto para almacenamiento en memoria de recepciones cargadas desde Firebase
let recepcionesCache = {};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar fecha de entrada al día de hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById("fechaEntrada").value = hoy;

    // 2. Controlador del Slider de Actualización de Progreso (Panel Izquierdo)
    const updateSlider = document.getElementById("updateProgresoSlider");
    const updateValor = document.getElementById("updateProgresoValor");
    updateSlider.addEventListener("input", (e) => {
        updateValor.textContent = `${e.target.value}%`;
        
        // Cambio de color dinámico en la etiqueta según el porcentaje
        const val = parseInt(e.target.value);
        if (val < 30) updateValor.className = "badge bg-danger fs-6";
        else if (val < 75) updateValor.className = "badge bg-warning text-dark fs-6";
        else updateValor.className = "badge bg-success fs-6";
    });

    // 3. Eventos principales
    document.getElementById("formComercial").addEventListener("submit", guardarNuevaRecepcionFirebase);
    document.getElementById("selectRecepcion").addEventListener("change", seleccionarRecepcionParaActualizar);
    document.getElementById("btnActualizarProgreso").addEventListener("click", guardarAvanceProgresoFirebase);
    document.getElementById("btnRefrescarSelect").addEventListener("click", cargarRecepcionesEnSelectYTabla);

    // 4. Escuchar en tiempo real Firebase al cargar la página
    escucharFirebase();
});

/**
 * Escucha en tiempo real la referencia 'recepciones' en Firebase
 */
function escucharFirebase() {
    db.ref("recepciones").on("value", (snapshot) => {
        recepcionesCache = {};
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                recepcionesCache[child.key] = {
                    key: child.key,
                    ...child.val()
                };
            });
        }
        poblarSelectRecepciones();
        renderizarTablaAlertas();
    }, (error) => {
        console.error("Error al conectar con Firebase: ", error);
    });
}

function cargarRecepcionesEnSelectYTabla() {
    db.ref("recepciones").once("value").then((snapshot) => {
        recepcionesCache = {};
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                recepcionesCache[child.key] = {
                    key: child.key,
                    ...child.val()
                };
            });
        }
        poblarSelectRecepciones();
        renderizarTablaAlertas();
    });
}

/**
 * Poblar el desplegable de selección de N° de Recepción (ORDENADO DESCENDENTE)
 */
function poblarSelectRecepciones() {
    const select = document.getElementById("selectRecepcion");
    const valorSeleccionadoPrevio = select.value;
    
    select.innerHTML = '<option value="">-- Seleccione un N° de Recepción --</option>';

    // Obtener los elementos y ordenarlos de forma descendente por número de recepción o timestamp
    const items = Object.values(recepcionesCache).sort((a, b) => {
        const numA = a.numeroRecepcion || "";
        const numB = b.numeroRecepcion || "";
        if (numA && numB) {
            return numB.localeCompare(numA);
        }
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    if (items.length === 0) {
        select.innerHTML = '<option value="">-- No hay recepciones registradas en Firebase --</option>';
        document.getElementById("panelActualizacion").style.display = "none";
        return;
    }

    // Insertar opciones ordenadas descendentemente
    items.forEach((item) => {
        const num = item.numeroRecepcion || 'Sin N°';
        const cliente = item.cliente || 'Cliente Desconocido';
        const progreso = item.progreso !== undefined ? item.progreso : 0;

        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = `${num} - ${cliente} (${progreso}%)`;
        select.appendChild(option);
    });

    // Mantener la selección previa si existe
    if (valorSeleccionadoPrevio && recepcionesCache[valorSeleccionadoPrevio]) {
        select.value = valorSeleccionadoPrevio;
        seleccionarRecepcionParaActualizar();
    }
}

/**
 * Cuando el usuario selecciona un número de recepción de la lista desplegable
 */
function seleccionarRecepcionParaActualizar() {
    const select = document.getElementById("selectRecepcion");
    const key = select.value;
    const panel = document.getElementById("panelActualizacion");

    if (!key || !recepcionesCache[key]) {
        panel.style.display = "none";
        return;
    }

    const item = recepcionesCache[key];
    const progresoActual = item.progreso !== undefined ? parseInt(item.progreso) : 0;

    document.getElementById("infoCliente").textContent = item.cliente || "N/A";
    document.getElementById("infoServicio").textContent = item.descripcion || "Servicio General";
    
    const fEntrada = item.fechaEntrada || item.fecha || "No especificada";
    const fSalida = item.fechaSalida || "No especificada";
    document.getElementById("infoFechas").textContent = `Entrada: ${fEntrada} | Entrega: ${fSalida}`;

    // Cargar en el slider el valor actual
    const slider = document.getElementById("updateProgresoSlider");
    const label = document.getElementById("updateProgresoValor");
    slider.value = progresoActual;
    label.textContent = `${progresoActual}%`;

    const colorClass = progresoActual < 30 ? "badge bg-danger fs-6" : (progresoActual < 75 ? "badge bg-warning text-dark fs-6" : "badge bg-success fs-6");
    label.className = colorClass;

    panel.style.display = "block";
}

/**
 * Función centralizada para actualizar el progreso en Firebase Realtime Database
 */
function actualizarProgresoEnFirebase(key, nuevoProgreso) {
    db.ref("recepciones/" + key).update({
        progreso: nuevoProgreso,
        ultimaActualizacion: new Date().toISOString()
    }).then(() => {
        console.log(`Progreso de ${key} actualizado al ${nuevoProgreso}%`);
    }).catch((err) => {
        console.error("Error al actualizar progreso:", err);
        alert("Hubo un error al guardar el avance en Firebase.");
    });
}

/**
 * Guarda el incremento/cambio de porcentaje en Firebase desde el panel lateral
 */
function guardarAvanceProgresoFirebase() {
    const key = document.getElementById("selectRecepcion").value;
    if (!key || !recepcionesCache[key]) {
        alert("Por favor, selecciona una recepción válida.");
        return;
    }

    const nuevoProgreso = parseInt(document.getElementById("updateProgresoSlider").value);
    actualizarProgresoEnFirebase(key, nuevoProgreso);
    alert(`¡Progreso actualizado con éxito al ${nuevoProgreso}% en Firebase!`);
}

/**
 * Formatea fechas a YYYYMMDD para correlativo
 */
function obtenerFechaFormatoCompacto(fechaStr) {
    if (!fechaStr) return new Date().toISOString().split('T')[0].replace(/-/g, "");
    return fechaStr.replace(/-/g, "");
}

/**
 * Crea una nueva Recepción Comercial directamente en Firebase Realtime Database
 */
function guardarNuevaRecepcionFirebase(e) {
    e.preventDefault();

    const cliente = document.getElementById("clienteNombre").value.trim();
    const telefono = document.getElementById("clienteTelefono").value.trim();
    const descripcion = document.getElementById("descripcionServicio").value.trim();
    const fechaEntrada = document.getElementById("fechaEntrada").value;
    const fechaSalida = document.getElementById("fechaSalida").value;
    const progreso = 0; // Inicia por defecto en 0%

    if (new Date(fechaSalida) < new Date(fechaEntrada)) {
        alert("La fecha de salida (entrega) no puede ser previa a la fecha de entrada.");
        return;
    }

    // Generar N° de Recepción correlativo único (RO-YYYYMMDD-00X)
    const formatoFecha = obtenerFechaFormatoCompacto(fechaEntrada);
    const contador = Object.values(recepcionesCache).filter(r => r.numeroRecepcion && r.numeroRecepcion.includes(formatoFecha)).length + 1;
    
    // Formato con guion: RO-YYYYMMDD-001
    const numeroRecepcion = `RO-${formatoFecha}-${String(contador).padStart(3, '0')}`;

    const nuevoRegistro = {
        cliente: cliente,
        telefono: telefono,
        descripcion: descripcion,
        fecha: fechaEntrada,
        fechaEntrada: fechaEntrada,
        fechaSalida: fechaSalida,
        numeroRecepcion: numeroRecepcion,
        progreso: progreso,
        timestamp: new Date().toISOString()
    };

    const clienteSanitizado = cliente.replace(/[^a-zA-Z0-9]/g, "_");
    const nuevaRef = db.ref("recepciones/" + clienteSanitizado + "_" + Date.now());

    nuevaRef.set(nuevoRegistro).then(() => {
        document.getElementById("displayNumeroRecepcion").textContent = numeroRecepcion;
        document.getElementById("cajaNumeroGenerado").style.display = "block";

        alert(`¡Recepción "${numeroRecepcion}" guardada exitosamente en Firebase!`);

        // Limpiar campos
        document.getElementById("formComercial").reset();
        document.getElementById("fechaEntrada").value = fechaEntrada;
    }).catch((err) => {
        console.error("Error al registrar en Firebase:", err);
        alert("No se pudo conectar a Firebase para guardar el registro.");
    });
}

/**
 * SISTEMA DE ALERTAS INTELIGENTES: Renderiza la tabla de trabajos activos evaluando tiempos y progreso (ORDENADO DESCENDENTE)
 */
function renderizarTablaAlertas() {
    const tbody = document.getElementById("tablaTrabajosActivos");
    tbody.innerHTML = "";

    // Convertir el objeto a Array y ordenar descendente por N° de Recepción / Fecha de creación
    const items = Object.values(recepcionesCache).sort((a, b) => {
        const numA = a.numeroRecepcion || "";
        const numB = b.numeroRecepcion || "";
        if (numA && numB) {
            return numB.localeCompare(numA);
        }
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    document.getElementById("totalTrabajos").textContent = items.length;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No existen recepciones registradas en la base de datos.</td></tr>`;
        return;
    }

    const hoy = new Date();

    items.forEach((item) => {
        const fEntradaStr = item.fechaEntrada || item.fecha || "";
        const fSalidaStr = item.fechaSalida || "";
        const progreso = item.progreso !== undefined ? parseInt(item.progreso) : 0;

        const fechaEntrada = fEntradaStr ? new Date(fEntradaStr) : hoy;
        const fechaSalida = fSalidaStr ? new Date(fSalidaStr) : hoy;

        const msPorHora = 1000 * 60 * 60;
        const horasTotales = Math.max((fechaSalida - fechaEntrada) / msPorHora, 1);
        const horasRestantes = (fechaSalida - hoy) / msPorHora;

        let AlertaActiva = false;
        let motivoAlerta = "";

        // REGLAS DE ALERTAS INTELIGENTES
        if (horasRestantes <= 48 && progreso === 0) {
            AlertaActiva = true;
            motivoAlerta = "¡Alarma! Menos de 48 horas restantes con 0% de progreso.";
        }
        else if ((horasRestantes / horasTotales) <= 0.20 && progreso < 20) {
            AlertaActiva = true;
            motivoAlerta = "¡Atención! Menos del 20% del tiempo total con poco avance.";
        }
        else if (horasRestantes < 0 && progreso < 100) {
            AlertaActiva = true;
            motivoAlerta = "¡URGENTE! Fecha de entrega vencida y trabajo inconcluso.";
        }

        const tr = document.createElement("tr");
        if (AlertaActiva) {
            tr.classList.add("row-alert-urgent");
        }

        const barColor = progreso < 30 ? 'bg-danger' : (progreso < 75 ? 'bg-warning text-dark' : 'bg-success');

        tr.innerHTML = `
            <td class="fw-bold text-info">${item.numeroRecepcion || 'S/N'}</td>
            <td>
                <div class="fw-semibold text-light">${item.cliente || 'S/N'}</div>
                <small class="text-muted d-inline-block text-truncate" style="max-width: 180px;">
                    ${item.descripcion || 'Sin descripción'}
                </small>
            </td>
            <td>
                <div class="small text-muted">E: ${fEntradaStr || '-'}</div>
                <div class="small fw-bold ${horasRestantes <= 48 ? 'text-danger' : 'text-success'}">
                    S: ${fSalidaStr || '-'}
                </div>
            </td>
            <td style="min-width: 140px;">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge ${barColor}">${progreso}%</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${barColor}" role="progressbar" style="width: ${progreso}%;"></div>
                </div>
            </td>
            <td class="text-center align-middle">
                ${AlertaActiva 
                    ? `<i class="fa-solid fa-triangle-exclamation icon-warning-pulse fs-5" title="${motivoAlerta}"></i>`
                    : `<i class="fa-solid fa-circle-check text-success fs-5 opacity-75" title="Dentro del tiempo estimado"></i>`
                }
            </td>
        `;

        tbody.appendChild(tr);
    });
}