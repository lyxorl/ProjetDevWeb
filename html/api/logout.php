<?php
header("Content-Type: application/json");

// Suppression des cookies
setcookie('user_pseudo', '', time() - 3600, "/");
setcookie('user_rang', '', time() - 3600, "/");

echo json_encode(['success' => true]);
?>
