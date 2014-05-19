//var closeButton = document.querySelector('#button');
//closeButton.addEventListener('click', function (e) {
//    console.log("Button clicked!!")
//});

var app = angular.module('collabApp', []);

app.controller('InteractionCtrl', function ($scope) {

    $scope.rows = [];
    $scope.messageContent = 'content';

    $scope.addRow = function () {
        $scope.rows[$scope.rows.length] = {
            'cells': [
                {'value': 'a'},
                {'value': 'b'},
                {'value': 'c'},
                {'value': 'd'}
            ]
        }
    }

    //    {'name': 'Nexus S',
//         'snippet': 'Fast just got faster with Nexus S.'},
    $scope.fetchMessages = function () {
//        this.rows = [
//            {'id': 1,
//                'from': 'santiago',
//                'content': 'Hola!'},
//            {'id': 2,
//                'from': 'karola',
//                'content': 'Hallo!'},
//            {'id': 3,
//                'from': 'Philip',
//                'content': 'Hej!'},
//            {'id': 4,
//                'from': 'Tony',
//                'content': 'Hello!'},
//        ]
    };

    $scope.sendMessage = function () {
        console.log("Message is: "+$scope.messageContent);
    }
});