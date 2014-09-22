/**
 * NewsCastCache Class
 * This is the class representing the cache exchanged as part of
 * the gossip protocol NewsCast. It is composed of NewsCastItems.
 *
 * @param maxSize
 * @param localIp
 * @constructor
 */
function NewsCastCache(maxSize, localIp) {

    this.COUNTER_TYPE = 501;
    this.REGISTER_TYPE = 502;

    this.maxSize = maxSize;
    this.items = [];
    this.map = {};
    this.mapHistory = {};
    this.localIp = localIp;

}

/**
 * Add items to the cache.
 * @param itemsArray
 */
NewsCastCache.prototype.addItems = function (itemsArray) {

    var itemObj;
    var n = Network.getInstance();
    var ts = new Date().getTime();
    itemsArray.forEach(function (item) {
        var hash = createUniqueHash(n.getVPNIp());
        if (item instanceof Counter) {
            itemObj = new NewsCastCacheItem(item, this.localIp, this.COUNTER_TYPE, hash, ts);
            this.items.push(itemObj);
        } else if (item instanceof MVRegister) {
            itemObj = new NewsCastCacheItem(item, this.localIp, this.REGISTER_TYPE, hash, ts);
            this.items.push(itemObj);
        } else {
            log("ERROR: Provided object of unrecognized type.", item);
            return;
        }

        // add items that we do not have
        this.map[hash.toString()] = 1;
        this.mapHistory[hash.toString()] = 1;

        log_created(hash);
    }.bind(this));

    this.adjustSize();
};

/**
 * Merge the items in the cache with the ones provided,
 * given the deltaTime to adjust the timestamps.
 * @param itemsArray
 * @param deltaT
 */
NewsCastCache.prototype.mergeItems = function (itemsArray, deltaT) {


    itemsArray.forEach(function (item) {
//        log("Processing item with hash: "+item.hash);
        if (this.map.hasOwnProperty(item.hash) &&
            this.map[item.hash.toString()] === 1){
            // skip items that we already have
//            log("Skipping adding this item to the map.");
        }else{
            var i = new NewsCastCacheItem(item.crdt, item.ip, item.type, item.hash, parseInt(item.ts) - deltaT);
            this.map[item.hash.toString()] = 1;
            this.mapHistory[item.hash.toString()] = 1;
            this.items.push(i);
        }
    }.bind(this));
//    log("Map is:", this.map);

    this.adjustSize();
}

/**
 * Was the update represented by the hash given ever delivered?
 * @param hash
 * @returns {boolean}
 */
NewsCastCache.prototype.everDelivered = function (hash){

    if (this.mapHistory.hasOwnProperty(hash)){
        return true;
    }

    return false;
}

/**
 * Adjust the size of the cache by trimming the last items in the cache.
 */
NewsCastCache.prototype.adjustSize = function () {

    this.items.sort(NewsCastCacheItem.prototype.compare);

    if (this.items.length > this.maxSize) {
        log("Items before slice:", this.items);
        this.items = this.items.slice(0, this.maxSize - 1);
        log("Items after slice:", this.items);

        // rebuild the map with the latest updates
        this.map = {};
        this.items.forEach(function (item){
            this.map[item.hash] = 1;
        }.bind(this));

    }

};

/**
 * Convert to JSON.
 * @returns {*}
 */
NewsCastCache.prototype.toJSON = function () {
    return JSON.stringify(this.items);
}


/**
 * NewsCastCacheItem class
 * Represents an update to certain CRDT. It has the crdt data,
 * the ip of the replica that created the update, the type of crdt,
 * a hash to uniquely identify the update and the timestamp of
 * when it was created.
 * @param crdt
 * @param ip
 * @param type
 * @param hash
 * @param ts
 * @constructor
 */
function NewsCastCacheItem(crdt, ip, type, hash, ts) {

    this.ts = ts;
    this.ip = ip;
    this.type = type;
    this.data = crdt.toObject();
    this.hash = hash;


}

/**
 * Compare to items.
 * @param a
 * @param b
 * @returns {number}
 */
NewsCastCacheItem.prototype.compare = function (a, b) {
    if (a.ts < b.ts) {
        return 1;
    } else if (a.ts > b.ts) {
        return -1;
    } else {
        return 0;
    }
}