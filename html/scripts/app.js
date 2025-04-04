angular.module('maisonConnecteeApp', [])

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


.controller('MainController', ['$scope', '$http', '$window', '$interval', '$timeout', 
function($scope, $http, $window, $interval, $timeout) {
    


$scope.showLoginPopup = false;
$scope.showAppareilPopup = false;
$scope.popupPosition = { top: 0, left: 0 };

  
    // Initialisations
    $scope.showLoginPopup = false;
    $scope.showAppareilModal = false;
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
                $scope.isLoggedIn = false;
                //$scope.currentUser = null;
                checkAuth(); // Rafraîchit l'état
            });
    };

    // Gestion modals
    $scope.openAppareilModal = function(objet) {
        if (!$scope.isLoggedIn) return;
        $scope.selectedAppareil = objet;
        $scope.showAppareilModal = true;
    };

    $scope.closeModal = function() {
        $scope.showAppareilModal = false;
        $scope.selectedAppareil = null;
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
                    checkAuth();
                } else {
                    $scope.loginError = response.data.message || 'Identifiants incorrects';
                }
            })
            .catch(function() {
                $scope.loginError = 'Erreur de connexion au serveur';
            	});
    };

// ----- GESTION INSCRIPTION
    $scope.redirectToInscription = function() {
        $window.location.href = 'inscription.html';
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
	
// ---- pour modifier dans popup
     // ETAT
	$scope.toggleEtat = function() {
	    if (!$scope.selectedAppareil || !$scope.selectedAppareil.id_objet) {
		   console.error("ID objet manquant ou invalide");
		   return;
	    }

	    var nouvelEtat = $scope.selectedAppareil.etat === 'actif' ? 'inactif' : 'actif';
	    
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

    function affichageProfile(){
        var urlParams = new URLSearchParams(window.location.search);
        var pseudostr = urlParams.get('pseudo');

        if ($scope.isLoggedIn) {
            // faire la recup de l'utilisateur
            $http.post('api/getuser.php', {pseudo : localStorage.getItem('user_pseudo')}).then(function(response){
                if (response.data.success) {
                    $scope.user = response.data.data;
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

    $scope.openModifProfile = function(user){
        $scope.selectedUser = user;
		$scope.popupShowModifUser = true;
    }

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
    
    $scope.closePopup = function() {
	    $scope.showAppareilPopup = false;
	    $scope.selectedAppareil = null;
	};
	
//------- SUPPRIMER MATERIEL ----

	// Fonction de confirmation de suppression
	$scope.confirmDelete = function() {
	    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce matériel ?")) {
		    $scope.deleteMaterial();
	    }
	};

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