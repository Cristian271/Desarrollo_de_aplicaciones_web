const navLogos = document.querySelector('.nav-logos');

window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        navLogos.classList.add('nav-scroll');
    } else {
        navLogos.classList.remove('nav-scroll');
    }
});

const contenedorCatalogo = document.querySelector('.contenedor-catalogo');

function formatearPrecio(precio) {
    const numero = Number(precio);
    if (Number.isNaN(numero)) return '$0';
    return Number.isInteger(numero) ? `$${numero}` : `$${numero.toFixed(2)}`;
}

function renderizarCatalogoTienda(productos) {
    if (!contenedorCatalogo) return;
    contenedorCatalogo.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
        const aviso = document.createElement('p');
        aviso.textContent = 'No hay productos disponibles por el momento.';
        contenedorCatalogo.appendChild(aviso);
        return;
    }

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
        spanPrecio.textContent = formatearPrecio(prod.precio);

        datosTexto.appendChild(h3);
        datosTexto.appendChild(spanPrecio);

        const btnCarrito = document.createElement('button');
        btnCarrito.className = 'btn-carrito';
        btnCarrito.type = 'button';
        btnCarrito.textContent = '🛒';
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

async function cargarCatalogoTienda() {
    try {
        const respuesta = await fetch('php/listar_productos.php?publico=1');
        const data = await respuesta.json();
        if (respuesta.ok && data.ok) {
            renderizarCatalogoTienda(data.productos);
        }
    } catch (error) {
        console.error('Error al cargar el catálogo de la tienda:', error);
    }
}

window.addEventListener('storage', (e) => {
    if (e.key === 'productosTienda') {
        cargarCatalogoTienda();
    }
});

cargarCatalogoTienda();
