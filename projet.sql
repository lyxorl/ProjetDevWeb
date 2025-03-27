-- Création de la base de données (à décommenter si nécessaire)
-- CREATE DATABASE IF NOT EXISTS maison_connectee;
-- USE maison_connectee;

-- Table Users
CREATE TABLE IF NOT EXISTS Users (
    pseudo VARCHAR(50) PRIMARY KEY,
    age INT,
    genre VARCHAR(50),
    type VARCHAR(50) COMMENT 'mère, père, enfant, etc.',
    photo VARCHAR(50) COMMENT 'chemin vers l\'image',
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    mdp VARCHAR(255) NOT NULL COMMENT 'Stockage haché recommandé',
    rang VARCHAR(50) DEFAULT 'simple' COMMENT 'simple/complexe/admin',
    nb_point INT DEFAULT 0,
    mail VARCHAR(50) UNIQUE NOT NULL,
    validite BOOLEAN DEFAULT FALSE COMMENT '0=non validé, 1=validé',
    INDEX idx_mail (mail)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table objets_connectes
CREATE TABLE IF NOT EXISTS objets_connectes (
    id_objet VARCHAR(50) PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    description TEXT,
    etat VARCHAR(10) DEFAULT 'inactif' COMMENT 'actif/inactif/erreur',
    type VARCHAR(20) NOT NULL COMMENT 'thermostat, caméra, etc.',
    lieu VARCHAR(20) NOT NULL COMMENT 'salon, cuisine, etc.',
    mots_cles VARCHAR(50),
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_lieu (lieu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Rapport
CREATE TABLE IF NOT EXISTS Rapport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_ DATE NOT NULL,
    stats JSON COMMENT 'Stockage structuré des statistiques',
    infos TEXT,
    id_objet VARCHAR(50),
    FOREIGN KEY (id_objet) REFERENCES objets_connectes(id_objet) ON DELETE SET NULL,
    INDEX idx_date (date_)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Journal
CREATE TABLE IF NOT EXISTS Journal (
    id VARCHAR(50) PRIMARY KEY DEFAULT UUID(),
    date_ DATETIME DEFAULT CURRENT_TIMESTAMP,
    type_action VARCHAR(50) NOT NULL COMMENT 'connexion, modification, etc.',
    pseudo VARCHAR(50),
    id_objet VARCHAR(50),
    FOREIGN KEY (pseudo) REFERENCES Users(pseudo) ON DELETE CASCADE,
    FOREIGN KEY (id_objet) REFERENCES objets_connectes(id_objet) ON DELETE SET NULL,
    INDEX idx_date_action (date_),
    INDEX idx_type_action (type_action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertion de données de test (optionnel)
INSERT INTO Users (pseudo, age, genre, type, nom, prenom, mdp, mail, validite) 
VALUES 
('admin', 30, 'M', 'admin', 'Doe', 'John', SHA2('admin123', 256), 'admin@maison.com', TRUE),
('user1', 25, 'F', 'simple', 'Smith', 'Alice', SHA2('user123', 256), 'alice@maison.com', TRUE);

INSERT INTO objets_connectes (id_objet, nom, description, etat, type, lieu, mots_cles)
VALUES
('TH-001', 'Thermostat Salon', 'Régulation température', 'actif', 'thermostat', 'salon', 'chauffage, température'),
('CAM-001', 'Caméra Entrée', 'Surveillance 1080p', 'actif', 'camera', 'entrée', 'sécurité, mouvement');

INSERT INTO Journal (type_action, pseudo, id_objet)
VALUES 
('connexion', 'admin', NULL),
('modification', 'user1', 'TH-001');
