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

            if (password_verify($password, $user['mdp'])) {
           // if (hash('sha256', $password) === $user['mdp']) {
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
