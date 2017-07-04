/**
 * Part of the evias/nem-utils package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under the MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    evias/nem-utils
 * @author     Grégory Saive <greg@evias.be> (https://github.com/evias) 
 * @license    MIT License
 * @copyright  (c) 2017, Grégory Saive
 */

var sdk = require("nem-sdk").default;
var address = "TCTIMURL5LPKNJYF3OB3ACQVAXO3GK5IU2BJMPSU";
var node = sdk.model.objects.create("endpoint")("http://bob.nem.ninja", 7890);

var globalCnt = 0;
var hasTrxs = {};
var readTrxs = function(addr, lastId, doneCallback) {
    sdk.com.requests.account.transactions.all(node, addr, null, lastId)
        .then(function(res) {
            if (res.code >= 2) {
                console.log("error: ", res);
                return false;
            }

            var isDone = false;
            var cntTrx = res.data.length;
            for (var i = 0; i < res.data.length; i++) {
                lastId = res.data[i].meta.id;
                if (hasTrxs.hasOwnProperty(lastId)) {
                    isDone = true;
                    break;
                }

                hasTrxs[lastId] = true;
                globalCnt++;
            }

            if (isDone || cntTrx < 25) {
                return doneCallback(globalCnt);
            }

            readTrxs(addr, lastId, doneCallback);
        });
};

readTrxs(address, null, function(countTotal) {
    console.log("count transactions: " + countTotal);
});
