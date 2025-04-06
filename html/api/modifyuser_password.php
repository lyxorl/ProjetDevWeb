<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$response = ['success' => false, 'message' => ''];

try {
    // Vérification des données requises
    if (!isset($data['mdp']) || !isset($data['pseudo'])) {
        http_response_code(400);
        $response['message'] = 'Données manquantes: mdp et pseudo sont requis';
        echo json_encode($response);
        exit;
    }

    // Hachage du mot de passe
    $mot_de_passe = $data['mdp'];
    $hash = password_hash($mot_de_passe, PASSWORD_BCRYPT);

    // Mise à jour du mot de passe
    $stmt = $pdo->prepare("UPDATE Users SET mdp = ? WHERE pseudo = ?");
    if ($stmt->execute([$hash, $data['pseudo']])) {
        $response['success'] = true;
        $response['message'] = 'Mot de passe mis à jour avec succès';
        echo json_encode($response);
    } else {
        http_response_code(500);
        $response['message'] = 'Échec de la mise à jour';
        echo json_encode($response);
    }
} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = 'Erreur de base de données: ' . $e->getMessage();
    echo json_encode($response);
}
?>