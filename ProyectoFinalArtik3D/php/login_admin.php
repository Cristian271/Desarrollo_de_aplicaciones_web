<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$usuario = is_array($data) && isset($data['usuario'])
    ? trim((string)$data['usuario'])
    : trim((string)($_POST['usuario'] ?? ''));

$contrasena = is_array($data) && isset($data['contrasena'])
    ? (string)$data['contrasena']
    : (string)($_POST['contrasena'] ?? '');

$usuarioEsperado = 'admin';
$contrasenaEsperada = '1234';

if (
    $usuario === '' ||
    $contrasena === '' ||
    !hash_equals($usuarioEsperado, $usuario) ||
    !hash_equals($contrasenaEsperada, $contrasena)
) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario o contraseña incorrectos']);
    exit;
}

session_regenerate_id(true);
$_SESSION['admin_autenticado'] = true;
$_SESSION['admin_usuario'] = $usuario;

echo json_encode(['ok' => true, 'mensaje' => 'Sesión iniciada correctamente.']);