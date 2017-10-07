#!/usr/bin/env node

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

var InputCore = require("./core/console-input.js").ConsoleInput,
    ConsoleInput = new InputCore(),
    cli = require("commander"),
    fs = require("fs");

// get runtime information
var _package = JSON.parse(fs.readFileSync("package.json"));
var _scripts = fs.readdirSync(__dirname + "/scripts");
var _commands = {};
_scripts.forEach(function(filename) {
    var name = filename.replace(/\.js$/, '');
    _commands[name] = name;
});

var scriptWrapper = function(input) {
    if (!_commands.hasOwnProperty(input))
        return false;

    var cls = require(__dirname + "/scripts/" + input + ".js").Command;
    var ioc = new cls(ConsoleInput);
    return ioc;
}

// configure command line interpreter
cli.version(_package.version)
    .option("-e, --endpoint [endpoint]", "Set custom [endpoint] URL", /(https?:\/\/)?([a-z0-9\-_]):([0-9]+)/i)
    .option("-n, --network", "Set network (Mainnet|Testnet|Mijin)", /^(mainnet|testnet|mijin)/i);

cli.command("list")
    .description("List all available commands")
    .action(function(env, opts) {
        console.log("------------------------------------------------------------------------");
        console.log("--                      NEM CLI by eVias                              --");
        console.log("------------------------------------------------------------------------");
        console.log("");
        console.log("  Available Commands:");
        console.log("");

        Object.getOwnPropertyNames(_commands).forEach(function(command) {
            console.log("    " + command + "");
        });
        console.log("");
    });

// defines commander commands for the available commands (scripts/*.js)
Object.getOwnPropertyNames(_commands).forEach(function(command) {
    cli.command(command)
        .description("run command [" + command + "]")
        .action(function(env, opts) {
            var cmd = scriptWrapper(command);
            return cmd.run();
        });
});

cli.parse(process.argv);