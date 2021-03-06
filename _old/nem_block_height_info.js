/**
 * Part of the evias/nem-cli package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    evias/nem-cli
 * @author     Grégory Saive <greg@evias.be> (https://github.com/evias)
 * @license    MIT License
 * @copyright  (c) 2017, Grégory Saive <greg@evias.be>
 * @link       https://github.com/evias/nem-cli
 */

(function() {

    var sdk = require("nem-sdk").default;
    var request = require("request");

    var Command = function(ConsoleInput) {
        this.run = function() {
            console.log("");

            console.log("  [1] - NEM Mainnet");
            console.log("  [2] - NEM Testnet");
            console.log("  [3] - NEM Mijin");

            console.log("");
            ConsoleInput.ask("Please select a Network", /[1-3]/, function(inputNet) {

                var mainn = sdk.model.network.data.mainnet.id;
                var testn = sdk.model.network.data.testnet.id;
                var mijin = sdk.model.network.data.mijin.id;

                var network = mainn;
                if (inputNet == 2) network = testn;
                else if (inputNet == 3) network = mijin;

                var nodes = {};
                nodes[mainn] = { "host": "hugealice.nem.ninja", "protocol": "http", "port": 7890 };
                nodes[testn] = { "host": "bigalice2.nem.ninja", "protocol": "http", "port": 7890 };
                nodes[mijin] = { "host": "b1.nem.foundation", "protocol": "http", "port": 7895 };

                console.log("");
                ConsoleInput.ask("Enter NEM Block Height", /[0-9]+/, function(blockHeight) {

                    var node = nodes[network];
                    var params = { "height": blockHeight };

                    console.log("");
                    console.log("Now fetching block data..");

                    var apiUrl = node.protocol + "://" + node.host + ":" + node.port + "/block/at/public";
                    var wrapData = {
                        url: apiUrl,
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "Content-Length": JSON.stringify(params).length
                        },
                        json: JSON.stringify(params)
                    }
                    request(wrapData, function(error, response, body) {

                        var result = response.toJSON();

                        console.log("");
                        if (result.status && result.error) {
                            console.error("[ERROR] Error ocurred: " + result.error + " - " + result.message)
                        } else if (result.timeStamp) {

                            var nemEpoch = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
                            var utcTime = new Date(nemEpoch + (result.timeStamp * 1000));

                            console.log("+------------------------------------------------------------------------------+");
                            console.log("|")
                            console.log("| Block Timestamp: " + result.timeStamp + " ( " + utcTime + ")");
                            console.log("| Block Signature: " + result.signature);
                            console.log("| Block Signer: " + result.signer);
                            console.log("| Harvester XEM: " + sdk.utils.format.pubToAddress(result.signer, network));
                            console.log("| Previous Block Hash: " + (result.prevBlockHash && result.prevBlockHash.data ? result.prevBlockHash.data : "N/A"));
                            console.log("| Transactions: " + (result.transactions && result.transactions.length ? result.transactions.length : 0) + " Transactions");
                            console.log("|")
                            console.log("+------------------------------------------------------------------------------+");

                        }

                        return endJob_();
                    });
                });
            });
        };
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());