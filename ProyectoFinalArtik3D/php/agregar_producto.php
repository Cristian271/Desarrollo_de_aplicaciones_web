<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/verificar_admin.php";
exigirSesionAdmin();
require_once __DIR__ . "/conexion.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido."]);
    if ($conexion) {
        mysqli_close($conexion);
    }
    exit;
}

$nombre = trim($_POST["nombre"] ?? "");
$precio = (isset($_POST["precio"]) && is_numeric($_POST["precio"]))
    ? (float)$_POST["precio"]
    : -1.0;
$cantidad = (isset($_POST["cantidad"]) && $_POST["cantidad"] !== "" && is_numeric($_POST["cantidad"]))
    ? (int)$_POST["cantidad"]
    : 0;
$idCategoria = (isset($_POST["id_categoria"]) && $_POST["id_categoria"] !== "" && is_numeric($_POST["id_categoria"]))
    ? (int)$_POST["id_categoria"]
    : 0;
$esDestacado = (isset($_POST["es_destacado"]) && in_array((string)$_POST["es_destacado"], ["1", "true"], true))
    ? 1
    : 0;

if ($nombre === "" || strlen($nombre) > 120) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Debes ingresar un nombre de producto válido."]);
    mysqli_close($conexion);
    exit;
}

if ($precio < 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "El precio debe ser mayor o igual a 0."]);
    mysqli_close($conexion);
    exit;
}

if ($cantidad < 0) {
    $cantidad = 0;
}

if ($idCategoria <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Selecciona una categoría válida."]);
    mysqli_close($conexion);
    exit;
}

// Verificar categoría existente
$stmtCat = mysqli_prepare($conexion, "SELECT id_categoria FROM Categorias WHERE id_categoria = ?");
if (!$stmtCat) {
    error_log("Error al preparar consulta de categoría: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al validar categoría."]);
    mysqli_close($conexion);
    exit;
}
mysqli_stmt_bind_param($stmtCat, "i", $idCategoria);
mysqli_stmt_execute($stmtCat);
$resCheck = mysqli_stmt_get_result($stmtCat);
$catValida = $resCheck ? mysqli_fetch_assoc($resCheck) : null;
if ($resCheck) {
    mysqli_free_result($resCheck);
}
mysqli_stmt_close($stmtCat);

if (!$catValida) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "La categoría seleccionada no existe."]);
    mysqli_close($conexion);
    exit;
}

// Validar máximo 8 productos destacados al agregar
if ($esDestacado === 1) {
    $stmtCount = mysqli_prepare($conexion, "SELECT COUNT(*) AS total FROM Productos WHERE es_destacado = 1");
    if (!$stmtCount) {
        error_log("Error al preparar conteo de destacados: " . mysqli_error($conexion));
        http_response_code(500);
        echo json_encode(["ok" => false, "mensaje" => "Error interno al validar destacados."]);
        mysqli_close($conexion);
        exit;
    }
    mysqli_stmt_execute($stmtCount);
    $resCount = mysqli_stmt_get_result($stmtCount);
    $filaCount = $resCount ? mysqli_fetch_assoc($resCount) : null;
    if ($resCount) {
        mysqli_free_result($resCount);
    }
    mysqli_stmt_close($stmtCount);

    if ((int)($filaCount["total"] ?? 0) >= 8) {
        http_response_code(400);
        echo json_encode(["ok" => false, "mensaje" => "Solo se permiten máximo 8 productos destacados."]);
        mysqli_close($conexion);
        exit;
    }
}

// Imagen obligatoria para producto nuevo
if (!isset($_FILES["imagen"]) || $_FILES["imagen"]["error"] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Selecciona una imagen para el nuevo producto."]);
    mysqli_close($conexion);
    exit;
}

if ($_FILES["imagen"]["error"] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Ocurrió un error al subir la imagen."]);
    mysqli_close($conexion);
    exit;
}

$tamanoMaximo = 3 * 1024 * 1024; // 3 MB
if ($_FILES["imagen"]["size"] > $tamanoMaximo) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "La imagen supera el tamaño permitido (3 MB)."]);
    mysqli_close($conexion);
    exit;
}

$tiposPermitidos = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "image/webp" => "webp",
    "image/gif"  => "gif"
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = $finfo ? finfo_file($finfo, $_FILES["imagen"]["tmp_name"]) : "";
if ($finfo) {
    finfo_close($finfo);
}

if (!isset($tiposPermitidos[$mime])) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Formato de imagen no válido (usa JPG, PNG, WEBP o GIF)."]);
    mysqli_close($conexion);
    exit;
}

$carpetaDestino = dirname(__DIR__) . "/assets/images/products/";
if (!is_dir($carpetaDestino)) {
    mkdir($carpetaDestino, 0777, true);
}

$nombreArchivo = "prod_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $tiposPermitidos[$mime];
$rutaFisica = $carpetaDestino . $nombreArchivo;

if (!move_uploaded_file($_FILES["imagen"]["tmp_name"], $rutaFisica)) {
    error_log("Error al mover archivo subido a " . $rutaFisica);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo guardar la imagen en el servidor."]);
    mysqli_close($conexion);
    exit;
}

$rutaImagen = "assets/images/products/" . $nombreArchivo;

// Insertar producto nuevo con consulta preparada
$stmtIns = mysqli_prepare(
    $conexion,
    "INSERT INTO Productos (nombre, cantidad, precio, imagen, id_categoria, es_destacado) VALUES (?, ?, ?, ?, ?, ?)"
);
if (!$stmtIns) {
    error_log("Error al preparar INSERT de producto: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al registrar el producto."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param($stmtIns, "sidsii", $nombre, $cantidad, $precio, $rutaImagen, $idCategoria, $esDestacado);

if (!mysqli_stmt_execute($stmtIns)) {
    error_log("Error al ejecutar INSERT de producto: " . mysqli_stmt_error($stmtIns));
    mysqli_stmt_close($stmtIns);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo guardar el producto en la base de datos."]);
    mysqli_close($conexion);
    exit;
}

$nuevoId = (int)mysqli_insert_id($conexion);
mysqli_stmt_close($stmtIns);

$stmtProd = mysqli_prepare(
    $conexion,
    "SELECT p.cprod, p.nombre, p.cantidad, p.precio, p.imagen, p.id_categoria, c.nombre AS categoria, p.es_destacado
     FROM Productos p
     INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
     WHERE p.cprod = ?"
);
mysqli_stmt_bind_param($stmtProd, "i", $nuevoId);
mysqli_stmt_execute($stmtProd);
$resProd = mysqli_stmt_get_result($stmtProd);
$productoGuardado = $resProd ? mysqli_fetch_assoc($resProd) : null;
if ($resProd) {
    mysqli_free_result($resProd);
}
mysqli_stmt_close($stmtProd);
mysqli_close($conexion);

echo json_encode([
    "ok" => true,
    "accion" => "creado",
    "producto" => $productoGuardado
], JSON_UNESCAPED_UNICODE);