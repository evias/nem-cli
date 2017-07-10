/**
 * Part of the evias/nem-utils package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    evias/nem-utils
 * @author     Grégory Saive <greg@evias.be> (https://github.com/evias)
 * @license    MIT License
 * @copyright  (c) 2017, Grégory Saive <greg@evias.be>
 * @link       https://github.com/evias/nem-utils
 */

(function() {

    var sdk = require("nem-sdk").default;

    var Command = function(ConsoleInput) {
        this.run = function() {
            console.log("");
            ConsoleInput.ask("Your XEM Address", /[A-Z\-0-9]+/, function(address) {
                var nodeChar = address.substr(0, 1);
                var nodeHost = "http://bigalice2.nem.ninja";
                if (nodeChar === 'N') {
                    nodeHost = "http://hugealice.nem.ninja";
                }

                address = address.replace(/-/g, '');

                ConsoleInput.ask("Mosaic Slug (Leave empty for all - Example nem:xem)", /[a-zA-Z\-_:\.0-9]+/, function(mosaicSlug) {
                    mosaicSlug = mosaicSlug && mosaicSlug.length ? mosaicSlug.toLowerCase() : "";
                    console.log("This can take some time, please be patient..");
                    readBalance_(address, nodeHost, mosaicSlug, printBalances_);
                }, true);
            });
        };
    };

    var globalCnt = 0;
    var totalAmt = 0;
    var hasTrxs = {};
    var readBalance_ = function(addr, host, mosaicSlug, doneCallback) {
        //console.log("[DEBUG] Issuing NIS request with mosaicSlug : " + (mosaicSlug && mosaicSlug.length ? mosaicSlug : "ALL") + "..");

        var node = sdk.model.objects.create("endpoint")(host, 7890);
        sdk.com.requests.account.mosaics.owned(node, addr)
            .then(function(res) {
                if (res.code >= 2) {
                    console.log("error: ", res);
                    return endJob_();
                }

                if (!res.data || !res.data.length) {
                    console.log("[DEBUG] This account owns no Mosaics.");
                    return endJob_();
                }

                var relevant = {};
                if (mosaicSlug && mosaicSlug.length)
                    relevant[mosaicSlug] = 0;

                for (var i = 0; i < res.data.length; i++) {
                    var mosaic = res.data[i];
                    var slug = mosaic.mosaicId.namespaceId + ":" + mosaic.mosaicId.name;

                    if (mosaicSlug && mosaicSlug.length && slug != mosaicSlug)
                        continue; // not relevant

                    relevant[slug] = mosaic.quantity;
                }

                if (doneCallback)
                    doneCallback(relevant);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    var printBalances_ = function(relevantMosaics) {
        console.log("XEM Wallet Balances: ");
        console.log("----------------------------------");

        for (var mosaic in relevantMosaics) {
            var current = relevantMosaics[mosaic];
            var mosName = mosaic.replace(/^[^:]+:/, "");
            console.log(mosaic + ": " + current + " " + mosName.toUpperCase());
        }

        console.log("----------------------------------");
        return endJob_();
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());