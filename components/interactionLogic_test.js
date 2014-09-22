'use strict';
describe('Testing InteractionCtrl', function () {

    beforeEach(module('collabApp'));

    var interactionCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope;
        interactionCtrl = $controller("InteractionCtrl", {
            $scope: scope
        });
    }));

//    it('should add rows', function () {

//        expect(scope.messageContent).toBe('content');

//        expect(scope.rows.length).toBe(0);
//        scope.addRow();
//        expect(scope.rows.length).toBe(1);

////        expect(scope.rows[0].cells[0].value).toBe('a');
//    });


//    beforeEach(module('collabApp'));
//
//    it('should create rows when calling addRow', inject(function ($controller) {
//        var scope = {};
//        var ctrl = $controller('InteractionController', {$scope: scope});
//
//        expect(scope.rows.length).toBe(0);
//        scope.addRow();
//        expect(scope.rows.length).toBe(1);
//    }));

});