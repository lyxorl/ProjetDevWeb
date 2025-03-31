<?php
$host = '127.0.0.1';       // Adresse de l'hôte
$dbname = 'projet';     // Le nom de votre base de données
$username = 'root';  // Votre nom d'utilisateur MySQL
$password = 'cytech0001'; // Votre mot de passe MySQL


try {
    // Créer une connexion PDO à MySQL
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    // Configurer PDO pour gérer les erreurs
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    die("Connection échouée : " . $e->getMessage());
}
?>
