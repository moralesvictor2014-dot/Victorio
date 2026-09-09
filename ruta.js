const firebaseConfig = {
    databaseURL: "https://prueba-operaciones-ca707-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
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
    if (fechaStr.includes("-")) {
        const partes = fechaStr.split("-");
        if (partes[0].length === 4) {
            return fechaStr;
        }
        if (partes[2]?.length === 4) {
            const [dia, mes, anio] = partes;
            return `${anio}-${mes}-${dia}`;
        }
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
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.emisRev)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.verifReq)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.dispMat)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.reemOrings)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.lubricacion)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondValvula)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.reemPqs)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondTapa)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.remocGuarda)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.recargaCo2)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.recargaCilindro)}</select></td>
        <td><input type="text" class="form-control col-small-select" placeholder="Peso" value="${data.pesoCartucho || ''}"></td>
        <td><input type="text" class="form-control col-small-select" placeholder="Peso" value="${data.pesoCilindro || ''}"></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.selloCapsula)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondVastago)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondSifon)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondPintura)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondMang)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondRuedas)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.acondReguladores)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.reemManometro)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.cambioSello)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.precintoSeg)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.identEquipo)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.equipoOperativo)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.constanciaSalida)}</select></td>
        <td><select class="form-select col-small-select">${generarOpcionesRuta(data.presFinal)}</select></td>
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

function generarOpcionesRuta(valorSeleccionado) {
    const estados = ["", "C", "NC", "NA"];
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

/**
 * Consulta las recepciones guardadas desde recepcion.html en el nodo 'recepciones'
 */
function buscarEnFirebase() {
    const query = document.getElementById("searchQuery").value.trim().toLowerCase();
    const resultsContainer = document.getElementById("searchResultsContainer");
    const resultsList = document.getElementById("searchResultsList");

    resultsList.innerHTML = `<div class="text-center py-2 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando recepciones desde Firebase...</div>`;
    resultsContainer.style.display = "block";

    db.ref("recepciones").once("value")
        .then((snapshot) => {
            resultsList.innerHTML = "";
            if (!snapshot.exists()) {
                resultsList.innerHTML = `<div class="text-center py-2 text-danger">No se encontraron recepciones en la base de datos.</div>`;
                return;
            }

            let registros = [];
            snapshot.forEach((childSnapshot) => {
                const registro = childSnapshot.val();
                if (registro) {
                    const cliente = (registro.cliente || "").toLowerCase();
                    const numRecepcion = (registro.numeroRecepcion || "").toLowerCase();

                    if (!query || cliente.includes(query) || numRecepcion.includes(query)) {
                        registros.push({
                            key: childSnapshot.key,
                            ...registro
                        });
                    }
                }
            });

            if (registros.length === 0) {
                resultsList.innerHTML = `<div class="text-center py-2 text-warning">No hay coincidencias con "${query}".</div>`;
                return;
            }

            // Ordenar de forma descendente por timestamp
            registros.sort((a, b) => {
                const tiempoA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const tiempoB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                if (tiempoA !== tiempoB) {
                    return tiempoB - tiempoA; 
                }
                return b.key.localeCompare(a.key); 
            });

            registros.forEach((item) => {
                // Contar cuántos seriales válidos tiene registrados
                const cantidadSeriales = item.equipos 
                    ? item.equipos.filter(e => e.serial && e.serial.trim() !== "").length 
                    : 0;

                const a = document.createElement("a");
                a.href = "#";
                a.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2";
                a.innerHTML = `
                    <div>
                        <span class="badge bg-danger me-2">${item.numeroRecepcion || 'S/N°'}</span>
                        <strong>Cliente:</strong> ${item.cliente || 'Sin Cliente'} 
                        <small class="text-muted ms-2">(Fecha: ${item.fecha || item.fechaEntrada || 'N/A'})</small>
                        <span class="badge bg-secondary ms-2">${cantidadSeriales} Seriales</span>
                    </div>
                    <span class="badge bg-warning text-dark px-3 py-2"><i class="fa-solid fa-arrow-pointer me-1"></i> Seleccionar y Matchear</span>
                `;
                a.addEventListener("click", (e) => {
                    e.preventDefault();
                    cargarRecepcionEnRuta(item);
                });
                resultsList.appendChild(a);
            });
        })
        .catch((error) => {
            console.error("Error al buscar en Firebase:", error);
            resultsList.innerHTML = `<div class="text-center py-2 text-danger">Error de conexión con Firebase.</div>`;
        });
}

/**
 * Carga los datos de una Recepción seleccionada y matchea los seriales en la Hoja de Ruta
 */
function cargarRecepcionEnRuta(data) {
    currentRecordKey = data.key;

    const fechaVal = formatearAParaInput(data.fecha || data.fechaEntrada || "");
    document.getElementById("inputFecha").value = fechaVal;
    document.getElementById("inputCliente").value = data.cliente || "";
    document.getElementById("inputNumero").value = data.numeroRecepcion || "";

    // Verificar si ya existe una Hoja de Ruta previamente guardada para este registro en el nodo 'rutas'
    db.ref("rutas/" + data.key).once("value").then((snapshot) => {
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";

        if (snapshot.exists()) {
            // Si ya existe la Hoja de Ruta guardada, cargamos sus valores
            const rutaGuardada = snapshot.val();
            if (rutaGuardada.equipos && Array.isArray(rutaGuardada.equipos)) {
                rutaGuardada.equipos.forEach(eq => agregarFila(eq));
            }
            document.getElementById("btnGuardar").style.display = "none";
            document.getElementById("btnGuardarCambios").style.display = "inline-block";
            alert(`¡Hoja de Ruta guardada previamente cargada para "${data.cliente}" (${data.numeroRecepcion || 'Sin N°'})!`);
        } else {
            // Si es nueva Hoja de Ruta, matcheamos los seriales ingresados en recepcion.html
            let equiposConSerial = [];

            if (data.equipos && Array.isArray(data.equipos)) {
                equiposConSerial = data.equipos.filter(eq => eq.serial && eq.serial.trim() !== "");
            }

            if (equiposConSerial.length > 0) {
                equiposConSerial.forEach(eq => {
                    agregarFila({
                        serial: eq.serial.trim()
                    });
                });
            } else if (data.equipos && Array.isArray(data.equipos) && data.equipos.length > 0) {
                data.equipos.forEach(eq => {
                    agregarFila({
                        serial: eq.serial || ''
                    });
                });
            } else {
                for (let i = 1; i <= 15; i++) {
                    agregarFila();
                }
            }

            document.getElementById("btnGuardar").style.display = "inline-block";
            document.getElementById("btnGuardarCambios").style.display = "none";
            alert(`¡${equiposConSerial.length} serial(es) matcheados exitosamente desde la Recepción de "${data.cliente}" (${data.numeroRecepcion || 'Sin N°'})!`);
        }

        actualizarContador();
        document.getElementById("searchResultsContainer").style.display = "none";
        document.getElementById("searchQuery").value = "";
    }).catch((err) => {
        console.error("Error al consultar ruta:", err);
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";
        if (data.equipos && Array.isArray(data.equipos)) {
            data.equipos.filter(eq => eq.serial && eq.serial.trim() !== "").forEach(eq => agregarFila({ serial: eq.serial }));
        }
        actualizarContador();
        document.getElementById("searchResultsContainer").style.display = "none";
    });
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
            emisRev: inputs[1].value,
            verifReq: inputs[2].value,
            dispMat: inputs[3].value,
            reemOrings: inputs[4].value,
            lubricacion: inputs[5].value,
            acondValvula: inputs[6].value,
            reemPqs: inputs[7].value,
            acondTapa: inputs[8].value,
            remocGuarda: inputs[9].value,
            recargaCo2: inputs[10].value,
            recargaCilindro: inputs[11].value,
            pesoCartucho: inputs[12].value,
            pesoCilindro: inputs[13].value,
            selloCapsula: inputs[14].value,
            acondVastago: inputs[15].value,
            acondSifon: inputs[16].value,
            acondPintura: inputs[17].value,
            acondMang: inputs[18].value,
            acondRuedas: inputs[19].value,
            acondReguladores: inputs[20].value,
            reemManometro: inputs[21].value,
            cambioSello: inputs[22].value,
            precintoSeg: inputs[23].value,
            identEquipo: inputs[24].value,
            equipoOperativo: inputs[25].value,
            constanciaSalida: inputs[26].value,
            presFinal: inputs[27].value,
            observaciones: inputs[28].value
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

    if (!datos.cliente || datos.cliente === "Cliente_General") {
        alert("Por favor, ingresa el nombre del cliente antes de guardar.");
        return;
    }

    const uniqueKey = currentRecordKey || (datos.cliente.replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now());
    const registroRef = db.ref("rutas/" + uniqueKey);

    registroRef.set(datos).then(() => {
        alert("¡Hoja de Ruta guardada exitosamente en Firebase!");
        currentRecordKey = uniqueKey;
        document.getElementById("btnGuardar").style.display = "none";
        document.getElementById("btnGuardarCambios").style.display = "inline-block";
    }).catch((error) => {
        console.error("Error al guardar en Firebase: ", error);
        alert("Hubo un error al guardar los datos.");
    });
}

function actualizarEnFirebase() {
    if (!currentRecordKey) {
        alert("No hay ningún registro seleccionado para actualizar. Si es nuevo, usa 'Guardar Nueva Ruta'.");
        return;
    }

    const datos = recolectarDatosFormulario();

    if (!datos.cliente) {
        alert("Por favor, ingresa el nombre del cliente.");
        return;
    }

    db.ref("rutas/" + currentRecordKey).update(datos).then(() => {
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
    const nombreArchivo = `Ruta_${clienteLimpio}_${fechaInput}.xlsx`;

    const worksheetData = [
        ["", "", "", "Hoja de Ruta de Equipos de Extinción", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        [],
        [`Fecha: ${fechaInput}`, "", "", "", "", "", `Cliente: ${clienteInput}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", `N° Recepción: ${numeroRecepcion}`],
        [],
        [
            "Ítem", "Serial", "Emis./Rev. Inf.", "Verif. Req.", "Disp. Mat/Eq", "Reem. O'rings",
            "Lubricación", "Acond. Válvula", "Reem. PQS", "Acond. Tapa", "Remoc. Guarda Cart.",
            "Recarga Cart. CO2", "Recarga Cilindro", "Peso Cart. (Post)", "Peso Cilindro (Post)",
            "Sello Cápsula CO2", "Acond. Vástago", "Acond. Sifón", "Acond. Pintura",
            "Acond. Mang. A.P.", "Acond. Ruedas", "Acond. Reguladores", "Reem. Manómetro",
            "Cambio Sello", "Precinto Seg.", "Ident. Equipo", "Eq. Operativo",
            "Const./Reg. Salida", "Pres. Final Eq.", "Observaciones"
        ]
    ];

    const rows = document.querySelectorAll("#tableBody tr");
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll("input, select");
        worksheetData.push([
            index + 1,
            inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value, 
            inputs[5].value, inputs[6].value, inputs[7].value, inputs[8].value, inputs[9].value, 
            inputs[10].value, inputs[11].value, inputs[12].value, inputs[13].value, inputs[14].value, 
            inputs[15].value, inputs[16].value, inputs[17].value, inputs[18].value, inputs[19].value, 
            inputs[20].value, inputs[21].value, inputs[22].value, inputs[23].value, inputs[24].value, 
            inputs[25].value, inputs[26].value, inputs[27].value, inputs[28].value
        ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ruta");

    XLSX.writeFile(workbook, nombreArchivo);
}