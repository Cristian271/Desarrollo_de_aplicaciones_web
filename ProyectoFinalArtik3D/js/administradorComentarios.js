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

    const contenedorPendientes = document.getElementById('contenedor-pendientes');
    const contenedorAprobados = document.getElementById('contenedor-aprobados');

    function generarEstrellas(calificacion) {
        const llenas = Math.max(0, Math.min(5, calificacion));
        return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
    }


    function cargarComentarios() {
        const pendientes = JSON.parse(localStorage.getItem('comentariosPendientes')) || [];
        const aprobados = JSON.parse(localStorage.getItem('comentariosAprobados')) || [];

        mostrarPendientes(pendientes);
        mostrarAprobados(aprobados);
    }

    function mostrarPendientes(pendientes) {
        contenedorPendientes.innerHTML = '';

        if (pendientes.length === 0) {
            contenedorPendientes.innerHTML = '<p class="mensaje-vacio">No hay comentarios pendientes por revisar.</p>';
            return;
        }

        pendientes.forEach((item, index) => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'tarjeta-opinion';
            tarjeta.innerHTML = `
                <div>
                    <div class="cabecera-tarjeta">
                        <div class="info-usuario">
                            <h3>${item.nombre}</h3>
                            <div class="estrellas">${generarEstrellas(item.calificacion)}</div>
                        </div>
                    </div>
                    <p class="comentario">${item.comentario}</p>
                </div>
                <div class="pie-tarjeta">
                    <span>${item.fecha}</span>
                    <div class="acciones-comentario">
                        <button class="btn-aprobar" data-index="${index}" title="Aprobar comentario">✓</button>
                        <button class="btn-rechazar" data-index="${index}" title="Rechazar comentario">✕</button>
                    </div>
                </div>
            `;
            contenedorPendientes.appendChild(tarjeta);
        });

        contenedorPendientes.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                aprobarComentario(parseInt(e.currentTarget.getAttribute('data-index'), 10));
            });
        });

        contenedorPendientes.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                rechazarComentario(parseInt(e.currentTarget.getAttribute('data-index'), 10));
            });
        });
    }

    function mostrarAprobados(aprobados) {
        contenedorAprobados.innerHTML = '';

        if (aprobados.length === 0) {
            contenedorAprobados.innerHTML = '<p class="mensaje-vacio">Aún no hay comentarios aprobados.</p>';
            return;
        }

        aprobados.forEach((item, index) => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'tarjeta-opinion';
            tarjeta.innerHTML =`
                <div>
                    <div class="cabecera-tarjeta">
                        <div class="info-usuario">
                            <h3>${item.nombre}</h3>
                            <div class="estrellas">${generarEstrellas(item.calificacion)}</div>
                        </div>
                    </div>
                    <p class="comentario">${item.comentario}</p>
                </div>
                <div class="pie-tarjeta">
                    <span>${item.fecha}</span>
                    <button class="btn-rechazar" data-index="${index}" title="Regresar a pendientes">✕</button>
                </div>
            `;
            contenedorAprobados.appendChild(tarjeta);
        });

        contenedorAprobados.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                devolverPendientes(parseInt(e.currentTarget.getAttribute('data-index'), 10));
            });
        });
    }

    function aprobarComentario(index) {
        const pendientes = JSON.parse(localStorage.getItem('comentariosPendientes')) || [];
        const aprobados = JSON.parse(localStorage.getItem('comentariosAprobados')) || [];

        const [aprobado] = pendientes.splice(index, 1);
        if (aprobado) {
            aprobados.unshift(aprobado); 
            localStorage.setItem('comentariosPendientes', JSON.stringify(pendientes));
            localStorage.setItem('comentariosAprobados', JSON.stringify(aprobados));
            cargarComentarios();
        }
    }

    function rechazarComentario(index) {
        const pendientes = JSON.parse(localStorage.getItem('comentariosPendientes')) || [];
        pendientes.splice(index, 1);
        localStorage.setItem('comentariosPendientes', JSON.stringify(pendientes));
        cargarComentarios();
    }

    function devolverPendientes(index) {
        const pendientes = JSON.parse(localStorage.getItem('comentariosPendientes')) || [];
        const aprobados = JSON.parse(localStorage.getItem('comentariosAprobados')) || [];

        const [devuelto] = aprobados.splice(index, 1);
        if (devuelto) {
            pendientes.unshift(devuelto);
            localStorage.setItem('comentariosPendientes', JSON.stringify(pendientes));
            localStorage.setItem('comentariosAprobados', JSON.stringify(aprobados));
            cargarComentarios();
        }
    }

    cargarComentarios();
}