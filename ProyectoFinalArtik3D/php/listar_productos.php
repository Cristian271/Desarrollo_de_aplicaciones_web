<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/conexion.php";

$soloPublico = isset($_GET["publico"]) && $_GET["publico"] === "1";
$soloDestacados = isset($_GET["destacados"]) && $_GET["destacados"] === "1";

if ($soloPublico) {
    // Vista pública: omite 'cantidad' (stock) para el cliente
    $sql = "SELECT cprod, nombre, precio, imagen, id_categoria, categoria, es_destacado FROM vista_catalogo_publico";
    if ($soloDestacados) {
        $sql .= " WHERE es_destacado = 1";
    }
    $sql .= " ORDER BY cprod DESC";
    if ($soloDestacados) {
        $sql .= " LIMIT 8";
    }
} else {
    $sql = "SELECT p.cprod, p.nombre, p.cantidad, p.precio, p.imagen, p.id_categoria, c.nombre AS categoria, p.es_destacado
            FROM Productos p
            INNER JOIN Categorias c ON p.id_categoria = c.id_categoria";
    if ($soloDestacados) {
        $sql .= " WHERE p.es_destacado = 1";
    }
    $sql .= " ORDER BY p.cprod DESC";
    if ($soloDestacados) {
        $sql .= " LIMIT 8";
    }
}

$resultado = mysqli_query($conexion, $sql);
if (!$resultado) {
    error_log("Error en SELECT productos: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error al obtener los productos."]);
    mysqli_close($conexion);
    exit;
}

$productos = [];
while ($fila = mysqli_fetch_assoc($resultado)) {
    $productos[] = $fila;
}
mysqli_free_result($resultado);

$resCategorias = mysqli_query($conexion, "SELECT id_categoria, nombre FROM Categorias ORDER BY nombre ASC");
if (!$resCategorias) {
    error_log("Error en SELECT categorias: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error al obtener las categorías."]);
    mysqli_close($conexion);
    exit;
}

$categorias = [];
while ($cat = mysqli_fetch_assoc($resCategorias)) {
    $categorias[] = $cat;
}
mysqli_free_result($resCategorias);

mysqli_close($conexion);
echo json_encode([
    "ok" => true,
    "productos" => $productos,
    "categorias" => $categorias
], JSON_UNESCAPED_UNICODE);