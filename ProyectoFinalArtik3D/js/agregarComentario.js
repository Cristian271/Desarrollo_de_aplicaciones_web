const formularioComentario = document.getElementById('formulario-comentario');
const mensajeExito = document.getElementById('mensaje-exito');

if (formularioComentario) {
    formularioComentario.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre-cliente').value.trim();
        const calificacion = parseInt(document.getElementById('calificacion-cliente').value, 10);
        const comentario = document.getElementById('texto-comentario').value.trim();

        if (!nombre || isNaN(calificacion) || !comentario) {
            return;
        }

        const pendientes = JSON.parse(localStorage.getItem('comentariosPendientes')) || [];

        const nuevoComentario = {
            id: Date.now(),
            nombre: nombre,
            calificacion: calificacion,
            comentario: comentario,
            fecha: new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        };

        pendientes.push(nuevoComentario);
        localStorage.setItem('comentariosPendientes', JSON.stringify(pendientes));

        mensajeExito.classList.remove('oculto');

        setTimeout(() => {
            window.close();

            /* SOLO PARA PRUEBAS, abrir agregarComentario.html directo en pestaña*/
            if (window.opener && !window.opener.closed) {
                window.close();
            } else {
                window.location.href = 'index.html';
            }
        }, 2000);
    });
}