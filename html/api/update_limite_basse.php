<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db_connect.php'; 

$data = json_decode(file_get_contents('php://input'), true);


// Validation renforcée
if (!isset($data['id_objet']) || !is_string($data['id_objet']) || 
    !isset($data['lim_basse']) || !is_numeric($data['lim_basse'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Données invalides',
        'received' => $data
    ]));
}

$id_objet = trim($data['id_objet']);
$lim_basse = round(floatval($data['lim_basse']), 1); // Arrondir à 1 décimale

try {
    $stmt = $pdo->prepare("UPDATE Objets_connectes SET lim_basse = :lim_basse WHERE id_objet = :id_objet");
    $stmt->bindParam(':lim_basse', $lim_basse, PDO::PARAM_STR);
    $stmt->bindParam(':id_objet', $id_objet, PDO::PARAM_STR);
    $success = $stmt->execute();
    
    echo json_encode([
        'success' => $success,
        'rows_affected' => $stmt->rowCount(),
        'new_lim_basse' => $lim_basse
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage()
    ]);
}
?>
