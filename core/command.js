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
"use strict";

import ConsoleInput from "./console-input";
import NEMNetworkConnection from "./nem-connection";

/**
 * The BaseCommand class will be extended by all scripts/*.js 
 * JS Command classes.
 *
 * This class is responsible for handling *command line arguments*
 * passed to the CLI as well as hold a *connection object*, an SDK
 * instance and a *node object*, which can all be used directly
 * in child classes.
 */
class BaseCommand {

    /**
     * Construct the BaseCommand object
     *
     * Default properties will be initialized with this 
     * constructor.
     *
     * @param {object} _package 
     */
    constructor(_package) {
        this.io = new ConsoleInput();
        this.npmPackage = _package;

        this.signature = "";
        this.description = "";

        this.options = [];
        this.examples = [];
    }

    /**
     * This method outputs the help message corresponding to
     * the `./nem-cli <command> --help` command.
     *
     * It will display a list of examples use cases of this API wrapper.
     * 
     * @return void
     */
    help() {
        console.log("------------------------------------------------------------------------");
        console.log("--                               NEM CLI                              --");
        console.log("------------------------------------------------------------------------");
        console.log("")
        console.log("  Usage: nem-cli " + this.signature + " [options]");
        console.log("");
        console.log("  Description:");
        console.log("");
        console.log("    " + this.description);
        console.log("");

        console.log("");
        console.log("  Options: ");

        console.log("");
        console.log("    -n, --node [node]\t\tSet custom [node] for NIS API");
        console.log("    -p, --port [port]\t\tSet custom [port] for NIS API");
        console.log("    -N, --network [network]\t\tSet network (Mainnet|Testnet|Mijin)");
        console.log("    -S, --force-ssl\t\tUse SSL (HTTPS)");
        console.log("    -d, --verbose\t\tSet verbose command execution (more logs)");
        console.log("");

        for (let i = 0; i < this.options.length; i++) {
            let opt = this.options[i];
            console.log("    " + opt.signature + "\t" + opt.description);
        }
        console.log("");

        if (this.examples.length) {
            console.log("");
            console.log("  Examples:");
            console.log("");
            for (let j = 0; j < this.examples.length; j++) {
                let example = this.examples[j];
                console.log("    $ " + example);
            }
        }
    }

    /**
     * This method should *execute* the action proper to the subcommand.
     *
     * Example:
     * 
     *     run(env) { console.log("Command running!"); }
     *
     * @return void
     */
    run(env) {
        throw new Error("Please specify a run(env) method in your subclass of BaseCommand.");
    }

    /**
     * This method should end the command execution process.
     * 
     * Example:
     * 
     *     end() { return process.exit(); }
     * 
     * @return void
     */
    end() {
        throw new Error("Please specify a end() method in your subclass of BaseCommand.");
    }

    /**
     * This method will initialize the *connection* object and
     * the SDK object as well as the node object (SDK endpoint).
     *
     * After this method has been called, the command can fully
     * interact with the NEM blockchain node.
     *
     * @param {object} options  Can contain keys "network", "node", "port", "forceSsl"
     */
    init(options) {
        this.argv = options;
        
        // prepare connection to NEM network
        let defaultNodes = {
            "mainnet": "hugealice.nem.ninja",
            "testnet": "bigalice2.nem.ninja"
        };

        let network = "testnet";
        let port = this.argv.port ? parseInt(this.argv.port) : 7890;
        let node = this.argv.node && this.argv.node.length ? this.argv.node : "bigalice2.nem.ninja";

        if (this.argv.network) {
            // --network has precedence over --node

            network = this.argv.network.toLowerCase();
            if (! defaultNodes.hasOwnProperty(network))
                network = "testnet";

            node =  defaultNodes[network];
        }

        let nsch = node.match(/^http/) ? node.replace(/:\/\/.*/, '') : null;
        node     = node.replace(/https?:\/\//, '');

        let scheme = this.argv.forceSsl ? "https" : (nsch ? nsch : "http");

        // set connection object
        this.conn = new NEMNetworkConnection(network, scheme + "://" + node, port);
        this.SDK  = this.conn.SDK;
        this.node = this.SDK.model.objects.create("endpoint")(this.conn.getHost(), this.conn.getPort());
    }

    /**
     * Getter for the `options` property.
     *
     * This property holds the commands' specific argument
     * line options.
     *
     * @return  {array}
     */
    getOptions() {
        return this.options;
    }

    /**
     * Getter for the `signature` property.
     *
     * The signature property explained:
     *
     *     $ ./nem-cli api
     *     $ ./nem-cli list
     * 
     * In these 2 examples, signatures are *api* and *list*.
     *
     * The signature is used to register a subcommand to the commander
     * arguments helper.
     *
     * @return  {string}
     */
    getSignature() {
        return this.signature;
    }

    /**
     * Getter for the `description` property.
     *
     * @return  {string}
     */
    getDescription() {
        return this.description;
    }

    /**
     * Getter for the `io` property.
     *
     * This property holds a helper for class `ConsoleInput`
     * such that input can be asked for from the terminal.
     *
     * @see     {ConsoleInput}
     * @return  {array}
     */
    getInput() {
        return this.io;
    }
}

exports.BaseCommand = BaseCommand;
export default BaseCommand;
