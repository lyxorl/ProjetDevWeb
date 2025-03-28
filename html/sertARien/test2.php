<?php
require 'db_connect.php';
$test = $pdo->query("SELECT COUNT(*) FROM objets_connectes")->fetchColumn();
echo "Nombre d'objets: $test";
?>
