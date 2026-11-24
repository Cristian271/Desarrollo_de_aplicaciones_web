<?php
declare(strict_types=1);

function exigirSesionAdmin(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['admin_autenticado']) || $_SESSION['admin_autenticado'] !== true) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'mensaje' => 'No autorizado. Debes iniciar sesión como administrador.'
        ]);
        exit;
    }
}