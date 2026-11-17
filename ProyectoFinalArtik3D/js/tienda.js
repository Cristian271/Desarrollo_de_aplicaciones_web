const navLogos = document.querySelector('.nav-logos');

window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        navLogos.classList.add('nav-scroll');
    } else {
        navLogos.classList.remove('nav-scroll');
    }
});

const contenedorCatalogo = document.querySelector('.contenedor-catalogo');

function cargarCatalogoTienda() {
    const productosGuardados = JSON.parse(localStorage.getItem('productosTienda'));
    if (!productosGuardados || !contenedorCatalogo) {
        return;
    }

    contenedorCatalogo.innerHTML = '';
    productosGuardados.forEach((prod) => {
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
                <button class="btn-carrito">🛒</button>
            </div>
        `;
        contenedorCatalogo.appendChild(article);
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === 'productosTienda') {
        cargarCatalogoTienda();
    }
});

cargarCatalogoTienda();
