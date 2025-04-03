// Default export is a4 paper, portrait, using millimeters for units

angular.module('maisonConnecteeApp', [])
    .controller('MainController', function($scope, $http){
        $scope.showInscriptPopup = false;
        $scope.InscriptMsg = '';
        $scope.creation = { pseudo: '', date: '', genre: '', image: null, type: '', nom: '', prenom: '', adresse: '', mdp: '' };
        $scope.objet={nom: 'default'};
        $scope.isLoggedIn= false;
        $scope.showRapportPopup = false;
        $scope.RapportMsg = ''; 


        $scope.openInscript = function() {
            $scope.showInscriptPopup = true;
            $scope.InscriptMsg = '';
        };

        $scope.closeInscript = function() {
            $scope.showInscriptPopup = false;
            $scope.InscriptMsg = '';  
        };

        $scope.inscript = function() {
            $scope.InscriptMsg = "";
            $http.post('api/Send_Inscription.php', $scope.creation)
                .then(function(response) {
                    if (response.data.success) {
                        $scope.InscriptMsg = "Inscription réussie!";
                    } else {
                        $scope.InscriptMsg = response.data.message || 'Echec de l inscription';
                    }
                })
                .catch(function() {
                    $scope.InscriptMsg = $scope.creation;
                    
                });
        };

        $scope.openRapport = function() {
            $scope.showRapportPopup = true;
            $scope.RapportMsg = '';
        };

        $scope.closeRapport = function() {
            $scope.showRapportPopup = false;
            $scope.RapportMsg = '';  
        };

        $scope.creerRapport = function(){
            var ladate=new Date()
            const doc = new jsPDF();

            doc.text("Rapport de l'objet : "+$scope.objet.nom, 10, 10);
            doc.text("Redigé le : "+ladate.getDate()+"/"+(ladate.getMonth()+1)+"/"+ladate.getFullYear(),10,20);
            //doc.addPage(); //si on veut ajouter des pages
            /*
            var img = new Image()
            img.src = 'assets/sample.png'
            doc.addImage(img, 'png', 10, 78, 12, 15)
            */
            doc.save("Rapport_"+$scope.objet.nom+"_"+ladate.getDate()+"_"+(ladate.getMonth()+1)+"_"+ladate.getFullYear()+".pdf");
            $scope.RapportMsg = "Success";  
        }

    });
