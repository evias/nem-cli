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
    var network = null;

    var Command = function(ConsoleInput) {
        this.run = function() {
            console.log("");
            ConsoleInput.ask("Your XEM Address", /[A-Z\-0-9]+/, function(address) {
                var nodeChar = address.substr(0, 1);
                var nodeHost = "http://bigalice2.nem.ninja";
                network = sdk.model.network.data.testnet;
                if (nodeChar === 'N') {
                    nodeHost = "http://hugealice.nem.ninja";
                    network = sdk.model.network.data.mainnet;
                } else if (nodeChar === 'M') {
                    nodeHost = "http://127.0.0.1"; //XXX insert mijin node
                    network = sdk.model.network.data.mijin;
                }

                address = address.replace(/-/g, '');
                readTrxs_(address, nodeHost, null, printTrxs_, true);
            });
        };
    };

    var nemEpoch = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
    var globalCnt = 0;
    var hasTrxs = {};
    var byDate = [];

    var nemTrxDateCompare_ = function(a, b) {
        if (a.transaction.timeStamp < b.transaction.timeStamp) return -1;
        if (a.transaction.timeStamp > b.transaction.timeStamp) return 1;

        return 0;
    };

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
                    byDate.push(res.data[i]);

                    globalCnt++;
                }

                if (isDone || cntTrx < 25) {
                    byDate.sort(nemTrxDateCompare_).reverse();
                    return doneCallback(addr, byDate);
                }

                readTrxs_(addr, host, lastId, doneCallback);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    var printTrxs_ = function(address, transactions) {
        console.log("Recent Transactions: ");
        console.log("----------------------------------");

        for (var i = 0; i < transactions.length; i++) {
            var metaDataPair = transactions[i];

            var meta = metaDataPair.meta;
            var content = metaDataPair.transaction;
            var isMultiSig = content.type === sdk.model.transactionTypes.multisigTransaction;
            var realContent = isMultiSig ? content.otherTrans : content;
            var isIncome = realContent.recipient == address;
            var totalFee = isMultiSig ? content.fee + realContent.fee : realContent.fee;

            var trxId = meta.id;
            var trxHash = meta.hash.data;
            if (meta.innerHash.data && meta.innerHash.data.length)
                trxHash = meta.innerHash.data;

            var nemTime = realContent.timeStamp;
            var trxDate = new Date(nemEpoch + (nemTime * 1000));
            var fmtDate = trxDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
            var recipient = realContent.recipient;
            var xemAmount = isIncome ? (realContent.amount / Math.pow(10, 6)).toFixed(6) : (totalFee / Math.pow(10, 6)).toFixed(6);
            //XXX add mosaics listing

            if (!isIncome)
                xemAmount = "-" + xemAmount;

            console.log("- " + "ID: " + trxId + ", Amount: " + xemAmount + " XEM" + ", Hash: " + trxHash + ", Recipient: " + recipient + ", Time: " + trxDate);
        }
        console.log("----------------------------------");
        process.exit();
    };

    module.exports.Command = Command;
}());