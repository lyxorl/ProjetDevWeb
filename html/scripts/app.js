angular.module('maisonConnecteeApp', [])

.run(['$window', function($window) {
    // Initialisation correcte pour jsPDF 2.5.1
    $window.jsPDF = $window.jspdf ? $window.jspdf.jsPDF : null;
    
    // Pour debug - vérifiez que jsPDF est bien disponible
    console.log('jsPDF disponible:', !!$window.jsPDF);
}])

.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    var file = element[0].files[0];
                    modelSetter(scope, file);
                    
                    if (file && file.type.match('image.*')) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            scope.imagePreviewUrl = e.target.result;
                            scope.$apply();
                        }
                        reader.readAsDataURL(file);
                    }
                });
            });
        }
    };
}])



.controller('MainController', ['$scope','$q', '$http', '$window', '$interval', '$timeout', 
function($scope, $q, $http, $window, $interval, $timeout) {

$scope.showLoginPopup = false;
$scope.showAppareilPopup = false;
$scope.popupPosition = { top: 0, left: 0 };

  
    // Initialisations
    $scope.showLoginPopup = false;
    $scope.showRapportPopup = false;
    $scope.showRapportGlobalPopup = false;
    $scope.typeOptions = ["Alarme", "Caméra", "Capteur","Lumière", "Prise","Serrure","Thermostat","Volet"];
    $scope.isLoggedIn = false;
    $scope.selectedAppareil = null;
    $scope.selectedRang = 'simple';
    $scope.currentAccessLevel = 1;
    $scope.availableRangs = ['simple'];
    $scope.selectedUser = { pseudo: '', password: '' }
	$scope.user = { pseudo: '', password: '' };
    $scope.loginError = '';
    $scope.weatherData = null;
    $scope.objets = [];
    $scope.filtres = { lieux: [], types: [], etats: [] };
    $scope.filters = { lieu: '', type: '', etat: '', motsCles: '' };
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.sortField = 'nom';
    $scope.reverse = false;
    $scope.loading = true;
	$scope.showInscriptionPopup = false;
    $scope.inscriptionData = {
	    genre: 'M',
	    type: 'parent'
	};
	$scope.passwordStrength = 0;
	$scope.passwordStrengthColor = '#eee';
	$scope.imagePreviewUrl = null;
	$scope.inscriptionMessage = '';
	$scope.inscriptionMessageType = '';
	$scope.showRankUpPopup = false;
	$scope.newRank = '';
	$scope.showAjoutObjetPopup = false;
	$scope.showRapportPopup = false;
	$scope.showRapportGlobalPopup = false;
	$scope.rapportData = null;
	$scope.rapportGlobalData = null;
	$scope.rapportDateDebut = new Date();
	$scope.rapportDateFin = new Date();
	$scope.rapportGlobalDateDebut = new Date();
	$scope.rapportGlobalDateFin = new Date();

    $scope.userslist = [];
    $scope.popupShowModifUser = false;

	localStorage.setItem('selected_rang', 'simple');

    
// ----- GESTION DU MENU DÉROULANT POUR LES NIVEAUX

	// Niveaux d'accès
	    $scope.accessLevels = {
		   simple: 1,
		   complexe: 2,
		   admin: 3
	    };
//---------------
		// Nouvelle fonction pour gérer le rang
	function getSelectedRang() {
	    return localStorage.getItem('selected_rang') || 'simple';
	}

	function setSelectedRang(rang) {
	    localStorage.setItem('selected_rang', rang);
	    console.log('Rang sauvegardé:', rang);
	}

//----------------
    // RANG DISPONIBLES 
    $scope.updateAvailableRangs = function() {
        if (!$scope.currentUser) {
            $scope.availableRangs = ['simple'];
            return;
        }

        const userRang = $scope.currentUser.rang;
        $scope.availableRangs = ['simple'];

        if (userRang === 'complexe' || userRang === 'admin') {
            $scope.availableRangs.push('complexe');
        }
        if (userRang === 'admin') {
            $scope.availableRangs.push('admin');
        }
    };

    
    // MAJ RANG SUITE AU CHOIX
    $scope.updateAccessLevel = function() {
	    // Récupère la valeur DIRECTEMENT depuis le DOM
	    const selectElement = document.querySelector('[ng-model="selectedRang"]');
	    const domValue = selectElement ? selectElement.value : $scope.selectedRang;
	    
	    // Nettoie la valeur si c'est un objet String
	    const cleanValue = domValue && domValue.toString().replace('string:', '');
	    
	    // Validation finale
	    if (!cleanValue || !$scope.availableRangs.includes(cleanValue)) {
		   console.warn('Valeur invalide, réinitialisation à simple');
		   $scope.selectedRang = 'simple';
	    } else {
		   $scope.selectedRang = cleanValue;
	    }
	    
	    // Sauvegarde
	    localStorage.setItem('selected_rang', $scope.selectedRang);
	    $scope.currentAccessLevel = $scope.accessLevels[$scope.selectedRang];
	    
	    console.log('Mise à jour FINALE - DOM:', domValue, 
		          'Scope:', $scope.selectedRang, 
		          'Niveau:', $scope.currentAccessLevel);
	    
	    // Force la cohérence DOM/Scope
	    $timeout(() => {
		   if (selectElement) {
		       selectElement.value = $scope.selectedRang;
		   }
	    });
	};
    
    

    // GESTION INITIALE DES VALEURS
    function checkAuth() {
	    const pseudo = localStorage.getItem('user_pseudo');
	    const rang = localStorage.getItem('user_rang');
	    
	    if (pseudo && rang) {
		   $scope.isLoggedIn = true;
		   $scope.currentUser = { pseudo, rang };
		   
		   // Récupère et nettoie la valeur
		   let selectedRang = localStorage.getItem('selected_rang') || rang;
		   selectedRang = selectedRang.toString().replace('string:', '');
		   
		   if (!$scope.availableRangs.includes(selectedRang)) {
		       selectedRang = 'simple';
		   }
		   
		   $scope.selectedRang = selectedRang;
		   $scope.updateAvailableRangs();
		   affichageProfile(); // in checkAuth function
		   console.log('Connexion - Rang final:', $scope.selectedRang);
	    }
	}
	

    // Logout
    $scope.logout = function() {
        $http.post('api/logout.php')
            .finally(function() {
                localStorage.removeItem('user_pseudo');
        		localStorage.removeItem('user_rang');
				localStorage.removeItem('selected_rang');
                $scope.isLoggedIn = false;
                //$scope.currentUser = null;
                checkAuth(); // Rafraîchit l'état
            });
    };

    

// ----- GESTION CONNEXION

    $scope.openLogin = function() {
        $scope.showLoginPopup = true;
        $scope.loginError = '';
        $scope.user = { pseudo: '', password: '' };
    };

    $scope.closeLogin = function() {
        $scope.showLoginPopup = false;
        $scope.loginError = '';
        $scope.user = { pseudo: '', password: '' };
    };

    $scope.login = function() {
        $scope.loginError = '';
        $http.post('api/login.php', $scope.user)
            .then(function(response) {
                if (response.data.success) {
                    $scope.showLoginPopup = false;
                    localStorage.setItem('user_pseudo', response.data.pseudo);
                	localStorage.setItem('user_rang', response.data.rang);
					$scope.currentUser = {
						pseudo: response.data.pseudo,
						rang: response.data.rang
					};
					
					// 1. Fermer le popup immédiatement
					$scope.showLoginPopup = false;
					
					// 2. Ajouter les points après la connexion (délai de 500ms)
					$timeout(function() {
						$scope.addPoints(1).catch(function(error) {
							console.error("Erreur ajout points:", error);
						});
					}, 500);
                    checkAuth();
                } else {
                    $scope.loginError = response.data.message || 'Identifiants incorrects';
                }
            })
            .catch(function() {
                $scope.loginError = 'Erreur de connexion au serveur';
            	});
    };


// ------ Météo

const apiKey = '0042905619163fc9e31183aef7b25ae5';

function getWeather(lat, lon) {
    $http.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`)
        .then(function(response) {
            $scope.weatherData = {
                city: response.data.name,
                iconUrl: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
                temperature: Math.round(response.data.main.temp),
                description: response.data.weather[0].description,
                windSpeed: response.data.wind.speed,
                humidity: response.data.main.humidity
            };
        })
        .catch(function() {
            $scope.weatherData = {
                city: "Localisation indisponible",
                temperature: "--",
                description: "Service météo indisponible"
            };
        });
}

		// Version avec Cergy comme lieu fixe
		$scope.refreshWeather = function() {
		    // Coordonnées GPS de Cergy, France
		    const fixedLat = 49.0363;  // Latitude de Cergy
		    const fixedLon = 2.0761;   // Longitude de Cergy
		    
		    getWeather(fixedLat, fixedLon);
		};

		// Appeler refreshWeather au chargement
		
		$scope.refreshWeather();
    var weatherInterval = $interval($scope.refreshWeather, 1800000);
    checkAuth();
    $interval(checkAuth, 300000);

    $scope.$on('$destroy', function() {
        $interval.cancel(weatherInterval);
    });




// GESTION INVENTAIRE MATERIEL

    $scope.resetFilters = function() {
        $scope.filters = { lieu: '', type: '', etat: '', motsCles: '' };
        $scope.currentPage = 0;
    };

    $scope.customFilter = function(objet) {
    return (
        (!$scope.filters.lieu || objet.lieu === $scope.filters.lieu) &&
        (!$scope.filters.type || objet.type === $scope.filters.type) &&
        (!$scope.filters.etat || objet.etat === $scope.filters.etat) &&
        (!$scope.filters.motsCles || 
            (objet.mots_cles && objet.mots_cles.toLowerCase().includes($scope.filters.motsCles.toLowerCase())) ||
            (objet.nom && objet.nom.toLowerCase().includes($scope.filters.motsCles.toLowerCase())) ||
            (objet.description && objet.description.toLowerCase().includes($scope.filters.motsCles.toLowerCase()))
    ));
	};

    $scope.sortBy = function(field) {
        $scope.reverse = ($scope.sortField === field) ? !$scope.reverse : false;
        $scope.sortField = field;
    };

    $scope.numberOfPages = function() {
        return Math.ceil($scope.filteredObjets.length / $scope.pageSize);
    };

    // Initialisation
    $http.get('api/materiels.php')
        .then(function(response) {
            $scope.objets = response.data.materiels;
            $scope.filtres = response.data.filtres;
            $scope.loading = false;
        })
        .catch(function(error) {
            console.error('Erreur inventaire:', error);
            $scope.loading = false;
        });

       
// --- POPUP VISUALISER MATERIEL

	$scope.openAppareilPopup = function(objet) {
	    if (!$scope.isLoggedIn) return;
	    
	    $scope.selectedAppareil = angular.copy(objet);
	    $scope.selectedAppareil.lim_basse = parseFloat(objet.lim_basse);
	    $scope.selectedAppareil.lim_haute = parseFloat(objet.lim_haute);
	    $scope.selectedAppareil.newConsigne = parseFloat(objet.consigne) || $scope.selectedAppareil.lim_basse;
	    $scope.showAppareilPopup = true;
	    
	    $http.get('api/materiels.php').then(function(response) {
		    console.log("Données reçues:", response.data);
		    // Doit montrer id_objet comme chaîne (ex: "a1b2c3", pas 123)
		});
	    
	    
	};

	$scope.closePopup = function() {
	    $scope.showAppareilPopup = false;
	    $scope.selectedAppareil = null;
	};
	
// ---- pour modifier dans popup
     // ETAT
	$scope.toggleEtat = function() {
	    if (!$scope.selectedAppareil || !$scope.selectedAppareil.id_objet) {
		   console.error("ID objet manquant ou invalide");
		   return;
	    }

		var nouvelEtat = $scope.selectedAppareil.etat === 'Actif' ? 'Inactif' : 'Actif';
	    
	    $http.post('api/update_etat.php', {
		   id_objet: $scope.selectedAppareil.id_objet,  // On envoie tel quel sans conversion
		   etat: nouvelEtat
	    }).then(function(response) {
		   if (response.data.success) {
		       $scope.selectedAppareil.etat = nouvelEtat;
		       updateListeObjets($scope.selectedAppareil.id_objet, nouvelEtat);
		   } else {
		       console.error("Erreur serveur:", response.data.message);
		   }
	    }).catch(function(error) {
		   console.error("Erreur HTTP:", error);
	    });
	};

	// MAJ DIRECTE
	function updateListeObjets(id_objet, nouvelEtat) {
	    angular.forEach($scope.objets, function(obj) {
		   if (obj.id_objet === id_objet) {  // Comparaison directe des chaînes
		       obj.etat = nouvelEtat;
		   }
	    });
	}


	//CONSIGNE
	$scope.updateConsigne = function() {
	    // Récupération de la valeur
	    const newConsigne = $scope.selectedAppareil.newConsigne;
	     
	     // Récupération des limites
	    const limBasse = parseFloat($scope.selectedAppareil.lim_basse);
	    const limHaute = parseFloat($scope.selectedAppareil.lim_haute);
	    
	    // Validation du type
	    if (newConsigne === null || newConsigne === undefined || newConsigne === '') {
		   alert(`Veuillez saisir un nombre entre ${limBasse}°C et ${limHaute}°C, il doit être un multiple de 0.5 (ex: 19, 19.5 ou 20)`);
		   return;
	    }
	    
	    // Conversion en nombre
	    const numericValue = Number(newConsigne);
	    	    
	    // Envoi au serveur
	    $http.post('api/update_consigne.php', {
		   id_objet: $scope.selectedAppareil.id_objet,
		   consigne: numericValue
	    }).then(function(response) {
		   if (response.data.success) {
		       $scope.selectedAppareil.consigne = numericValue;
		       $scope.selectedAppareil.newConsigne = numericValue;
		   }
	    }).catch(function(error) {
		   console.error("Erreur:", error);
		   alert("Erreur serveur lors de la mise à jour");
	    });
	};
	
	//LIM BASSE

	$scope.updateLimBasse = function() {
	    // Récupération de la valeur
	    const newLimBasse = $scope.selectedAppareil.newLimBasse;
	    const currentLimHaute = parseFloat($scope.selectedAppareil.lim_haute);
	    // Validation de base
	    if (newLimBasse === null || newLimBasse === undefined || newLimBasse === '') {
		   alert(`Veuillez saisir un nombre entre 16°C et ${currentLimHaute}°C, il doit être un multiple de 0.5 (ex: 19, 19.5 ou 20)`);
		   return;
	    }
	    
	    // Conversion en nombre
	    const numericValue = Number(newLimBasse);
	    
	       
	    // Validation par rapport à lim_haute
	    
	    if (numericValue > currentLimHaute) {
		   alert("La limite basse doit être inférieure à la limite haute (" + currentLimHaute + ")");
		   return;
	    }
	    
	    // Envoi au serveur
	    $http.post('api/update_limite_basse.php', {
		   id_objet: $scope.selectedAppareil.id_objet,
		   lim_basse: numericValue
	    }).then(function(response) {
		   if (response.data.success) {
		       // Mise à jour de la limite basse
		       $scope.selectedAppareil.lim_basse = numericValue;
		       
		       // Vérification si la consigne actuelle est inférieure à la nouvelle limite basse
		       const currentConsigne = parseFloat($scope.selectedAppareil.consigne);
		       if (currentConsigne < numericValue) {
		           // Mise à jour de la consigne
		           $scope.selectedAppareil.consigne = numericValue;
		           $scope.selectedAppareil.newConsigne = numericValue;
		           
		           // Mise à jour en base de données
		           $http.post('api/update_consigne.php', {
		               id_objet: $scope.selectedAppareil.id_objet,
		               consigne: numericValue
		           }).then(function(response) {
		               if (!response.data.success) {
		                   console.error("Échec de la mise à jour de la consigne");
		               }
		           });
		       }
		       
		       alert("Limite basse mise à jour avec succès");
		   }
	    }).catch(function(error) {
		   console.error("Erreur:", error);
		   alert("Erreur serveur lors de la mise à jour");
	    });
	};


	//LIM HAUTE

	$scope.updateLimHaute = function() {
	    // Récupération de la valeur
	    const newLimHaute = $scope.selectedAppareil.newLimHaute;
	    const currentLimBasse = parseFloat($scope.selectedAppareil.lim_basse);
	    // Validation de base
	    if (newLimHaute === null || newLimHaute === undefined || newLimHaute === '') {
		   alert(`Veuillez saisir un nombre entre ${currentLimBasse}°C et 27°C, il doit être un multiple de 0.5 (ex: 19, 19.5 ou 20)`);
		   return;
	    }
	    
	    // Conversion en nombre
	    const numericValue = Number(newLimHaute);
	    
	       
	    // Validation par rapport à lim_basse
	    
	    if (numericValue < currentLimBasse) {
		   alert("La limite haute doit être supérieure à la limite basse (" + currentLimBasse + ")");
		   return;
	    }
	    
	    // Envoi au serveur
	    $http.post('api/update_limite_haute.php', {
		   id_objet: $scope.selectedAppareil.id_objet,
		   lim_haute: numericValue
	    }).then(function(response) {
		   if (response.data.success) {
		       // Mise à jour de la limite haute
		       $scope.selectedAppareil.lim_haute = numericValue;
		       
		       // Vérification si la consigne actuelle est supérieure à la nouvelle limite haute
		       const currentConsigne = parseFloat($scope.selectedAppareil.consigne);
		       if (currentConsigne > numericValue) {
		           // Mise à jour de la consigne
		           $scope.selectedAppareil.consigne = numericValue;
		           $scope.selectedAppareil.newConsigne = numericValue;
		           
		           // Mise à jour en base de données
		           $http.post('api/update_consigne.php', {
		               id_objet: $scope.selectedAppareil.id_objet,
		               consigne: numericValue
		           }).then(function(response) {
		               if (!response.data.success) {
		                   console.error("Échec de la mise à jour de la consigne");
		               }
		           });
		       }
		       
		       alert("Limite haute mise à jour avec succès");
		   }
	    }).catch(function(error) {
		   console.error("Erreur:", error);
		   alert("Erreur serveur lors de la mise à jour");
	    });
	};

//------- SUPPRIMER MATERIEL ----

	// Fonction de confirmation de suppression
	$scope.confirmDelete = function() {
	    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce matériel ?")) {
		    $scope.deleteMaterial();
	    }
	};

	

	// Fonction de suppression effective
	$scope.deleteMaterial = function() {
	    if (!$scope.selectedAppareil || !$scope.selectedAppareil.id_objet) {
		    console.error("Aucun matériel sélectionné ou ID manquant");
		    return;
	    }
	    
	    $http.post('api/delete_material.php', {
		    id_objet: $scope.selectedAppareil.id_objet
	    }).then(function(response) {
	    		console.log("Réponse serveur:", response.data);
		    if (response.data.success) {
		       // Supprime de la liste locale
		        $scope.objets = $scope.objets.filter(function(obj) {
		            return obj.id_objet !== $scope.selectedAppareil.id_objet;
		        });
		        
		       // Ferme le popup
		        $scope.closePopup();
		        alert("Matériel supprimé avec succès");
		    } else {
		        alert("Erreur lors de la suppression : " + (response.data.message || 'Erreur inconnue'));
		    }
	    }).catch(function(error) {
		    console.error("Erreur complète:", error);
		    if (error.data) {
		        console.error("Détails erreur:", error.data);
		    }
        	    alert("Erreur serveur lors de la suppression. Voir la console pour plus de détails.");
    });
};



	
// ------- UTILISATEURS ----

	// -------------- Liste des users et modification du profil --------------

    function affichageProfile(){
        var urlParams = new URLSearchParams(window.location.search);
        var pseudostr = urlParams.get('pseudo');

        if ($scope.isLoggedIn) {
            // faire la recup de l'utilisateur
            $http.post('api/getuser.php', {pseudo : localStorage.getItem('user_pseudo')}).then(function(response){
                if (response.data.success) {
                   
                    $scope.user = response.data.data;
                    $scope.user.photo='Users_img/'+$scope.user.photo;
                } else {
					console.error("Erreur lors du chargement du profile :", error);
                    //$window.location.href = 'index.html';
                }
            }, function(error) {
                console.error("Erreur lors du chargement du profile :", error);
                //$window.location.href = 'index.html';
            });
        }
    }

    $scope.loadProfile = function() {
        affichageProfile();
    };

    $scope.updateProfile = function() {
        // faire la recup de l'user
        $http.post('api/modifyuser.php', $scope.user).then(function(response) {
            $scope.message = "Profil mis à jour avec succès";
        }, function(error) {
            console.error("Erreur lors de la mise à jour du profil", error);
            $scope.message = "Erreur lors de la mise à jour du profil";
        });

        $scope.popupShowModifUser = false; //ferme la page lors de la mis a jour
    };

    $scope.openModifProfile = function(user) {
	    // Fait une copie profonde de l'utilisateur
	    $scope.selectedUser = angular.copy(user);
	    // Ajoute le chemin complet de la photo si elle existe
	    if ($scope.selectedUser.photo) {
		   $scope.selectedUser.photo = 'Users_img/' + $scope.selectedUser.photo;
	    }
	    $scope.popupShowModifUser = true;
	};

	$scope.closeModifUser = function() { // chuis trop con ya un nom different entre user et profile
		// faudrat que je fasse le menage
		$scope.popupShowModifUser = false;
    };

    $http.get('api/users.php')
        .then(function(response) {
            $scope.userslist = response.data.users;
        })
        .catch(function(error) {
            
            console.error('Erreur lors de la recuperation des users:', error);
            $scope.loading = false;
        });

	$scope.validateUser = function(userselect) {
		userselect.validite = 1-userselect.validite;
		$http.post('api/modifyuser_validite.php', userselect).then(function(response) {

            $scope.message = "Profil mis à jour avec succès";
        }, function(error) {
            console.error("Erreur lors de la mise à jour du profil", error);
            $scope.message = "Erreur lors de la mise à jour du profil";
        });
	}

	$scope.condVisualizeProfile = function(user){
		return user == localStorage.getItem('user_pseudo');
	}
	
	
	$scope.confirmDeleteUser = function(user) {
	    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?")) {
		    $http.post('api/delete_user.php', user).then (function(response) {
			if (response.data.success) {
				$scope.userslist = $scope.userslist.filter(function(obj) {
					return obj.pseudo !== user.pseudo;
				});
				$scope.closeModifUser();
				alert("Utilisateur supprimé avec succès");
			}
		    },function(error) {
            console.error("Erreur lors de la supression de l'user", error);
            $scope.message = "Erreur lors de la supression de l'user";
        });
	    }
	};


// -------------- RAPPORT --------------
$scope.RapportMsg = '';
	$scope.creerRapport = function() {
    try {
        // 1. Vérification des prérequis
        if (!$scope.selectedAppareil) {
            throw new Error("Aucun appareil sélectionné");
        }
        
       // Vérification plus robuste de la disponibilité de jsPDF
        const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
        if (!jsPDF) {
            throw new Error("La bibliothèque jsPDF n'est pas chargée correctement");
        }

        // 2. Initialisation
        const doc = new jsPDF();
        const ladate = new Date();
        let positionY = 20; // Position verticale initiale

        // 3. En-tête du document
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text(`Rapport pour ${$scope.selectedAppareil.nom} (ID: ${$scope.selectedAppareil.id_objet})`, 10, 15);
        
        doc.setFontSize(10);
        doc.text(`Généré le ${ladate.toLocaleDateString()} à ${ladate.toLocaleTimeString()}`, 10, positionY);
        positionY += 10;

        // 4. Section Informations de base
        doc.setFontSize(14);
        doc.text("Informations de l'appareil :", 10, positionY);
        positionY += 8;
        
        doc.setFontSize(12);
        const infosBase = [
            `Type: ${$scope.selectedAppareil.type}`,
            `État: ${$scope.selectedAppareil.etat}`,
            `Emplacement: ${$scope.selectedAppareil.lieu}`
        ];
        
        infosBase.forEach(info => {
            doc.text(info, 14, positionY);
            positionY += 7;
        });

        // 5. Section spécifique pour les thermostats
        if ($scope.selectedAppareil.type === 'Thermostat') {
            positionY += 3;
            doc.text("Paramètres thermiques :", 14, positionY);
            positionY += 7;
            
            const infosThermo = [
                `Température actuelle: ${$scope.selectedAppareil.temperature || 'N/A'}°C`,
                `Consigne: ${$scope.selectedAppareil.consigne || 'N/A'}°C`,
                `Plage: ${$scope.selectedAppareil.lim_basse || 'N/A'}°C - ${$scope.selectedAppareil.lim_haute || 'N/A'}°C`
            ];
            
            infosThermo.forEach(info => {
                doc.text(info, 18, positionY);
                positionY += 7;
            });
        }

        // 6. Section Statistiques (si rapportData existe)
        if ($scope.rapportData) {
            positionY += 5;
            doc.setFontSize(14);
            doc.text("Statistiques d'utilisation :", 10, positionY);
            positionY += 8;
            
            doc.setFontSize(12);
            const stats = [
                `Consommation totale: ${$scope.rapportData.consoTotale.toFixed(2)} kWh`,
                `Durée totale ON: ${$scope.rapportData.dureeTotale.toFixed(2)} heures`,
                `Consommation moyenne: ${$scope.rapportData.consoMoyenne.toFixed(2)} W/h`
            ];
            
            stats.forEach(stat => {
                doc.text(stat, 14, positionY);
                positionY += 7;
            });
        }

        // 7. Génération du fichier
        const fileName = `Rapport_${$scope.selectedAppareil.id_objet}_${ladate.getFullYear()}${(ladate.getMonth()+1).toString().padStart(2, '0')}${ladate.getDate().toString().padStart(2, '0')}.pdf`;
        doc.save(fileName);
        
        $scope.RapportMsg = "success";
        console.log("PDF généré avec succès :", fileName);
    } catch (error) {
        console.error("Erreur lors de la génération du PDF :", error);
        alert(`Erreur lors de la génération du PDF : ${error.message}`);
        $scope.RapportMsg = "error";
    }
};

	$scope.RapportMsgG = ''; 
	$scope.creerRapportGlobal = function() {
    try {
        // 1. Calculer les données si nécessaire
        if (!$scope.rapportGlobalData) {
            $scope.calculateRapportGlobal();
            return; // La fonction sera rappelée après le calcul
        }

        // 2. Initialisation PDF
        const doc = new jsPDF();
        const ladate = new Date();
        let positionY = 20;

        // 3. En-tête
        doc.setFontSize(16);
        doc.text("Rapport Global", 10, 10);
        doc.setFontSize(10);
        doc.text(`Généré le ${ladate.getDate()}/${ladate.getMonth()+1}/${ladate.getFullYear()}`, 10, 16);

        // 4. Données principales
        doc.setFontSize(12);
        doc.text("Consommation totale: " + $scope.rapportGlobalData.consoTotale.toFixed(2) + " kWh", 10, positionY);
        positionY += 8;
        
        if ($scope.rapportGlobalData.appareilPlusConsommateur) {
            doc.text("Appareil le plus consommateur: " + 
                   $scope.rapportGlobalData.appareilPlusConsommateur.nom + " (" + 
                   $scope.rapportGlobalData.appareilPlusConsommateur.conso.toFixed(2) + " kWh)", 
                   10, positionY);
            positionY += 8;
        }

        // 5. Tableau des appareils
        doc.setFontSize(14);
        doc.text("Détails par appareil:", 10, positionY);
        positionY += 10;
        
        $scope.rapportGlobalData.detailsAppareils.forEach(appareil => {
            if (positionY > 280) { // Nouvelle page si nécessaire
                doc.addPage();
                positionY = 20;
            }
            
            doc.text(`${appareil.nom} (${appareil.type}): ` +
                    `${appareil.conso.toFixed(2)} kWh, ` +
                    `${appareil.duree.toFixed(2)} heures`, 
                    10, positionY);
            positionY += 8;
        });

        // 6. Sauvegarde
        const fileName = `Rapport_Global_${ladate.getDate()}_${ladate.getMonth()+1}_${ladate.getFullYear()}.pdf`;
        doc.save(fileName);
        
        $scope.RapportMsgG = "success";
    } catch (error) {
        console.error("Erreur génération PDF:", error);
        $scope.RapportMsgG = "error";
        alert("Erreur lors de la génération du PDF: " + error.message);
    }
};

	$scope.openRapportPopup = function(objet) {
	    if (!window.jspdf) {
		   alert("La bibliothèque PDF n'est pas encore chargée. Veuillez réessayer dans quelques secondes.");
		   return;
	    }
	    $scope.selectedAppareil = objet;
		console.log(objet);
	    $scope.showRapportPopup = true;
	    $scope.rapportDateDebut = new Date(new Date().setDate(new Date().getDate() - 7)); // 7 derniers jours par défaut
	    $scope.rapportDateFin = new Date();
	    $scope.calculateRapport();
	};

	// Fermer le rapport
	$scope.closeRapportPopup = function() {
	    $scope.showRapportPopup = false;
	    $scope.rapportData = null;
	};



// Ouvrir le rapport global
$scope.openRapportGlobalPopup = function() {
    $scope.showRapportGlobalPopup = true;
    $scope.rapportGlobalDateDebut = new Date(new Date().setMonth(new Date().getMonth() - 1)); // 1 mois par défaut
    $scope.rapportGlobalDateFin = new Date();
    $scope.calculateRapportGlobal();
};

// Fermer le rapport global
$scope.closeRapportGlobalPopup = function() {
    $scope.showRapportGlobalPopup = false;
    $scope.rapportGlobalData = null;
};

// Calculer le rapport pour un appareil
$scope.calculateRapport = function() {
    if (!$scope.selectedAppareil) return;
    
    $http.get('api/journal.php?objet=' + $scope.selectedAppareil.id_objet)
        .then(function(response) {
            const events = response.data;
            let consoTotale = 0;
            let dureeTotale = 0;
            let currentState = null;
            let startTime = null;
            
            const dateDebut = new Date($scope.rapportDateDebut);
            const dateFin = new Date($scope.rapportDateFin);
            
            // Filtrer les événements dans la période
            const filteredEvents = events.filter(event => {
                const eventDate = new Date(event.date_);
                return eventDate >= dateDebut && eventDate <= dateFin;
            });
            
            // Calculer la consommation
            filteredEvents.forEach(event => {
                const eventDate = new Date(event.date_);
                const details = JSON.parse(event.details);
                
                if (details.etat === 'ON') {
                    currentState = 'ON';
                    startTime = eventDate;
                } else if (details.etat === 'OFF' && currentState === 'ON' && startTime) {
                    const durationHours = (eventDate - startTime) / (1000 * 60 * 60);
                    dureeTotale += durationHours;
                    consoTotale += durationHours * (details.conso || $scope.selectedAppareil.conso || 0);
                    currentState = 'OFF';
                }
            });
            
            // Si l'appareil est toujours ON à la fin de la période
            if (currentState === 'ON' && startTime) {
                const durationHours = (dateFin - startTime) / (1000 * 60 * 60);
                dureeTotale += durationHours;
                consoTotale += durationHours * ($scope.selectedAppareil.conso || 0);
            }
            
            $scope.rapportData = {
                consoTotale: consoTotale / 1000, // Convertir en kWh
                dureeTotale: dureeTotale,
                consoMoyenne: (consoTotale / dureeTotale) || 0,
                evenements: filteredEvents
            };
        });
};

// Calculer le rapport global
$scope.calculateRapportGlobal = function() {
    $http.get('api/materiels.php')
        .then(function(response) {
            const appareils = response.data.materiels;
            const dateDebut = new Date($scope.rapportGlobalDateDebut);
            const dateFin = new Date($scope.rapportGlobalDateFin);
            
            let consoTotale = 0;
            let detailsAppareils = [];
            let appareilPlusConsommateur = { nom: '', conso: 0 };
            
            // Créer un tableau de promesses pour chaque appareil
            var promises = appareils.map(function(appareil) {
                return $http.get('api/journal.php?objet=' + appareil.id_objet)
                    .then(function(journalResponse) {
                        const events = journalResponse.data;
                        let consoAppareil = 0;
                        let dureeAppareil = 0;
                        let currentState = null;
                        let startTime = null;
                        
                        events.forEach(event => {
                            const eventDate = new Date(event.date_);
                            if (eventDate >= dateDebut && eventDate <= dateFin) {
                                const details = JSON.parse(event.details);
                                
                                if (details.etat === 'ON') {
                                    currentState = 'ON';
                                    startTime = eventDate;
                                } else if (details.etat === 'OFF' && currentState === 'ON' && startTime) {
                                    const durationHours = (eventDate - startTime) / (1000 * 60 * 60);
                                    dureeAppareil += durationHours;
                                    consoAppareil += durationHours * (details.conso || appareil.conso || 0);
                                    currentState = 'OFF';
                                }
                            }
                        });
                        
                        // Si l'appareil est toujours ON à la fin de la période
                        if (currentState === 'ON' && startTime) {
                            const durationHours = (dateFin - startTime) / (1000 * 60 * 60);
                            dureeAppareil += durationHours;
                            consoAppareil += durationHours * (appareil.conso || 0);
                        }
                        
                        consoAppareil = consoAppareil / 1000; // Convertir en kWh
                        
                        return {
                            appareil: appareil,
                            conso: consoAppareil,
                            duree: dureeAppareil
                        };
                    });
            });
            
            // Quand toutes les promesses sont résolues
            $q.all(promises).then(function(results) {
                results.forEach(function(result) {
                    consoTotale += result.conso;
                    
                    detailsAppareils.push({
                        nom: result.appareil.nom,
                        type: result.appareil.type,
                        conso: result.conso,
                        duree: result.duree
                    });
                    
                    if (result.conso > appareilPlusConsommateur.conso) {
                        appareilPlusConsommateur = {
                            nom: result.appareil.nom,
                            conso: result.conso
                        };
                    }
                });
                
                $scope.rapportGlobalData = {
                    consoTotale: consoTotale,
                    appareilPlusConsommateur: appareilPlusConsommateur,
                    detailsAppareils: detailsAppareils
                };
            });
        });
};
	// -------------- POPUP INSCRIPTION --------------
	
    $scope.openInscriptionPopup = function() {
	    $scope.showInscriptionPopup = true;
	    $scope.inscriptionData = {
		   genre: 'M',
		   type: 'parent'
	    };
	    $scope.passwordStrength = 0;
	    $scope.passwordStrengthColor = '#eee';
	    $scope.imagePreviewUrl = null;
	    $scope.inscriptionMessage = '';
	};

	$scope.closeInscriptionPopup = function() {
	    $scope.showInscriptionPopup = false;
	};

	// Normalisation du prénom
	$scope.normalizePrenom = function() {
	    if ($scope.inscriptionData.prenom) {
		   $scope.inscriptionData.prenom = $scope.inscriptionData.prenom
		       .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
		       .replace(/[^a-zA-Z\- ]/g, "");
	    }
	};

	// Force du mot de passe
	$scope.updatePasswordStrength = function() {
	    if (!$scope.inscriptionData.mdp) {
		   $scope.passwordStrength = 0;
		   return;
	    }
	    
	    var strength = 0;
	    var length = $scope.inscriptionData.mdp.length;
	    
	    strength += Math.min(length / 12 * 50, 50);
	    
	    if (/[A-Z]/.test($scope.inscriptionData.mdp)) strength += 10;
	    if (/[0-9]/.test($scope.inscriptionData.mdp)) strength += 20;
	    if (/[^A-Za-z0-9]/.test($scope.inscriptionData.mdp)) strength += 20;
	    
	    $scope.passwordStrength = Math.min(strength, 100);
	    
	    if ($scope.passwordStrength < 30) {
		   $scope.passwordStrengthColor = '#ff0000';
	    } else if ($scope.passwordStrength < 70) {
		   $scope.passwordStrengthColor = '#ffcc00';
	    } else {
		   $scope.passwordStrengthColor = '#00cc00';
	    }
	};

	// Soumission du formulaire
	$scope.submitInscriptionForm = function() {
	    // Vérification du formulaire
	    if (!$scope.inscriptionData.pseudo || !$scope.inscriptionData.mdp || 
	        !$scope.inscriptionData.mail || !$scope.inscriptionData.nom || 
	        !$scope.inscriptionData.prenom) {
	        $scope.inscriptionMessage = 'Tous les champs obligatoires doivent être remplis';
	        $scope.inscriptionMessageType = 'error';
	        return;
	    }

	    // Préparation des données
	    var formData = new FormData();
	    angular.forEach($scope.inscriptionData, function(value, key) {
	        if (value !== undefined && value !== null) {
	            formData.append(key, value);
	        }
	    });
	    
	    // Ajout de la photo si elle existe
	    if ($scope.inscriptionData.photo) {
		   formData.append('photo', $scope.inscriptionData.photo);
	    }

	    // Envoi au serveur
	    $http.post('api/inscription.php', formData, {
	        transformRequest: angular.identity,
	        headers: {'Content-Type': undefined}
	    }).then(function(response) {
	        $scope.inscriptionMessage = response.data.message;
	        $scope.inscriptionMessageType = response.data.success ? 'success' : 'error';
	        
	        if (response.data.success) {
	            // Affiche un message plus complet
	            $scope.inscriptionMessage = 'Inscription réussie ! Un email de validation a été envoyé à ' + 
	                                        $scope.inscriptionData.mail +
	                                        '. Veuillez vérifier votre boîte mail.';
	            
	            
	        }
	    }).catch(function(error) {
	        var errorMsg = 'Erreur lors de l\'inscription';
	        if (error.data && error.data.message) {
	            if (error.data.message.includes('pseudo')) {
	                errorMsg = 'Ce pseudo est déjà utilisé';
	            } else if (error.data.message.includes('mail')) {
	                errorMsg = 'Cet email est déjà enregistré';
	            } else {
	                errorMsg = error.data.message;
	            }
	        }
	        $scope.inscriptionMessage = errorMsg;
	        $scope.inscriptionMessageType = 'error';
	    });
	};

	// ----------- AJOUT POINTS ET NIVEAUX --------------

	$scope.addPoints = function(pointsToAdd) {
		$http.post('api/update_points.php', {
		  pseudo: $scope.currentUser.pseudo,
		  points: pointsToAdd
		}).then(function(response) {
		  if (response.data.newRank) {
		   $scope.currentUser.rang = response.data.newRank;
		   $scope.updateAvailableRangs();
		   
		   // Affiche la notification de changement de rang
		   $scope.showRankUpNotification(response.data.newRank);
		  }
		}).catch(function(error) {
		  console.error("Erreur:", error);
		});
  };

  // POPUP changement rang

  $scope.showRankUpNotification = function(rank) {
		$scope.newRank = rank;
		$scope.showRankUpPopup = true;
		
		// Ferme automatiquement après 5 secondes
		$timeout(function() {
		  $scope.showRankUpPopup = false;
		}, 4000);
  };
  


// --------------------- AJOUT MATERIEL ------------------
    
    // Gestion du popup d'ajout
	$scope.showAjoutObjetPopup = false;
	$scope.nouvelObjet = {
	    etat: 'Actif'
	};

	$scope.openAjoutObjetPopup = function() {
	    $scope.showAjoutObjetPopup = true;
	    $scope.nouvelObjet = {
		   etat: 'Actif'
	    };
	};

	$scope.closeAjoutObjetPopup = function() {
	    $scope.showAjoutObjetPopup = false;
	};

	$scope.ajouterNouvelObjet = function() {
	    if (!$scope.currentUser) {
		   alert("Vous devez être connecté pour ajouter un objet");
		   return;
	    }
	    
	    if (!$scope.nouvelObjet.nom || !$scope.nouvelObjet.type || !$scope.nouvelObjet.lieu) {
		   alert("Veuillez remplir tous les champs obligatoires (Nom, Type, Lieu)");
		   return;
	    }

	    // Préparation des données
	    const objetData = {
		   nom: $scope.nouvelObjet.nom,
		   description: $scope.nouvelObjet.description || '',
		   type: $scope.nouvelObjet.type,
		   lieu: $scope.nouvelObjet.lieu,
		   etat: $scope.nouvelObjet.etat || 'Inactif',
		   mots_cles: $scope.nouvelObjet.mots_cles || ''
	    };

	    // Ajout des spécificités thermostat si nécessaire
	    if ($scope.nouvelObjet.type === 'Thermostat') {
		   objetData.temperature = parseFloat($scope.nouvelObjet.temperature) || 20.0;
		   objetData.consigne = parseFloat($scope.nouvelObjet.consigne) || 20.0;
		   objetData.lim_haute = parseFloat($scope.nouvelObjet.lim_haute) || 25.0;
		   objetData.lim_basse = parseFloat($scope.nouvelObjet.lim_basse) || 18.0;
	    }

	    // Envoi au serveur
	    $http.post('api/ajout-objet.php', objetData)
		   .then(function(response) {
		       if (response.data.success) {
		           // Ajoute le nouvel objet à la liste
		           $scope.objets.push(response.data.objet);
		           $scope.closeAjoutObjetPopup();
		           alert("Objet ajouté avec succès!");
		           $scope.addPoints(3);
		           
		           // Recharge la liste complète pour être sûr
		           $http.get('api/materiels.php')
		               .then(function(res) {
		                   $scope.objets = res.data.materiels;
		               });
		       } else {
		           alert("Erreur lors de l'ajout: " + (response.data.message || 'Erreur inconnue'));
		       }
		   })
		   .catch(function(error) {
		       console.error("Erreur complète:", error);
		       let errorMsg = "Erreur serveur lors de l'ajout";
		       
		       if (error.data) {
		           console.error("Détails erreur:", error.data);
		           if (error.data.error) {
		               errorMsg += "\n" + error.data.error;
		           }
		           if (error.data.query) {
		               console.log("Requête SQL:", error.data.query);
		           }
		       }
		       
		       alert(errorMsg);
		   });
	};
    
    
    $scope.typeExists = function() {
		    if (!$scope.newType || !$scope.typeOptions) return false;
		    return $scope.typeOptions.some(function(t) {
			   return t.toLowerCase() === $scope.newType.toLowerCase();
		    });
		};
    
    
   
	// Fonction de formatage avancée
		$scope.formatTypeName = function(value) {
		    if (!value) return '';
		    return value
			   .trim() // Supprime les espaces avant/après
			   .replace(/\s+/g, ' ') // Réduit les espaces multiples
			   .replace(/(?:^|\s)\S/g, function(char) { 
				  return char.toUpperCase(); // Capitalise chaque mot
			   });
		};

		// Fonction d'ajout avec vérification
		$scope.addNewType = function() {
		    console.log('--- DEBUT addNewType ---');
		    
		    // Récupération sécurisée de la valeur
		    var inputEl = document.getElementById('typeInputField');
		    var actualValue = inputEl ? inputEl.value : '';
		    
		    if (!actualValue) {
			   console.warn('Champ vide');
			   return;
		    }
			var actualValue = $scope.formatTypeName(actualValue);

		    // Vérification existence
		    if ($scope.typeExists(actualValue)) {
			   console.warn('Type existe déjà:', actualValue);
			   return;
		    }
		    
		    // Mise à jour sans déclencher $apply si inutile
		    $timeout(function() {
			   $scope.typeOptions.push(actualValue);
			   $scope.nouvelObjet.type = actualValue;
			   $scope.newType = '';
			   inputEl.value = ''; // Réinitialisation DOM
			   
			   console.log('Type ajouté avec succès:', actualValue);
		    });
		    
		    console.log('--- FIN addNewType ---');
		};
    
  
// ------- SUIVI INSCRIPTION EMAIL
	// Ajout d'une fonction pour renvoyer l'email de validation
	$scope.resendValidationEmail = function() {
	    if (!$scope.inscriptionData.mail) {
	        $scope.inscriptionMessage = 'Aucun email à renvoyer';
	        $scope.inscriptionMessageType = 'error';
	        return;
	    }

	    $http.post('api/resend_validation.php', {
	        mail: $scope.inscriptionData.mail
	    }).then(function(response) {
	        $scope.inscriptionMessage = response.data.message;
	        $scope.inscriptionMessageType = response.data.success ? 'success' : 'error';
	    }).catch(function(error) {
	        $scope.inscriptionMessage = 'Erreur lors de l\'envoi de l\'email';
	        $scope.inscriptionMessageType = 'error';
	    });
	};
    
	$scope.updateProfileInfo = function(user){
		console.log(user);
		$http.post('api/modifyuser.php', user).then(function(response) {
			$scope.popupShowModifUser = false;
        }, function(error) {
            $scope.message = "Erreur lors de la mise à jour de l'utilisateur";
        });
	}
    
}])





// --- FIN NE PAS TOUCHER APRES

.filter('startFrom', function() {
    return function(input, start) {
        if (!input) return [];
        start = +start;
        return input.slice(start);
    };
});
