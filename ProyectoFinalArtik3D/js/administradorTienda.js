if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
} else {
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            sessionStorage.removeItem('adminAutenticado');
            window.location.replace('validarCredencial.html');
        });
    }

    const contenedorCatalogo = document.getElementById('contenedor-catalogo');
    const btnAgregar = document.getElementById('btn-agregar');

    function formatearPrecioAdmin(precio) {
        const numero = Number(precio);
        if (Number.isNaN(numero)) return '$0';
        return Number.isInteger(numero) ? `$${numero}` : `$${numero.toFixed(2)}`;
    }

    function renderizarProductos(productos) {
        if (!contenedorCatalogo) return;
        contenedorCatalogo.innerHTML = '';

        productos.forEach((prod) => {
            const article = document.createElement('article');

            const contImg = document.createElement('div');
            contImg.className = 'contenedor-imagen';

            const img = document.createElement('img');
            img.src = prod.imagen || 'assets/images/products/p1.png';
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

    async function cargarProductos() {
        try {
            const respuesta = await fetch('php/listar_productos.php');
            const data = await respuesta.json();
            if (respuesta.ok && data.ok && Array.isArray(data.productos)) {
                renderizarProductos(data.productos);
            }
        } catch (error) {
            console.error('Error al cargar productos en administrador:', error);
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

    window.addEventListener('storage', (e) => {
        if (e.key === 'ultimaActualizacionProductos') {
            cargarProductos();
        }
    });

    cargarProductos();
}