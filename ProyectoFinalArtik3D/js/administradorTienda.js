if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
} else {
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async () => {
            try {
                await fetch('php/logout_admin.php', { method: 'POST' });
            } catch (error) {
                console.error('Error al cerrar sesión en el servidor:', error);
            } finally {
                sessionStorage.removeItem('adminAutenticado');
                window.location.replace('validarCredencial.html');
            }
        });
    }

    const contenedorCatalogo = document.getElementById('contenedor-catalogo');
    const btnAgregar = document.getElementById('btn-agregar');
    const formBusqueda = document.getElementById('form-busqueda-admin');
    const inputBuscar = document.getElementById('input-buscar-admin');
    const btnLimpiarBusqueda = document.getElementById('btn-limpiar-busqueda-admin');
    const estadoBusqueda = document.getElementById('estado-busqueda-admin');

    const LONGITUD_MAX_BUSQUEDA = 120;
    const DEBOUNCE_BUSQUEDA_MS = 280;

    let controladorBusquedaActual = null;
    let temporizadorBusqueda = null;
    let ultimoTerminoBuscado = '';

    function formatearPrecioAdmin(precio) {
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

    function renderizarProductos(productos, terminoBuscado = '') {
        if (!contenedorCatalogo) return;
        contenedorCatalogo.innerHTML = '';

        if (!Array.isArray(productos) || productos.length === 0) {
            const aviso = document.createElement('p');
            aviso.className = 'mensaje-sin-resultados';
            aviso.textContent = terminoBuscado
                ? `No se encontraron productos que coincidan con "${terminoBuscado}".`
                : 'No hay productos registrados en la tienda.';
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
            spanPrecio.textContent = formatearPrecioAdmin(prod.precio);

            datosTexto.appendChild(h3);
            datosTexto.appendChild(spanPrecio);

            const btnBorrar = document.createElement('button');
            btnBorrar.className = 'btn-borrar';
            btnBorrar.type = 'button';
            btnBorrar.dataset.cprod = String(prod.cprod);
            btnBorrar.dataset.nombre = prod.nombre || 'este producto';

            const imgBasura = document.createElement('img');
            imgBasura.src = 'assets/images/boton/basura.png';
            imgBasura.alt = 'Borrar';
            btnBorrar.appendChild(imgBasura);

            info.appendChild(datosTexto);
            info.appendChild(btnBorrar);

            article.appendChild(contImg);
            article.appendChild(info);
            contenedorCatalogo.appendChild(article);
        });
    }

    async function cargarProductos(terminoRaw = ultimoTerminoBuscado) {
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
            const url = `php/buscar_productos.php?admin=1&q=${encodeURIComponent(termino)}`;
            const respuesta = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: controladorBusquedaActual.signal
            });

            if (respuesta.status === 401) {
                sessionStorage.removeItem('adminAutenticado');
                window.location.replace('validarCredencial.html');
                return;
            }

            const data = await respuesta.json();
            if (!respuesta.ok || !data.ok) {
                actualizarEstadoBusqueda(data.mensaje || 'No se pudo realizar la búsqueda.', true);
                return;
            }

            const productos = Array.isArray(data.productos) ? data.productos : [];
            renderizarProductos(productos, termino);

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
            console.error('Error al cargar productos en administrador:', error);
            actualizarEstadoBusqueda('Ocurrió un error al consultar los productos.', true);
        }
    }

    if (contenedorCatalogo) {
        contenedorCatalogo.addEventListener('click', async (e) => {
            const boton = e.target.closest('.btn-borrar');
            if (!boton) return;

            const cprod = boton.dataset.cprod;
            const nombre = boton.dataset.nombre || 'este producto';
            if (!cprod) return;

            const confirmar = confirm(`¿Seguro que deseas eliminar "${nombre}" de la tienda?`);
            if (!confirmar) return;

            boton.disabled = true;

            try {
                const respuesta = await fetch('php/eliminar_producto.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cprod: Number(cprod), accion: 'eliminar' })
                });
                const data = await respuesta.json();

                if (!respuesta.ok || !data.ok) {
                    alert(data.mensaje || 'No se pudo eliminar el producto.');
                    boton.disabled = false;
                    return;
                }

                localStorage.setItem('ultimaActualizacionProductos', String(Date.now()));
                await cargarProductos();
            } catch (error) {
                console.error('Error al eliminar producto:', error);
                alert('Error de comunicación con el servidor al eliminar.');
                boton.disabled = false;
            }
        });
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            localStorage.setItem('destinoProducto', 'tienda');
            window.open('agregarProducto.html', 'AgregarProducto', 'width=480,height=680');
        });
    }

    if (formBusqueda && inputBuscar) {
        formBusqueda.addEventListener('submit', (e) => {
            e.preventDefault();
            clearTimeout(temporizadorBusqueda);
            cargarProductos(inputBuscar.value);
        });

        inputBuscar.addEventListener('input', () => {
            actualizarBotonLimpiar();
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(() => {
                cargarProductos(inputBuscar.value);
            }, DEBOUNCE_BUSQUEDA_MS);
        });
    }

    if (btnLimpiarBusqueda && inputBuscar) {
        btnLimpiarBusqueda.addEventListener('click', () => {
            clearTimeout(temporizadorBusqueda);
            inputBuscar.value = '';
            actualizarBotonLimpiar();
            inputBuscar.focus();
            cargarProductos('');
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'ultimaActualizacionProductos') {
            cargarProductos();
        }
    });

    actualizarBotonLimpiar();
    cargarProductos();
}