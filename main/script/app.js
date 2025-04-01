angular.module('maisonConnecteeApp', [])
    .controller('MainController', function($scope) {
        $scope.showInscriptPopup = false;
        $scope.InscriptMsg = '';
        $scope.creation = { pseudo: '', date: '', genre: '', image: '', type: '', nom: '', prenom: '', adresse: '', mdp: '' };
        $scope.reverse = false;
        $scope.loading = true;

        $scope.openInscript = function() {
            $scope.showInscriptPopup = true;
            $scope.InscriptMsg = '';
        };

        $$scope.closeInscript = function() {
            $scope.showInscriptPopup = false;
            $scope.InscriptMsg = '';  
        };

        $scope.inscript= function() {
            $scope.InscriptMsg = '';
            $http.post('api/Send_Inscription.php',$scope.creation)
                .then(function(response) {
                    if (response.data.success) {
                        $scope.InscriptMsg = "Reussite"
                    } else {
                        $scope.InscriptMsg = response.data.message || 'Echec de lajout';
                    }
                })
                .catch(function() {
                    $scope.InscriptMsg = 'Erreur de connexion au serveur';
                    });
        };
    });
