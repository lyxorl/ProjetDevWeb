<?php

try {
    // Connexion sécurisée à la base de données
    $pdo = new PDO("mysql:host=localhost;dbname=projet", "root", "VOTRE_MOT_DE_PASSE", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Nouveau mot de passe à hacher
    $mot_de_passe = "user123";
    $hash = password_hash($mot_de_passe, PASSWORD_BCRYPT);

    // Mise à jour du mot de passe
    $stmt = $pdo->prepare("UPDATE Users SET mdp = ? WHERE pseudo = ?");
    if ($stmt->execute([$hash, "user1"])) {
        echo "Mot de passe mis à jour avec succès.";
    } else {
        echo "Échec de la mise à jour.";
    }
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}

?>

