angular.module('maisonConnecteeApp', [])
.controller('MainController', ['$scope', '$http', '$window', '$interval', '$timeout', 
function($scope, $http, $window, $interval, $timeout) {
    
    // Niveaux d'accès
    $scope.accessLevels = {
        simple: 1,
        complexe: 2,
        admin: 3
    };

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

    // Fonction pour lire les cookies
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Met à jour les rangs disponibles
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

    // Met à jour le niveau d'accès
    $scope.updateAccessLevel = function() {
    	   console.log('Rang sélectionné:', $scope.selectedRang);
        //$scope.currentAccessLevel = $scope.accessLevels[$scope.selectedRang] || 1;
        //console.log('Niveau mis à jour:', $scope.selectedRang, $scope.currentAccessLevel);
        $scope.$applyAsync(); // Force la mise à jour de la vue
        $timeout(function() {
        	});
    };

    // Vérification initiale des cookies
    function checkAuth() {
        const pseudo = getCookie('user_pseudo');
        const rang = getCookie('user_rang');
        
        if (pseudo && rang) {
            $scope.isLoggedIn = true;
            $scope.currentUser = { pseudo, rang };
            $scope.selectedRang = rang;
            $scope.updateAvailableRangs();
            //$scope.updateAccessLevel();
            $scope.showLoginPopup = false;
        } else {
            $scope.isLoggedIn = false;
            $scope.currentUser = null;
            $scope.selectedRang = 'simple';
            $scope.updateAvailableRangs();
            //$scope.updateAccessLevel();
            $scope.showLoginPopup = false;
        }
        $scope.updateAccessLevel();
    }

    // Logout
    $scope.logout = function() {
        $http.post('api/logout.php')
            .finally(function() {
                $scope.isLoggedIn = false;
                $scope.currentUser = null;
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

    // Gestion connexion
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
                    checkAuth();
                } else {
                    $scope.loginError = response.data.message || 'Identifiants incorrects';
                }
            })
            .catch(function() {
                $scope.loginError = 'Erreur de connexion au serveur';
            	});
    };

    // Redirection inscription
    $scope.redirectToInscription = function() {
        $window.location.href = 'inscription.html';
    };

   // Météo
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

    // Inventaire
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

    $scope.refreshWeather();
    var weatherInterval = $interval($scope.refreshWeather, 1800000);
    checkAuth();
    $interval(checkAuth, 300000);

    $scope.$on('$destroy', function() {
        $interval.cancel(weatherInterval);
    });
}])

.filter('startFrom', function() {
    return function(input, start) {
        if (!input) return [];
        start = +start;
        return input.slice(start);
    };
});


