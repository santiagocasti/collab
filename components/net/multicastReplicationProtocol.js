/**
 * ReplicationP - Replication Protocol constants
 */
var MulticastReplicationProtocol = (function () {

    const COUNTER_PAYLOAD = 101;
    const IDENTITY_PAYLOAD = 102;

    const PORT = 1234;
    const MULTICAST_IP = "237.132.123.123";

    return{
        Port: PORT,

        MulticastIP: MULTICAST_IP,

        PayloadTypes: {
            COUNTER: COUNTER_PAYLOAD,
            IDENTITY: IDENTITY_PAYLOAD
        },

        IsValidPayloadType: function (pt) {
            switch (parseInt(pt)) {
                case COUNTER_PAYLOAD:
                case IDENTITY_PAYLOAD:
                    return true;
                    break;
                default:
                    return false;
            }
        }
    }
})();