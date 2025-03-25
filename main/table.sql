CREATE TABLE Resident(
	id INT AUTO_INCREMENT PRIMARY KEY,
	Nom VARCHAR(20),
	Prenom VARCHAR(20));


CREATE TABLE User(
	id INT AUTO_INCREMENT PRIMARY KEY,
	Pseudo VARCHAR(20),
    Age INT,
    Genre VARCHAR(20),
    Photo VARCHAR(20),
    Rang VARCHAR(20),
    MDP VARCHAR(64), 
    idResident INT,
    FOREIGN KEY fk_Resident(idResident) REFERENCES Resident(id) ON DELETE CASCADE);

INSERT INTO Resident (Nom, Prenom) VALUES ('TestA', 'TestA');
INSERT INTO Resident (Nom, Prenom) VALUES ('TestB', 'TestB');