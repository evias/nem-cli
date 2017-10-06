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
            ConsoleInput.ask("Enter NEM Timestamp", /[0-9]+/, function(nemTime) {

                var nemEpoch = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
                var utcTime = new Date(nemEpoch + (nemTime * 1000));

                console.log("UTC Time & Date: " + utcTime);
                return endJob_();
            });
        };
    };

    var endJob_ = function() {
        process.exit();
    };

    module.exports.Command = Command;
}());