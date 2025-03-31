<?php
// Activer l'affichage de toutes les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

require_once 'db_connect.php';

try {
    // Test de connexion simple
    echo "<h2>Test de connexion à la base de données</h2>";
    
    // 1. Vérification de la connexion
    if ($pdo) {
        echo "<p style='color:green'>✓ Connexion PDO réussie</p>";
    } else {
        echo "<p style='color:red'>✗ Échec de la connexion</p>";
        exit;
    }

    // 2. Test de requête simple
    $stmt = $pdo->query("SELECT 1");
    if ($stmt->fetch()) {
        echo "<p style='color:green'>✓ Requête test exécutée avec succès</p>";
    }

    // 3. Test avec votre table Users
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM Users");
        $count = $stmt->fetchColumn();
        echo "<p style='color:green'>✓ Table Users accessible (".$count." enregistrements)</p>";
        
        // 4. Test avec des données réelles (affiche les 5 premiers users)
        $stmt = $pdo->query("SELECT pseudo, mail, validite FROM Users LIMIT 5");
        echo "<h3>5 premiers utilisateurs :</h3>";
        echo "<table border='1'><tr><th>Pseudo</th><th>Email</th><th>Validité</th></tr>";
        while ($row = $stmt->fetch()) {
            echo "<tr>";
            echo "<td>".htmlspecialchars($row['pseudo'])."</td>";
            echo "<td>".htmlspecialchars($row['mail'])."</td>";
            echo "<td>".($row['validite'] ? '✓ Valide' : '✗ Non valide')."</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } catch (PDOException $e) {
        echo "<p style='color:red'>✗ Erreur sur la table Users : ".$e->getMessage()."</p>";
    }

} catch (PDOException $e) {
    echo "<h2 style='color:red'>Erreur critique :</h2>";
    echo "<p>".$e->getMessage()."</p>";
    echo "<h3>Vérifiez :</h3>";
    echo "<ul>";
    echo "<li>Le serveur MySQL est-il démarré ?</li>";
    echo "<li>Les identifiants dans db_connect.php sont-ils corrects ?</li>";
    echo "<li>La base 'maison_connectee' existe-t-elle ?</li>";
    echo "</ul>";
}
?>
