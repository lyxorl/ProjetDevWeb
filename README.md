Faut qu'on se fixe sur la manière de hash dans la bdd pour le mdp la j'ai utilisé sha2 256, si vous préférez utiliser password_hash() dite le moi je modifierai.
Sur le github j'ai mis (dans ma branche)  accueil2.html (la ou on tape logging mdp), db_connect.php (pour la connexion à la base. Attention à changer le mdp de mysql dedans. J'ai créé une base appelée projet pour y foutre mes tables.) 
Il y a un dossier api avec la page login.php (il y a des fonctions de debug dedans quisont commentées.) Et des fichiers logs pour les erreurs éventuelles.

Au fait faudra retoucher le .sql car ça créé pas une des tables ça met erreur



Je rajoute un test_db.php à la racine pour tester la connexion à la bdd. C'est utile pour voir si ça ça fonctionne déjà avant de pousser plus loin
