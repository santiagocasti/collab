
module.exports = (function () {

    return {

        getCrdtKey: function (id, crdtName){
            return crdtName + ":" + id;
        },

        getIdSetKey: function (crdtName){
            return crdtName + ":all";
        },

        getTestKey: function (){
            return "peersRetrievedTest";
        }


    }

})();

