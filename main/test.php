<?php
// Inclure la connexion à la base de données
include('db.php');

try {
    // Préparer la requête SQL avec un paramètre
    $stmt = $pdo->prepare("SELECT * FROM Resident WHERE Nom = :nom");
    $stmt->bindParam(':nom', $nom_c, PDO::PARAM_STR);
     // Définir la valeur du paramètre
    $nom_c = 'TestC'; // Exemple de nom à rechercher
    $nom = 'TestC';
    $prenom = 'TestC';
    
    $stmt2 = $pdo->prepare("INSERT INTO Resident (Nom, Prenom) VALUES (:nom, :prenom)");

    // Lier les paramètres aux valeurs
    $stmt2->bindParam(':nom', $nom);
    $stmt2->bindParam(':prenom', $prenom);
    
    // Exécuter la requête
    $stmt2->execute();
    $stmt->execute();
    
    // Récupérer les résultats
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($data) {
        echo "<h1>Données trouvées</h1>";
        echo "<ul>";
        foreach ($data as $row) {
            echo "<li>" . htmlspecialchars($row['Nom']) . " - " . htmlspecialchars($row['Prenom']) . "</li>";
        }
        echo "</ul>";
    } else {
        echo "Aucune donnée trouvée.";
    }
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}

?>
