<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
require_once '../db_connect.php';

file_put_contents('debug.log', print_r($_POST, true));
$newuserjsonformat = file_get_contents('php://input');
$newuser = json_decode($json, true);

// a voir comment est donnee new user donc suprimmer une partie des donnees mis en param ou les mettre a null
$query = "INSERT INTO Users (pseudo, age, type_, photo, nom, prenom, mdp, rang, nb_point, mail, validite) VALUES (:pseudo, :age, :type_, :photo, :nom, :prenom, :mdp, :rang, :nb_point, :mail, :validite)";
$stmt = $conn->prepare($query);

//$nom = htmlspecialchars(strip_tags($data->nom)); // a faire avec bcp de donnee pour enlever les char speciaux
//$stmt->bindParam(':nom', $nom);

try {
    $stmt->execute();
    http_response_code(201);
    echo json_encode([
        "message" => "Utilisateur créé avec succès",
        "id" => $conn->lastInsertId()
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur lors de la création de l'utilisateur"]);
}

?>