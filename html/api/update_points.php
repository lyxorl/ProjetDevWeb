<?php
header("Content-Type: application/json");
require_once '../db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Validation
if (!isset($data['pseudo']) || !is_numeric($data['points'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Données invalides']));
}

try {
    $pdo->beginTransaction();

    // 1. Ajout des points
    $stmt = $pdo->prepare("UPDATE Users SET nb_point = nb_point + :points WHERE pseudo = :pseudo");
    $stmt->execute([':points' => $data['points'], ':pseudo' => $data['pseudo']]);

    // 2. Lecture IMMÉDIATE des nouvelles valeurs (nécessite un commit temporaire)
    $pdo->commit();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT nb_point, rang FROM Users WHERE pseudo = :pseudo");
    $stmt->execute([':pseudo' => $data['pseudo']]);
    $user = $stmt->fetch();

    $newRank = null;
    $pointsMinimum = null;

    // 3. Application des points minimums
    if ($user['rang'] === 'admin' && $user['nb_point'] < 100) {
        $pointsMinimum = 100;
    } elseif ($user['rang'] === 'complexe' && $user['nb_point'] < 40) {
        $pointsMinimum = 40;
    }

    if ($pointsMinimum !== null) {
        $pdo->prepare("UPDATE Users SET nb_point = :points WHERE pseudo = :pseudo")
            ->execute([':points' => $pointsMinimum, ':pseudo' => $data['pseudo']]);
    }

    // 4. Vérification promotion de rang (avec les nouveaux points)
    $stmt = $pdo->prepare("SELECT nb_point, rang FROM Users WHERE pseudo = :pseudo");
    $stmt->execute([':pseudo' => $data['pseudo']]);
    $user = $stmt->fetch();

    if ($user['nb_point'] >= 100 && $user['rang'] === 'complexe') {
        $newRank = 'admin';
    } elseif ($user['nb_point'] >= 40 && $user['rang'] === 'simple') {
        $newRank = 'complexe';
    }

    if ($newRank) {
        $pdo->prepare("UPDATE Users SET rang = :rang WHERE pseudo = :pseudo")
            ->execute([':rang' => $newRank, ':pseudo' => $data['pseudo']]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'newRank' => $newRank,
        'pointsAdjusted' => ($pointsMinimum !== null)
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
