<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../db_connect.php';

$id_objet = $_GET['objet'] ?? die(json_encode(['error' => 'ID objet manquant']));
$date_debut = $_GET['date_debut'] ?? null;
$date_fin = $_GET['date_fin'] ?? null;

try {
    $sql = "SELECT * FROM Journal WHERE id_objet = :id_objet";
    
    if ($date_debut && $date_fin) {
        $sql .= " AND date_ BETWEEN :date_debut AND :date_fin";
    }
    
    $sql .= " ORDER BY date_ DESC";
    
    $stmt = $pdo->prepare($sql);
    $params = [':id_objet' => $id_objet];
    
    if ($date_debut && $date_fin) {
        $params[':date_debut'] = $date_debut;
        $params[':date_fin'] = $date_fin;
    }
    
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($results);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

?>