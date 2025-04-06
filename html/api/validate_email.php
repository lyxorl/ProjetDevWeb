<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db_connect.php';

define('SECRET_KEY', 'votre_cle_secrete_32_caracteres_!'); // Doit correspondre à inscription.php

$response = ['success' => false, 'message' => 'Erreur inconnue'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $dataString = $_GET['d'] ?? '';
        $signature = $_GET['s'] ?? '';

        // Vérification de la signature
        $expectedSignature = hash_hmac('sha256', $dataString, SECRET_KEY);
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Signature invalide');
        }

        // Décodage des données
        $data = json_decode(base64_decode($dataString), true);
        
        if (!$data || !isset($data['p'], $data['e'], $data['t'])) {
            throw new Exception('Données de validation corrompues');
        }

        // Vérification de l'expiration (1 heure)
        if (time() > $data['t']) {
            throw new Exception('Lien de validation expiré');
        }

        // Mise à jour de la validité dans la base
        $stmt = $pdo->prepare("UPDATE Users SET validite = 0 WHERE pseudo = ? AND mail = ?");
        $stmt->execute([$data['p'], $data['e']]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Utilisateur non trouvé ou déjà validé');
        }

        $response = [
            'success' => true,
            'message' => 'Email validé avec succès. Votre compte est en attente de validation par un administrateur.'
        ];
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>