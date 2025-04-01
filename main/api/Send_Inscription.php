<!DOCTYPE html>
<html>
<head>
        <link rel="stylesheet" type="text/css" href="../style.css">
</head>
<body>

    <a href='index.html'>Page de Connexion (WIP)</a>
    <br>  

<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
require_once 'db.php';

file_put_contents('debug.log', print_r($_POST, true)); // Log des données reçues

// Récupération des données (adapté pour AngularJS)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

    $response = [
        'success' => false,
        'message' => 'Erreur inconnue'
    ];


    //stockage des variables
    $x = time();
    $inscript = date("d/m/Y", $x );

try {
   if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pseudo= $data['pseudo'];
    $pseudo = trim($pseudo);
    $genre = $data['genre'];
    $type = $data['type'];
    $date = $data['date'];
    
    $now = time();
    $temp = strtotime($date);
    $age = $now - $temp;
    $age = floor($age / (60*60*24*365.25));


    $nom = $data['nom'];
    $prenom = $data['prenom'];
    $adresse = $data['adresse'];
    $mdp = $data['mdp'];
    $mdp = trim($mdp);
    $hashmdp = password_hash($mdp, PASSWORD_BCRYPT);

    /*
    if(password_verify($mdp,$hashmdp)){
        echo "c bon <br>";
    }
    */

    $stmt = $pdo->prepare("SELECT * FROM Users WHERE pseudo = :nom");
    $stmt->bindParam(':nom', $pseudo, PDO::PARAM_STR);
     // Définir la valeur du paramètre

    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($data) {
        $response['message'] = 'Pseudonyme déja pris';
    } else {    

        $typesAdresse = ["hotmail.com","laposte.net","gmail.com"];
        $temp = explode("@", $adresse);

        $stmt = $pdo->prepare("SELECT * FROM Users WHERE mail = :mail");
        $stmt->bindParam(':mail', $adresse, PDO::PARAM_STR);
        // Définir la valeur du paramètre

        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!in_array($temp[1], $typesAdresse)){
            $response['message'] = 'Adresse mail invalide';
        }

        else if($data) {
            $response['message'] = 'Adresse mail déja prise';
        }

        else{
            $types = ["image/jpeg","image/png","image/jpg"];
            if(isset($_FILES['img'])){
                $img = $_FILES["img"];
                if (in_array($img["type"], $types)) {
                    // Générer le nom du fichier
                    $temp = $img["type"];
                    $temp = explode("image/", $temp);
                    $filename = $pseudo.".".$temp[1];
                    $stock = "Users_img/" . $filename;
                    $extent = $temp[1];

                    echo "Chemin du fichier temporaire : " . $img["tmp_name"] . "<br>";
                    echo "Chemin de destination : " . $stock. "<br>";

                    // Déplacer le fichier
                    if (move_uploaded_file($img["tmp_name"], $stock)) {
                    } 
                    else {
                        $response['message'] = 'Erreur lors du deplacement de l image';
                    }
                } 
                else {
                    $response['message'] = 'format d image invalide';
                }
            }

            $stmt2 = $pdo->prepare("INSERT INTO Users (pseudo, age, genre, type, photo, nom, prenom, mdp, mail) VALUES (:pseudo, :age, :genre, :type, :photo, :nom, :prenom, :mdp, :mail)");

            
            // Lier les paramètres aux valeurs
            $stmt2->bindParam(':pseudo', $pseudo);
            $stmt2->bindParam(':age', $age);
            $stmt2->bindParam(':genre', $genre);
            $stmt2->bindParam(':type', $type);
            $stmt2->bindParam(':nom', $nom);
            $stmt2->bindParam(':photo', $stock);
            $stmt2->bindParam(':prenom', $prenom);
            $stmt2->bindParam(':mail', $adresse);
            $stmt2->bindParam(':mdp', $hashmdp);
            

       
            $stmt2->execute();


            $response = [
                'success' => true,
                'message' => 'Inscription réussie',
            ];
            

            
        }
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

</body>
</html>