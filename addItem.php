<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers");
require_once '../db_connect.php';

file_put_contents('debug.log', print_r($_POST, true));

$data = json_decode(file_get_contents("php://input"));


// IMPORTANT pour l'instant le php ne genere pas l'id de l'objet c'est quelque chose qu'il faut que je fasse.

// Validation des données
if (!isset($data->id_objet) || !isset($data->nom) || !isset($data->type) || !isset($data->lieu)) {
    throw new Exception("Données manquantes");
    file_put_contents('debug.log', "Donnees incomplete", FILE_APPEND);
}

$stmt = $conn->prepare("INSERT INTO objets_connectes
    (id_objet, nom, description, etat, type, lieu, mots_cles)
    VALUES (:id_objet, :nom, :description, :etat, :type, :lieu, :mots_cles)");

try{
    $stmt->execute([
        ':id_objet' => $data->id_objet,
        ':nom' => $data->nom,
        ':description' => isset($data->description) ? $data->description : null,
        ':etat' => isset($data->etat) ? $data->etat : 'inactif',
        ':type' => $data->type,
        ':lieu' => $data->lieu,
        ':mots_cles' => isset($data->mots_cles) ? $data->mots_cles : null
    ]);

    file_put_contents('debug.log', "Ajout de l'objet faites correctement", FILE_APPEND);

    // rajouter eventuellement un test pour verifier

}catch(PDOException $e) {
    file_put_contents('debug.log', "PDO Error", FILE_APPEND);
}catch(Exception $e) {
    file_put_contents('debug.log', "Erreur inconnu (autre que PDO)", FILE_APPEND);
}

?>