const CLAVE_CARRITO = 'artik3d_carrito';
const CLAVE_CLIENTE = 'artik3d_cliente';
const RUTA_PHP_CARRITO = 'php/';
const RUTA_ICONO_CARRITO = 'assets/images/boton/carritoCompras.png';

let carrito = [];

function asegurarPanelCarritoEnDOM() {
    if (document.getElementById('panel-carrito') || document.querySelector('.carrito-lateral')) {
        return;
    }

    const panel = document.createElement('aside');
    panel.id = 'panel-carrito';
    panel.className = 'carrito-lateral';

    panel.innerHTML = `
        <div class="carrito-cabecera">
            <h2>Tu Carrito de Encargo</h2>
            <button type="button" id="btn-cerrar-carrito" class="btn-cerrar-carrito" aria-label="Cerrar carrito">✕</button>
        </div>
        <div id="carrito-lista-items" class="carrito-lista-items"></div>
        <div class="carrito-total">
            Total estimado: <span id="carrito-total">$0.00</span>
        </div>
        <form id="form-confirmar-encargo" class="carrito-formulario">
            <label for="carrito-nombre-cliente">Tu nombre completo:</label>
            <input type="text" id="carrito-nombre-cliente" maxlength="120" required placeholder="Ej. Alan Morales">

            <label for="carrito-telefono-cliente">Teléfono de contacto (10 dígitos):</label>
            <input type="tel" id="carrito-telefono-cliente" inputmode="numeric" maxlength="10" minlength="10" pattern="[0-9]{10}" required placeholder="Ej. 9991234567" title="Ingresa exactamente 10 dígitos numéricos">

            <button type="submit" class="btn-confirmar-encargo">Confirmar Encargo</button>
        </form>
    `;

    document.body.appendChild(panel);
}

function cargarCarritoDesdeStorage() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO);
        carrito = guardado ? JSON.parse(guardado) : [];
        if (!Array.isArray(carrito)) carrito = [];
    } catch (e) {
        carrito = [];
    }
    actualizarNotificacionCarrito();
}

function guardarCarritoEnStorage() {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    actualizarNotificacionCarrito();
}

function actualizarNotificacionCarrito() {
    const botonesCarritoNav = document.querySelectorAll('.btn-carrito-nav, .nav-logos > a');
    const tieneProductos = carrito.length > 0;

    botonesCarritoNav.forEach(btn => {
        if (tieneProductos) {
            btn.classList.add('tiene-notificacion');
        } else {
            btn.classList.remove('tiene-notificacion');
        }
    });
}

function guardarDatosClienteCookie(nombre, telefono) {
    const datos = encodeURIComponent(JSON.stringify({ nombre_cliente: nombre, telefono }));
    const dias = 30;
    const expira = new Date(Date.now() + dias * 86400000).toUTCString();
    document.cookie = `${CLAVE_CLIENTE}=${datos}; expires=${expira}; path=/; SameSite=Lax`;
}

function leerDatosClienteCookie() {
    const cookies = document.cookie.split('; ');
    for (const c of cookies) {
        if (c.startsWith(`${CLAVE_CLIENTE}=`)) {
            try {
                return JSON.parse(decodeURIComponent(c.split('=')[1]));
            } catch (e) {
                return null;
            }
        }
    }
    return null;
}

function abrirPanelCarrito() {
    asegurarPanelCarritoEnDOM();
    const panel = document.getElementById('panel-carrito') || document.querySelector('.carrito-lateral');
    if (panel) {
        panel.classList.add('abierto');
        renderizarPanelCarrito();
    }
}

function cerrarPanelCarrito() {
    const panel = document.getElementById('panel-carrito') || document.querySelector('.carrito-lateral');
    if (panel) panel.classList.remove('abierto');
}

function agregarAlCarrito(producto) {
    const cprod = Number(producto.cprod);
    const existente = carrito.find(item => Number(item.cprod) === cprod);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            cprod: cprod,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: 1
        });
    }

    guardarCarritoEnStorage();
    renderizarPanelCarrito();

    const btnNav = document.querySelector('.btn-carrito-nav, .nav-logos > a');
    if (btnNav) {
        btnNav.classList.remove('pulso-agregado');
        void btnNav.offsetWidth;
        btnNav.classList.add('pulso-agregado');
    }
}

function cambiarCantidadCarrito(cprod, delta) {
    const index = carrito.findIndex(item => Number(item.cprod) === Number(cprod));
    if (index === -1) return;

    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    guardarCarritoEnStorage();
    renderizarPanelCarrito();
}

function eliminarDelCarrito(cprod) {
    carrito = carrito.filter(item => Number(item.cprod) !== Number(cprod));
    guardarCarritoEnStorage();
    renderizarPanelCarrito();
}

function crearBotonAgregarProducto(producto) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-carrito';
    btn.title = 'Agregar al carrito';

    const img = document.createElement('img');
    img.src = RUTA_ICONO_CARRITO;
    img.alt = 'Agregar al carrito';

    btn.appendChild(img);
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        agregarAlCarrito(producto);
    });

    return btn;
}

function renderizarPanelCarrito() {
    const contenedorItems = document.getElementById('carrito-lista-items') || document.querySelector('.carrito-lista-items');
    const totalEl = document.getElementById('carrito-total');
    if (!contenedorItems || !totalEl) return;

    contenedorItems.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'carrito-vacio-texto';
        vacio.textContent = 'Tu carrito está vacío.';
        contenedorItems.appendChild(vacio);
        totalEl.textContent = '$0.00';
        return;
    }

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const card = document.createElement('div');
        card.className = 'carrito-item';

        const info = document.createElement('div');
        info.className = 'carrito-item-info';

        const titulo = document.createElement('strong');
        titulo.textContent = item.nombre;

        const detallePrecio = document.createElement('span');
        detallePrecio.textContent = `$${item.precio.toFixed(2)} c/u — Subtotal: $${subtotal.toFixed(2)}`;

        info.append(titulo, detallePrecio);

        const controles = document.createElement('div');
        controles.className = 'carrito-item-controles';

        const btnMenos = document.createElement('button');
        btnMenos.type = 'button';
        btnMenos.textContent = '-';
        btnMenos.addEventListener('click', () => cambiarCantidadCarrito(item.cprod, -1));

        const spanCant = document.createElement('span');
        spanCant.textContent = item.cantidad;

        const btnMas = document.createElement('button');
        btnMas.type = 'button';
        btnMas.textContent = '+';
        btnMas.addEventListener('click', () => cambiarCantidadCarrito(item.cprod, 1));

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.textContent = '🗑';
        btnEliminar.title = 'Quitar producto';
        btnEliminar.addEventListener('click', () => eliminarDelCarrito(item.cprod));

        controles.append(btnMenos, spanCant, btnMas, btnEliminar);
        card.append(info, controles);
        contenedorItems.appendChild(card);
    });

    totalEl.textContent = `$${total.toFixed(2)}`;
}

function normalizarTelefono(valor) {
    return String(valor || '').replace(/\D/g, '').slice(0, 10);
}

function esTelefonoValido(valor) {
    return /^\d{10}$/.test(valor);
}

async function enviarEncargoDesdeCarrito(e) {
    e.preventDefault();
    if (carrito.length === 0) {
        alert('Agrega al menos un producto al carrito.');
        return;
    }

    const inputNombre = document.getElementById('carrito-nombre-cliente');
    const inputTelefono = document.getElementById('carrito-telefono-cliente');
    const nombre = inputNombre ? inputNombre.value.trim() : '';
    const telefono = inputTelefono ? inputTelefono.value.trim() : '';

    if (!nombre || nombre.length > 120) {
        alert('Por favor ingresa un nombre válido.');
        if (inputNombre) inputNombre.focus();
        return;
    }

    if (!esTelefonoValido(telefono)) {
        alert('Por favor ingresa un número telefónico válido.');
        if (inputTelefono) inputTelefono.focus();
        return;
    }

    try {
        const res = await fetch(`${RUTA_PHP_CARRITO}crear_encargo.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_cliente: nombre,
                telefono: telefono,
                carrito: carrito.map(i => ({ cprod: i.cprod, cantidad: i.cantidad }))
            })
        });

        const data = await res.json();
        if (!data.ok) {
            alert(data.mensaje || 'No se pudo registrar el encargo.');
            return;
        }

        guardarDatosClienteCookie(nombre, telefono);
        carrito = [];
        guardarCarritoEnStorage();
        renderizarPanelCarrito();
        cerrarPanelCarrito();
        localStorage.setItem('ultimaActualizacionEncargos', Date.now().toString());
        alert(`¡Encargo #${data.id_encargo} registrado con éxito!`);
    } catch (err) {
        console.error(err);
        alert('Error de conexión al enviar el encargo.');
    }
}

function inicializarMenuContacto() {
    const wrapper = document.querySelector('.contacto-nav-wrapper');
    const boton = document.querySelector('.btn-contacto-nav');
    const menu = document.getElementById('menu-contacto');
    if (!wrapper || !boton || !menu) return;

    function cerrarMenu() {
        menu.hidden = true;
        boton.setAttribute('aria-expanded', 'false');
    }

    boton.addEventListener('click', (e) => {
        e.stopPropagation();
        const abrir = menu.hidden;
        menu.hidden = !abrir;
        boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            cerrarMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarMenu();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarMenuContacto();
    asegurarPanelCarritoEnDOM();
    cargarCarritoDesdeStorage();
    renderizarPanelCarrito();

    const datosGuardados = leerDatosClienteCookie();
    if (datosGuardados) {
        const inputNombre = document.getElementById('carrito-nombre-cliente');
        const inputTelefono = document.getElementById('carrito-telefono-cliente');
        const nombreGuardado = datosGuardados.nombre_cliente || datosGuardados.nombre;
        if (inputNombre && nombreGuardado) inputNombre.value = nombreGuardado;
        if (inputTelefono && datosGuardados.telefono) {
            inputTelefono.value = normalizarTelefono(datosGuardados.telefono);
        }
    }

    const inputTelefono = document.getElementById('carrito-telefono-cliente');
    if (inputTelefono) {
        inputTelefono.addEventListener('input', () => {
            const soloDigitos = normalizarTelefono(inputTelefono.value);
            if (inputTelefono.value !== soloDigitos) {
                inputTelefono.value = soloDigitos;
            }
        });
    }

    const botonesAbrir = document.querySelectorAll('.btn-carrito-nav, .nav-logos > a');
    botonesAbrir.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            abrirPanelCarrito();
        });
    });

    const btnCerrar = document.getElementById('btn-cerrar-carrito') || document.querySelector('.btn-cerrar-carrito');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarPanelCarrito);

    const formEncargo = document.getElementById('form-confirmar-encargo');
    if (formEncargo) formEncargo.addEventListener('submit', enviarEncargoDesdeCarrito);

    const params = new URLSearchParams(window.location.search);
    if (params.get('abrirCarrito') === '1') {
        abrirPanelCarrito();
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === CLAVE_CARRITO) {
        cargarCarritoDesdeStorage();
        renderizarPanelCarrito();
    }
});