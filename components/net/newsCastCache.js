function NewsCastCache(maxSize, localIp) {

    this.COUNTER_TYPE = 501;
    this.REGISTER_TYPE = 502;

    this.maxSize = maxSize;
    this.items = [];
    this.localIp = localIp;

}

NewsCastCache.prototype.addItems = function (itemsArray) {

    var itemObj;
    itemsArray.forEach(function (item) {
        if (item instanceof Counter) {
            itemObj = new NewsCastCacheItem(item, this.localIp, this.COUNTER_TYPE);
            this.items.push(itemObj);
        } else if (item instanceof MVRegister) {
            itemObj = new NewsCastCacheItem(item, this.localIp, this.REGISTER_TYPE);
            this.items.push(itemObj);
        } else {
            log("ERROR: Provided object of unrecognized type.", item);
        }
    }.bind(this));

    this.adjustSize();
};

NewsCastCache.prototype.adjustSize = function () {

    this.items.sort(NewsCastCacheItem.prototype.compare);

    if (this.items.length > this.maxSize) {
        this.items = this.items.slice(0, this.maxSize - 1);
    }

};

NewsCastCache.prototype.toJSON = function () {
    return JSON.stringify(this.items);
}


function NewsCastCacheItem(crdt, ip, type) {

    this.ts = new Date().getTime();
    this.ip = ip;
    this.type = type;
    this.data = crdt.toObject();

}

NewsCastCacheItem.prototype.compare = function (a, b) {
    if (a.ts < b.ts) {
        return -1;
    } else if (a.ts > b.ts) {
        return 1;
    } else {
        return 0;
    }
}