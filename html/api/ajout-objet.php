<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Validation des données requises
if (!isset($data['nom']) || !is_string($data['nom']) || 
    !isset($data['type']) || !is_string($data['type']) ||
    !isset($data['lieu']) || !is_string($data['lieu'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Données requises manquantes (nom, type, lieu)',
        'received' => $data
    ]));
}

// Préparation des données
$id_objet = uniqid();
$nom = trim($data['nom']);
$description = isset($data['description']) ? trim($data['description']) : '';
$etat = isset($data['etat']) && in_array($data['etat'], ['Actif', 'Inactif']) ? $data['etat'] : 'Inactif';
$type = trim($data['type']);
$lieu = trim($data['lieu']);

// Traitement des mots-clés (peut être null)
$mots_cles = null;
if (isset($data['mots_cles']) && is_string($data['mots_cles']) && !empty(trim($data['mots_cles']))) {
    $mots_cles = json_encode(array_map('trim', explode(',', $data['mots_cles'])));
}

// Valeurs par défaut pour les thermostats
$temperature = null;
$consigne = null;
$lim_haute = null;
$lim_basse = null;

if ($type === 'thermostat') {
    $temperature = isset($data['temperature']) ? floatval($data['temperature']) : 20.0;
    $consigne = isset($data['consigne']) ? floatval($data['consigne']) : 20.0;
    $lim_haute = isset($data['lim_haute']) ? floatval($data['lim_haute']) : 25.0;
    $lim_basse = isset($data['lim_basse']) ? floatval($data['lim_basse']) : 18.0;
}

try {
    // Construction dynamique de la requête
    $query = "INSERT INTO Objets_connectes 
        (id_objet, nom, description, etat, type, lieu, mots_cles, temperature, consigne, lim_haute, lim_basse) 
        VALUES 
        (:id_objet, :nom, :description, :etat, :type, :lieu, :mots_cles, :temperature, :consigne, :lim_haute, :lim_basse)";
    
    $stmt = $pdo->prepare($query);
    
    // Binding des paramètres
    $stmt->bindParam(':id_objet', $id_objet, PDO::PARAM_STR);
    $stmt->bindParam(':nom', $nom, PDO::PARAM_STR);
    $stmt->bindParam(':description', $description, PDO::PARAM_STR);
    $stmt->bindParam(':etat', $etat, PDO::PARAM_STR);
    $stmt->bindParam(':type', $type, PDO::PARAM_STR);
    $stmt->bindParam(':lieu', $lieu, PDO::PARAM_STR);
    $stmt->bindParam(':mots_cles', $mots_cles, PDO::PARAM_STR);
    
    // Pour les valeurs numériques qui peuvent être NULL
    $stmt->bindValue(':temperature', $temperature, $temperature === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':consigne', $consigne, $consigne === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':lim_haute', $lim_haute, $lim_haute === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':lim_basse', $lim_basse, $lim_basse === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    
    // Exécution
    $success = $stmt->execute();
    
    // Réponse
    echo json_encode([
        'success' => $success,
        'id_objet' => $id_objet,
        'objet' => [
            'id_objet' => $id_objet,
            'nom' => $nom,
            'description' => $description,
            'etat' => $etat,
            'type' => $type,
            'lieu' => $lieu,
            'mots_cles' => $mots_cles ? json_decode($mots_cles) : [],
            'temperature' => $temperature,
            'consigne' => $consigne,
            'lim_haute' => $lim_haute,
            'lim_basse' => $lim_basse
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données',
        'error' => $e->getMessage(),
        'query' => $query,
        'params' => [
            'id_objet' => $id_objet,
            'nom' => $nom,
            'type' => $type,
            'lieu' => $lieu
        ]
    ]);
}
