<?php
header("Content-Type: application/json; charset=utf-8");

$soloPublico = isset($_GET["publico"]) && $_GET["publico"] === "1";
if (!$soloPublico) {
    require_once __DIR__ . "/verificar_admin.php";
    exigirSesionAdmin();
}

require_once __DIR__ . "/conexion.php";

function formatearFechaEs(string $fechaSql): string {
    $timestamp = strtotime($fechaSql);
    if ($timestamp === false) {
        return $fechaSql;
    }
    $meses = [
        1 => "ene", 2 => "feb", 3 => "mar", 4 => "abr",
        5 => "may", 6 => "jun", 7 => "jul", 8 => "ago",
        9 => "sep", 10 => "oct", 11 => "nov", 12 => "dic"
    ];
    $dia = date("d", $timestamp);
    $mes = $meses[(int)date("n", $timestamp)] ?? "";
    $anio = date("Y", $timestamp);
    return "$dia $mes $anio";
}

//Vista index
if ($soloPublico) {
    $sql = "SELECT id_comentario, nombre_cliente, calificacion, comentario, creado_en
            FROM Comentarios
            WHERE estado = 'aprobado'
            ORDER BY id_comentario DESC";
    $resultado = mysqli_query($conexion, $sql);
    if (!$resultado) {
        error_log("Error al listar comentarios públicos: " . mysqli_error($conexion));
        http_response_code(500);
        echo json_encode(["ok" => false, "mensaje" => "Error al obtener opiniones."]);
        mysqli_close($conexion);
        exit;
    }

    $aprobados = [];
    while ($fila = mysqli_fetch_assoc($resultado)) {
        $aprobados[] = [
            "id_comentario" => (int)$fila["id_comentario"],
            "nombre" => $fila["nombre_cliente"],
            "calificacion" => (int)$fila["calificacion"],
            "comentario" => $fila["comentario"],
            "fecha" => formatearFechaEs($fila["creado_en"])
        ];
    }
    mysqli_free_result($resultado);
    mysqli_close($conexion);

    echo json_encode([
        "ok" => true,
        "aprobados" => $aprobados
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vista de administrador
$sql = "SELECT id_comentario, nombre_cliente, calificacion, comentario, estado, creado_en
        FROM Comentarios
        ORDER BY id_comentario DESC";
$resultado = mysqli_query($conexion, $sql);
if (!$resultado) {
    error_log("Error al listar comentarios admin: " . mysqli_error($conexion));
    http_response_code(500);
    echo json_encode(["ok" => false, "mensaje" => "Error al obtener los comentarios."]);
    mysqli_close($conexion);
    exit;
}

$pendientes = [];
$aprobados = [];

while ($fila = mysqli_fetch_assoc($resultado)) {
    $item = [
        "id_comentario" => (int)$fila["id_comentario"],
        "nombre" => $fila["nombre_cliente"],
        "calificacion" => (int)$fila["calificacion"],
        "comentario" => $fila["comentario"],
        "fecha" => formatearFechaEs($fila["creado_en"])
    ];

    if ($fila["estado"] === "aprobado") {
        $aprobados[] = $item;
    } else {
        $pendientes[] = $item;
    }
}

mysqli_free_result($resultado);
mysqli_close($conexion);

echo json_encode([
    "ok" => true,
    "pendientes" => $pendientes,
    "aprobados" => $aprobados
], JSON_UNESCAPED_UNICODE);
