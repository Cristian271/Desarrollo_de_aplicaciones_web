<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/verificar_admin.php";
exigirSesionAdmin();
require_once __DIR__ . "/conexion.php";

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
    http_response_code(405);
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido."]);
    mysqli_close($conexion);
    exit;
}

$rawInput = file_get_contents("php://input");
$jsonData = json_decode($rawInput, true);

$idRaw = $jsonData["id_comentario"] ?? ($_POST["id_comentario"] ?? "");
$accion = $jsonData["accion"] ?? ($_POST["accion"] ?? "");

$idComentario = (is_numeric($idRaw) && (int)$idRaw > 0) ? (int)$idRaw : 0;

if ($idComentario <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "ID de comentario no válido."]);
    mysqli_close($conexion);
    exit;
}

if (!in_array($accion, ["aprobar", "devolver_pendiente", "eliminar"], true)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "mensaje" => "Acción no válida."]);
    mysqli_close($conexion);
    exit;
}

if ($accion === "eliminar") {
    $stmt = mysqli_prepare($conexion, "DELETE FROM Comentarios WHERE id_comentario = ?");
    if (!$stmt) {
        error_log("Error al preparar DELETE comentario: " . mysqli_error($conexion));
        http_response_code(500);
        echo json_encode(["ok" => false, "mensaje" => "Error interno al eliminar el comentario."]);
        mysqli_close($conexion);
        exit;
    }
    mysqli_stmt_bind_param($stmt, "i", $idComentario);
} else {
    $nuevoEstado = ($accion === "aprobar") ? "aprobado" : "pendiente";
    $stmt = mysqli_prepare($conexion, "UPDATE Comentarios SET estado = ? WHERE id_comentario = ?");
    if (!$stmt) {
        error_log("Error al preparar UPDATE comentario: " . mysqli_error($conexion));
        http_response_code(500);
        echo json_encode(["ok" => false, "mensaje" => "Error interno al actualizar el comentario."]);
        mysqli_close($conexion);
        exit;
    }
    mysqli_stmt_bind_param($stmt, "si", $nuevoEstado, $idComentario);
}

if (!mysqli_stmt_execute($stmt)) {
    error_log("Error al ejecutar acción en comentario: " . mysqli_stmt_error($stmt));
    mysqli_stmt_close($stmt);
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "No se pudo procesar la acción."]);
    mysqli_close($conexion);
    exit;
}

$afectadas = mysqli_stmt_affected_rows($stmt);
mysqli_stmt_close($stmt);
mysqli_close($conexion);

if ($afectadas === 0) {
    http_response_code(404);
    echo json_encode(["ok" => false, "mensaje" => "El comentario no existe o no sufrió cambios."]);
    exit;
}

echo json_encode([
    "ok" => true,
    "accion" => $accion,
    "id_comentario" => $idComentario
], JSON_UNESCAPED_UNICODE);