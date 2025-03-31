
-- Création de la base
DROP DATABASE IF EXISTS projet;
CREATE DATABASE projet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projet;

DROP TABLE IF EXISTS Journal;
DROP TABLE IF EXISTS Rapport;
DROP TABLE IF EXISTS objets_connectes;
DROP TABLE IF EXISTS Objets_connectes;
DROP TABLE IF EXISTS Users;

-- Table Users
CREATE TABLE Users (
    pseudo VARCHAR(50) PRIMARY KEY,
    age INT CHECK (age BETWEEN 0 AND 120),
    genre ENUM('M', 'F', 'Autre') NOT NULL,
    type ENUM('admin', 'parent', 'enfant', 'invité') NOT NULL,
    photo VARCHAR(255),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    mdp VARCHAR(255) NOT NULL COMMENT 'Stocké avec bcrypt',
    rang ENUM('simple', 'complexe', 'admin') DEFAULT 'simple',
    nb_point INT UNSIGNED DEFAULT 0,
    mail VARCHAR(100) UNIQUE NOT NULL,
    validite BOOLEAN DEFAULT FALSE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mail (mail)
) ENGINE=InnoDB;

-- Table Objets_connectes sans position
CREATE TABLE Objets_connectes (
    id_objet VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    description TEXT,
    etat ENUM('actif', 'inactif', 'erreur', 'maintenance') DEFAULT 'inactif',
    type ENUM('thermostat', 'camera', 'lumiere', 'prise', 'alarme', 'capteur') NOT NULL,
    lieu ENUM('salon', 'cuisine', 'chambre', 'salle_de_bain', 'entrée', 'garage') NOT NULL,
    mots_cles JSON,
    temperature DECIMAL(5,2) DEFAULT NULL,
    consigne DECIMAL(5,2) DEFAULT NULL,
    lim_haute DECIMAL(5,2) DEFAULT NULL,
    lim_basse DECIMAL(5,2) DEFAULT NULL,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_lieu (type, lieu),
    INDEX idx_temperature (temperature)
) ENGINE=InnoDB;

-- Table Rapport
CREATE TABLE Rapport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_ DATE NOT NULL,
    stats JSON NOT NULL,
    infos TEXT,
    id_objet VARCHAR(50),
    FOREIGN KEY (id_objet) REFERENCES Objets_connectes(id_objet) ON DELETE SET NULL,
    INDEX idx_date (date_)
) ENGINE=InnoDB;

-- Table Journal
CREATE TABLE Journal (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    date_ DATETIME DEFAULT CURRENT_TIMESTAMP,
    type_action ENUM('connexion', 'deconnexion', 'modification', 'activation', 'desactivation', 'erreur', 'reglage') NOT NULL,
    pseudo VARCHAR(50),
    id_objet VARCHAR(50),
    details JSON,
    FOREIGN KEY (pseudo) REFERENCES Users(pseudo) ON DELETE SET NULL,
    FOREIGN KEY (id_objet) REFERENCES Objets_connectes(id_objet) ON DELETE SET NULL,
    INDEX idx_date_action (date_)
) ENGINE=InnoDB;

-- Données initiales
INSERT INTO Users (pseudo, age, genre, type, nom, prenom, mdp, mail, validite, rang) VALUES 
('admin', 35, 'M', 'admin', 'Doe', 'John', '$2y$10$Vq.lPod26o0LIOJXKw0Qj.aerT1NniOhBdqia0BpY5Zw0alSivokK', 'admin@maison.com', TRUE, 'admin'),
('user1', 40, 'F', 'parent', 'Smith', 'Alice', '$2y$10$cp5riFeGyZdXVC819ccXs.YtDXYSODVLql1OoAZShGHKV2N03339i', 'alice@maison.com', FALSE, 'complexe');

INSERT INTO Objets_connectes (id_objet, nom, description, etat, type, lieu, mots_cles, temperature, consigne, lim_haute, lim_basse) VALUES
('TH-001', 'Thermostat Salon', 'Régulation température intelligente', 'actif', 'thermostat', 'salon', '["chauffage", "température", "économie"]', 21.5, 20.0, 23.0, 18.0),
('CAM-001', 'Caméra Entrée', 'Surveillance HD avec détection mouvement', 'actif', 'camera', 'entrée', '["sécurité", "mouvement", "enregistrement"]', NULL, NULL, NULL, NULL),
('TEMP-001', 'Capteur Chambre', 'Capteur température/humidité', 'actif', 'capteur', 'chambre', '["température", "humidité", "environnement"]', 19.8, NULL, NULL, NULL);

-- Triggers et procédures (version simplifiée)
DELIMITER //
CREATE TRIGGER after_temp_update
AFTER UPDATE ON Objets_connectes
FOR EACH ROW
BEGIN
    IF (NEW.temperature IS NOT NULL AND NEW.temperature != OLD.temperature) THEN
        INSERT INTO Rapport (date_, stats, id_objet)
        VALUES (
            CURRENT_DATE(),
            JSON_OBJECT(
                'type', 'temperature',
                'ancienne_valeur', OLD.temperature,
                'nouvelle_valeur', NEW.temperature,
                'unite', '°C'
            ),
            NEW.id_objet
        );
    END IF;
END//
DELIMITER ;

-- Activation de l'event scheduler
SET GLOBAL event_scheduler = ON;
