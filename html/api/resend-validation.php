<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db_connect.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$response = ['success' => false, 'message' => ''];

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (empty($data['mail'])) {
        throw new Exception('Email non fourni');
    }

    // Vérifie si l'utilisateur existe et n'est pas encore validé
    $stmt = $pdo->prepare("SELECT pseudo, validite FROM Users WHERE mail = ?");
    $stmt->execute([$data['mail']]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception('Aucun compte trouvé avec cet email');
    }

    if ($user['validite'] !== null) {
        throw new Exception('Ce compte a déjà été validé');
    }

    // Réutilise la fonction sendValidationEmail de inscription.php
    require 'inscription.php'; // Inclut les fonctions nécessaires
    
    $emailSent = sendValidationEmail($data['mail'], $user['pseudo']);

    if (!$emailSent) {
        throw new Exception('Erreur lors de l\'envoi de l\'email');
    }

    $response = [
        'success' => true,
        'message' => 'Un nouvel email de validation a été envoyé'
    ];

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>