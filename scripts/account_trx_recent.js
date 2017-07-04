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
                var nodeHost = "http://bob.nem.ninja";
                if (nodeChar === 'N') {
                    nodeHost = "http://alice7.nem.ninja";
                }

                readTrxs_(address, nodeHost, null, printTrxs_, true);
            });
        };
    };

    var globalCnt = 0;
    var hasTrxs = {};
    var readTrxs_ = function(addr, host, lastId, doneCallback, last25 = false) {
        var node = sdk.model.objects.create("endpoint")(host, 7890);
        sdk.com.requests.account.transactions.all(node, addr, null, lastId)
            .then(function(res) {
                if (res.code >= 2) {
                    console.log("error: ", res);
                    return false;
                }

                var isDone = last25;
                var cntTrx = res.data.length;
                for (var i = 0; i < res.data.length; i++) {
                    lastId = res.data[i].meta.id;
                    if (hasTrxs.hasOwnProperty(lastId)) {
                        isDone = true;
                        break;
                    }

                    hasTrxs[lastId] = res.data[i];
                    globalCnt++;
                }

                if (isDone || cntTrx < 25) {
                    return doneCallback(hasTrxs);
                }

                readTrxs_(addr, host, lastId, doneCallback);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    var printTrxs_ = function(transactions) {
        console.log("Recent Transactions: ");
        console.log("----------------------------------");

        for (var txHash in transactions) {
            var metaDataPair = transactions[txHash];

            var meta = metaDataPair.meta;
            var content = metaDataPair.transaction;
            var isMultiSig = content.type === sdk.model.transactionTypes.multisigTransaction;
            var realContent = isMultiSig ? content.otherTrans : content;

            var trxId = meta.id;
            var trxHash = meta.hash.data;
            if (meta.innerHash.data && meta.innerHash.data.length)
                trxHash = meta.innerHash.data;

            var xemAmount = (realContent.amount / Math.pow(10, 6)).toFixed(6);
            //XXX add mosaics listing

            console.log("- " + "ID: " + trxId + ", Amount: " + xemAmount + " XEM" + ", Hash: " + trxHash);
        }
        console.log("----------------------------------");
        process.exit();
    };

    module.exports.Command = Command;
}());