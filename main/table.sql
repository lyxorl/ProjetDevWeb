CREATE TABLE Resident(
	id INT PRIMARY KEY,
	Nom VARCHAR(20),
	Prenom VARCHAR(20));


CREATE TABLE User(
	id INT PRIMARY KEY,
	Pseudo VARCHAR(20),
    Age INT,
    Genre VARCHAR(20),
    Photo VARCHAR(20),
    Rang VARCHAR(20),
    Nom VARCHAR(20),
    Prenom VARCHAR(20),
    MDP VARCHAR(64),
    CONSTRAINT  PRIMARY KEY (Prenom,Nom),
	FOREIGN KEY fk_Resident(Prenom) REFERENCES Resident(Prenom), 
	FOREIGN KEY fk_Resident(Nom) REFERENCES Resident(Nom));

INSERT INTO Resident VALUES (1, 'TestA', 'TestA');
INSERT INTO Resident VALUES (2, 'TestB', 'TestB');
