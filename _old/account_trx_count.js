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

                console.log("This can take some time, please be patient..");
                readTrxs_(address, nodeHost, null, printCount_);
            });
        };
    };

    var globalCnt = 0;
    var totalAmt = 0;
    var hasTrxs = {};
    var readTrxs_ = function(addr, host, lastId, doneCallback) {
        //console.log("[DEBUG] Issuing NIS request with lastId : " + lastId + "..");

        if (lastId === null)
            totalAmt = 0;

        var node = sdk.model.objects.create("endpoint")(host, 7890);
        sdk.com.requests.account.transactions.incoming(node, addr, null, lastId)
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
                    var lastHash = res.data[i].meta.hash.data;
                    if (hasTrxs.hasOwnProperty(lastId)) {
                        //console.log("[DEBUG] Found already Read: " + lastId + ".. Done.");
                        isDone = true;
                        break;
                    }

                    var transferType = sdk.model.transactionTypes.transfer;
                    var multisigType = sdk.model.transactionTypes.multisigTransaction;

                    var transactionType = res.data[i].transaction.type;
                    var isTypeRelevant = transactionType === transferType || transactionType === multisigType;

                    // if its multisig, check that the inner transaction is TRANSFER
                    if (transactionType === multisigType) {
                        isTypeRelevant &= res.data[i].transaction.otherTrans.type === transferType;
                    }

                    if (!isTypeRelevant) {
                        // transaction not relevant
                        console.log("[DEBUG] Skipping Transaction: " + JSON.stringify(res.data[i]));
                        continue;
                    }

                    var trxMicroXEM = getTrxRawAmount_(res.data[i], 'nem:xem');
                    //console.log("[DEBUG] Micro XEM Amount found: " + trxMicroXEM + " with transaction hash: " + lastHash);

                    //if (!trxMicroXEM)
                    //console.log("[DEBUG] 0 XEM Transaction: " + JSON.stringify(res.data[i]));

                    hasTrxs[lastId] = true;
                    totalAmt = totalAmt + trxMicroXEM;
                    globalCnt++;
                }

                if (isDone || cntTrx < 25) {
                    return doneCallback(globalCnt, totalAmt);
                }

                readTrxs_(addr, host, lastId, doneCallback);
            }, function(err) {
                console.log("error: ", err);
                return false;
            });
    };

    var getTrxRawAmount_ = function(trxMetaDataPair, currency) {
        if (!currency) currency = 'nem:xem';
        currency = currency.toLowerCase();

        var meta = trxMetaDataPair.meta;
        var content = trxMetaDataPair.transaction;

        var isMultisig = content.type === sdk.model.transactionTypes.multisigTransaction;

        // multisig tx have content in `transaction.otherTrans`
        var realContent = isMultisig ? content.otherTrans : content;
        var isMosaic = realContent.mosaics && realContent.mosaics.length > 0;

        var lookupNS = currency.replace(/:[^:]+$/, "");
        var lookupMos = currency.replace(/^[^:]+:/, "");

        if (isMosaic) {
            // from microXEM to XEM (amount is *multiplier*)
            var multiplier = realContent.amount / Math.pow(10, 6);

            // now look for XEM
            for (var i in realContent.mosaics) {
                var mosaic = realContent.mosaics[i];
                var isLookupMosaic = mosaic.mosaicId.namespaceId == lookupNS &&
                    mosaic.mosaicId.name == lookupMos;

                if (!isLookupMosaic)
                    continue;

                return multiplier * mosaic.quantity;
            }

            // no XEM in transaction.
            return 0;
        }

        if (currency !== 'nem:xem')
        // trying to read a Mosaic amount but none found
            return 0;

        // not a mosaic transer, `content.amount` is our XEM amount.
        return realContent.amount;
    };

    var printCount_ = function(countTotal, globalAmount) {
        console.log("Transactions Count: ");
        console.log("----------------------------------");
        console.log("Total Count: " + countTotal);
        console.log("Total Amount: " + (globalAmount / Math.pow(10, 6)).toFixed(6) + " XEM");
        console.log("----------------------------------");
        process.exit();
    };

    module.exports.Command = Command;
}());