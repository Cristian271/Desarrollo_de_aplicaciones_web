if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
} else {
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async () => {
            try {
                await fetch('php/logout_admin.php', { method: 'POST' });
            } catch (error) {
                console.error('Error al cerrar sesión en el servidor:', error);
            } finally {
                sessionStorage.removeItem('adminAutenticado');
                window.location.replace('validarCredencial.html');
            }
        });
    }

    const contenedorPendientes = document.getElementById('contenedor-pendientes');
    const contenedorAprobados = document.getElementById('contenedor-aprobados');

    function generarEstrellas(calificacion) {
        const llenas = Math.max(0, Math.min(5, Number(calificacion) || 0));
        return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
    }

    function crearTarjetaComentario(item, esPendiente) {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-opinion';

        const bloqueSuperior = document.createElement('div');

        const cabecera = document.createElement('div');
        cabecera.className = 'cabecera-tarjeta';

        const infoUsuario = document.createElement('div');
        infoUsuario.className = 'info-usuario';

        const h3 = document.createElement('h3');
        h3.textContent = item.nombre || '';

        const estrellas = document.createElement('div');
        estrellas.className = 'estrellas';
        estrellas.textContent = generarEstrellas(item.calificacion);

        infoUsuario.appendChild(h3);
        infoUsuario.appendChild(estrellas);
        cabecera.appendChild(infoUsuario);

        const pComentario = document.createElement('p');
        pComentario.className = 'comentario';
        pComentario.textContent = item.comentario || '';

        bloqueSuperior.appendChild(cabecera);
        bloqueSuperior.appendChild(pComentario);

        const pie = document.createElement('div');
        pie.className = 'pie-tarjeta';

        const spanFecha = document.createElement('span');
        spanFecha.textContent = item.fecha || '';
        pie.appendChild(spanFecha);

        if (esPendiente) {
            const acciones = document.createElement('div');
            acciones.className = 'acciones-comentario';

            const btnAprobar = document.createElement('button');
            btnAprobar.className = 'btn-aprobar';
            btnAprobar.type = 'button';
            btnAprobar.dataset.id = String(item.id_comentario);
            btnAprobar.title = 'Aprobar comentario';
            btnAprobar.textContent = '✓';

            const btnRechazar = document.createElement('button');
            btnRechazar.className = 'btn-rechazar';
            btnRechazar.type = 'button';
            btnRechazar.dataset.id = String(item.id_comentario);
            btnRechazar.title = 'Rechazar comentario';
            btnRechazar.textContent = '✕';

            acciones.appendChild(btnAprobar);
            acciones.appendChild(btnRechazar);
            pie.appendChild(acciones);
        } else {
            const btnDevolver = document.createElement('button');
            btnDevolver.className = 'btn-rechazar';
            btnDevolver.type = 'button';
            btnDevolver.dataset.id = String(item.id_comentario);
            btnDevolver.title = 'Regresar a pendientes';
            btnDevolver.textContent = '✕';
            pie.appendChild(btnDevolver);
        }

        tarjeta.appendChild(bloqueSuperior);
        tarjeta.appendChild(pie);
        return tarjeta;
    }

    function mostrarPendientes(pendientes) {
        if (!contenedorPendientes) return;
        contenedorPendientes.innerHTML = '';

        if (pendientes.length === 0) {
            contenedorPendientes.innerHTML = '<p class="mensaje-vacio">No hay comentarios pendientes por revisar.</p>';
            return;
        }

        pendientes.forEach((item) => {
            contenedorPendientes.appendChild(crearTarjetaComentario(item, true));
        });
    }

    function mostrarAprobados(aprobados) {
        if (!contenedorAprobados) return;
        contenedorAprobados.innerHTML = '';

        if (aprobados.length === 0) {
            contenedorAprobados.innerHTML = '<p class="mensaje-vacio">Aún no hay comentarios aprobados.</p>';
            return;
        }

        aprobados.forEach((item) => {
            contenedorAprobados.appendChild(crearTarjetaComentario(item, false));
        });
    }

    async function cargarComentarios() {
        try {
            const respuesta = await fetch('php/listar_comentarios.php');
            if (respuesta.status === 401) {
                sessionStorage.removeItem('adminAutenticado');
                window.location.replace('validarCredencial.html');
                return;
            }
            const data = await respuesta.json();
            if (respuesta.ok && data.ok) {
                mostrarPendientes(Array.isArray(data.pendientes) ? data.pendientes : []);
                mostrarAprobados(Array.isArray(data.aprobados) ? data.aprobados : []);
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        }
    }

    async function ejecutarAccionComentario(idComentario, accion, boton) {
        if (boton) boton.disabled = true;
        try {
            const respuesta = await fetch('php/gestionar_comentario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ id_comentario: Number(idComentario), accion })
            });

            if (respuesta.status === 401) {
                sessionStorage.removeItem('adminAutenticado');
                window.location.replace('validarCredencial.html');
                return;
            }

            const data = await respuesta.json();
            if (!respuesta.ok || !data.ok) {
                alert(data.mensaje || 'No se pudo procesar el comentario.');
                if (boton) boton.disabled = false;
                return;
            }

            localStorage.setItem('ultimaActualizacionComentarios', String(Date.now()));
            await cargarComentarios();
        } catch (error) {
            console.error('Error al gestionar comentario:', error);
            alert('Error de comunicación con el servidor.');
            if (boton) boton.disabled = false;
        }
    }

    if (contenedorPendientes) {
        contenedorPendientes.addEventListener('click', (e) => {
            const btnAprobar = e.target.closest('.btn-aprobar');
            if (btnAprobar) {
                ejecutarAccionComentario(btnAprobar.dataset.id, 'aprobar', btnAprobar);
                return;
            }

            const btnRechazar = e.target.closest('.btn-rechazar');
            if (btnRechazar) {
                if (!confirm('¿Seguro que deseas eliminar este comentario pendiente?')) return;
                ejecutarAccionComentario(btnRechazar.dataset.id, 'eliminar', btnRechazar);
            }
        });
    }

    if (contenedorAprobados) {
        contenedorAprobados.addEventListener('click', (e) => {
            const btnDevolver = e.target.closest('.btn-rechazar');
            if (btnDevolver) {
                ejecutarAccionComentario(btnDevolver.dataset.id, 'devolver_pendiente', btnDevolver);
            }
        });
    }

    cargarComentarios();

    window.addEventListener('storage', (e) => {
        if (e.key === 'ultimaActualizacionComentarios') {
            cargarComentarios();
        }
    });
    window.addEventListener('focus', cargarComentarios);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) cargarComentarios();
    });
    setInterval(cargarComentarios, 10000);
}