//var closeButton = document.querySelector('#button');
//closeButton.addEventListener('click', function (e) {
//    console.log("Button clicked!!")
//});

var app = angular.module('collabApp', []);

app.controller('InteractionCtrl', function ($scope) {

    $scope.rows = [];
    $scope.messageContent = 'content';
    $scope.onlineUserCount = 0;
    $scope.onlineUserCountString = "";

    $scope.cellClicked = function () {
        console.log("Cell clicked");
    }

    $scope.addRow = function () {
//        $scope.rows[$scope.rows.length] = {
//            'cells': [
//                {'value': $scope.rows.length + 1},
//                {'value': 'from'},
//                {'value': 'to'},
//                {'value': $scope.messageContent}
//            ]
//        }

        $scope.sendMessage();
    }

    $scope.printPeersList = function () {
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.PRINT_PEER_LIST, $scope.messageContent);
        console.log("Requesting that direct replication request is sent.");
        var fem = FrontEndMessaging.getInstance();
        fem.sendMessage(msg);
    }

    $scope.sendDirectReplicationRequest = function () {
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.PERFORM_DIRECT_REPLICATION_REQUEST, $scope.messageContent);
        console.log("Requesting that peers list is printed.");
        var fem = FrontEndMessaging.getInstance();
        fem.sendMessage(msg);
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
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.NEW_DATA_CREATED, $scope.messageContent);
        console.log("About to send from frontend:");
        console.log(msg);
        var fem = FrontEndMessaging.getInstance();
        fem.sendMessage(msg);
        $scope.addMessage(msg);
    }

    $scope.addMessage = function (message) {
        $scope.rows[$scope.rows.length] = {
            'cells': [
                {'value': $scope.rows.length + 1},
                {'value': message.from},
                {'value': message.to},
                {'value': message.content}
            ]
        }
    }

    $scope.handleMessage = function (message) {
        console.log("We are in InteractionLogic handle Message");
        console.log(message);
        $scope.addMessage(message);
        $scope.$apply();
    }

    $scope.updateOnlineUserCount = function (message) {
        console.log("We received a new online user count");
        console.log(message);
        $scope.onlineUserCount = message.content;
        $scope.onlineUserCountString = $scope.onlineUserCount + " online users";
        $scope.$apply();
    }

    var fem = FrontEndMessaging.getInstance();
    fem.addCallbackForEvent(FrontEndMessaging.EventType.NEW_DATA, $scope.handleMessage);
    fem.addCallbackForEvent(FrontEndMessaging.EventType.UPDATED_USER_COUNT, $scope.updateOnlineUserCount);
});

function callback_fy6fhP17Zt2g(message, sender, sendResponse) {
    var fem = FrontEndMessaging.getInstance();
    fem.handleMessage(message, sender, sendResponse);
}

if (chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(callback_fy6fhP17Zt2g);
}

if (chrome.app.window) {
    var currentWindow = chrome.app.window.current();

    if (currentWindow) {
        currentWindow.onClosed.addListener(function () {
            var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.CLOSING_WINDOW, "");
            var fem = FrontEndMessaging.getInstance();
            fem.sendMessage(msg);
        });

        // notify the backend that the front end loaded
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.OPENED_WINDOW, "");
        var fem = FrontEndMessaging.getInstance();
        fem.sendMessage(msg);
    }
}

