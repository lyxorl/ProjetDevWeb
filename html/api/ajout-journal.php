<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

require_once '../db_connect.php';

// Récupération des données
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

// Vérification de session
if (!isset($_SESSION['user_pseudo'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

// Validation des données
if (empty($data['id_objet']) || empty($data['pseudo']) || empty($data['action'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données manquantes']);
    exit;
}

try {
    // Insertion dans le journal
    $sqlJournal = "INSERT INTO Journal (
        type_action, pseudo, id_objet, details
    ) VALUES (
        :type_action, :pseudo, :id_objet, :details
    )";
    
    $stmtJournal = $pdo->prepare($sqlJournal);
    $stmtJournal->execute([
        ':type_action' => $data['action'],
        ':pseudo' => $data['pseudo'],
        ':id_objet' => $data['id_objet'],
        ':details' => json_encode($data['details'])
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Action journalisée avec succès'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>
