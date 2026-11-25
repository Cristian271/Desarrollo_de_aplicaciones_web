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

/* SECCIÓN DE OPINIONES */
const btnDejarOpinion = document.getElementById('btn-dejar-opinion');
const contenedorOpinionesIndex = document.getElementById('contenedor-opiniones-index');
const promedio = document.getElementById('promedio-opiniones');
const estrellasPromedio = document.getElementById('estrellas-promedio');
const totalOpiniones = document.getElementById('total-opiniones');

if (btnDejarOpinion) {
    btnDejarOpinion.addEventListener('click', () => {
        window.open('agregarComentario.html', 'DejarOpinion', 'width=480,height=640');
    });
}

let indiceRotacion = 0;
let intervaloRotacion = null;

function generarEstrellasOpinion(calificacion) {
    const llenas = Math.round(calificacion);
    return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

function actualizarResumenOpiniones(aprobados) {
    if (!promedio || !estrellasPromedio || !totalOpiniones) return;

    if (aprobados.length === 0) {
        promedio.textContent = '0.0';
        estrellasPromedio.textContent = '☆☆☆☆☆';
        totalOpiniones.textContent = 'Sin reseñas aún';
        return;
    }

    const suma = aprobados.reduce((acum, item) => acum + Number(item.calificacion), 0);
    const promedioC = suma / aprobados.length;

    promedio.textContent = promedioC.toFixed(1);
    estrellasPromedio.textContent = generarEstrellasOpinion(promedioC);
    totalOpiniones.textContent = `Basado en ${aprobados.length} ${aprobados.length === 1 ? 'opinión' : 'opiniones'}`;
}

function mostrarOpinionesVisibles(aprobados) {
    if (!contenedorOpinionesIndex) return;
    contenedorOpinionesIndex.innerHTML = '';

    if (aprobados.length === 0) {
        contenedorOpinionesIndex.innerHTML = `
            <div class="tarjeta">
                <p class="comentario">Aún no hay opiniones aprobadas. ¡Sé el primero en dejar la tuya!</p>
            </div>
        `;
        return;
    }

    const cantidadAMostrar = Math.min(3, aprobados.length);

    for (let i = 0; i < cantidadAMostrar; i++) {
        const posicion = (indiceRotacion + i) % aprobados.length;
        const item = aprobados[posicion];

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta tarjeta-opinion';

        const bloqueSuperior = document.createElement('div');

        const cabecera = document.createElement('div');
        cabecera.className = 'cabecera-tarjeta';

        const infoUsuario = document.createElement('div');
        infoUsuario.className = 'info-usuario';

        const h3 = document.createElement('h3');
        h3.textContent = item.nombre || '';

        const divEstrellas = document.createElement('div');
        divEstrellas.className = 'estrellas';
        divEstrellas.textContent = generarEstrellasOpinion(item.calificacion);

        infoUsuario.appendChild(h3);
        infoUsuario.appendChild(divEstrellas);
        cabecera.appendChild(infoUsuario);

        const pComentario = document.createElement('p');
        pComentario.className = 'comentario';
        pComentario.textContent = item.comentario || '';

        bloqueSuperior.appendChild(cabecera);
        bloqueSuperior.appendChild(pComentario);

        const pie = document.createElement('div');
        pie.className = 'pie-tarjeta';
        pie.textContent = item.fecha || '';

        tarjeta.appendChild(bloqueSuperior);
        tarjeta.appendChild(pie);
        contenedorOpinionesIndex.appendChild(tarjeta);
    }
}

async function iniciarSistemaOpiniones() {
    try {
        const respuesta = await fetch('php/listar_comentarios.php?publico=1');
        const data = await respuesta.json();
        if (!respuesta.ok || !data.ok) return;

        const aprobados = Array.isArray(data.aprobados) ? data.aprobados : [];

        if (indiceRotacion >= aprobados.length) {
            indiceRotacion = 0;
        }

        actualizarResumenOpiniones(aprobados);
        mostrarOpinionesVisibles(aprobados);

        if (intervaloRotacion) {
            clearInterval(intervaloRotacion);
            intervaloRotacion = null;
        }

        if (aprobados.length > 3) {
            intervaloRotacion = setInterval(() => {
                indiceRotacion = (indiceRotacion + 3) % aprobados.length;
                mostrarOpinionesVisibles(aprobados);
            }, 15000);
        }
    } catch (error) {
        console.error('Error al cargar opiniones:', error);
    }
}

window.addEventListener('storage', (e) => {
    if (e.key === 'ultimaActualizacionComentarios') {
        iniciarSistemaOpiniones();
    }
});
window.addEventListener('focus', iniciarSistemaOpiniones);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) iniciarSistemaOpiniones();
});

iniciarSistemaOpiniones();