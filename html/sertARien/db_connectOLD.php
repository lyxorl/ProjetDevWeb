<?php
// Configuration de la connexion MySQL
$host = 'localhost';     // Adresse du serveur MySQL
$db   = 'projet'; // Nom de votre base de données
$user = 'root';          // Nom d'utilisateur MySQL
$pass = 'Cypri124$';              // Mot de passe MySQL
$charset = 'utf8mb4';    // Encodage des caractères

// Chaîne de connexion (DSN)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// Options de configuration PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Génère des exceptions en cas d'erreur
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Retourne les résultats sous forme de tableau associatif
    PDO::ATTR_EMULATE_PREPARES   => false, // Désactive l'émulation des requêtes préparées (plus sécurisé)
];

try {
    // Création de l'instance PDO (connexion à la base)
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // En cas d'erreur, on lance une exception avec le message d'erreur
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// $pdo est maintenant disponible pour effectuer des requêtes
?>
