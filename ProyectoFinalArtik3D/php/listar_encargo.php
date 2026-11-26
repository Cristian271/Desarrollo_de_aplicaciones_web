<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';

$sqlEncargos = "
    SELECT 
        e.id_encargo,
        e.nombre_cliente,
        e.telefono,
        e.estado,
        GROUP_CONCAT(CONCAT(p.nombre, ' (x', de.cantidad, ')') SEPARATOR ', ') AS resumen
    FROM Encargos e
    LEFT JOIN Detalle_Encargos de ON e.id_encargo = de.id_encargo
    LEFT JOIN Productos p ON de.cprod = p.cprod
    WHERE e.estado = 'pendiente'
    GROUP BY e.id_encargo
    ORDER BY e.id_encargo DESC
";

$resEncargos = mysqli_query($conexion, $sqlEncargos);
if (!$resEncargos) {
    echo json_encode(['ok' => false, 'mensaje' => 'Error al consultar encargos.']);
    exit;
}

$encargos = [];
$stmtDetalle = mysqli_prepare($conexion, "
    SELECT de.id_detalle_encargo, de.cprod, de.cantidad, p.nombre, p.precio, p.cantidad AS stock_actual
    FROM Detalle_Encargos de
    INNER JOIN Productos p ON de.cprod = p.cprod
    WHERE de.id_encargo = ?
");

while ($row = mysqli_fetch_assoc($resEncargos)) {
    $idEncargo = (int)$row['id_encargo'];
    mysqli_stmt_bind_param($stmtDetalle, "i", $idEncargo);
    mysqli_stmt_execute($stmtDetalle);
    $resDet = mysqli_stmt_get_result($stmtDetalle);

    $detalles = [];
    while ($det = mysqli_fetch_assoc($resDet)) {
        $detalles[] = $det;
    }

    $row['detalles'] = $detalles;
    $encargos[] = $row;
}
mysqli_stmt_close($stmtDetalle);

echo json_encode(['ok' => true, 'encargos' => $encargos]);