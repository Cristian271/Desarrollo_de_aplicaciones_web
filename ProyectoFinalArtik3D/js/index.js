const producto = {
    nombre: "Nutria",
    cantidad: 5,
    disponible: true,
};

console.log(producto.cantidad);

function activarBotonCompra() {
    const boton = document.getElementById('btn-compra');
    if (boton) {
        boton.addEventListener("click", () => {
            if (producto.disponible == true) {
                producto.cantidad -= 1;
                console.log(producto.cantidad);
                if (producto.cantidad == 0) {
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
    if (window.scrollY > 20) {
        navLogos.classList.add('nav-scroll');
    } else {
        navLogos.classList.remove('nav-scroll');
    }
});

const contenedorDestacados = document.querySelector('.contenedor-productos-destacados');

function cargarDestacadosIndex() {
    const productosGuardados = JSON.parse(localStorage.getItem('productosDestacados'));
    if (productosGuardados && contenedorDestacados) {
        contenedorDestacados.innerHTML = '';
        productosGuardados.forEach((prod, index) => {
            const article = document.createElement('article');
            const idBtn = index === 0 ? 'id="btn-compra" type="submit" value="agregar"' : '';
            article.innerHTML = `
                <div class="contenedor-imagen">
                    <img src="${prod.imagen}">
                </div>
                <div class="info-producto">
                    <div>
                        <h3>${prod.nombre}</h3>
                        <span>${prod.precio}</span>
                    </div>
                    <button class="btn-carrito" ${idBtn}>🛒</button>
                </div>
            `;
            contenedorDestacados.appendChild(article);
        });
    }
    activarBotonCompra();
}

window.addEventListener('storage', (e) => {
    if (e.key === 'productosDestacados') {
        cargarDestacadosIndex();
    }
});

cargarDestacadosIndex();
