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

import BaseCommand from "../core/command";
import Request from "request";
import * as JSONBeautifier from "prettyjson";
import * as fs from "fs";
import * as Table from "easy-table";

class Command extends BaseCommand {

    /**
     * Configure this API client instance.
     *
     * We also configure options for this command.
     *
     * @param {object}  npmPack
     */
    constructor(npmPack) {
        super(npmPack);

        this.signature = "wallet";
        this.description = ("    " + "This tool lets you read data of NEM blockchain wallets.\n"
                    + "    " + "Specify the address of the wallet with --address to get started.\n\n"
                    + "    " + "Example: nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ");

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `nem-cli.js wallet` command."
        }, {
            "signature": "-a, --address <wltfile>",
            "description": "Open a wallet by address."
        }, {
            "signature": "-w, --watch",
            "description": "Watch a wallet's transactions and balances."
        }, {
            "signature": "-s, --summary",
            "description": "Get the summary (Overview) of a given wallet."
        }, {
            "signature": "-e, --export [flags]",
            "description": "Create a .wlt file export of the said wallet (This will need a private key or password)."
        }, {
            "signature": "-f, --file <wltfile>",
            "description": "Open a wallet through a .wlt file backup (This will need a password)."
        }];

        this.examples = [
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --summary",
            "nem-cli wallet --file /home/alice/Downloads/alices_wallet.wlt --summary",
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --watch",
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --export",
        ];
    }

    /**
     * This method will run the NIS API Wrapper subcommand.
     *
     * The HTTP request will first be prepared and can be *displayed* with
     * the `--verbose` command line argument.
     *
     * There is currently *no confirmation* for the execution of HTTP Requests.
     *
     * @param   {object}    env
     * @return  void
     */
    run(env) {

        let self = this;

        let address  = env.address;
        let hasFile = env.file !== undefined;
        let isWatch = env.post === true;
        let isSummary = env.post === true;
        let isExport = env.export === true;
        let hasHelp = env.help === true;

        let wallet = this.loadWallet();

        if (!wallet) {
            self.help();
            return self.end();
        }

        //XXX
        let beautified = JSONBeautifier.render(wallet, {
            keysColor: 'green',
            dashColor: 'green',
            stringColor: 'yellow'
        });
        console.log(beautified);

        this.end();
    }

    /**
     * This method will end the current command process.
     *
     * @return void
     */
    end() {
        process.exit();
    }

    /**
     * Load a NEM Wallet READ-ONLY Data using the given
     * command line arguments (--address and --file)
     * 
     * @return {Wallet|false}
     */
    loadWallet() {
        let params = this.argv;
        let wallet = false;
        if (this.argv.address && this.argv.address.length) {
            if (! this.SDK.model.address.isValid(this.argv.address))
                return false;

            this.switchNetworkByAddress(this.argv.address);

            wallet = {
                privateKey: undefined,
                name: "Default",
                accounts: {
                    "0": {
                        address: this.argv.address,
                        network: this.networkId,
                        label: "Default"
                    }
                }
            };
        }

        if (this.argv.file && this.argv.file.length) {
            // should read .wlt and provide multiple choice if available
            let b64 = fs.readFileSync(this.argv.file);
            let words = this.SDK.crypto.js.enc.Base64.parse(b64.toString());
            let plain = words.toString(this.SDK.crypto.js.enc.Utf8);

            wallet = JSON.parse(plain);

            if (wallet && wallet.accounts && Object.keys(wallet.accounts).length) {
                let addr = wallet.accounts[0].address;
                this.switchNetworkByAddress(addr);
            }
        }

        return wallet;
    }
}

exports.Command = Command;
export default Command;
