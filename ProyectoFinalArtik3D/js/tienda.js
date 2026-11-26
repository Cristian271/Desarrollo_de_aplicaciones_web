const navLogos = document.querySelector('.nav-logos');

window.addEventListener('scroll', () => {
    if (!navLogos) return;
    if (window.scrollY > 20) {
        navLogos.classList.add('nav-scroll');
    } else {
        navLogos.classList.remove('nav-scroll');
    }
});

const contenedorCatalogo = document.querySelector('.contenedor-catalogo');
const formBusqueda = document.getElementById('form-busqueda-tienda');
const inputBuscar = document.getElementById('input-buscar-producto');
const btnLimpiarBusqueda = document.getElementById('btn-limpiar-busqueda');
const estadoBusqueda = document.getElementById('estado-busqueda');

const LONGITUD_MAX_BUSQUEDA = 120;
const DEBOUNCE_BUSQUEDA_MS = 280;

let controladorBusquedaActual = null;
let temporizadorBusqueda = null;
let ultimoTerminoBuscado = '';

function formatearPrecio(precio) {
    const numero = Number(precio);
    if (Number.isNaN(numero)) return '$0';
    return Number.isInteger(numero) ? `$${numero}` : `$${numero.toFixed(2)}`;
}

function obtenerRutaImagenSegura(ruta) {
    const valor = typeof ruta === 'string' ? ruta.trim() : '';
    if (valor.startsWith('assets/') || valor.startsWith('https://') || valor.startsWith('http://')) {
        return valor;
    }
    return 'assets/images/products/p1.png';
}

function sanitizarTerminoBusqueda(texto) {
    if (typeof texto !== 'string') return '';
    return texto
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, LONGITUD_MAX_BUSQUEDA);
}

function actualizarEstadoBusqueda(mensaje, esError = false) {
    if (!estadoBusqueda) return;
    estadoBusqueda.textContent = mensaje;
    estadoBusqueda.classList.toggle('estado-error', esError);
}

function actualizarBotonLimpiar() {
    if (!btnLimpiarBusqueda || !inputBuscar) return;
    btnLimpiarBusqueda.hidden = inputBuscar.value.trim().length === 0;
}

function renderizarCatalogoTienda(productos, terminoBuscado = '') {
    if (!contenedorCatalogo) return;
    contenedorCatalogo.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
        const aviso = document.createElement('p');
        aviso.className = 'mensaje-sin-resultados';
        aviso.textContent = terminoBuscado
            ? `No se encontraron productos que coincidan con "${terminoBuscado}".`
            : 'No hay productos disponibles por el momento.';
        contenedorCatalogo.appendChild(aviso);
        return;
    }

    productos.forEach((prod) => {
        const article = document.createElement('article');

        const contImg = document.createElement('div');
        contImg.className = 'contenedor-imagen';

        const img = document.createElement('img');
        img.src = obtenerRutaImagenSegura(prod.imagen);
        img.alt = prod.nombre || 'Producto';
        contImg.appendChild(img);

        const info = document.createElement('div');
        info.className = 'info-producto';

        const datosTexto = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = prod.nombre || '';

        const spanPrecio = document.createElement('span');
        spanPrecio.textContent = formatearPrecio(prod.precio);

        datosTexto.appendChild(h3);
        datosTexto.appendChild(spanPrecio);

        const btnCarrito = document.createElement('button');
        btnCarrito.className = 'btn-carrito';
        btnCarrito.type = 'button';
        btnCarrito.title = 'Agregar al carrito';

        const imgCarrito = document.createElement('img');
        imgCarrito.src = 'assets/images/boton/carritoCompras.png';
        imgCarrito.alt = 'Agregar al carrito';
        btnCarrito.appendChild(imgCarrito);

        btnCarrito.addEventListener('click', () => {
            if (typeof agregarAlCarrito === 'function') {
                agregarAlCarrito(prod);
            }
        });

        info.appendChild(datosTexto);
        info.appendChild(btnCarrito);

        article.appendChild(contImg);
        article.appendChild(info);
        contenedorCatalogo.appendChild(article);
    });
}

async function buscarProductosTienda(terminoRaw = '') {
    const termino = sanitizarTerminoBusqueda(terminoRaw);
    ultimoTerminoBuscado = termino;

    if (controladorBusquedaActual) {
        controladorBusquedaActual.abort();
    }
    controladorBusquedaActual = new AbortController();

    if (termino) {
        actualizarEstadoBusqueda(`Buscando "${termino}"...`);
    } else {
        actualizarEstadoBusqueda('');
    }

    try {
        const url = `php/buscar_productos.php?q=${encodeURIComponent(termino)}`;
        const respuesta = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controladorBusquedaActual.signal
        });

        const data = await respuesta.json();
        if (!respuesta.ok || !data.ok) {
            actualizarEstadoBusqueda(data.mensaje || 'No se pudo realizar la búsqueda.', true);
            return;
        }

        const productos = Array.isArray(data.productos) ? data.productos : [];
        renderizarCatalogoTienda(productos, termino);

        if (termino) {
            const etiqueta = productos.length === 1 ? 'producto encontrado' : 'productos encontrados';
            actualizarEstadoBusqueda(`${productos.length} ${etiqueta} para "${termino}".`);
        } else {
            actualizarEstadoBusqueda('');
        }
    } catch (error) {
        if (error && error.name === 'AbortError') {
            return;
        }
        console.error('Error al buscar productos en la tienda:', error);
        actualizarEstadoBusqueda('Ocurrió un error al consultar el catálogo.', true);
    }
}

if (formBusqueda && inputBuscar) {
    formBusqueda.addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(temporizadorBusqueda);
        buscarProductosTienda(inputBuscar.value);
    });

    inputBuscar.addEventListener('input', () => {
        actualizarBotonLimpiar();
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(() => {
            buscarProductosTienda(inputBuscar.value);
        }, DEBOUNCE_BUSQUEDA_MS);
    });
}

if (btnLimpiarBusqueda && inputBuscar) {
    btnLimpiarBusqueda.addEventListener('click', () => {
        clearTimeout(temporizadorBusqueda);
        inputBuscar.value = '';
        actualizarBotonLimpiar();
        inputBuscar.focus();
        buscarProductosTienda('');
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === 'productosTienda') {
        buscarProductosTienda(ultimoTerminoBuscado);
    }
});

actualizarBotonLimpiar();
buscarProductosTienda('');