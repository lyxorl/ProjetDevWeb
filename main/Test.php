<?php
// Inclure la connexion à la base de données
include('db.php');

try {
    // Préparer la requête SQL avec un paramètre
    $stmt = $pdo->prepare("SELECT * FROM Resident WHERE Nom = :nom");
    $stmt->bindParam(':nom', $nom, PDO::PARAM_STR);
    
    // Définir la valeur du paramètre
    $nom = 'TestA'; // Exemple de nom à rechercher
    
    // Exécuter la requête
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
