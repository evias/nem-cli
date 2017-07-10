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
                readTrxs_(address, nodeHost, null, printCount_);
            });
        };
    };

    var globalCnt = 0;
    var hasTrxs = {};
    var readTrxs_ = function(addr, host, lastId, doneCallback) {
        //console.log("[DEBUG] Issuing NIS request with lastId : " + lastId + "..");
        var node = sdk.model.objects.create("endpoint")(host, 7890);
        sdk.com.requests.account.transactions.all(node, addr, null, lastId)
            .then(function(res) {
                if (res.code >= 2) {
                    console.log("error: ", res);
                    return false;
                }

                var isDone = false;
                var cntTrx = res.data.length;

                //console.log("[DEBUG] Read " + cntTrx + " transactions chunk..");

                for (var i = 0; i < res.data.length; i++) {
                    lastId = res.data[i].meta.id;
                    if (hasTrxs.hasOwnProperty(lastId)) {
                        //console.log("[DEBUG] Found already Read: " + lastId + ".. Done.");
                        isDone = true;
                        break;
                    }

                    hasTrxs[lastId] = true;
                    globalCnt++;
                }

                if (isDone || cntTrx < 25) {
                    return doneCallback(globalCnt);
                }

                readTrxs_(addr, host, lastId, doneCallback);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    var printCount_ = function(countTotal) {
        console.log("Transactions Count: ");
        console.log("----------------------------------");
        console.log("Total Count: " + countTotal);
        console.log("----------------------------------");
        process.exit();
    };

    module.exports.Command = Command;
}());