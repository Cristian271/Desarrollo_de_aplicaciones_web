if (sessionStorage.getItem('adminAutenticado') !== 'true') {
    window.location.replace('validarCredencial.html');
} else {
    const formularioProducto = document.getElementById('formulario-producto');
    const selectExistente = document.getElementById('producto-existente');
    const selectCategoria = document.getElementById('categoria-producto');
    const inputCprod = document.getElementById('cprod-producto');
    const inputEsDestacado = document.getElementById('es-destacado-producto');
    const inputNombre = document.getElementById('nombre-producto');
    const inputPrecio = document.getElementById('precio-producto');
    const inputCantidad = document.getElementById('cantidad-producto');
    const inputImagen = document.getElementById('imagen-producto');
    const etiquetaImagen = document.getElementById('etiqueta-imagen');
    const subtituloModo = document.getElementById('subtitulo-modo');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const mensajeEstado = document.getElementById('mensaje-estado');

    const destino = localStorage.getItem('destinoProducto') || 'tienda';
    let productosCargados = [];

    if (inputEsDestacado) {
        inputEsDestacado.value = destino === 'destacados' ? '1' : '0';
    }

    function mostrarMensaje(texto, esError = false) {
        if (!mensajeEstado) return;
        mensajeEstado.textContent = texto;
        mensajeEstado.style.color = esError ? '#ef4444' : '#10b981';
    }

    function establecerModoCreacion() {
        inputCprod.value = '';
        inputNombre.value = '';
        inputPrecio.value = '';
        inputCantidad.value = '0';
        inputImagen.value = '';
        inputImagen.required = true;
        inputEsDestacado.value = destino === 'destacados' ? '1' : '0';

        if (etiquetaImagen) {
            etiquetaImagen.textContent = 'Imagen del producto (obligatoria para producto nuevo)';
        }
        if (subtituloModo) {
            subtituloModo.textContent = 'Modo creación: se agregará un producto nuevo a la base de datos.';
        }
        if (btnGuardar) {
            btnGuardar.textContent = 'Guardar producto';
        }
    }

    function rellenarDesdeProductoExistente(cprodSeleccionado) {
        if (!cprodSeleccionado) {
            establecerModoCreacion();
            return;
        }

        const encontrado = productosCargados.find(
            (prod) => String(prod.cprod) === String(cprodSeleccionado)
        );

        if (!encontrado) {
            establecerModoCreacion();
            return;
        }

        inputCprod.value = String(encontrado.cprod);
        inputNombre.value = encontrado.nombre ?? '';
        inputPrecio.value = encontrado.precio ?? '';
        inputCantidad.value = encontrado.cantidad ?? '0';
        inputImagen.value = '';
        inputImagen.required = false;

        if (encontrado.id_categoria) {
            selectCategoria.value = String(encontrado.id_categoria);
        }

        if (destino === 'destacados') {
            inputEsDestacado.value = '1';
        } else {
            inputEsDestacado.value = String(encontrado.es_destacado ?? '0');
        }

        if (etiquetaImagen) {
            etiquetaImagen.textContent = 'Imagen del producto (opcional: déjala vacía para conservar la actual)';
        }
        if (subtituloModo) {
            subtituloModo.textContent = `Modo actualización: se actualizará el producto #${encontrado.cprod} en la base de datos.`;
        }
        if (btnGuardar) {
            btnGuardar.textContent = 'Actualizar producto';
        }
    }

    async function cargarDatosIniciales() {
        try {
            const respuesta = await fetch('php/listar_productos.php');
            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                mostrarMensaje(data.mensaje || 'No se pudieron cargar los productos y categorías.', true);
                return;
            }

            productosCargados = Array.isArray(data.productos) ? data.productos : [];

            const totalDestacadosActuales = productosCargados.filter(
                (p) => Number(p.es_destacado) === 1
            ).length;

            if (destino === 'destacados' && totalDestacadosActuales >= 8) {
                mostrarMensaje(
                    'Ya hay 8 productos destacados. Si seleccionas uno existente podrás actualizarlo, pero no añadir un destacado nuevo.',
                    true
                );
            }

            const categorias = Array.isArray(data.categorias) ? data.categorias : [];

            selectCategoria.innerHTML = '';
            if (categorias.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Sin categorías disponibles';
                selectCategoria.appendChild(opt);
            } else {
                categorias.forEach((cat) => {
                    const opt = document.createElement('option');
                    opt.value = String(cat.id_categoria);
                    opt.textContent = cat.nombre;
                    selectCategoria.appendChild(opt);
                });
            }

            selectExistente.innerHTML = '<option value="">-- Nuevo producto (escribir manualmente) --</option>';
            productosCargados.forEach((prod) => {
                const opt = document.createElement('option');
                opt.value = String(prod.cprod);
                opt.textContent = `${prod.nombre} ($${prod.precio})`;
                selectExistente.appendChild(opt);
            });

            establecerModoCreacion();
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            mostrarMensaje('Error de comunicación con el servidor al cargar productos.', true);
        }
    }

    if (selectExistente) {
        selectExistente.addEventListener('change', (e) => {
            rellenarDesdeProductoExistente(e.target.value);
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (window.opener && !window.opener.closed) {
                window.close();
            } else {
                window.location.href = 'administradorTienda.html';
            }
        });
    }

    if (formularioProducto) {
        formularioProducto.addEventListener('submit', async (e) => {
            e.preventDefault();
            mostrarMensaje('');

            const esActualizacion = inputCprod.value.trim() !== '';
            const nombre = inputNombre.value.trim();
            const precio = parseFloat(inputPrecio.value);
            const cantidad = parseInt(inputCantidad.value, 10);
            const idCategoria = selectCategoria.value;
            const archivo = inputImagen.files[0];

            if (!nombre) {
                mostrarMensaje('Debes escribir el nombre del producto.', true);
                inputNombre.focus();
                return;
            }

            if (isNaN(precio) || precio < 0) {
                mostrarMensaje('El precio debe ser un número mayor o igual a 0.', true);
                inputPrecio.focus();
                return;
            }

            if (isNaN(cantidad) || cantidad < 0) {
                mostrarMensaje('La cantidad debe ser un número entero mayor o igual a 0.', true);
                inputCantidad.focus();
                return;
            }

            if (!idCategoria) {
                mostrarMensaje('Selecciona una categoría.', true);
                selectCategoria.focus();
                return;
            }

            if (!esActualizacion && !archivo) {
                mostrarMensaje('Selecciona una imagen para el producto nuevo.', true);
                inputImagen.focus();
                return;
            }

            const formData = new FormData(formularioProducto);
            formData.set('nombre', nombre);
            formData.set('precio', String(precio));
            formData.set('cantidad', String(cantidad));
            formData.set('id_categoria', String(idCategoria));
            formData.set('es_destacado', inputEsDestacado.value);

            const endpoint = esActualizacion
                ? 'php/actualizar_producto.php'
                : 'php/agregar_producto.php';

            if (btnGuardar) {
                btnGuardar.disabled = true;
            }

            try {
                const respuesta = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                const data = await respuesta.json();

                if (!respuesta.ok || !data.ok) {
                    mostrarMensaje(data.mensaje || 'No se pudo procesar el producto.', true);
                    if (btnGuardar) btnGuardar.disabled = false;
                    return;
                }

                localStorage.setItem('ultimaActualizacionProductos', String(Date.now()));

                if (window.opener && !window.opener.closed) {
                    try {
                        window.opener.localStorage.setItem('ultimaActualizacionProductos', String(Date.now()));
                        window.opener.location.reload();
                    } catch (err) {
                        // Evita bloquear si el navegador restringe el acceso a opener
                    }
                    window.close();
                } else {
                    const destinoRedireccion = destino === 'destacados'
                        ? 'administradorProductosDestacados.html'
                        : 'administradorTienda.html';
                    window.location.href = destinoRedireccion;
                }
            } catch (error) {
                console.error('Error al guardar producto:', error);
                mostrarMensaje('Error de red al comunicarse con el servidor.', true);
                if (btnGuardar) btnGuardar.disabled = false;
            }
        });
    }

    cargarDatosIniciales();
}