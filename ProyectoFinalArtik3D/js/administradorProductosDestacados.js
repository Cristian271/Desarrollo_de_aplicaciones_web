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

    function obtenerProductosIniciales() {
        const articulos = contenedorDestacados.querySelectorAll('article');
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
        let productos = JSON.parse(localStorage.getItem('productosDestacados'));
        if (!productos) {
            productos = obtenerProductosIniciales();
            localStorage.setItem('productosDestacados', JSON.stringify(productos));
        }
        renderizarProductos(productos);
    }

    function renderizarProductos(productos) {
        contenedorDestacados.innerHTML = '';
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
            contenedorDestacados.appendChild(article);
        });

        const botonesBorrar = contenedorDestacados.querySelectorAll('.btn-borrar');
        botonesBorrar.forEach((boton) => {
            boton.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                borrarProducto(index);
            });
        });
    }

    function borrarProducto(index) {
        const productos = JSON.parse(localStorage.getItem('productosDestacados')) || [];
        productos.splice(index, 1);
        localStorage.setItem('productosDestacados', JSON.stringify(productos));
        renderizarProductos(productos);
    }

    btnAgregar.addEventListener('click', () => {
        const productos = JSON.parse(localStorage.getItem('productosDestacados')) || [];
        if (productos.length >= MAX_PRODUCTOS) {
            alert('Solo se permite un máximo de 8 productos destacados. Borra alguno antes de añadir uno nuevo.');
            return;
        }
        localStorage.setItem('destinoProducto', 'destacados');
        window.open('agregarProducto.html', 'AgregarProducto', 'width=480,height=620');
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'productosDestacados') {
            cargarProductos();
        }
    });

    cargarProductos();
}
