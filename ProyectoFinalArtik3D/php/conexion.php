<?php
$servidor = "localhost";
$usuario  = "root";
$contrasena = ""; 
$bd       = "artik3d";

$conexion = mysqli_connect($servidor, $usuario, $contrasena, $bd);

if (!$conexion) {
    http_response_code(500);
    exit('No se pudo conectar a la base de datos. Revise la configuración.');
}
if (!mysqli_set_charset($conexion, 'utf8mb4')) {
    http_response_code(500);
    exit('No se pudo establecer la codificación de caracteres.');
}
