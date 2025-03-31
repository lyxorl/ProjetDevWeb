Hello, j’ai re-uploadé toute ma branche avec les fichiers à jours.

A la racine de ma branche il y a la dernière version de la base SQL avec les mots de passe hachés en BCRYPT et la nouvelle structure des objets connectés, et une automatisation du remplissage de la table journal. Attention dans cette version la table prends un O majuscule. Si des soucis à l’importation avec les COMMENT voir avec Evan il a la parade.

Il y a le dossier html tel qu’il est chez moi pour le serveur apache. Dedans il y a :
- dashboard.html : sert a rien juste un test pour le renvoi en cas de succès d’authentification
- db_connect.php : sert à se connecter à la BDD (attention a bien mettre votre mot de passe perso pour que ca fonctionne chez vous)
- index.html qui est la page principale du site avec les boutons se connecter, s’inscrire, mais aussi une partie affichage du matériel et filtrage de ce dernier. C’est ici qu’il faudra taper pour ajouter un bouton modifier et ou supprimer en fonction du niveau de l’utilisateur.
- style.css : sert à gérer les couleurs, etc…
- test_db.php : sert à tester la connection à la BDD et affiche là où ça bloque.
- un dossier api avec :
	- login.php : sert à l’authentification de l’utilisateur
	- materiel.php : sert à récupérer les informations sur les objets connectés nottament pour l’affichage
- un dossier scripts avec :
	- app.js : contient tout mon code angular 

Il y a le dossier AIDE qui contient :
- rapport.pdf qui explique le fonctionnement pour la génération des rapports
- update_mdp_hash.php : sert à changer les mdp des utilisateurs, peut servir de base pour injection ou modif sur n’importe quelle table
