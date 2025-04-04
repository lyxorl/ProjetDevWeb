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
$requiredFields = ['pseudo'];
$response = ['success' => true, 'message' => 'Mise à jour réussie'];
$updatedFields = [];

// Vérification des champs obligatoires
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || $data[$field] === '') {
        $response = [
            'success' => false,
            'message' => "Le champ '$field' est obligatoire"
        ];
        echo json_encode($response);
        exit;
    }
}

foreach ($data as $field => $value) {
    // Liste des champs autorisés à être mis à jour
    $allowedFields = ['age', 'genre', 'type', 'photo', 'nom', 'prenom', 'mdp', 'rang', 'nb_point', 'mail', 'validite'];
    
    if (!in_array($field, $allowedFields)) {
        continue; // Ignore les champs non autorisés
    }
    
    // Cas spécial pour le mot de passe
    if ($field === 'mdp') {
        if (empty($value)) {
            continue; // Ignore si le mot de passe est vide
        }
        $value = password_hash($value, PASSWORD_BCRYPT); // Hachage du mot de passe
    }
    
    // Cas spécial pour les champs vides (sauf mdp déjà traité)
    if (empty($value) && $field !== 'mdp') {
        $value = null; // Transforme les chaines vides en NULL
    }

    try {
        $sql = "UPDATE Users SET $field = :value WHERE pseudo = :pseudo";
        $stmt = $pdo->prepare($sql);
        
        $stmt->execute([
            ':value' => $value,
            ':pseudo' => $data['pseudo']
        ]);
        
        if ($stmt->rowCount() > 0) {
            $updatedFields[] = $field;
        }
        
    } catch (PDOException $e) {
        $response = [
            'success' => false,
            'message' => "Erreur lors de la mise à jour du champ $field: " . $e->getMessage()
        ];
        echo json_encode($response);
        exit;
    }
}

// Vérification si des champs ont été mis à jour
if (empty($updatedFields)) {
    $response = [
        'success' => false,
        'message' => 'Aucun champ valide à mettre à jour'
    ];
} else {
    $response['updated_fields'] = $updatedFields;
    $response['rows_affected'] = count($updatedFields);
}

echo json_encode($response);
?>