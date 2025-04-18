<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../db_connect.php';

try {
    $data = [
        'materiels' => $pdo->query("SELECT id_objet, nom, description, etat, type, lieu, temperature, consigne, lim_haute, lim_basse, mots_cles FROM Objets_connectes")->fetchAll(PDO::FETCH_ASSOC),
        'filtres' => [
            'lieux' => $pdo->query("SELECT DISTINCT lieu FROM Objets_connectes WHERE lieu IS NOT NULL ORDER BY lieu")->fetchAll(PDO::FETCH_COLUMN),
            'types' => $pdo->query("SELECT DISTINCT type FROM Objets_connectes WHERE type IS NOT NULL ORDER BY type")->fetchAll(PDO::FETCH_COLUMN),
            'etats' => $pdo->query("SELECT DISTINCT etat FROM Objets_connectes WHERE etat IS NOT NULL ORDER BY etat")->fetchAll(PDO::FETCH_COLUMN)
        ]
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
