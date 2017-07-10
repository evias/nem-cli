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
            ConsoleInput.ask("Please enter a Namespace", /[a-zA-Z\-\._0-9]+/, function(namespace) {
                ConsoleInput.ask("Please enter a Network (Testnet/Mainnet)", /(testnet|mainnet)/i, function(network) {
                    var nodeHost = "http://bigalice2.nem.ninja";
                    if (network.toLowerCase() == 'mainnet') {
                        nodeHost = "http://hugealice.nem.ninja";
                    }

                    getMosaicDefinition_(namespace, network, nodeHost, printDefinitions_);
                });
            });
        };
    };

    var globalCnt = 0;
    var hasTrxs = {};

    var getMosaicDefinition_ = function(namespace, network, host, callback) {
        var endpoint = sdk.model.objects.create("endpoint")(host, 7890);

        sdk.com.requests.namespace.mosaicDefinitions(endpoint, namespace).then(function(res) {
            if (res.code >= 2) {
                console.error("Error happened on NIS namespace.mosaicDefinitions, with Response: " + JSON.stringify(res));
                return endJob_();
            }

            if (!res.data || !res.data.length) {
                console.log("No mosaics found for Namespace " + namespace + " on Network " + network);
                return endJob_();
            }

            var mosaicDefs = res.data;
            return callback(mosaicDefs);
        }, function(err) {
            console.error(err);
            return endJob_();
        });
    };

    var printDefinitions_ = function(mosaicDefArray) {
        //console.log(mosaicDefArray);
        for (var i = 0; i < mosaicDefArray.length; i++) {
            var currentDef = mosaicDefArray[i];
            var mosaicSlug = sdk.utils.format.mosaicIdToName(currentDef.mosaic.id);

            console.log("Mosaic: " + mosaicSlug);
            //console.log(JSON.stringify(currentDef));
        }

        return endJob_();
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());