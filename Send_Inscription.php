<!DOCTYPE html>
<html>
<head>
        <link rel="stylesheet" type="text/css" href="../style.css">
</head>
<body>

    <a href='index.html'>Page de Connexion (WIP)</a>
    <br>  

<?php

    include('db.php');

    //stockage des variables
    $x = time();
    $inscript = date("d/m/Y", $x );


    $pseudo= $_POST['pseudo'];
    $pseudo = trim($pseudo);
    $genre = $_POST['genre'];
    $type = $_POST['type'];
    $date = $_POST['date'];
    
    $now = time();
    $temp = strtotime($date);
    $age = $now - $temp;
    $age = floor($age / (60*60*24*365.25));


    $nom = $_POST['nom'];
    $prenom = $_POST['prenom'];
    $adresse = $_POST['adresse'];
    $mdp = $_POST['mdp'];
    $mdp = trim($mdp);
    $hashmdp = password_hash($mdp, PASSWORD_BCRYPT);

    /*
    if(password_verify($mdp,$hashmdp)){
        echo "c bon <br>";
    }
    */

    echo $pseudo." ".$genre." ".$type." ".$date." ".$age." ".$nom." ".$prenom." ".$adresse." ".$mdp." ".$hashmdp."<br>";

    $stmt = $pdo->prepare("SELECT * FROM Users WHERE pseudo = :nom");
    $stmt->bindParam(':nom', $pseudo, PDO::PARAM_STR);
     // Définir la valeur du paramètre

    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($data) {
        echo "<h4> Pseudonyme déja pris, veuillez en choisir un autre ou vous connecter </h1>";
        foreach ($data as $row) {
            echo "<li>". htmlspecialchars($row['pseudo']) . "</li>";
        }
        echo "<a href='Inscription.php'>Page Inscription</a>";
        

    } else {    


        $regex = '/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/'; 

        $stmt = $pdo->prepare("SELECT * FROM Users WHERE mail = :mail");
        $stmt->bindParam(':mail', $adresse, PDO::PARAM_STR);
        // Définir la valeur du paramètre

        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!(preg_match($regex, $email))){
            echo "<h4> Adresse mail invalide, veuillez en choisir un autre ou vous connecter </h1>";
            echo "<a href='Inscription.php'>Page Inscription</a>";
        }

        else if($data) {
            echo "<h4> Adresse mail déja prise, veuillez en choisir un autre ou vous connecter </h1>";
            foreach ($data as $row) {
                echo "<li>". htmlspecialchars($row['mail']) . "</li>";
            }
            echo "<a href='Inscription.php'>Page Inscription</a>";
        }

        else{
            echo "Aucune donnée trouvée."."<br>";
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
                        echo "Erreur lors du déplacement du fichier.";
                    }
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
            echo "Demande d'inscription reussite";
            

            
        }
    }

    

    
?>

</body>
</html>