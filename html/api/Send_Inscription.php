<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Activer le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

$response = ['success' => false, 'message' => ''];

file_put_contents('logs/debug.log', print_r([
    'timestamp' => date('Y-m-d H:i:s'),
    'received_data' => json_decode(file_get_contents('php://input'), true),
    'server' => $_SERVER,
    'errors' => error_get_last()
], true), FILE_APPEND);




try {
    // 1. Vérifier la méthode HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée', 405);
    }

    // 2. Récupérer les données JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Données JSON invalides', 400);
    }

    // 3. Valider les champs obligatoires
    $required = ['pseudo', 'date', 'genre', 'type', 'nom', 'prenom', 'adresse', 'mdp'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Le champ $field est requis", 400);
        }
    }

    // 4. Nettoyer les données
    $pseudo = trim($data['pseudo']);
    $genre = strtoupper(trim($data['genre']));
    $type = strtolower(trim($data['type']));
    $date = trim($data['date']);
    $nom = trim($data['nom']);
    $prenom = trim($data['prenom']);
    $adresse = strtolower(trim($data['adresse']));
    $mdp = trim($data['mdp']);

    // 5. Valider les ENUM
    if (!in_array($genre, ['M', 'F', 'AUTRE'])) {
        throw new Exception('Genre invalide (M/F/Autre)', 400);
    }
    if (!in_array($type, ['admin', 'parent', 'enfant', 'invité'])) {
        throw new Exception('Type de compte invalide', 400);
    }

    // 6. Calculer et valider l'âge
    $birthDate = new DateTime($date);
    $age = (new DateTime())->diff($birthDate)->y;
    if ($age < 0 || $age > 120) {
        throw new Exception('Âge invalide', 400);
    }

    // 7. Vérifier l'unicité du pseudo
    $stmt = $pdo->prepare("SELECT pseudo FROM Users WHERE pseudo = ?");
    $stmt->execute([$pseudo]);
    if ($stmt->fetch()) {
        throw new Exception('Ce pseudo existe déjà', 409);
    }

    // 8. Valider l'email
    if (!filter_var($adresse, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email invalide', 400);
    }
    $stmt = $pdo->prepare("SELECT pseudo FROM Users WHERE mail = ?");
    $stmt->execute([$adresse]);
    if ($stmt->fetch()) {
        throw new Exception('Email déjà utilisé', 409);
    }

    // 9. Hacher le mot de passe
    $hashmdp = password_hash($mdp, PASSWORD_BCRYPT);
    if ($hashmdp === false) {
        throw new Exception('Erreur de hachage du mot de passe', 500);
    }

    // 10. Insérer dans la BDD
    $stmt = $pdo->prepare("INSERT INTO Users 
        (pseudo, age, genre, type, nom, prenom, mdp, mail, rang, validite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'simple', FALSE)");

    $success = $stmt->execute([
        $pseudo,
        $age,
        $genre,
        $type,
        $nom,
        $prenom,
        $hashmdp,
        $adresse
    ]);

    if (!$success) {
        $errorInfo = $stmt->errorInfo();
        throw new Exception("Erreur BDD: " . $errorInfo[2], 500);
    }

    $response = [
        'success' => true,
        'message' => 'Inscription réussie',
        'pseudo' => $pseudo
    ];

} catch (PDOException $e) {
    $response = [
        'success' => false,
        'message' => 'Erreur base de données: ' . $e->getMessage(),
        'code' => $e->getCode()
    ];
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ];
}

// Journalisation
file_put_contents('logs/inscription.log', 
    date('[Y-m-d H:i:s] ') . json_encode($response) . "\n", 
    FILE_APPEND);

echo json_encode($response);
?>