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

    const contenedorDestacados = document.getElementById('contenedor-destacados');
    const btnAgregar = document.getElementById('btn-agregar');
    const MAX_PRODUCTOS = 8;
    let totalDestacadosActuales = 0;

    function formatearPrecioDestacados(precio) {
        const numero = Number(precio);
        if (Number.isNaN(numero)) return '$0';
        return Number.isInteger(numero) ? `$${numero}` : `$${numero.toFixed(2)}`;
    }

    function renderizarProductos(productos) {
        if (!contenedorDestacados) return;
        contenedorDestacados.innerHTML = '';
        totalDestacadosActuales = productos.length;

        productos.slice(0, MAX_PRODUCTOS).forEach((prod) => {
            const article = document.createElement('article');

            const contImg = document.createElement('div');
            contImg.className = 'contenedor-imagen';

            const img = document.createElement('img');
            img.src = prod.imagen || 'assets/images/products/p1.png';
            img.alt = prod.nombre || 'Producto destacado';
            contImg.appendChild(img);

            const info = document.createElement('div');
            info.className = 'info-producto';

            const datosTexto = document.createElement('div');
            const h3 = document.createElement('h3');
            h3.textContent = prod.nombre || '';

            const spanPrecio = document.createElement('span');
            spanPrecio.textContent = formatearPrecioDestacados(prod.precio);

            datosTexto.appendChild(h3);
            datosTexto.appendChild(spanPrecio);

            const btnBorrar = document.createElement('button');
            btnBorrar.className = 'btn-borrar';
            btnBorrar.type = 'button';
            btnBorrar.dataset.cprod = String(prod.cprod);
            btnBorrar.dataset.nombre = prod.nombre || 'este producto';

            const imgBasura = document.createElement('img');
            imgBasura.src = 'assets/images/boton/basura.png';
            imgBasura.alt = 'Quitar de destacados';
            btnBorrar.appendChild(imgBasura);

            info.appendChild(datosTexto);
            info.appendChild(btnBorrar);

            article.appendChild(contImg);
            article.appendChild(info);
            contenedorDestacados.appendChild(article);
        });
    }

    async function cargarProductos() {
        try {
            const respuesta = await fetch('php/listar_productos.php?destacados=1');
            const data = await respuesta.json();
            if (respuesta.ok && data.ok && Array.isArray(data.productos)) {
                renderizarProductos(data.productos);
            }
        } catch (error) {
            console.error('Error al cargar destacados en administrador:', error);
        }
    }

    if (contenedorDestacados) {
        contenedorDestacados.addEventListener('click', async (e) => {
            const boton = e.target.closest('.btn-borrar');
            if (!boton) return;

            const cprod = boton.dataset.cprod;
            const nombre = boton.dataset.nombre || 'este producto';
            if (!cprod) return;

            const confirmar = confirm(`¿Quitar "${nombre}" de productos destacados?`);
            if (!confirmar) return;

            boton.disabled = true;

            try {
                const respuesta = await fetch('php/eliminar_producto.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cprod: Number(cprod), accion: 'quitar_destacado' })
                });
                const data = await respuesta.json();

                if (!respuesta.ok || !data.ok) {
                    alert(data.mensaje || 'No se pudo quitar el producto de destacados.');
                    boton.disabled = false;
                    return;
                }

                localStorage.setItem('ultimaActualizacionProductos', String(Date.now()));
                await cargarProductos();
            } catch (error) {
                console.error('Error al quitar destacado:', error);
                alert('Error de comunicación con el servidor.');
                boton.disabled = false;
            }
        });
    }

    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            if (totalDestacadosActuales >= MAX_PRODUCTOS) {
                alert('Solo se permite un máximo de 8 productos destacados.');
                return;
            }
            localStorage.setItem('destinoProducto', 'destacados');
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