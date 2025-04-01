angular.module('maisonConnecteeApp', [])
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

	$scope.openAppareilPopup = function(objet, event) {
	    if (!$scope.isLoggedIn) return;
	    
	    $scope.selectedAppareil = objet;
	    $scope.showAppareilPopup = true;
	    
	    // Positionnement près du bouton cliqué
	    /*if (event) {
		   $scope.popupPosition = {
		       top: event.clientY + 'px',
		       left: event.clientX + 'px'
		   };
	    } else {
		   // Position par défaut au centre
		   $scope.popupPosition = {
		       top: '50%',
		       left: '50%'
		   };
	    }*/
	};
    
    $scope.closePopup = function() {
	    $scope.showAppareilPopup = false;
	    $scope.selectedAppareil = null;
	};
    
}])

// --- FIN NE PAS TOUCHER APRES

.filter('startFrom', function() {
    return function(input, start) {
        if (!input) return [];
        start = +start;
        return input.slice(start);
    };
});


