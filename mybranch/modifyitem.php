<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers");
require_once '../db_connect.php';

file_put_contents('debug.log', print_r($_POST, true));

$data = json_decode(file_get_contents("php://input"));

try{
    $stmt = $conn->prepare("UPDATE objets_connectes
                            SET nom = :nom,
                                description = :description,
                                etat = :etat,
                                type = :type,
                                lieu = :lieu,
                                mots_cles = :mots_cles
                            WHERE id_objet = :id_objet");
    
    // Exécution avec les paramètres
    $stmt->execute([
        ':id_objet' => $data->id_objet,
        ':nom' => $data->nom,
        ':description' => isset($data->description) ? $data->description : null,
        ':etat' => isset($data->etat) ? $data->etat : 'inactif',
        ':type' => $data->type,
        ':lieu' => $data->lieu,
        ':mots_cles' => isset($data->mots_cles) ? $data->mots_cles : null
    ]);

    // rajouter eventuellement un test pour verifier
    
}catch(PDOException $e) {
    file_put_contents('debug.log', "PDO Error", FILE_APPEND);
}catch(Exception $e) {
    file_put_contents('debug.log', "Erreur inconnu (autre que PDO)", FILE_APPEND);
}
?>