// scripts/app.js
angular.module('maisonConnecteeApp', [])
.controller('MainController', ['$scope', '$http', '$window', '$interval', 
function($scope, $http, $window, $interval) {
    
    // Gestion du popup de connexion
    $scope.showLoginPopup = false;
    $scope.user = {
        pseudo: '',
        password: ''
    };
    $scope.loginError = '';
    
    $scope.openLogin = function() {
        $scope.showLoginPopup = true;
    };
    
    $scope.closeLogin = function() {
        $scope.showLoginPopup = false;
        $scope.loginError = '';
    };
    
    $scope.login = function() {
        $scope.loginError = '';
        $http.post('api/login.php', $scope.user)
            .then(function(response) {
                if (response.data.success) {
                    $scope.closeLogin();
                    $window.location.href = 'dashboard.html';
                } else {
                    $scope.loginError = response.data.message || 'Identifiants incorrects';
                }
            })
            .catch(function(error) {
                $scope.loginError = 'Erreur de connexion au serveur';
            });
    };
    
    // Redirection inscription
    $scope.redirectToInscription = function() {
        $window.location.href = 'inscription.html';
    };
    
    // Gestion météo
    $scope.weatherData = null;
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

    $scope.refreshWeather = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    getWeather(position.coords.latitude, position.coords.longitude);
                },
                function(error) {
                    console.warn("Erreur géolocalisation:", error);
                    getWeather(48.8566, 2.3522); // Paris par défaut
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes de cache
                }
            );
        } else {
            getWeather(48.8566, 2.3522);
        }
    };

    // Appel initial et rafraîchissement périodique (toutes les 30 minutes)
    $scope.refreshWeather();
    var weatherInterval = $interval($scope.refreshWeather, 1800000);
    
    // Nettoyage quand le contrôleur est détruit
    $scope.$on('$destroy', function() {
        if (weatherInterval) {
            $interval.cancel(weatherInterval);
        }
    });

    // Gestion de l'inventaire
    $scope.objets = [];
    $scope.filtres = {
        lieux: [],
        types: [],
        etats: []
    };
    $scope.filters = {
        lieu: '',
        type: '',
        etat: '',
        motsCles: ''
    };
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.sortField = 'nom';
    $scope.reverse = false;
    $scope.loading = true;

    // Chargement des données de l'inventaire
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

    // Réinitialisation des filtres
    $scope.resetFilters = function() {
        $scope.filters = {
            lieu: '',
            type: '',
            etat: '',
            motsCles: ''
        };
        $scope.currentPage = 0;
    };

    // Filtre personnalisé
    $scope.customFilter = function(objet) {
        return (
            (!$scope.filters.lieu || objet.lieu === $scope.filters.lieu) &&
            (!$scope.filters.type || objet.type === $scope.filters.type) &&
            (!$scope.filters.etat || objet.etat === $scope.filters.etat) &&
            (!$scope.filters.motsCles || 
             (objet.mots_cles && objet.mots_cles.toLowerCase().includes($scope.filters.motsCles.toLowerCase())) ||
             (objet.nom && objet.nom.toLowerCase().includes($scope.filters.motsCles.toLowerCase())) ||
             (objet.description && objet.description.toLowerCase().includes($scope.filters.motsCles.toLowerCase())))
        );
    };

    // Tri des colonnes
    $scope.sortBy = function(field) {
        $scope.reverse = ($scope.sortField === field) ? !$scope.reverse : false;
        $scope.sortField = field;
    };

    // Calcul du nombre de pages
    $scope.numberOfPages = function() {
        return Math.ceil($scope.filteredObjets.length / $scope.pageSize);
    };
}])

.filter('startFrom', function() {
    return function(input, start) {
        if (!input) return [];
        start = +start;
        return input.slice(start);
    };
});
