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
            ConsoleInput.ask("Enter Public Key", /[A-Z\-0-9]+/, function(pubKey) {

                var mijin = sdk.utils.format.pubToAddress(pubKey, sdk.model.network.data.mijin.id);
                var testn = sdk.utils.format.pubToAddress(pubKey, sdk.model.network.data.testnet.id);
                var mainn = sdk.utils.format.pubToAddress(pubKey, sdk.model.network.data.mainnet.id);

                console.log("Mainnet Address: " + mainn);
                console.log("Testnet Address: " + testn);
                console.log("Mijin Address: " + mijin);

                return endJob_();
            });
        };
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());