<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';

$input = json_decode(file_get_contents('php://input'), true);
$accion = $input['accion'] ?? '';

mysqli_begin_transaction($conexion);

try {
    if ($accion === 'editar_cantidad') {
        $idDetalle = (int)($input['id_detalle_encargo'] ?? 0);
        $cantidad = (int)($input['cantidad'] ?? 0);

        if ($idDetalle <= 0 || $cantidad <= 0) {
            throw new Exception("Datos inválidos para actualizar cantidad.");
        }

        $stmt = mysqli_prepare($conexion, "
            UPDATE Detalle_Encargos de
            INNER JOIN Encargos e ON de.id_encargo = e.id_encargo
            SET de.cantidad = ?
            WHERE de.id_detalle_encargo = ? AND e.estado = 'pendiente'
        ");
        mysqli_stmt_bind_param($stmt, "ii", $cantidad, $idDetalle);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

    } elseif ($accion === 'eliminar_renglon') {
        $idDetalle = (int)($input['id_detalle_encargo'] ?? 0);

        $stmt = mysqli_prepare($conexion, "
            DELETE de FROM Detalle_Encargos de
            INNER JOIN Encargos e ON de.id_encargo = e.id_encargo
            WHERE de.id_detalle_encargo = ? AND e.estado = 'pendiente'
        ");
        mysqli_stmt_bind_param($stmt, "i", $idDetalle);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

    } elseif ($accion === 'rechazar') {
        $idEncargo = (int)($input['id_encargo'] ?? 0);

        $stmt = mysqli_prepare($conexion, "UPDATE Encargos SET estado = 'rechazado' WHERE id_encargo = ? AND estado = 'pendiente'");
        mysqli_stmt_bind_param($stmt, "i", $idEncargo);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

    } elseif ($accion === 'finalizar') {
        $idEncargo = (int)($input['id_encargo'] ?? 0);

        // Verificar que el encargo siga pendiente (bloqueo de fila)
        $stmtEstado = mysqli_prepare($conexion, "SELECT estado FROM Encargos WHERE id_encargo = ? FOR UPDATE");
        mysqli_stmt_bind_param($stmtEstado, "i", $idEncargo);
        mysqli_stmt_execute($stmtEstado);
        $resEstado = mysqli_stmt_get_result($stmtEstado);
        $encargo = mysqli_fetch_assoc($resEstado);
        mysqli_stmt_close($stmtEstado);

        if (!$encargo || $encargo['estado'] !== 'pendiente') {
            throw new Exception("El encargo no existe o ya fue procesado.");
        }

        // Validar stock disponible en Productos antes de disparar el trigger
        $stmtStock = mysqli_prepare($conexion, "
            SELECT p.nombre, p.cantidad AS stock, de.cantidad AS solicitado
            FROM Detalle_Encargos de
            INNER JOIN Productos p ON de.cprod = p.cprod
            WHERE de.id_encargo = ?
            FOR UPDATE
        ");
        mysqli_stmt_bind_param($stmtStock, "i", $idEncargo);
        mysqli_stmt_execute($stmtStock);
        $resStock = mysqli_stmt_get_result($stmtStock);

        $hayArticulos = false;
        while ($item = mysqli_fetch_assoc($resStock)) {
            $hayArticulos = true;
            if ((int)$item['stock'] < (int)$item['solicitado']) {
                throw new Exception("Stock insuficiente para '{$item['nombre']}' (Disponible: {$item['stock']}, Solicitado: {$item['solicitado']}).");
            }
        }
        mysqli_stmt_close($stmtStock);

        if (!$hayArticulos) {
            throw new Exception("No se puede finalizar un encargo sin artículos.");
        }

        // Ejecutar UPDATE que dispara trg_encargo_finalizado_descontar_stock
        $stmtFin = mysqli_prepare($conexion, "UPDATE Encargos SET estado = 'finalizado' WHERE id_encargo = ?");
        mysqli_stmt_bind_param($stmtFin, "i", $idEncargo);
        if (!mysqli_stmt_execute($stmtFin)) {
            throw new Exception("Error al finalizar el encargo.");
        }
        mysqli_stmt_close($stmtFin);
    } else {
        throw new Exception("Acción no reconocida.");
    }

    mysqli_commit($conexion);
    echo json_encode(['ok' => true, 'mensaje' => 'Operación realizada con éxito.']);
} catch (Exception $e) {
    mysqli_rollback($conexion);
    echo json_encode(['ok' => false, 'mensaje' => $e->getMessage()]);
}