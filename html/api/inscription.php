<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../db_connect.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Configuration
define('SECRET_KEY', 'votre_cle_secrete_32_caracteres_!');
define('APP_URL', '127.0.0.1');
define('EMAIL_FROM', 'projetdevwebcytech@gmail.com');
define('EMAIL_NAME', 'Maison Connectée');
define('UPLOAD_DIR', __DIR__.'/../Users_img/');

// Fonctions utilitaires
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function generateSignedLink($pseudo, $email) {
    $data = [
        'p' => $pseudo,
        'e' => $email,
        't' => time() + 3600 // 1h expiration
    ];
    $dataString = base64_encode(json_encode($data));
    $signature = hash_hmac('sha256', $dataString, SECRET_KEY);
    return APP_URL . "/validate.html?d=$dataString&s=$signature";
}

function sendValidationEmail($email, $pseudo, $prenom) {
    $mail = new PHPMailer(true);
    $validationLink = generateSignedLink($pseudo, $email);

    try {
        // Configuration SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = EMAIL_FROM;
        $mail->Password = 'selpbuzytpgclzhq';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        // Destinataires
        $mail->setFrom(EMAIL_FROM, EMAIL_NAME);
        $mail->addAddress($email);
        $mail->addReplyTo('no-reply@maison.com', 'Ne pas répondre');

        // Contenu
        $mail->isHTML(true);
        $mail->Subject = 'Validez votre inscription à Maison Connectée';

        $mail->Body = "
            <h2>Bonjour $prenom,</h2>
            <p>Merci pour votre inscription sur notre plateforme Maison Connectée.</p>
            <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <p><a href='$validationLink' style='background:#4CAF50;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;display:inline-block;margin:15px 0;'>Activer mon compte</a></p>
            <p>Ce lien expirera dans 1 heure.</p>
            <p><small>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</small></p>
        ";

        $mail->AltBody = "Bonjour $prenom,\n\nMerci pour votre inscription. Veuillez cliquer sur ce lien pour valider votre compte :\n$validationLink\n\nCe lien expirera dans 1 heure.";

        return $mail->send();
    } catch (Exception $e) {
        error_log("Erreur d'envoi d'email: " . $e->getMessage());
        return false;
    }
}

// Traitement principal
try {
    // Récupération des données
    $json = file_get_contents('php://input');
    $data = $_POST;

    // Validation des champs obligatoires
    $requiredFields = ['pseudo', 'mdp', 'nom', 'prenom', 'mail', 'genre', 'type'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Le champ $field est requis");
        }
    }

    // Validation email
    if (!filter_var($data['mail'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Format d'email invalide");
    }

    // Traitement de la photo (si présente)
    $photoName = null;
    if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        // Vérification du type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $_FILES['photo']['tmp_name']);
        finfo_close($finfo);

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($mime, $allowedTypes)) {
            throw new Exception("Seuls les formats JPEG, PNG et GIF sont acceptés");
        }

        // Vérification de la taille (max 2MB)
        if ($_FILES['photo']['size'] > 2097152) {
            throw new Exception("La photo ne doit pas dépasser 2MB");
        }

        // Création du dossier si inexistant
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        // Génération d'un nom unique
        $extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $photoName = uniqid('user_').'.'.$extension;
        $uploadPath = UPLOAD_DIR.$photoName;

        if (!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadPath)) {
            throw new Exception("Erreur lors de l'enregistrement de la photo");
        }
    }
	else{
	$photoName = 'defaut.jpg';
	}
    
    // Hashage du mot de passe
    $hashedPassword = password_hash($data['mdp'], PASSWORD_BCRYPT);

    // Insertion en base de données
    $stmt = $pdo->prepare("
        INSERT INTO Users 
        (pseudo, nom, prenom, mail, mdp, genre, type, photo, age, rang, validite, date_creation, date_modification) 
        VALUES 
        (:pseudo, :nom, :prenom, :mail, :mdp, :genre, :type, :photo, :age, 'simple', NULL, NOW(), NOW())
    ");

    $stmt->execute([
        'pseudo' => sanitizeInput($data['pseudo']),
        'nom' => sanitizeInput($data['nom']),
        'prenom' => sanitizeInput($data['prenom']),
        'mail' => filter_var($data['mail'], FILTER_SANITIZE_EMAIL),
        'mdp' => $hashedPassword,
        'genre' => $data['genre'],
        'type' => $data['type'],
        'photo' => $photoName,
        'age' => !empty($data['age']) ? (int)$data['age'] : null
    ]);

    // Envoi de l'email de validation
    $emailSent = sendValidationEmail($data['mail'], $data['pseudo'], $data['prenom']);

    if (!$emailSent) {
        throw new Exception("L'inscription a réussi mais l'email de validation n'a pas pu être envoyé");
    }

    // Réponse JSON
    echo json_encode([
        'success' => true,
        'message' => 'Inscription réussie ! Un email de validation a été envoyé à '.$data['mail'],
        'data' => [
            'pseudo' => $data['pseudo'],
            'mail' => $data['mail']
        ]
    ]);

} catch (PDOException $e) {
    // Gestion des erreurs SQL
    $errorMessage = 'Erreur de base de données';
    if ($e->getCode() == 23000) {
        if (strpos($e->getMessage(), 'pseudo') !== false) {
            $errorMessage = 'Ce pseudo est déjà utilisé';
        } elseif (strpos($e->getMessage(), 'mail') !== false) {
            $errorMessage = 'Cet email est déjà enregistré';
        }
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $errorMessage,
        'error_code' => $e->getCode()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>