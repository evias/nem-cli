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

                    readBalance_(address, nodeHost, mosaicSlug, preparePrintBalances_);
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

                var relevant = [];
                for (var i = 0; i < res.data.length; i++) {
                    var mosaic = res.data[i];
                    var slug = mosaic.mosaicId.namespaceId + ":" + mosaic.mosaicId.name;

                    if (mosaicSlug && mosaicSlug.length && slug != mosaicSlug)
                        continue; // not relevant

                    var mosName = slug.replace(/^[^:]+:/, "");
                    var namespace = slug.replace(/:[^:]+$/, "");
                    relevant.push({
                        slug: slug,
                        name: mosName,
                        namespace: namespace,
                        balance: mosaic.quantity
                    });
                }

                if (doneCallback)
                    doneCallback(node, relevant, 0);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    // this function will get mosaic definition pairs we don't know about yet
    var preparePrintBalances_ = function(node, relevantMosaics, currentIndex) {
        if (!currentIndex) currentIndex = 0;

        if (currentIndex == relevantMosaics.length)
        // Done with recursion.
            return printBalances_(relevantMosaics);

        var cntMosaics = Object.getOwnPropertyNames(relevantMosaics);
        var current = relevantMosaics[currentIndex];
        var currentNS = current.namespace;

        if (current.slug == 'nem:xem') {
            current.divisibility = 6;
            relevantMosaics[currentIndex] = current;
            currentIndex++;
            return preparePrintBalances_(node, relevantMosaics, currentIndex);
        }

        sdk.com.requests.namespace
            .mosaicDefinitions(node, currentNS)
            .then(function(res) {
                var mosaicDef = sdk.utils.helpers.searchMosaicDefinitionArray(res.data, [current.name]);

                if (!mosaicDef[current.slug]) {
                    currentIndex++;
                    return preparePrintBalances_(node, relevantMosaics, currentIndex);
                }

                var mosaicMDP = mosaicDef[current.slug];

                var divisibility = 0;
                if (mosaicMDP && mosaicMDP.properties) {
                    for (var i = 0; i < mosaicMDP.properties.length; i++) {
                        var prop = mosaicMDP.properties[i];

                        if (prop.name != 'divisibility')
                            continue;

                        divisibility = parseInt(prop.value);
                    }
                }

                current.divisibility = divisibility;
                relevantMosaics[currentIndex] = current;
                currentIndex++;
                return preparePrintBalances_(node, relevantMosaics, currentIndex);
            });
    };

    var printBalances_ = function(relevantMosaics) {
        console.log("XEM Wallet Balances: ");
        console.log("----------------------------------");

        if (!relevantMosaics || !relevantMosaics.length) {
            console.log("No Mosaic Balances to display.");
        } else {
            for (var i = 0; i < relevantMosaics.length; i++) {
                var current = relevantMosaics[i];
                var div = current.divisibility;
                var amount = (current.balance / Math.pow(10, div)).toFixed(div);
                console.log(current.slug + ": " + amount + " " + current.name.toUpperCase());
            }
        }

        console.log("----------------------------------");
        return endJob_();
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());