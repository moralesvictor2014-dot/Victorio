const firebaseConfig = {
    databaseURL: "https://prueba-operaciones-ca707-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentRecordKey = null; 

document.addEventListener("DOMContentLoaded", () => {
    resetearFormulario(true);

    document.getElementById("btnAddRow").addEventListener("click", () => {
        agregarFila({});
        actualizarContador();
    });

    document.getElementById("btnGuardar").addEventListener("click", guardarEnFirebase);
    document.getElementById("btnGuardarCambios").addEventListener("click", actualizarEnFirebase);
    document.getElementById("btnExportar").addEventListener("click", exportarAExcel);
    document.getElementById("btnBuscar").addEventListener("click", buscarEnFirebase);
    document.getElementById("btnNuevo").addEventListener("click", () => resetearFormulario(true));
    
    document.getElementById("searchQuery").addEventListener("keypress", (e) => {
        if (e.key === "Enter") buscarEnFirebase();
    });
});

function formatearAAnverso(fechaStr) {
    if (!fechaStr) return "";
    if (fechaStr.includes("-") && fechaStr.split("-")[0].length === 4) {
        const [anio, mes, dia] = fechaStr.split("-");
        return `${dia}-${mes}-${anio}`;
    }
    return fechaStr;
}

function formatearAParaInput(fechaStr) {
    if (!fechaStr) return new Date().toISOString().split('T')[0];
    if (fechaStr.includes("-") && fechaStr.split("-")[2]?.length === 4) {
        const [dia, mes, anio] = fechaStr.split("-");
        return `${anio}-${mes}-${dia}`;
    }
    return fechaStr;
}

function agregarFila(data = {}) {
    const tbody = document.getElementById("tableBody");
    const index = tbody.rows.length + 1;
    const tr = document.createElement("tr");
    
    tr.innerHTML = `
        <td class="fw-bold item-index">${index}</td>
        <td><input type="text" class="form-control col-serial" placeholder="Serial" value="${data.serial || ''}"></td>
        <td><input type="text" class="form-control col-marca" placeholder="Marca" value="${data.marca || ''}"></td>
        <td>
            <select class="form-select col-tipo">
                <option value="">-</option>
                <option value="P" ${data.tipo === 'P' ? 'selected' : ''}>P</option>
                <option value="R" ${data.tipo === 'R' ? 'selected' : ''}>R</option>
            </select>
        </td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.co2)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.pqs)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.esp)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.h2o)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.otro)}</select></td>
        <td><input type="text" class="form-control" placeholder="Cap." value="${data.capacidad || ''}"></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.presion)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.mangD)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.mangA)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.mangB)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.cupillaR)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.cilindro)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.manometro)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.boquilla)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.valvula)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.pasadores)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.precinto)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.fMetalica)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.fPlastica)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.gCapsula)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.capsulaCo2)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesEstado(data.pintura)}</select></td>
        <td><input type="text" class="form-control" placeholder="P.H Ext." value="${data.phExtingidor || ''}"></td>
        <td><input type="text" class="form-control" placeholder="P.H Imp." value="${data.phImpulsor || ''}"></td>
        <td><input type="text" class="form-control col-obs" placeholder="Observaciones..." value="${data.observaciones || ''}"></td>
        <td>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarFila(this)" title="Eliminar fila">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
    actualizarContador();
}

function generarOpcionesEstado(valorSeleccionado) {
    const estados = ["", "OK", "NC", "NF", "RG", "NT", "NA"];
    return estados.map(est => `
        <option value="${est}" ${est === valorSeleccionado ? 'selected' : ''}>
            ${est === '' ? '--' : est}
        </option>
    `).join('');
}

function eliminarFila(btn) {
    const row = btn.closest("tr");
    row.remove();
    reindexarTabla();
    actualizarContador();
}

function reindexarTabla() {
    const rows = document.querySelectorAll("#tableBody tr");
    rows.forEach((row, idx) => {
        row.querySelector(".item-index").textContent = idx + 1;
    });
}

function actualizarContador() {
    const count = document.querySelectorAll("#tableBody tr").length;
    document.getElementById("rowCount").textContent = count;
}

function resetearFormulario(conFilasVacias = false) {
    currentRecordKey = null;

    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    document.getElementById("inputFecha").value = `${anio}-${mes}-${dia}`;
    
    document.getElementById("inputCliente").value = "";
    document.getElementById("inputNumero").value = "";
    document.getElementById("tableBody").innerHTML = "";
    document.getElementById("searchResultsContainer").style.display = "none";
    document.getElementById("searchQuery").value = "";

    document.getElementById("btnGuardar").style.display = "inline-block";
    document.getElementById("btnGuardarCambios").style.display = "none";

    if (conFilasVacias) {
        for (let i = 1; i <= 15; i++) {
            agregarFila();
        }
    }
}

function buscarEnFirebase() {
    const query = document.getElementById("searchQuery").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("searchResultsContainer");
    const resultsList = document.getElementById("searchResultsList");

    resultsList.innerHTML = `<div class="text-center py-2 text-muted">Cargando listado desde Firebase...</div>`;
    resultsContainer.style.display = "block";

    db.ref("recepciones").once("value")
        .then((snapshot) => {
            resultsList.innerHTML = "";
            if (!snapshot.exists()) {
                resultsList.innerHTML = `<div class="text-center py-2 text-danger">No se encontraron registros guardados en la base de datos.</div>`;
                return;
            }

            let registros = [];
            snapshot.forEach((childSnapshot) => {
                const registro = childSnapshot.val();
                const cliente = (registro.cliente || "").toLowerCase();
                const numRecepcion = (registro.numeroRecepcion || "").toLowerCase();

                if (!query || cliente.includes(query) || numRecepcion.includes(query)) {
                    registros.push({
                        key: childSnapshot.key,
                        ...registro
                    });
                }
            });

            if (registros.length === 0) {
                resultsList.innerHTML = `<div class="text-center py-2 text-warning">No hay coincidencias con "${query}".</div>`;
                return;
            }

            // Ordenar de forma descendente (los más recientes / nuevos primero basándose en el timestamp o clave)
            registros.sort((a, b) => {
                const tiempoA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const tiempoB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                if (tiempoA !== tiempoB) {
                    return tiempoB - tiempoA; // Orden descendiente por tiempo
                }
                return b.key.localeCompare(a.key); // Respaldo alfabético descendiente
            });

            registros.forEach((item) => {
                const a = document.createElement("a");
                a.href = "#";
                a.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2";
                a.innerHTML = `
                    <div>
                        <span class="badge bg-danger me-2">${item.numeroRecepcion || 'S/N°'}</span>
                        <strong>Cliente:</strong> ${item.cliente} 
                        <small class="text-muted ms-2">(Fecha: ${item.fecha || item.fechaEntrada || 'N/A'})</small>
                    </div>
                    <span class="badge bg-primary px-3 py-2"><i class="fa-solid fa-arrow-pointer me-1"></i> Seleccionar y Cargar</span>
                `;
                a.addEventListener("click", (e) => {
                    e.preventDefault();
                    cargarRecepcionEnFormulario(item);
                });
                resultsList.appendChild(a);
            });
        })
        .catch((error) => {
            console.error("Error al buscar:", error);
            resultsList.innerHTML = `<div class="text-center py-2 text-danger">Error al consultar Firebase.</div>`;
        });
}

function cargarRecepcionEnFormulario(data) {
    currentRecordKey = data.key;

    document.getElementById("inputFecha").value = formatearAParaInput(data.fecha || data.fechaEntrada || "");
    document.getElementById("inputCliente").value = data.cliente || "";
    document.getElementById("inputNumero").value = data.numeroRecepcion || "";

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    if (data.equipos && Array.isArray(data.equipos)) {
        data.equipos.files = data.equipos.forEach(eq => {
            agregarFila(eq);
        });
    } else if (data.equipos) {
        data.equipos.forEach(eq => {
            agregarFila(eq);
        });
    } else {
        for (let i = 1; i <= 15; i++) {
            agregarFila();
        }
    }

    document.getElementById("searchResultsContainer").style.display = "none";
    document.getElementById("searchQuery").value = "";
    
    document.getElementById("btnGuardar").style.display = "none";
    document.getElementById("btnGuardarCambios").style.display = "inline-block";

    alert(`¡Recepción de "${data.cliente}" (${data.numeroRecepcion || 'Sin N°'}) cargada correctamente! Ya puedes editarla o exportarla.`);
}

function recolectarDatosFormulario() {
    const fechaInputVal = document.getElementById("inputFecha").value;
    const fecha = formatearAAnverso(fechaInputVal);
    const cliente = document.getElementById("inputCliente").value.trim() || "Cliente_General";
    const numeroRecepcion = document.getElementById("inputNumero").value.trim();

    const equipos = [];
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll("input, select");
        equipos.push({
            item: index + 1,
            serial: inputs[0].value,
            marca: inputs[1].value,
            tipo: inputs[2].value,
            co2: inputs[3].value,
            pqs: inputs[4].value,
            esp: inputs[5].value,
            h2o: inputs[6].value,
            otro: inputs[7].value,
            capacidad: inputs[8].value,
            presion: inputs[9].value,
            mangD: inputs[10].value,
            mangA: inputs[11].value,
            mangB: inputs[12].value,
            cupillaR: inputs[13].value,
            cilindro: inputs[14].value,
            manometro: inputs[15].value,
            boquilla: inputs[16].value,
            valvula: inputs[17].value,
            pasadores: inputs[18].value,
            precinto: inputs[19].value,
            fMetalica: inputs[20].value,
            fPlastica: inputs[21].value,
            gCapsula: inputs[22].value,
            capsulaCo2: inputs[23].value,
            pintura: inputs[24].value,
            phExtingidor: inputs[25].value,
            phImpulsor: inputs[26].value,
            observaciones: inputs[27].value
        });
    });

    return {
        fecha,
        cliente,
        numeroRecepcion,
        equipos,
        timestamp: new Date().toISOString()
    };
}

function guardarEnFirebase() {
    const datos = recolectarDatosFormulario();

    if (!datos.cliente) {
        alert("Por favor, ingresa el nombre del cliente antes de guardar.");
        return;
    }

    const clienteSanitizado = datos.cliente.replace(/[^a-zA-Z0-9]/g, "_");
    const registroRef = db.ref("recepciones/" + clienteSanitizado + "_" + Date.now());

    registroRef.set(datos).then(() => {
        alert("¡Datos guardados exitosamente en Firebase Realtime Database!");
        currentRecordKey = clienteSanitizado + "_" + Date.now();
        document.getElementById("btnGuardar").style.display = "none";
        document.getElementById("btnGuardarCambios").style.display = "inline-block";
    }).catch((error) => {
        console.error("Error al guardar en Firebase: ", error);
        alert("Hubo un error al guardar los datos.");
    });
}

function actualizarEnFirebase() {
    if (!currentRecordKey) {
        alert("No hay ningún registro seleccionado para actualizar. Si es nuevo, usa 'Guardar Nueva Recepción'.");
        return;
    }

    const datos = recolectarDatosFormulario();

    if (!datos.cliente) {
        alert("Por favor, ingresa el nombre del cliente.");
        return;
    }

    db.ref("recepciones/" + currentRecordKey).update(datos).then(() => {
        alert("¡Los cambios se han guardado con éxito en Firebase!");
    }).catch((error) => {
        console.error("Error al actualizar en Firebase: ", error);
        alert("Hubo un error al actualizar los datos.");
    });
}

function exportarAExcel() {
    const clienteInput = document.getElementById("inputCliente").value.trim() || "Cliente";
    const fechaInputVal = document.getElementById("inputFecha").value;
    const fechaInput = formatearAAnverso(fechaInputVal);
    const numeroRecepcion = document.getElementById("inputNumero").value.trim();

    const clienteLimpio = clienteInput.replace(/[^a-zA-Z0-9_-]/g, "_");
    const nombreArchivo = `${clienteLimpio}_${fechaInput}.xlsx`;

    const worksheetData = [
        ["", "", "", "Recepción de Equipos de Extinción", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        [],
        [`Fecha: ${fechaInput}`, "", "", "", "", "", `Cliente: ${clienteInput}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", `N° Recepción: ${numeroRecepcion}`],
        [],
        [
            "Ítem", "Serial", "Marca", "Tipo (P/R)", "CO2", "PQS", "ESP", "H2O", "Otro", 
            "Capacidad", "Presión", "Mang. D.", "Mang. A.", "Mang. B.", "Cupilla R.", "Cilindro", "Manómetro", "Boquilla", 
            "Válvula", "Pasadores", "Precinto", "F. Metalica", "F. Plastica", 
            "G. Capsula", "Capsula CO2", "Pintura", "P.H Extingidor", "P.H Impulsor", "Observaciones"
        ]
    ];

    const rows = document.querySelectorAll("#tableBody tr");
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll("input, select");
        worksheetData.push([
            index + 1,
            inputs[0].value,
            inputs[1].value,
            inputs[2].value,
            inputs[3].value,
            inputs[4].value,
            inputs[5].value,
            inputs[6].value,
            inputs[7].value,
            inputs[8].value,
            inputs[9].value,
            inputs[10].value,
            inputs[11].value,
            inputs[12].value,
            inputs[13].value,
            inputs[14].value,
            inputs[15].value,
            inputs[16].value,
            inputs[17].value,
            inputs[18].value,
            inputs[19].value,
            inputs[20].value,
            inputs[21].value,
            inputs[22].value,
            inputs[23].value,
            inputs[24].value,
            inputs[25].value,
            inputs[26].value,
            inputs[27].value,
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recepción");

    XLSX.writeFile(workbook, nombreArchivo);
}