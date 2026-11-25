const STORAGE_KEY = 'artik3d_carrito';
const COOKIE_NAME = 'artik3d_cliente';

function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

function leerCookieCliente() {
    const cookies = document.cookie.split('; ');
    const encontrada = cookies.find(row => row.startsWith(`${COOKIE_NAME}=`));
    if (!encontrada) return null;
    try {
        return JSON.parse(decodeURIComponent(encontrada.split('=')[1]));
    } catch {
        return null;
    }
}

function autocompletarDatosCliente() {
    const datos = leerCookieCliente();
    if (!datos) return;
    const inputNombre = document.getElementById('nombre_cliente');
    const inputTel = document.getElementById('telefono_cliente');
    if (inputNombre && datos.nombre_cliente) inputNombre.value = datos.nombre_cliente;
    if (inputTel && datos.telefono) inputTel.value = datos.telefono;
}

function agregarAlCarrito(prod) {
    const cprod = Number(prod.cprod || prod.id || 0);
    if (!cprod) {
        alert('Error: El producto no tiene identificador válido.');
        return;
    }

    const carrito = obtenerCarrito();
    const existente = carrito.find(item => Number(item.cprod) === cprod);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            cprod: cprod,
            nombre: prod.nombre || 'Producto',
            precio: Number(prod.precio || 0),
            imagen: prod.imagen || 'assets/images/products/p1.png',
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    renderizarCarrito();
    abrirCarrito();
}

function cambiarCantidadCarrito(cprod, delta) {
    let carrito = obtenerCarrito();
    const index = carrito.findIndex(item => Number(item.cprod) === Number(cprod));
    if (index === -1) return;

    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    guardarCarrito(carrito);
    renderizarCarrito();
}

function eliminarDelCarrito(cprod) {
    const carrito = obtenerCarrito().filter(item => Number(item.cprod) !== Number(cprod));
    guardarCarrito(carrito);
    renderizarCarrito();
}

function abrirCarrito() {
    const panel = document.getElementById('panel-carrito-lateral');
    if (panel) {
        panel.classList.add('abierto');
        renderizarCarrito();
    }
}

function cerrarCarrito() {
    const panel = document.getElementById('panel-carrito-lateral');
    if (panel) {
        panel.classList.remove('abierto');
    }
}

function inicializarPanelCarrito() {
    if (document.getElementById('panel-carrito-lateral')) return;

    const aside = document.createElement('aside');
    aside.id = 'panel-carrito-lateral';
    aside.className = 'carrito-lateral';

    const cabecera = document.createElement('div');
    cabecera.className = 'carrito-cabecera';

    const titulo = document.createElement('h2');
    titulo.textContent = 'Tu Carrito de Encargo';

    const btnCerrar = document.createElement('button');
    btnCerrar.type = 'button';
    btnCerrar.className = 'btn-cerrar-carrito';
    btnCerrar.textContent = '✕';
    btnCerrar.addEventListener('click', cerrarCarrito);

    cabecera.append(titulo, btnCerrar);

    const lista = document.createElement('div');
    lista.id = 'carrito-lista-items';
    lista.className = 'carrito-lista-items';

    const totalDiv = document.createElement('div');
    totalDiv.id = 'carrito-total-texto';
    totalDiv.className = 'carrito-total';

    const form = document.createElement('form');
    form.id = 'form-confirmar-encargo';
    form.className = 'carrito-formulario';
    form.addEventListener('submit', confirmarEncargo);

    const labelNombre = document.createElement('label');
    labelNombre.htmlFor = 'nombre_cliente';
    labelNombre.textContent = 'Tu nombre completo:';

    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.id = 'nombre_cliente';
    inputNombre.required = true;
    inputNombre.placeholder = 'Ej. Alan Morales';

    const labelTel = document.createElement('label');
    labelTel.htmlFor = 'telefono_cliente';
    labelTel.textContent = 'Teléfono de contacto:';

    const inputTel = document.createElement('input');
    inputTel.type = 'tel';
    inputTel.id = 'telefono_cliente';
    inputTel.required = true;
    inputTel.placeholder = 'Ej. 9991234567';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.type = 'submit';
    btnConfirmar.className = 'btn-confirmar-encargo';
    btnConfirmar.textContent = 'Confirmar Encargo';

    form.append(labelNombre, inputNombre, labelTel, inputTel, btnConfirmar);
    aside.append(cabecera, lista, totalDiv, form);
    document.body.appendChild(aside);

    const iconoNavCarrito = document.querySelector('.nav-logos img[alt*="Carrito"]')?.closest('a');
    if (iconoNavCarrito) {
        iconoNavCarrito.href = '#';
        iconoNavCarrito.addEventListener('click', (e) => {
            e.preventDefault();
            abrirCarrito();
        });
    }
}

function renderizarCarrito() {
    const contenedor = document.getElementById('carrito-lista-items');
    const totalDiv = document.getElementById('carrito-total-texto');
    if (!contenedor || !totalDiv) return;

    const carrito = obtenerCarrito();
    contenedor.innerHTML = '';

    if (carrito.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'carrito-vacio';
        vacio.textContent = 'Tu carrito está vacío.';
        contenedor.appendChild(vacio);
        totalDiv.textContent = 'Total estimado: $0.00';
        return;
    }

    let total = 0;

    carrito.forEach(item => {
        const subtotal = Number(item.precio) * Number(item.cantidad);
        total += subtotal;

        const fila = document.createElement('div');
        fila.className = 'carrito-item';

        const info = document.createElement('div');
        info.className = 'carrito-item-info';

        const nombre = document.createElement('strong');
        nombre.textContent = item.nombre;

        const precio = document.createElement('span');
        precio.textContent = `$${Number(item.precio).toFixed(2)} c/u — Subtotal: $${subtotal.toFixed(2)}`;

        info.append(nombre, precio);

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

        const btnQuitar = document.createElement('button');
        btnQuitar.type = 'button';
        btnQuitar.className = 'btn-quitar-item';
        btnQuitar.textContent = '🗑';
        btnQuitar.addEventListener('click', () => eliminarDelCarrito(item.cprod));

        controles.append(btnMenos, spanCant, btnMas, btnQuitar);
        fila.append(info, controles);
        contenedor.appendChild(fila);
    });

    totalDiv.textContent = `Total estimado: $${total.toFixed(2)}`;
}

async function confirmarEncargo(event) {
    if (event) event.preventDefault();

    const nombre = document.getElementById('nombre_cliente')?.value.trim() || '';
    const telefono = document.getElementById('telefono_cliente')?.value.trim() || '';
    const carrito = obtenerCarrito();

    if (!nombre || !telefono || carrito.length === 0) {
        alert('Por favor ingresa tu nombre, teléfono y agrega al menos un producto.');
        return;
    }

    try {
        const respuesta = await fetch('php/crear_encargo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_cliente: nombre,
                telefono: telefono,
                carrito: carrito
            })
        });

        const data = await respuesta.json();

        if (data.ok) {
            localStorage.removeItem(STORAGE_KEY);
            // Avisar a Encargos.html que se registró un pedido nuevo
            localStorage.setItem('ultimaActualizacionEncargos', Date.now().toString());

            const payload = encodeURIComponent(JSON.stringify({ nombre_cliente: nombre, telefono }));
            document.cookie = `${COOKIE_NAME}=${payload}; max-age=${86400 * 30}; path=/; SameSite=Lax`;

            alert(`Encargo registrado con éxito. Tu folio es #${data.id_encargo}`);
            renderizarCarrito();
            cerrarCarrito();
        } else {
            alert(data.mensaje || 'No se pudo registrar el encargo.');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor.');
    }
}

// Sincronizar si el usuario tiene abiertas dos pestañas (ej. index.html y tienda.html)
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        renderizarCarrito();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    inicializarPanelCarrito();
    autocompletarDatosCliente();
    renderizarCarrito();

    const params = new URLSearchParams(window.location.search);
    if (params.get('abrirCarrito') === '1') {
        abrirCarrito();
    }
});