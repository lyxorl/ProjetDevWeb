<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../db_connect.php';

try {
    $data = [
        'users' => $pdo->query("SELECT pseudo, nom, prenom, rang, validite, age, genre, type, mail FROM Users")->fetchAll(PDO::FETCH_ASSOC),
        // travailler les filtres mais pas tout de suites
    ];
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Erreur de base de données',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
