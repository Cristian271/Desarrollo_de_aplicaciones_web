<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';

$input = json_decode(file_get_contents('php://input'), true);

$nombre = trim($input['nombre_cliente'] ?? '');
$telefono = trim($input['telefono'] ?? '');
$carrito = $input['carrito'] ?? [];

if ($nombre === '' || $telefono === '' || !is_array($carrito) || count($carrito) === 0) {
    echo json_encode(['ok' => false, 'mensaje' => 'Datos del cliente o carrito incompletos.']);
    exit;
}

mysqli_begin_transaction($conexion);

try {
    // 1. Insertar cabecera en Encargos (estado queda 'pendiente' por defecto)
    $stmtEncargo = mysqli_prepare($conexion, "INSERT INTO Encargos (nombre_cliente, telefono) VALUES (?, ?)");
    mysqli_stmt_bind_param($stmtEncargo, "ss", $nombre, $telefono);
    if (!mysqli_stmt_execute($stmtEncargo)) {
        throw new Exception("Error al registrar el encargo.");
    }
    $idEncargo = mysqli_insert_id($conexion);
    mysqli_stmt_close($stmtEncargo);

    // 2. Insertar artículos en Detalle_Encargos
    $stmtDetalle = mysqli_prepare($conexion, "INSERT INTO Detalle_Encargos (id_encargo, cprod, cantidad) VALUES (?, ?, ?)");
    foreach ($carrito as $item) {
        $cprod = (int)($item['cprod'] ?? 0);
        $cantidad = (int)($item['cantidad'] ?? 0);

        if ($cprod <= 0 || $cantidad <= 0) {
            throw new Exception("Producto o cantidad inválida en el carrito.");
        }

        mysqli_stmt_bind_param($stmtDetalle, "iii", $idEncargo, $cprod, $cantidad);
        if (!mysqli_stmt_execute($stmtDetalle)) {
            throw new Exception("Error al guardar el detalle del producto.");
        }
    }
    mysqli_stmt_close($stmtDetalle);

    mysqli_commit($conexion);

    // 3. Guardar cookie con datos del cliente por 30 días
    $datosCliente = json_encode(['nombre_cliente' => $nombre, 'telefono' => $telefono]);
    setcookie('artik3d_cliente', $datosCliente, [
        'expires' => time() + (86400 * 30),
        'path' => '/',
        'samesite' => 'Lax'
    ]);

    echo json_encode([
        'ok' => true,
        'id_encargo' => $idEncargo,
        'mensaje' => 'Encargo registrado correctamente.'
    ]);
} catch (Exception $e) {
    mysqli_rollback($conexion);
    echo json_encode(['ok' => false, 'mensaje' => $e->getMessage()]);
}