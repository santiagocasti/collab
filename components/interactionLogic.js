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

    $scope.cellClicked = function (row, col) {

        if (col == 0) {
            log("Ignoring this column because it's the one that indicates the numbers");
            return;
        }

        // if we are editing this cell, ignore the click
        if ($scope.rows[row].cells[col].edit === true) {
            log("Ignoring click cause we are editing this cell.");
            return;
        }

        $scope.rows[row].cells[col].edit = true;

        log("Cell clicked [" + row + "," + col + "]");

        // get the cell
        var $cell = $("#cell" + row + "-" + col);

        // add an input
        var $input = $('<input>').attr({
            id: 'editCell',
            name: 'bar',
            class: "inputEditCell"
        });

        // set the value of input to the cell content
        $input.val($cell.html().trim());

        // remove all the children
        $cell.empty();

        // append the input to the cell
        $cell.append($input);

        // refresh styling
        $cell.hide().show();

        // focus on the input
        $input.focus();

        var callback_j2h3l4kjhdlaks = function (event) {
            // get the value of the input
            var value = $input.val();

            $cell.hide();

            // clean the cell content
            $cell.empty();
            // set the cell content
            $cell.text(value);
            // set editing flag to false

            $cell.show();

            $scope.rows[row].cells[col].edit = false;

            $scope.saveCellContent(row, col, value);

        };

        // when you hit 'intro' is like a submit for this control
        $input.keydown(function (event) {
            if (event.keyCode == 13) {
                callback_j2h3l4kjhdlaks(event);
            }
        });

        $input.blur(callback_j2h3l4kjhdlaks);

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

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    $scope.setupSpreadsheet = function () {

        var names = ["James", "Ana", "John", "Alice"];
        var category = ["Food", "Beauty", "University", "Job", "Home stuff", "Fun"];
        var shop = ["Edeka", "Lidl", "DM", "Real", "VRN", "Kino", "Theater", "Bahn", "Meinfernbus"];

        var i;
        var cell0, cell1, cell2, cell3, cell4;
        for (i = 0; i < 15; ++i) {

            cell0 = $scope.rows.length + 1;
            cell1 = names[getRandomInt(0, names.length - 1)];
            cell2 = category[getRandomInt(0, category.length - 1)];
            cell3 = shop[getRandomInt(0, shop.length - 1)];
            cell4 = getRandomInt(0, 150);

            $scope.rows[$scope.rows.length] = {
                'cells': [
                    {'value': cell0, 'row': i, 'col': 0, 'edit': false},
                    {'value': " ", 'row': i, 'col': 1, 'edit': false},
                    {'value': " ", 'row': i, 'col': 2, 'edit': false},
                    {'value': " ", 'row': i, 'col': 3, 'edit': false},
                    {'value': " ", 'row': i, 'col': 4, 'edit': false},
                    {'value': " ", 'row': i, 'col': 5, 'edit': false},
                    {'value': " ", 'row': i, 'col': 6, 'edit': false},
                    {'value': " ", 'row': i, 'col': 7, 'edit': false},
                    {'value': " ", 'row': i, 'col': 8, 'edit': false}
                ]
            }
        }


    }

    $scope.getCellClass = function (row, column) {
        if (column !== 0) {
            return "tg-031e";
        } else {
            return "tg-afp9";
        }
    }


    $scope.handleMessage = function (message) {
        console.log("We are in InteractionLogic handle Message");
        console.log(message);
        $scope.$apply();
    }

    $scope.updateCell = function (content) {

        var value;
        content.forEach(function (cell) {
            value = "";
            if (cell.value.length === 1) {
                value = cell.value[0];
            } else {
                cell.value.forEach(function (element) {
                    value = value + element + " | ";
                });
            }

            $scope.rows[cell.row]['cells'][cell.col].value = value;

            console.log("Updating cell [" + cell.row + "," + cell.col + "] with value [" + value + "]");

        });

        $scope.$apply();
    }

    $scope.updateOnlineUserCount = function (message) {
        console.log("We received a new online user count");
        console.log(message);
        $scope.onlineUserCount = message.content;
        $scope.onlineUserCountString = $scope.onlineUserCount + " online users";
        $scope.$apply();
    }

    $scope.saveCellContent = function (row, column, value) {
        var fem = FrontEndMessaging.getInstance();
        var cell = {};
        cell.row = row;
        cell.col = column;
        cell.value = value;
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.NEW_CELL_VALUE, cell);
        fem.sendMessage(msg);
    }

    var fem = FrontEndMessaging.getInstance();
    fem.addCallbackForEvent(FrontEndMessaging.EventType.NEW_DATA, $scope.handleMessage);
    fem.addCallbackForEvent(FrontEndMessaging.EventType.NEW_CELL_VALUE, $scope.updateCell);
    fem.addCallbackForEvent(FrontEndMessaging.EventType.UPDATED_USER_COUNT, $scope.updateOnlineUserCount);

    $scope.setupSpreadsheet();
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
        // notify the backend that the front end loaded
        var msg = MessagePassing.MessageToBack(MessagePassing.MessageTypes.OPENED_WINDOW, "");
        var fem = FrontEndMessaging.getInstance();
        fem.sendMessage(msg);
    }
}

