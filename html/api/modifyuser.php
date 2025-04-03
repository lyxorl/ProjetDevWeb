<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Active le debuggage PHP (à désactiver en production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../db_connect.php';

$response = ['success' => false, 'message' => ''];

// Récupère les données POST
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Vérifie le JSON
if (!$data) {
    $response['message'] = 'Données JSON invalides';
    http_response_code(400);
    echo json_encode($response);
    exit;
}


// Liste des champs obligatoires (selon votre table SQL)
$requiredFields = ['pseudo', 'type', 'nom', 'prenom', 'mdp', 'mail'];

foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        $response['message'] = "Le champ '$field' est obligatoire";
    }
}

try {
    // Requête mise à jour
    $stmt = $pdo->prepare("UPDATE Users 
                            SET age = :age,
                                genre = :genre,
                                type = :type,
                                photo = :photo,
                                nom = :nom,
                                prenom = :prenom,
                                mdp = :mdp,
                                rang = :rang,
                                nb_point = :nb_point,
                                mail = :mail,
                                validite = :validite
                            WHERE pseudo = :pseudo");

    // Exécution avec les paramètres
    $stmt->execute([
        ':pseudo' => $data['pseudo'],
        ':age' => $data['age'] ?? null, // "?? null" = valeur par défaut si non fournie
        ':genre' => $data['genre'],
        ':type' => $data['type'],
        ':photo' => $data['photo'] ?? null,
        ':nom' => $data['nom'],
        ':prenom' => $data['prenom'],
        ':mdp' => $data['mdp'],
        ':rang' => $data['rang'] ?? 'simple',
        ':nb_point' => $data['nb_point'] ?? 0,
        ':mail' => $data['mail'],
        ':validite' => $data['validite'] ?? false
    ]);

    $response = [
        'success' => true,
        'message' => 'Utilisateur mis à jour',
        'rows_affected' => $stmt->rowCount()
    ];

} catch (PDOException $e) {
    $response['message'] = "Erreur SQL : " . $e->getMessage();
    http_response_code(500);
    error_log("Erreur SQL (modifyuser.php) : " . $e->getMessage());
}

echo json_encode($response);
?>