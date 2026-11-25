const producto = {
    nombre: "Nutria",
    cantidad: 5,
    disponible: true,
};

function activarBotonCompra() {
    const boton = document.getElementById('btn-compra');
    if (boton) {
        boton.addEventListener("click", () => {
            if (producto.disponible === true) {
                producto.cantidad -= 1;
                if (producto.cantidad === 0) {
                    producto.disponible = false;
                }
            } else {
                alert('Producto no disponible');
            }
        });
    }
}

const navLogos = document.querySelector('.nav-logos');
window.addEventListener('scroll', () => {
    if (!navLogos) return;
    if (window.scrollY > 20) {
        navLogos.classList.add('nav-scroll');
    } else {
        navLogos.classList.remove('nav-scroll');
    }
});

const contenedorDestacados = document.querySelector('.contenedor-productos-destacados');

function formatearPrecioDestacado(precio) {
    const numero = Number(precio);
    if (Number.isNaN(numero)) return '$0';
    return Number.isInteger(numero) ? `$${numero}` : `$${numero.toFixed(2)}`;
}

function renderizarDestacadosIndex(productos) {
    if (!contenedorDestacados) return;
    contenedorDestacados.innerHTML = '';

    productos.slice(0, 8).forEach((prod, index) => {
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
        spanPrecio.textContent = formatearPrecioDestacado(prod.precio);

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
        contenedorDestacados.appendChild(article);
    });

    activarBotonCompra();
}

async function cargarDestacadosIndex() {
    try {
        const respuesta = await fetch('php/listar_productos.php?publico=1&destacados=1');
        const data = await respuesta.json();
        if (respuesta.ok && data.ok && Array.isArray(data.productos)) {
            renderizarDestacadosIndex(data.productos);
            return;
        }
    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
    }
    activarBotonCompra();
}

window.addEventListener('storage', (e) => {
    if (e.key === 'ultimaActualizacionProductos') {
        cargarDestacadosIndex();
    }
});

cargarDestacadosIndex();