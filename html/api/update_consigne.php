<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Validation
$id_objet = trim($data['id_objet'] ?? 0);
$consigne = isset($data['consigne']) ? floatval($data['consigne']) : null;

if ($id_objet <= 0 || $consigne === null) {
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE Objets_connectes SET consigne = ? WHERE id_objet = ?");
    $success = $stmt->execute([$consigne, $id_objet]);
    
    echo json_encode(['success' => $success]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données']);
}
