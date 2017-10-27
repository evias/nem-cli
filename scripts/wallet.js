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
import NIS from "./api";
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
            "signature": "-a, --address <address>",
            "description": "Set the current wallet by address."
        }, {
            "signature": "-w, --watch",
            "description": "Watch a wallet's transactions and balances."
        }, {
            "signature": "-o, --overview",
            "description": "Get the overview of a given wallet."
        }, {
            "signature": "-b, --balances",
            "description": "Get the account balances of a given wallet."
        }, {
            "signature": "-l, --latest",
            "description": "Get the latest transactions of a given wallet."
        }, {
            "signature": "-e, --export [flags]",
            "description": "Create a .wlt file export of the said wallet (This will need a private key or password)."
        }, {
            "signature": "-f, --file <wltfile>",
            "description": "Open a wallet through a .wlt file backup (This will need a password)."
        }];

        this.examples = [
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --overview",
            "nem-cli wallet --file /home/alice/Downloads/alices_wallet.wlt --overview",
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --watch",
            "nem-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --export",
        ];

        this.wallet = undefined;
        this.addresses = {};
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

        this.wallet = this.loadWallet();

        if (!this.wallet) {
            self.help();
            return self.end();
        }

        // Wallet now loaded, should provide with a Menu or Table content

        if (env.overview)
            // --overview
            return this.accountOverview(this.wallet.accounts["0"].address);
        else if (env.balances)
            // --balances
            return this.accountBalances(this.wallet.accounts["0"].address);
        else if (env.latest)
            // --latest
            return this.latestTransactions(this.wallet.accounts["0"].address);

        // the end-user has not specified `--overview`, `--balances` or 
        // `--latest` command line arguments.

        // we will now display a menu so that the user can pick which 
        // wallet address should be selected and which sub command must
        // be executed.

        if (Object.keys(this.wallet.accounts).length === 1) {
            // only one account available, show menu directly.

            this.addressMenu(this.wallet.accounts["0"].address);
        }
        else {
            // show an account selector for multiple accounts wallet

            this.showAccountSelector(function(response)
            {
                //let idx = response.selectedIndex;
                let addr = response.replace(/^([^:]+:\s?)/, '');
                self.addressMenu(addr);
            });
        }
    }

    /**
     * This method will display the Wallet command's Main Menu.
     * 
     * This lets the user choose between different Actions related
     * to the currently loaded Wallet.
     */
    addressMenu(address) {
        let self = this;

        var ov = function() { self.accountOverview(address); };
        var ba = function() { self.accountBalances(address); };
        var tx = function() { self.recentTransactions(address); };

        this.displayMenu("Wallet Utilities", {
            "0": {title: "Account Overview", callback: ov},
            "1": {title: "Account Balances", callback: ba},
            "2": {title: "Recent Transactions", callback: tx}
        }, function() { self.end(); }, true);
    }

    /**
     * This method will show a list of address from which the end-user 
     * has to select the wanted wallet.
     */
    showAccountSelector(selectedCallback) {
        let self = this;

        for (let i = 0, m = Object.keys(this.wallet.accounts).length; i < m; i++) {
            this.addresses[i] = {
                title: this.wallet.accounts[i].label + ": " + this.wallet.accounts[i].address,
                callback: selectedCallback
            };
        }

        this.displayMenu("Select an Address", this.addresses, function() { self.mainMenu(); }, false);
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

    /**
     * This method will display an account overview for the 
     * currently loaded wallet.
     * 
     * The overview includes wallet balances (mosaics), harvesting
     * status, latest transactions and other wallet informations
     */
    accountOverview(address) {
        let wrap = new NIS(this.npmPackage);
        wrap.init(this.argv);

        wrap.apiGet("/account/get?address=" + address, undefined, {}, function(nisResp)
        {
            let parsed = JSON.parse(nisResp);
            let beautified = JSONBeautifier.render(parsed, {
                keysColor: 'green',
                dashColor: 'green',
                stringColor: 'yellow'
            });

            console.log(beautified);
        });
    }

    /**
     * This method will display an account balances summary.
     * 
     * This should include all mosaics available for the given
     * account.
     */
    accountBalances(address) {
        let wrap = new NIS(this.npmPackage);
        wrap.init(this.argv);

        wrap.apiGet("/account/mosaic/owned?address=" + address, undefined, {}, function(nisResp)
        {
            let parsed = JSON.parse(nisResp);
            let beautified = JSONBeautifier.render(parsed, {
                keysColor: 'green',
                dashColor: 'green',
                stringColor: 'yellow'
            });

            console.log(beautified);
        });
    }

    /**
     * This method will display a list of latest transactions
     * for the currently loaded Wallet.
     */
    latestTransactions(address) {
        console.log("LATEST");
    }
}

exports.Command = Command;
export default Command;
