if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
} else {
    const formularioProducto = document.getElementById('formulario-producto');

    formularioProducto.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputImagen = document.getElementById('imagen-producto');
        const nombre = document.getElementById('nombre-producto').value.trim();
        const precioValor = document.getElementById('precio-producto').value.trim();
        const archivo = inputImagen.files[0];

        if (!archivo || !nombre || !precioValor) {
            return;
        }

        const destino = localStorage.getItem('destinoProducto') || 'tienda';
        const claveStorage = destino === 'destacados' ? 'productosDestacados' : 'productosTienda';
        const productos = JSON.parse(localStorage.getItem(claveStorage)) || [];

        if (destino === 'destacados' && productos.length >= 8) {
            alert('Solo se permite un máximo de 8 productos destacados.');
            return;
        }

        const lector = new FileReader();
        lector.onload = () => {
            const nuevoProducto = {
                nombre: nombre,
                precio: '$' + precioValor,
                imagen: lector.result
            };

            productos.push(nuevoProducto);
            localStorage.setItem(claveStorage, JSON.stringify(productos));

            if (window.opener && !window.opener.closed) {
                window.opener.location.reload();
            }
            window.close();
        };

        lector.readAsDataURL(archivo);
    });
}
