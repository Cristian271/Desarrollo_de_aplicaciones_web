if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
}

let listaEncargos = [];
let encargoSeleccionadoId = null;

const RUTA_PHP = 'php/';

async function cargarEncargos() {
    const contenedor = document.getElementById('lista-encargos');
    if (!contenedor) return;

    try {
        const res = await fetch(`${RUTA_PHP}listar_encargo.php`);
        const textoRespuesta = await res.text();

        let data;
        try {
            data = JSON.parse(textoRespuesta);
        } catch (e) {
            console.error('El servidor PHP no devolvió JSON válido. Respuesta recibida:', textoRespuesta);
            contenedor.textContent = 'Error en el servidor al cargar encargos. Revisa la consola (F12).';
            return;
        }

        if (!data.ok) {
            contenedor.textContent = data.mensaje || 'No se pudieron obtener los encargos.';
            return;
        }

        listaEncargos = data.encargos || [];
        renderizarTablaEncargos();

        if (encargoSeleccionadoId !== null) {
            const actual = listaEncargos.find(e => Number(e.id_encargo) === Number(encargoSeleccionadoId));
            if (actual) {
                renderizarPanelDetalle(actual);
            } else {
                cerrarPanelLateral();
            }
        }
    } catch (err) {
        console.error('Error de red al conectar con listar_encargo.php:', err);
        contenedor.textContent = 'Error de conexión con el servidor.';
    }
}

function renderizarTablaEncargos() {
    const contenedor = document.getElementById('lista-encargos');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (listaEncargos.length === 0) {
        const vacio = document.createElement('p');
        vacio.textContent = 'No hay encargos registrados todavía.';
        contenedor.appendChild(vacio);
        return;
    }

    listaEncargos.forEach(encargo => {
        const card = document.createElement('div');
        const esSeleccionado = Number(encargo.id_encargo) === Number(encargoSeleccionadoId);
        card.className = `encargo-card estado-${encargo.estado}${esSeleccionado ? ' seleccionada' : ''}`;

        const info = document.createElement('div');
        info.className = 'encargo-info';

        const titulo = document.createElement('h3');
        titulo.textContent = `Folio #${encargo.id_encargo} - ${encargo.nombre_cliente}`;

        const tel = document.createElement('p');
        tel.textContent = `Teléfono: ${encargo.telefono} | Estado: ${encargo.estado.toUpperCase()}`;

        info.append(titulo, tel);

        const acciones = document.createElement('div');
        acciones.className = 'encargo-acciones';

        const btnDetalle = document.createElement('button');
        btnDetalle.type = 'button';
        btnDetalle.className = 'btn-admin btn-ver';
        btnDetalle.textContent = 'Detalles';
        btnDetalle.addEventListener('click', () => abrirPanelLateral(encargo));

        const btnPdf = document.createElement('a');
        btnPdf.href = `${RUTA_PHP}descargar_tickets_encargo.php?id_encargo=${encodeURIComponent(encargo.id_encargo)}`;
        btnPdf.className = 'btn-admin btn-pdf';
        btnPdf.textContent = 'Descargar PDF';

        acciones.append(btnDetalle, btnPdf);
        card.append(info, acciones);
        contenedor.appendChild(card);
    });
}

function abrirPanelLateral(encargo) {
    encargoSeleccionadoId = encargo.id_encargo;
    const panel = document.getElementById('panel-lateral-encargo');
    if (panel) panel.classList.add('abierto');
    renderizarTablaEncargos();
    renderizarPanelDetalle(encargo);
}

function cerrarPanelLateral() {
    encargoSeleccionadoId = null;
    const panel = document.getElementById('panel-lateral-encargo');
    if (panel) panel.classList.remove('abierto');
    renderizarTablaEncargos();
}

function renderizarPanelDetalle(encargo) {
    const cuerpo = document.getElementById('detalle-encargo-contenido');
    if (!cuerpo) return;
    cuerpo.innerHTML = '';

    const esPendiente = encargo.estado === 'pendiente';

    const cabecera = document.createElement('div');
    cabecera.className = 'ticket-cabecera';

    const h2 = document.createElement('h2');
    h2.textContent = `Ticket #${encargo.id_encargo}`;

    const pCliente = document.createElement('p');
    pCliente.textContent = `Cliente: ${encargo.nombre_cliente} (${encargo.telefono})`;

    const pEstado = document.createElement('p');
    pEstado.textContent = `Estado actual: ${encargo.estado.toUpperCase()}`;

    cabecera.append(h2, pCliente, pEstado);
    cuerpo.appendChild(cabecera);

    const listaItems = document.createElement('div');
    listaItems.className = 'detalle-items-lista';

    const detalles = Array.isArray(encargo.detalles) ? encargo.detalles : [];
    const inputsCantidad = [];

    detalles.forEach(item => {
        const fila = document.createElement('div');
        fila.className = 'detalle-item-fila';

        const nombreProd = document.createElement('span');
        nombreProd.className = 'detalle-item-nombre';
        nombreProd.textContent = item.nombre;
        nombreProd.title = `Stock disponible: ${item.stock_actual}`;
        fila.appendChild(nombreProd);

        if (esPendiente) {
            const controles = document.createElement('div');
            controles.className = 'detalle-item-controles';

            const inputCant = document.createElement('input');
            inputCant.type = 'number';
            inputCant.min = '1';
            inputCant.value = item.cantidad;
            inputsCantidad.push({
                id_detalle_encargo: item.id_detalle_encargo,
                input: inputCant
            });

            const btnEliminar = document.createElement('button');
            btnEliminar.type = 'button';
            btnEliminar.className = 'btn-quitar-linea';
            btnEliminar.textContent = 'X';
            btnEliminar.title = 'Eliminar producto';
            btnEliminar.addEventListener('click', () => {
                enviarAccionEncargo({
                    accion: 'eliminar_renglon',
                    id_detalle_encargo: item.id_detalle_encargo
                });
            });

            controles.append(inputCant, btnEliminar);
            fila.appendChild(controles);
        } else {
            const cantTexto = document.createElement('span');
            cantTexto.className = 'detalle-item-cant-fija';
            cantTexto.textContent = `x${item.cantidad}`;
            fila.appendChild(cantTexto);
        }

        listaItems.appendChild(fila);
    });

    cuerpo.appendChild(listaItems);

    const barraAcciones = document.createElement('div');
    barraAcciones.className = `panel-acciones-finales ${esPendiente ? 'cuatro-botones' : 'un-boton'}`;

    const btnPdfPanel = document.createElement('a');
    btnPdfPanel.href = `${RUTA_PHP}descargar_tickets_encargo.php?id_encargo=${encodeURIComponent(encargo.id_encargo)}`;
    btnPdfPanel.className = 'btn-admin btn-pdf';
    btnPdfPanel.textContent = 'Descargar PDF';
    barraAcciones.appendChild(btnPdfPanel);

    if (esPendiente) {
        const btnActualizar = document.createElement('button');
        btnActualizar.type = 'button';
        btnActualizar.className = 'btn-admin btn-actualizar';
        btnActualizar.textContent = 'Actualizar';
        btnActualizar.addEventListener('click', async () => {
            await actualizarTodasLasCantidades(inputsCantidad);
        });

        const btnFinalizar = document.createElement('button');
        btnFinalizar.type = 'button';
        btnFinalizar.className = 'btn-admin btn-finalizar';
        btnFinalizar.textContent = 'Finalizar';
        btnFinalizar.addEventListener('click', () => {
            if (confirm('¿Finalizar encargo y descontar inventario?')) {
                enviarAccionEncargo({ accion: 'finalizar', id_encargo: encargo.id_encargo });
            }
        });

        const btnRechazar = document.createElement('button');
        btnRechazar.type = 'button';
        btnRechazar.className = 'btn-admin btn-rechazar';
        btnRechazar.textContent = 'Rechazar';
        btnRechazar.addEventListener('click', () => {
            if (confirm('¿Rechazar este encargo?')) {
                enviarAccionEncargo({ accion: 'rechazar', id_encargo: encargo.id_encargo });
            }
        });

        barraAcciones.append(btnActualizar, btnFinalizar, btnRechazar);
    }

    cuerpo.appendChild(barraAcciones);
}

async function actualizarTodasLasCantidades(listaInputs) {
    try {
        for (const entry of listaInputs) {
            const nuevaCant = parseInt(entry.input.value, 10);
            if (Number.isNaN(nuevaCant) || nuevaCant < 1) {
                alert('Todas las cantidades deben ser mayores o iguales a 1.');
                return;
            }
            const res = await fetch(`${RUTA_PHP}actualizar_encargo.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'editar_cantidad',
                    id_detalle_encargo: entry.id_detalle_encargo,
                    cantidad: nuevaCant
                })
            });
            const data = await res.json();
            if (!data.ok) {
                alert(data.mensaje || 'Error al actualizar una cantidad.');
                return;
            }
        }
        await cargarEncargos();
    } catch (err) {
        console.error(err);
        alert('Error de comunicación con el servidor.');
    }
}

async function enviarAccionEncargo(payload) {
    try {
        const res = await fetch(`${RUTA_PHP}actualizar_encargo.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.ok) {
            alert(data.mensaje || 'Error al actualizar el encargo.');
        } else {
            localStorage.setItem('ultimaActualizacionProductos', Date.now().toString());
            localStorage.setItem('productosTienda', Date.now().toString());
        }
        await cargarEncargos();
    } catch (err) {
        console.error(err);
        alert('Error de comunicación con el servidor.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            sessionStorage.removeItem('adminAutenticado');
            window.location.replace('validarCredencial.html');
        });
    }

    cargarEncargos();
});

window.addEventListener('storage', (e) => {
    if (e.key === 'ultimaActualizacionEncargos') {
        cargarEncargos();
    }
});