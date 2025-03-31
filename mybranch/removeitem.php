<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers");
require_once '../db_connect.php';

file_put_contents('debug.log', print_r($_POST, true));

$data = json_decode(file_get_contents("php://input"));

try{
    if (!isset($data->id_objet)) {
        throw new Exception("ID de l'objet manquant");
    }

    // Préparation de la requête SQL
    $stmt = $conn->prepare("DELETE FROM objets_connectes WHERE id_objet = :id_objet");
    $stmt->execute([':id_objet' => $data->id_objet]);

    // Vérification si une ligne a été supprimée
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Objet supprimé avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Aucun objet trouvé avec cet ID'
        ]);


        
    }
} catch(PDOException $e) {
    file_put_contents('debug.log', "PDO Error", FILE_APPEND);
} catch(Exception $e) {
    file_put_contents('debug.log', "Erreur (pas PDO)", FILE_APPEND);
}

?>