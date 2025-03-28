<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
require_once '../db_connect.php';

file_put_contents('debug.log', print_r($_POST, true)); // Log des données reçues

// Récupération des données (adapté pour AngularJS)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$response = [
    'success' => false,
    'message' => 'Erreur inconnue'
];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $pseudo = $data['pseudo'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT pseudo, mdp, validite FROM Users WHERE pseudo = ?");
        $stmt->execute([$pseudo]);
        $user = $stmt->fetch();

        if ($user) {


// Debug 3 : Tester password_verify manuellement
    $testPassword = 'admin123'; // Remplace par celui que tu tapes
    //if (password_verify($testPassword, $user['mdp'])) {
    if (hash('sha256', $password) === $user['mdp']) {
        file_put_contents('debug.log', "Password OK avec password_verify()\n", FILE_APPEND);
    } else {
        file_put_contents('debug.log', "Password NON OK avec password_verify()\n", FILE_APPEND);
    }

    // Debug 4 : Afficher les données récupérées de la BDD
    file_put_contents('debug.log', "Utilisateur : " . print_r($user, true), FILE_APPEND);

    // Debug 5 : Trim sur les champs reçus
    $pseudo = trim($data['pseudo']);
    $password = trim($data['password']);
    file_put_contents('debug.log', "Pseudo: $pseudo | Password: $password\n", FILE_APPEND);

    // Debug 6 : Comparaison en clair pour test (⚠️ juste pour débogage)
    if ($password === $user['mdp']) {
        file_put_contents('debug.log', "Comparaison en clair OK\n", FILE_APPEND);
    } else {
        file_put_contents('debug.log', "Comparaison en clair FAIL\n", FILE_APPEND);
    }

    // Debug 7 : Rehash du mot de passe pour voir le format
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    file_put_contents('debug.log', "Nouveau hash pour ce mot de passe : $hashed\n", FILE_APPEND);











            //if (password_verify($password, $user['mdp'])) {
            if (hash('sha256', $password) === $user['mdp']) {
                if ($user['validite']) {
                    $response = [
                        'success' => true,
                        'message' => 'Connexion réussie'
                    ];
                } else {
                    $response['message'] = 'Compte non validé par l\'administrateur';
                }
            } else {
                $response['message'] = 'Mot de passe incorrect';
            }
        } else {
            $response['message'] = 'Utilisateur inexistant';
        }
    } else {
        $response['message'] = 'Méthode non autorisée';
    }
} catch (PDOException $e) {
    $response['message'] = 'Erreur base de données';
    file_put_contents('debug.log', $e->getMessage(), FILE_APPEND);
}

echo json_encode($response);
?>
