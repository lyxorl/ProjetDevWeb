<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['pseudo']) || !is_string($data['pseudo']) || trim($data['pseudo']) === '') {
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "message" => "Pseudo invalide ou vide",
        "received_data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
$pseudo = trim($data['pseudo']);

try {

    $stmt = $pdo->prepare("SELECT * FROM Users WHERE pseudo = :pseudo");
    $stmt->bindParam(':pseudo', $pseudo, PDO::PARAM_STR);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode([
            "success" => true,
            "data" => $user
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Utilisateur non trouvé"
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Erreur de base de données',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>