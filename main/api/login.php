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

        $stmt = $pdo->prepare("SELECT pseudo, mdp, validite, rang FROM Users WHERE pseudo = ?");
        $stmt->execute([$pseudo]);
        $user = $stmt->fetch();

        if ($user) {

            if (password_verify($password, $user['mdp'])) {
           
                if ($user['validite']===1) {
                    setcookie('user_pseudo', $user['pseudo'], time() + 3600, "/");
        			setcookie('user_rang', $user['rang'], time() + 3600, "/");
                    $response = [
                        'success' => true,
                        'message' => 'Connexion réussie',
                        'pseudo' => $user['pseudo'],
            			'rang' => $user['rang']
                    ];
                } elseif ($user['validite'] === 0){
                    $response['message'] = 'Compte non validé par l\'administrateur';
                }
                elseif (is_null($user['validite'])){
                    $response['message'] = 'Adresse mail non validée';
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
    //file_put_contents('debug.log', $e->getMessage(), FILE_APPEND);
}

echo json_encode($response);
?>
