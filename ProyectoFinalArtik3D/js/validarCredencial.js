const formularioLogin = document.getElementById('formulario-login');

if (formularioLogin) {
    formularioLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value;
        const contrasena = document.getElementById('contrasena').value;

        if (usuario === "kiwibolas" && contrasena === "1234") {
            sessionStorage.setItem('adminAutenticado', 'true');

            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.sessionStorage.setItem('adminAutenticado', 'true');
                } catch (err) {
                }
                window.opener.location.href = "administradorTienda.html";
                window.close();
            } else {
                window.location.href = "administradorTienda.html";
            }
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    });
}
