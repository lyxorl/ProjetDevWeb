<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Validation
if (!isset($data['id_objet']) || !is_string($data['id_objet']) || 
    !isset($data['etat']) || !in_array($data['etat'], ['Actif', 'Inactif'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Données invalides',
        'received' => $data
    ]));
}

$id_objet = trim($data['id_objet']);
$etat = $data['etat'];

try {
    $stmt = $pdo->prepare("UPDATE Objets_connectes SET etat = :etat WHERE id_objet = :id_objet");
    $stmt->bindParam(':etat', $etat, PDO::PARAM_STR);
    $stmt->bindParam(':id_objet', $id_objet, PDO::PARAM_STR);  // Important: PDO::PARAM_STR
    $success = $stmt->execute();
    
    echo json_encode([
        'success' => $success,
        'rows_affected' => $stmt->rowCount(),
        'debug' => [
            'id_objet' => $id_objet,
            'type_id' => gettype($id_objet)
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
}