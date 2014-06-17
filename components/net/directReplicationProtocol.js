var DirectReplicationProtocol = (function () {
    const PORT = 2345;

    const DIRECT_REQUEST = 201;
    const DIRECT_RESPONSE = 202;

    return {
        Port: PORT,
        PayloadTypes: {
            REQUEST: DIRECT_REQUEST,
            RESPONSE: DIRECT_RESPONSE
        },

        IsValidPayloadType: function (pt) {
            switch (parseInt(pt)) {
                case DIRECT_REQUEST:
                case DIRECT_RESPONSE:
                    return true;
                    break;
                default:
                    return false;
            }
        }
    }
})();