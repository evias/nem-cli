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

        this.signature = "api";
        this.description = "This tool lets you execute a NIS API request on a NEM node.";

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `nem-cli.js api` command."
        }, {
            "signature": "-P, --post",
            "description": "Send a POST method HTTP request to the NIS API."
        }, {
            "signature": "-j, --json <body>",
            "description": "Add a JSON body to your NIS API request (application/json)."
        }, {
            "signature": "-u, --url <url>",
            "description": "Set the URL of a NIS endpoint for your NIS API request."
        }, {
            "signature": "-p, --params <query>",
            "description": "Add parameters to the Body of your NIS API request (application/x-www-form-urlencoded)."
        }];

        this.examples = [
            "nem-cli api --url /chain/height",
            "nem-cli api --url /chain/height --network testnet",
            "nem-cli api --url /chain/height --node bigalice2.nem.ninja",
            "nem-cli api --url /account/get?address=TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ",
            "nem-cli api --url /block/at/public --post --json '{\"height\": 1149971}'",
            "nem-cli api --url /heartbeat --node alice7.nem.ninja"
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

        let isPost  = env.post === true;
        let hasJson = env.json !== undefined;
        let hasParams = env.params !== undefined;
        let apiUrl  = env.url;
        let hasHelp = env.help === true;
        let isVerbose = env.verbose === true;

        if (!apiUrl) {
            self.help();
            return self.end();
        }

        // build the HTTP request dump
        // Headers and Body will be prepared in this block.

        let method = isPost ? "POST" : "GET";
        let headers = {};

        if (hasJson) {
            // append Content-Type and Content-Length headers and JSON body.
            headers = {
                "Content-Type": "application/json",
                "Content-Length": env.json.length
            };
        }
        else if (hasParams) {
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": env.params.length
            };
        }

        let body = "";
        if (hasJson)
            //XXX validate JSON ?
            body = env.json;
        else if (hasParams)
            //XXX validate parameters query
            body = env.params;

        // Done preparing HTTP request.

        if ("GET" === method) {
            this.apiGet(apiUrl, body, headers, function(response)
                {
                    //XXX beautify response output
                    console.log(response);
                    return self.end() 
                });
        }
        else if ("POST" === method) {
            this.apiPost(apiUrl, body, headers, function(response)
                {
                    //XXX beautify response output
                    console.log(response);
                    return self.end() 
                });
        }
    }

    /**
     * This method is a NIS API Wrapper helper method that will
     * send a GET Request to the configured `this.node`.
     * 
     * @param   {string}    url         NIS API URI (/chain/height, /block/at/public, etc.)
     * @param   {string}    body        HTTP Request Body (JSON)
     * @param   {object}    headers     HTTP Headers
     * @param   {Function}  callback    Success callback
     */
    apiGet(url, body, headers, callback) {
        if (this.argv.verbose)
            this.dumpRequest("GET", url, body, headers)

        var wrapData = {
            url: this.node.host + ":" + this.node.port + url,
            headers: headers,
            method: 'GET'
        };

        if (body && body.length)
            wrapData.json = JSON.parse(body);

        Request(wrapData, function(error, response, body) {
            let res = response.toJSON();
            return callback(res.body);
        });
    }

    /**
     * This method is a NIS API Wrapper helper method that will
     * send a POST Request to the configured `this.node`.
     *
     * @param   {string}    url         NIS API URI (/chain/height, /block/at/public, etc.)
     * @param   {string}    body        HTTP Request Body (JSON)
     * @param   {object}    headers     HTTP Headers
     * @param   {Function}  callback    Success callback
     * @return  void
     */
    apiPost(url, body, headers, callback) {
        if (this.argv.verbose)
            this.dumpRequest("POST", url, body, headers)

        var wrapData = {
            url: this.node.host + ":" + this.node.port + url,
            headers: headers,
            method: 'POST'
        };

        if (body && body.length)
            wrapData.json = JSON.parse(body);

        Request(wrapData, function(error, response, body) {
            let res = response.toJSON();
            return callback(res.body);
        });
    }

    /**
     * This method will display a dump of the HTTP request that 
     * *will* be sent.
     *
     * The `dumpRequest()` method should be called only when the 
     * `--verbose` command line argument has been passed.
     * 
     * @param   {string}    method      The HTTP Method (GET|POST)
     * @param   {string}    url         NIS API URI (/chain/height, /block/at/public, etc.)
     * @param   {string}    body        HTTP Request Body (JSON)
     * @param   {object}    headers     HTTP Headers
     * @param   {Function}  callback    Success callback
     * @return  void
     */
    dumpRequest(method, url, body, headers, noBeautify) {
        if (noBeautify === undefined) noBeautify = false;

        let wrapper = method + " " + url + " HTTP/1.1" + "\n"
                    + "User-Agent: evias/" + this.npmPackage.name + " v" + this.npmPackage.version + "\n"
                    + "Host: " + this.conn.getHost(false);

        console.log("");

        if (!noBeautify)
            console.log("---------------------------------------------------");

        console.log(wrapper);

        for (let key in headers)
            console.log(key + ": " + headers[key]);

        console.log(""); // HEADER-BODY separator
        console.log(body);

        if (!noBeautify)
            console.log("---------------------------------------------------");

        console.log("");
    }

    /**
     * This method will end the current command process.
     *
     * @return void
     */
    end() {
        process.exit();
    }
}

exports.Command = Command;
export default Command;
