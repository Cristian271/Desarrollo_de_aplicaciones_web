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

$cprod = (isset($_POST["cprod"]) && is_numeric($_POST["cprod"])) ? (int)$_POST["cprod"] : 0;
$nombre = trim($_POST["nombre"] ?? "");
$precio = (isset($_POST["precio"]) && is_numeric($_POST["precio"]))
    ? (float)$_POST["precio"]
    : -1.0;
$cantidad = (isset($_POST["cantidad"]) && $_POST["cantidad"] !== "" && is_numeric($_POST["cantidad"]))
    ? (int)$_POST["cantidad"]
    : 0;
$idCategoria = (isset($_POST["id_categoria"]) && is_numeric($_POST["id_categoria"]))
    ? (int)$_POST["id_categoria"]
    : 0;
$esDestacado = (isset($_POST["es_destacado"]) && in_array((string)$_POST["es_destacado"], ["1", "true"], true))
    ? 1
    : 0;

if ($cprod <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "ID de producto no válido para actualizar."]);
    mysqli_close($conexion);
    exit;
}

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

// Verificar que el producto exista y obtener su imagen actual
$stmtActual = mysqli_prepare($conexion, "SELECT cprod, imagen FROM Productos WHERE cprod = ?");
if (!$stmtActual) {
    error_log("Error al preparar consulta de producto existente: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al buscar el producto."]);
    mysqli_close($conexion);
    exit;
}
mysqli_stmt_bind_param($stmtActual, "i", $cprod);
mysqli_stmt_execute($stmtActual);
$resActual = mysqli_stmt_get_result($stmtActual);
$productoActual = $resActual ? mysqli_fetch_assoc($resActual) : null;
if ($resActual) {
    mysqli_free_result($resActual);
}
mysqli_stmt_close($stmtActual);

if (!$productoActual) {
    http_response_code(404);
    echo json_encode(["ok" => false, "mensaje" => "El producto seleccionado no existe."]);
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

// Conservar imagen actual si no se envía una nueva
$rutaImagen = $productoActual["imagen"] ?? "";

if (isset($_FILES["imagen"]) && $_FILES["imagen"]["error"] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES["imagen"]["error"] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["ok" => false, "mensaje" => "Ocurrió un error al subir la nueva imagen."]);
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
        echo json_encode(["ok" => false, "mensaje" => "No se pudo guardar la nueva imagen en el servidor."]);
        mysqli_close($conexion);
        exit;
    }

    $rutaImagen = "assets/images/products/" . $nombreArchivo;
}

// Actualizar datos base del producto con consulta preparada
$stmtUpd = mysqli_prepare(
    $conexion,
    "UPDATE Productos
     SET nombre = ?, cantidad = ?, precio = ?, imagen = ?, id_categoria = ?
     WHERE cprod = ?"
);
if (!$stmtUpd) {
    error_log("Error al preparar UPDATE de producto: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al preparar la actualización."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param(
    $stmtUpd,
    "sidsii",
    $nombre,
    $cantidad,
    $precio,
    $rutaImagen,
    $idCategoria,
    $cprod
);

if (!mysqli_stmt_execute($stmtUpd)) {
    error_log("Error al ejecutar UPDATE de producto: " . mysqli_stmt_error($stmtUpd));
    mysqli_stmt_close($stmtUpd);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo actualizar el producto en la base de datos."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_close($stmtUpd);

// Activar o desactivar destacado mediante procedimiento almacenado
$stmtSp = mysqli_prepare($conexion, "CALL sp_establecer_destacado(?, ?)");
if (!$stmtSp) {
    error_log("Error al preparar sp_establecer_destacado: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al actualizar estado destacado."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param($stmtSp, "ii", $cprod, $esDestacado);
if (!mysqli_stmt_execute($stmtSp)) {
    $errorSp = mysqli_stmt_error($stmtSp);
    error_log("Error al ejecutar sp_establecer_destacado: " . $errorSp);
    mysqli_stmt_close($stmtSp);
    http_response_code(400);
    echo json_encode([
        "ok" => false,
        "mensaje" => $errorSp ?: "No se pudo actualizar el estado destacado."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

if ($resSp = mysqli_stmt_get_result($stmtSp)) {
    mysqli_free_result($resSp);
}
mysqli_stmt_close($stmtSp);

while (mysqli_more_results($conexion)) {
    mysqli_next_result($conexion);
    if ($resExtra = mysqli_store_result($conexion)) {
        mysqli_free_result($resExtra);
    }
}

$stmtProd = mysqli_prepare(
    $conexion,
    "SELECT p.cprod, p.nombre, p.cantidad, p.precio, p.imagen, p.id_categoria, c.nombre AS categoria, p.es_destacado
     FROM Productos p
     INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
     WHERE p.cprod = ?"
);
mysqli_stmt_bind_param($stmtProd, "i", $cprod);
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
    "accion" => "actualizado",
    "producto" => $productoGuardado
], JSON_UNESCAPED_UNICODE);