<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" type="text/css" href="../style.css">

</head>
<body>

<a href='index.html'>Page de Connexion (WIP)</a>
<br>  

<form action="Send_Inscription.php" method="post" enctype="multipart/form-data">
    <p class="centerW">Veuillez remplir les infos suivantes</p>
    <table class="centertable">
        <tr><td><h3>Rubrique publique : </h3></td></tr>

        <tr><td>Pseudonyme : <input type ="text" name="pseudo" required> </td></tr>
        <tr><td>Date de naissance: <input type ="date" name="date" required> </td></tr>
        <tr><td >Genre :<select name="genre" required>
        <?php
            echo "<option value='M'>M</option>";
            echo "<option value='F'>F</option>";
            echo "<option value='Autre'>Autre</option>";
        ?>
        </select></td></tr>
        <tr><td><input class="buttona"type="file" name="img" accept="image/*" required></td></tr>
        <tr><td >Role/Fonction :<select name="type" required>
        <?php
            echo "<option value='parent'>parent</option>";
            echo "<option value='enfant'>enfant</option>";
            echo "<option value='invité'>invité</option>";
        ?>
        </select></td></tr>

        <tr><td><h3>Rubrique personelle :</h3></td></tr>

        <tr><td>Nom :<input type ="text" name="nom" required> </td></tr>
        <tr><td>Prenom :<input type ="text" name="prenom" required> </td></tr>
        <tr><td>Adresse mail :<input type ="text" name="adresse" required> </td></tr>
        <tr><td>Mot de passe :<input type ="password" name="mdp" required> </td></tr>
        <tr><td><button class="button" type="submit" name="submit" value="Submit">Envoyer</button> </td></tr>
    </table>
</form>

</body>
</html>
