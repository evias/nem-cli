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

var BaseCommand = require("../core/command").BaseCommand;

class Command extends BaseCommand {

    constructor(npmPack) {
        super(npmPack);

        this.signature = "api";
        this.description = "Execute a NIS API request on a NEM node.";

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `nem-cli.js api` command."
        }, {
            "signature": "-P, --post",
            "description": "Send a POST method HTTP request to the NIS API."
        }, {
            "signature": "-j, --json <body>",
            "description": "Add a JSON body to your NIS API request."
        }, {
            "signature": "-u, --url <url>",
            "description": "Set the URL of a NIS endpoint for your NIS API request."
        }];
    }

    help() {
        console.log("  Examples:");
        console.log("");
        console.log("    $ ./nem-cli api --url /chain/height")
        console.log("    $ ./nem-cli api --url /chain/height --network testnet")
        console.log("    $ ./nem-cli api --url /chain/height --node bigalice2.nem.ninja")
        console.log("    $ ./nem-cli api --url /account/get?address=TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ");
        console.log("    $ ./nem-cli api --url /block/at/public --post --json \"\{height: 1149971\}\"");
    }

    run(env) {

        let self = this;

        let isPost  = env.post === true;
        let hasJson = env.json !== undefined;
        let apiUrl  = env.url;
        let hasHelp = env.help === true;

        if (!isPost && !hasJson && !apiUrl) {
            self.help();
            return self.end();
        }

        // build the HTTP request dump
        let method = isPost ? "POST" : "GET";
        let wrapper = method + " " + apiUrl + " HTTP/1.1" + "\r\n"
                    + "User-Agent: evias/" + this.npmPackage.name + " v" + this.npmPackage.version + "\r\n"
                    + "Host: " + this.conn.getHost(false) + "\r\n";

        if (hasJson) {
            // append Content-Type and Content-Length headers and JSON body.
            wrapper = wrapper 
                    + "Content-Type: application/json" + "\r\n"
                    + "Content-Length: " + env.json.length + "\r\n";
        }

        wrapper += "\r\n"; // HEADER-BODY separator

        if (hasJson) {
            wrapper += env.json;
        }
        //XXX else if (hasPostParams)

        console.log("");
        console.log("Will now execute following NIS API " + method + " Request: ");
        console.log("---------------------------------------------------");
        console.log(wrapper);
        console.log("---------------------------------------------------");
        console.log("");

        //XXX --force || this.io.ask() for confirmation
        //XXX execute request

        return this.end();
    }

    end() {
        process.exit();
    }
}

exports.Command = Command;
export default Command;
