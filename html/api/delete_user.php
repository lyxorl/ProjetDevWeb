<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

$response = ['success' => false, 'message' => ''];

// Vérification de la méthode et des données
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Méthode non autorisée';
    echo json_encode($response);
    exit;
}

// Récupération des données
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['pseudo'])) {
    $response['message'] = 'Données invalides';
    echo json_encode($response);
    exit;
}

try {
    // Préparation et exécution de la requête
    $stmt = $pdo->prepare("DELETE FROM Users WHERE pseudo = :pseudo");
    $stmt->bindParam(':pseudo', $data['pseudo'], PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            $response['success'] = true;
            $response['message'] = 'User supprimé avec succès';
        } else {
            $response['message'] = 'Aucun user trouvé avec ce pseudo';
        }
    } else {
        $response['message'] = 'Erreur lors de l\'exécution de la requête';
    }
} catch (PDOException $e) {
    $response['message'] = 'Erreur base de données: ' . $e->getMessage();
    // Log l'erreur complète pour le débogage
    error_log('Erreur suppression matériel: ' . $e->getMessage());
}

echo json_encode($response);
?>
