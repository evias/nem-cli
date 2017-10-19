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

class BaseCommand {

    constructor(_package) {
        this.signature = "";
        this.description = "";

        this.options = [];
        this.io = new ConsoleInput();
        this.npmPackage = _package;
    }

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

        let scheme = this.argv.ssl ? "https" : (nsch ? nsch : "http");

        // set connection object
        this.conn = new NEMNetworkConnection(network, scheme + "://" + node, port);
        this.SDK = this.conn.SDK;
    }

    getOptions() {
        return this.options;
    }
    
    getSignature() {
        return this.signature;
    }

    getDescription() {
        return this.description;
    }

    getInput() {
        return this.io;
    }

    help() {}
    run(env, options) {}
    end() {}
}

exports.BaseCommand = BaseCommand;
export default BaseCommand;
