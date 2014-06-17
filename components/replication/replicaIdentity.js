var ReplicaIdentity = (function (){

    function init(id, timestamp){

        var id = id;
        var timestamp = timestamp;

        return {
            getId: function(){
                return id;
            },

            getTimestamp: function (){
                return timestamp;
            },

            toString: function(){
                return id + "." + timestamp.toString();
            }
        }

    }

    return {

        new: function (id, timestamp) {
            return init(id, timestamp);
        },

        newFromString: function (stringIdentity){
            var splittedHash = stringIdentity.split('.');
            return init(splittedHash[0], parseInt(splittedHash[1]));
        },

        IsValidStringIdentity: function (stringIdentity) {
            var splittedHash = stringIdentity.split('.');

            if (splittedHash.length != 2 ||
                splittedHash[1].length === 0 ||
                splittedHash[0].length === 0){
                return false;
            }

            // second value needs to be only numbers
            for (var i = 0; i<splittedHash[1].length; i++){
                if (splittedHash[1].charCodeAt(i) < 48 ||
                    splittedHash[1].charCodeAt(i) > 57){
                    return false;
                }
            }

            return true;
        }

    }


})();