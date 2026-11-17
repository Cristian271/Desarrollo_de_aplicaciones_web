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

    function obtenerProductosIniciales() {
        const articulos = contenedorCatalogo.querySelectorAll('article');
        const lista = [];
        articulos.forEach((articulo) => {
            const imagen = articulo.querySelector('img').getAttribute('src');
            const nombre = articulo.querySelector('h3').textContent;
            const precio = articulo.querySelector('span').textContent;
            lista.push({ nombre, precio, imagen });
        });
        return lista;
    }

    function cargarProductos() {
        let productos = JSON.parse(localStorage.getItem('productosTienda'));
        if (!productos) {
            productos = obtenerProductosIniciales();
            localStorage.setItem('productosTienda', JSON.stringify(productos));
        }
        renderizarProductos(productos);
    }

    function renderizarProductos(productos) {
        contenedorCatalogo.innerHTML = '';
        productos.forEach((prod, index) => {
            const article = document.createElement('article');
            article.innerHTML = `
                <div class="contenedor-imagen">
                    <img src="${prod.imagen}">
                </div>
                <div class="info-producto">
                    <div>
                        <h3>${prod.nombre}</h3>
                        <span>${prod.precio}</span>
                    </div>
                    <button class="btn-borrar" data-index="${index}"><img src="assets/images/boton/basura.png" alt="Borrar"></button>
                </div>
            `;
            contenedorCatalogo.appendChild(article);
        });

        const botonesBorrar = contenedorCatalogo.querySelectorAll('.btn-borrar');
        botonesBorrar.forEach((boton) => {
            boton.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                borrarProducto(index);
            });
        });
    }

    function borrarProducto(index) {
        const productos = JSON.parse(localStorage.getItem('productosTienda')) || [];
        productos.splice(index, 1);
        localStorage.setItem('productosTienda', JSON.stringify(productos));
        renderizarProductos(productos);
    }

    btnAgregar.addEventListener('click', () => {
        localStorage.setItem('destinoProducto', 'tienda');
        window.open('agregarProducto.html', 'AgregarProducto', 'width=480,height=620');
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'productosTienda') {
            cargarProductos();
        }
    });

    cargarProductos();
}
