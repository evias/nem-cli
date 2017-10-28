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

import * as URLSearchParams from "url";
var Menu = require("simple-terminal-menu");
var Table = require("easy-table");
var chalk = require("chalk");

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
        this.argv = {};
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

        const warning = chalk.red;
        const keyword = chalk.yellow;
        const label = chalk.green;
        const normal = chalk.reset;
        const log = console.log;

        log("")
        log("  " + label("Usage: ") + keyword("nem-cli " + this.signature + " [options]"));
        log("");
        log("  " + label("Description:"));
        log("");
        log(normal(this.description));
        log("");

        log("");
        log("  " + label("Options: "));

        log("");
        log("    " + keyword("-n, --node [node]") + normal("\t\tSet custom [node] for NIS API"));
        log("    " + keyword("-p, --port [port]") + normal("\t\tSet custom [port] for NIS API"));
        log("    " + keyword("-N, --network [network]") + normal("\t\tSet network (Mainnet|Testnet|Mijin)"));
        log("    " + keyword("-S, --force-ssl") + normal("\t\tUse SSL (HTTPS)"));
        log("    " + keyword("-d, --verbose") + normal("\t\tSet verbose command execution (more logs)"));
        log("");

        for (let i = 0; i < this.options.length; i++) {
            let opt = this.options[i];
            log("    " + keyword(opt.signature) + normal("\t\t" + opt.description));
        }
        log("");

        if (this.examples.length) {
            log("");
            log("  " + label("Examples: "));
            log("");
            for (let j = 0; j < this.examples.length; j++) {
                let example = this.examples[j];
                log("    $ " + example);
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
     * @param   {string}    subcommand
     * @param   {object}    opts
     * @return  {void}
     */
    run(subcommand, opts) {
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
        this.network = network;
        this.networkId = this.SDK.model.network.data[network];
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

    /**
     * The switchNetworkByQS method will identify potential a `address`
     * parameter in the query string of the URL provided.
     *
     * @param {string} url 
     */
    switchNetworkByQS(url) {

        let hasQuery = url && url.length ? url.match(/\?[a-z0-9=_\-\+%]+$/i) : false;
        if (! hasQuery)
            return "testnet";

        // most common use case: endpoint?address=..
        let query = url.replace(/(.*)(\?[a-z0-9=_\-\+%]+)$/i, "$2");
        let urlParams = new URLSearchParams(query);

        if (urlParams.has("address")) {
            // address parameter found, we will determine the network by 
            // the address parameter whenever an address is identified.

            let addr = urlParams.get("address");
            return this.setNetworkByAddress(addr);
        }
    }

    /**
     * Switch the currently set NEM NETWORK to the one retrieved
     * from the given `address`.
     *  
     * @param {String} address  NEM Wallet Address
     */
    switchNetworkByAddress(address) {
        let network = this.conn.getNetworkForAddress(address);
        if (network != this.network)
            // re-init with new network identified by address.
            this.init({"network": network});
    }

    /**
     * This method will display a terminal menu with
     * the given `items`. Items will be indexed, the
     * `items` parameter should be an array with choices
     * texts.
     * 
     * @param {Array} items 
     */
    displayMenu(menuTitle, items, quitCallback, addQuit, cbParams) {
        let self = this;

        let menu = new Menu({
            x: 3,
            y: 2
        });
        menu.writeTitle("NEM CLI v" + this.npmPackage.version);
        menu.writeSubtitle(menuTitle);
        menu.writeSeparator();

        for (let i = 0, m = Object.keys(items).length; i < m; i++) {
            let choice = items[i].title;
            let c = choice.substr(0, 1);

            // add menu item with callback
            menu.add(choice, items[i].callback);
        }

        if (addQuit === true) {
            menu.add("Quit", function() { 
                menu.close(); 
                return quitCallback ? quitCallback() : null; 
            });
        }
    }

    /**
     * This method will display a table in the terminal.
     * 
     * The arguments `headers` and `rows` are mandatory. The
     * `headers` array should have keys representing row field
     * names and values representing header titles.
     * 
     * @param {*} headers 
     * @param {*} rows 
     */
    displayTable(title, headers, data) {
        let self = this;
        let table = new Table();

        if (typeof data === 'object' && data.length) {
            // isArray
            data.forEach(function(row) {
                self.addRow(table, headers, row);
            });
        }
        else {
            self.addRow(table, headers, data);
        }
 
        console.log("");
        console.log(' ' + title + ' ');
        console.log("");
        console.log(table.toString());
    }

    /**
     * This method will check the type of data that is 
     * currently being added and will format (color) the
     * text accordingly.
     * 
     * @see chalk
     * @see easy-table
     * @param {Table} table 
     * @param {Array} fields 
     * @param {Object} data 
     */
    addRow(table, headers, data) {
        let fields = Object.keys(headers);
        for (let f in fields) {
            let field  = fields[f];
            let header = headers[field];

            let value = data[field];
            if (typeof value === 'boolean')
                // YES/NO flags
                value = value === true ? chalk.green("YES") : chalk.red("NO")
            else if (typeof value === 'number')
                // numbers
                value = chalk.yellow(value);
            else if (typeof value === 'string'
                    && (parseFloat(value) == value
                        || parseInt(value) == value)) {
                // numbers (but not typed right)
                value = chalk.yellow(value);
            }

            table.cell(header, value);
        }

        table.newRow();
        return table;
    }
}

exports.BaseCommand = BaseCommand;
export default BaseCommand;
