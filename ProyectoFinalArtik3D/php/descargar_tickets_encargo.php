<?php
require_once __DIR__ . '/conexion.php';

$idEncargo = (int)($_GET['id_encargo'] ?? 0);
if ($idEncargo <= 0) {
    http_response_code(400);
    exit("Folio inválido.");
}

$stmt = mysqli_prepare($conexion, "SELECT id_encargo, nombre_cliente, telefono, estado FROM Encargos WHERE id_encargo = ?");
mysqli_stmt_bind_param($stmt, "i", $idEncargo);
mysqli_stmt_execute($stmt);
$encargo = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
mysqli_stmt_close($stmt);

if (!$encargo) {
    http_response_code(404);
    exit("Encargo no encontrado.");
}

$stmtDet = mysqli_prepare($conexion, "
    SELECT p.nombre, de.cantidad, p.precio
    FROM Detalle_Encargos de
    INNER JOIN Productos p ON de.cprod = p.cprod
    WHERE de.id_encargo = ?
");
mysqli_stmt_bind_param($stmtDet, "i", $idEncargo);
mysqli_stmt_execute($stmtDet);
$resDet = mysqli_stmt_get_result($stmtDet);

$lineas = [
    "TICKET DE ENCARGO - ARTIK3D",
    "==========================================",
    "Folio: #" . $encargo['id_encargo'],
    "Cliente: " . $encargo['nombre_cliente'],
    "Telefono: " . $encargo['telefono'],
    "Estado: " . strtoupper($encargo['estado']),
    "------------------------------------------",
    "ARTICULOS:"
];

$total = 0;
while ($row = mysqli_fetch_assoc($resDet)) {
    $subtotal = (float)$row['precio'] * (int)$row['cantidad'];
    $total += $subtotal;
    $lineas[] = sprintf("- %s | Cant: %d | $%.2f", $row['nombre'], $row['cantidad'], $subtotal);
}
mysqli_stmt_close($stmtDet);

$lineas[] = "------------------------------------------";
$lineas[] = sprintf("TOTAL ESTIMADO: $%.2f", $total);

// Construcción de flujo PDF 1.4 nativo
$contenidoTexto = "BT\n/F1 11 Tf\n40 780 Td\n15 TL\n";
foreach ($lineas as $linea) {
    $limpia = iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $linea);
    $escapada = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $limpia);
    $contenidoTexto .= "($escapada) Tj\nT*\n";
}
$contenidoTexto .= "ET";

$objetos = [];
$objetos[] = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";
$objetos[] = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj";
$objetos[] = "3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 842] /Contents 5 0 R >> endobj";
$objetos[] = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj";
$objetos[] = "5 0 obj << /Length " . strlen($contenidoTexto) . " >> stream\n" . $contenidoTexto . "\nendstream endobj";

$pdf = "%PDF-1.4\n";
$offsets = [0];
foreach ($objetos as $obj) {
    $offsets[] = strlen($pdf);
    $pdf .= $obj . "\n";
}
$xrefPos = strlen($pdf);
$pdf .= "xref\n0 " . (count($objetos) + 1) . "\n0000000000 65535 f \n";
for ($i = 1; $i <= count($objetos); $i++) {
    $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
}
$pdf .= "trailer << /Size " . (count($objetos) + 1) . " /Root 1 0 R >>\nstartxref\n" . $xrefPos . "\n%%EOF";

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="ticket_encargo_' . $idEncargo . '.pdf"');
header('Content-Length: ' . strlen($pdf));
echo $pdf;