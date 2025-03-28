<?php
// Configuration de la connexion MySQL
$host = 'localhost';     // Adresse du serveur MySQL
$db   = 'projet';       // Nom de votre base de données
$user = 'root';         // Nom d'utilisateur MySQL
$pass = 'Cypri124$';    // Mot de passe MySQL
$charset = 'utf8mb4';   // Encodage des caractères

// Chaîne de connexion (DSN)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// Options de configuration PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Création de l'instance PDO
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // En cas d'erreur, on affiche un message propre et on arrête le script
    die(json_encode([
        'error' => true,
        'message' => 'Erreur de connexion à la base de données',
        'details' => $e->getMessage()
    ]));
}
?>
