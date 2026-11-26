<?php
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");

$esAdmin = isset($_GET["admin"]) && $_GET["admin"] === "1";
if ($esAdmin) {
    require_once __DIR__ . "/verificar_admin.php";
    exigirSesionAdmin();
}

require_once __DIR__ . "/conexion.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "GET") {
    http_response_code(405);
    echo json_encode([
        "ok" => false,
        "mensaje" => "Método no permitido."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

$busquedaRaw = $_GET["q"] ?? "";
if (!is_string($busquedaRaw)) {
    http_response_code(400);
    echo json_encode([
        "ok" => false,
        "mensaje" => "Parámetro de búsqueda no válido."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

// Eliminar caracteres de control y normalizar espacios
$busqueda = preg_replace('/[\x00-\x1F\x7F]/u', '', $busquedaRaw);
$busqueda = trim(preg_replace('/\s+/u', ' ', $busqueda ?? ''));

if (mb_strlen($busqueda, "UTF-8") > 120) {
    http_response_code(400);
    echo json_encode([
        "ok" => false,
        "mensaje" => "La búsqueda no puede superar los 120 caracteres."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

if ($busqueda === "") {
    if ($esAdmin) {
        $sql = "SELECT p.cprod, p.nombre, p.cantidad, p.precio, p.imagen, p.id_categoria, c.nombre AS categoria, p.es_destacado
                FROM Productos p
                INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
                ORDER BY p.cprod DESC";
    } else {
        $sql = "SELECT cprod, nombre, precio, imagen, id_categoria, categoria, es_destacado
                FROM vista_catalogo_publico
                ORDER BY cprod DESC";
    }
    $stmt = mysqli_prepare($conexion, $sql);
} else {
    // Escapar comodines LIKE (!, %, _) para evitar wildcard injection
    $busquedaEscapada = str_replace(["!", "%", "_"], ["!!", "!%", "!_"], $busqueda);
    $patron = "%" . $busquedaEscapada . "%";

    if ($esAdmin) {
        $sql = "SELECT p.cprod, p.nombre, p.cantidad, p.precio, p.imagen, p.id_categoria, c.nombre AS categoria, p.es_destacado
                FROM Productos p
                INNER JOIN Categorias c ON p.id_categoria = c.id_categoria
                WHERE p.nombre LIKE ? ESCAPE '!'
                ORDER BY p.cprod DESC";
    } else {
        $sql = "SELECT cprod, nombre, precio, imagen, id_categoria, categoria, es_destacado
                FROM vista_catalogo_publico
                WHERE nombre LIKE ? ESCAPE '!'
                ORDER BY cprod DESC";
    }
    $stmt = mysqli_prepare($conexion, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "s", $patron);
    }
}

if (!$stmt) {
    error_log("Error al preparar búsqueda de productos: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error interno al preparar la búsqueda."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

if (!mysqli_stmt_execute($stmt)) {
    error_log("Error al ejecutar búsqueda de productos: " . mysqli_stmt_error($stmt));
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error al consultar los productos."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

$resultado = mysqli_stmt_get_result($stmt);
if (!$resultado) {
    error_log("Error al obtener resultados de búsqueda: " . mysqli_stmt_error($stmt));
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "mensaje" => "No se pudieron obtener los resultados."
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conexion);
    exit;
}

$productos = [];
while ($fila = mysqli_fetch_assoc($resultado)) {
    $productos[] = $fila;
}

mysqli_free_result($resultado);
mysqli_stmt_close($stmt);
mysqli_close($conexion);

echo json_encode([
    "ok" => true,
    "termino" => $busqueda,
    "total" => count($productos),
    "productos" => $productos
], JSON_UNESCAPED_UNICODE);
