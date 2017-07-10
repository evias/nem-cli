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

var InputCore = require("./core/console-input.js").ConsoleInput;
var ConsoleInput = new InputCore();

var run = function() {
    console.log("------------------------------------------------------------------------");
    console.log("--                      NEM Utils by eVias                            --");
    console.log("------------------------------------------------------------------------");
    console.log("");

    console.log("  [1] - Read Account Transaction Count");
    console.log("  [2] - Read Recent Account Transactions");
    console.log("  [3] - Read Mosaic Definitions for Namespace");
    console.log("  [4] - Read Account Balances");

    ConsoleInput.ask("Please select a Module", /[1-4]/, function(input) {

        var Command = null;
        var container = null;
        if (input === '1') {
            Command = require("./scripts/account_trx_count").Command;
        } else if (input == '2') {
            Command = require("./scripts/account_trx_recent").Command;
        } else if (input == '3') {
            Command = require("./scripts/mosaics_get_definitions").Command;
        } else if (input == '4') {
            Command = require("./scripts/account_balances").Command;
        }
        container = new Command(ConsoleInput);
        return container.run();
    });
};

run();