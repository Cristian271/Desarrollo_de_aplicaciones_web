<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/conexion.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido."]);
    mysqli_close($conexion);
    exit;
}

$rawInput = file_get_contents("php://input");
$jsonData = json_decode($rawInput, true);

$nombre = is_array($jsonData) && isset($jsonData["nombre"])
    ? trim((string)$jsonData["nombre"])
    : trim((string)($_POST["nombre"] ?? ""));

$calificacionRaw = is_array($jsonData) && isset($jsonData["calificacion"])
    ? $jsonData["calificacion"]
    : ($_POST["calificacion"] ?? "");

$comentario = is_array($jsonData) && isset($jsonData["comentario"])
    ? trim((string)$jsonData["comentario"])
    : trim((string)($_POST["comentario"] ?? ""));

if ($nombre === "" || mb_strlen($nombre) > 80) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Ingresa un nombre válido (máximo 80 caracteres)."]);
    mysqli_close($conexion);
    exit;
}

if (!is_numeric($calificacionRaw) || (int)$calificacionRaw < 0 || (int)$calificacionRaw > 5) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "La calificación debe estar entre 0 y 5."]);
    mysqli_close($conexion);
    exit;
}

if ($comentario === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Escribe tu comentario antes de enviar."]);
    mysqli_close($conexion);
    exit;
}

$calificacion = (int)$calificacionRaw;

$stmt = mysqli_prepare(
    $conexion,
    "INSERT INTO Comentarios (nombre_cliente, calificacion, comentario, estado) VALUES (?, ?, ?, 'pendiente')"
);
if (!$stmt) {
    error_log("Error al preparar INSERT de comentario: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error interno al registrar la opinión."]);
    mysqli_close($conexion);
    exit;
}

mysqli_stmt_bind_param($stmt, "sis", $nombre, $calificacion, $comentario);

if (!mysqli_stmt_execute($stmt)) {
    error_log("Error al ejecutar INSERT de comentario: " . mysqli_stmt_error($stmt));
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo guardar tu opinión."]);
    mysqli_close($conexion);
    exit;
}

$nuevoId = (int)mysqli_insert_id($conexion);
mysqli_stmt_close($stmt);
mysqli_close($conexion);

echo json_encode([
    "ok" => true,
    "id_comentario" => $nuevoId,
    "mensaje" => "Opinión enviada y pendiente de aprobación."
], JSON_UNESCAPED_UNICODE);