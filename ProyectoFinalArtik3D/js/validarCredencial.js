const formularioLogin = document.getElementById('formulario-login');

if (formularioLogin) {
    formularioLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const contrasena = document.getElementById('contrasena').value;

        try {
            const respuesta = await fetch('php/login_admin.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({ usuario, contrasena })
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                alert(data.mensaje || 'Usuario o contraseña incorrectos');
                return;
            }

            sessionStorage.setItem('adminAutenticado', 'true');

            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.sessionStorage.setItem('adminAutenticado', 'true');
                } catch (err) {
                }
                window.opener.location.href = 'administradorTienda.html';
                window.close();
            } else {
                window.location.href = 'administradorTienda.html';
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            alert('No se pudo conectar con el servidor para validar la sesión.');
        }
    });
}
