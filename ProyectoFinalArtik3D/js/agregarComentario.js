const formularioComentario = document.getElementById('formulario-comentario');
const mensajeExito = document.getElementById('mensaje-exito');

if (formularioComentario) {
    formularioComentario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre-cliente').value.trim();
        const calificacion = parseInt(document.getElementById('calificacion-cliente').value, 10);
        const comentario = document.getElementById('texto-comentario').value.trim();

        if (!nombre || isNaN(calificacion) || !comentario) {
            return;
        }

        const btnSubmit = formularioComentario.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.disabled = true;

        try {
            const respuesta = await fetch('php/agregar_comentario.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ nombre, calificacion, comentario })
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                alert(data.mensaje || 'No se pudo enviar tu opinión.');
                if (btnSubmit) btnSubmit.disabled = false;
                return;
            }

            localStorage.setItem('ultimaActualizacionComentarios', String(Date.now()));
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.localStorage.setItem('ultimaActualizacionComentarios', String(Date.now()));
                } catch (err) {
                }
            }

            mensajeExito.classList.remove('oculto');

            setTimeout(() => {
                window.close();
            }, 2000);
        } catch (error) {
            console.error('Error al enviar comentario:', error);
            alert('Error de conexión con el servidor al enviar tu opinión.');
            if (btnSubmit) btnSubmit.disabled = false;
        }
    });
}