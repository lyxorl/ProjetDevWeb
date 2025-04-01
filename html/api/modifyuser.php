<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
require_once '../db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

?>