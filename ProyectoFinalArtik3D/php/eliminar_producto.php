<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/conexion.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido."]);
    if ($conexion) {
        mysqli_close($conexion);
    }
    exit;
}

$rawInput = file_get_contents("php://input");
$jsonData = json_decode($rawInput, true);

$cprodRaw = $_POST["cprod"] ?? ($jsonData["cprod"] ?? "");
$accion = $_POST["accion"] ?? ($jsonData["accion"] ?? "eliminar");

$cprod = (is_numeric($cprodRaw) && (int)$cprodRaw > 0) ? (int)$cprodRaw : 0;

if ($cprod <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "ID de producto no válido."]);
    mysqli_close($conexion);
    exit;
}

if (!in_array($accion, ["eliminar", "quitar_destacado"], true)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Acción no válida."]);
    mysqli_close($conexion);
    exit;
}

$stmtBuscar = mysqli_prepare($conexion, "SELECT cprod, nombre, imagen FROM Productos WHERE cprod = ?");
if (!$stmtBuscar) {
    error_log("Error al preparar búsqueda de producto: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al consultar el producto."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param($stmtBuscar, "i", $cprod);
mysqli_stmt_execute($stmtBuscar);
$resBuscar = mysqli_stmt_get_result($stmtBuscar);
$producto = $resBuscar ? mysqli_fetch_assoc($resBuscar) : null;
if ($resBuscar) {
    mysqli_free_result($resBuscar);
}
mysqli_stmt_close($stmtBuscar);

if (!$producto) {
    http_response_code(404);
    echo json_encode(["ok" => false, "mensaje" => "El producto no existe o ya fue eliminado."]);
    mysqli_close($conexion);
    exit;
}

if ($accion === "quitar_destacado") {
    $estadoDestacado = 0;
    $stmtSp = mysqli_prepare($conexion, "CALL sp_establecer_destacado(?, ?)");
    if (!$stmtSp) {
        error_log("Error al preparar sp_establecer_destacado: " . mysqli_error($conexion));
        http_response_code(500);
        echo json_encode(["ok" => false, "mensaje" => "Error interno al actualizar destacado."]);
        mysqli_close($conexion);
        exit;
    }

    mysqli_stmt_bind_param($stmtSp, "ii", $cprod, $estadoDestacado);
    if (!mysqli_stmt_execute($stmtSp)) {
        $errorSp = mysqli_stmt_error($stmtSp);
        error_log("Error al ejecutar sp_establecer_destacado: " . $errorSp);
        mysqli_stmt_close($stmtSp);
        mysqli_close($conexion);
        http_response_code(400);
        echo json_encode([
            "ok" => false,
            "mensaje" => $errorSp ?: "No se pudo quitar el producto de destacados."
        ], JSON_UNESCAPED_UNICODE);
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

    mysqli_close($conexion);

    echo json_encode([
        "ok" => true,
        "accion" => "quitar_destacado",
        "cprod" => $cprod,
        "mensaje" => "Producto quitado de destacados."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmtDel = mysqli_prepare($conexion, "DELETE FROM Productos WHERE cprod = ?");
if (!$stmtDel) {
    error_log("Error al preparar DELETE de producto: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al eliminar el producto."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param($stmtDel, "i", $cprod);
if (!mysqli_stmt_execute($stmtDel)) {
    error_log("Error al ejecutar DELETE de producto: " . mysqli_stmt_error($stmtDel));
    mysqli_stmt_close($stmtDel);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo eliminar el producto de la base de datos."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_close($stmtDel);
mysqli_close($conexion);

$imagenRelativa = $producto["imagen"] ?? "";
if ($imagenRelativa !== "" && strpos($imagenRelativa, "assets/images/products/") === 0) {
    $nombreBase = basename($imagenRelativa);
    if (strpos($nombreBase, "prod_") === 0) {
        $rutaFisica = dirname(__DIR__) . "/" . $imagenRelativa;
        if (is_file($rutaFisica)) {
            @unlink($rutaFisica);
        }
    }
}

echo json_encode([
    "ok" => true,
    "accion" => "eliminado",
    "cprod" => $cprod,
    "mensaje" => "Producto eliminado correctamente."
], JSON_UNESCAPED_UNICODE);