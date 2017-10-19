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
import NEM from "nem-sdk";

class NEMNetworkConnection {

    /**
     * Construct a NEM network connection object.
     * 
     * This object will hold created utilities objects from the NEM-sdk
     * 
     * @param   {string|integer}    network
     * @param   {string}            host
     * @param   {integer}           port
     */
    constructor(network, host, port) {
        this.defaultNodes = {
            "mainnet": "hugealice.nem.ninja",
            "testnet": "bigalice2.nem.ninja"
        };

        this.SDK = NEM;

        this.networkId = 104;
        this.host = "hugealice.nem.ninja";
        this.port = 7890;

        this.setNetwork(network);
        this.setHost(host);
        this.setPort(port);
    }

    /**
     * Set properties of the objects using setter methods.
     * 
     * The `opts` object can contain 'network', 'node' and
     * 'port' values.
     * 
     * @param   {object}    opts    The NEM Connection object properties
     */
    setOptions(opts) {
        for (let key in Object.getOwnPropertyNames(opts)) {
            let val = opts[key];

            if ("network" === key) {
                this.setNetwork(val);
            }
            else if ("host" === key) {
                this.setHost(val);
            }
            else if ("port" === key) {
                this.setPort(val);
            }
        }

        return this;
    }

    /**
     * This method will configure the `networkId` property of this
     * NEM Network Connection instance.
     * 
     * The Network ID is used for various SDK and NIS APIs requests.
     * 
     * @param   {string}    network
     */
    setNetwork(network) {
        let netIds = {
            "mainnet": NEM.model.network.data.mainnet.id,
            "testnet": NEM.model.network.data.testnet.id,
            "mijin": NEM.model.network.data.mijin.id,
        };

        // identify parameter
        if (typeof network === 'string') {
            network = network.toLowerCase();
            if (netIds.hasOwnProperty(network)) {
                this.networkId = netIds[network];
                return this;
            }
        }
        else if (typeof network === "number" && parseInt(network)) {
            this.networkId = parseInt(network) ? parseInt(network) : netIds["testnet"];
            return this;
        }

        // could not identify network
        this.networkId = netIds["testnet"];
        return this;
    }

    /**
     * Set the NIS node host to be used for the NEM
     * Network Connection.
     * 
     * @param   {string}    host
     */
    setHost(host) {
        if (!host || !host.length)
            host = this.defaultNodes["testnet"];

        let nsch = host.match(/^http/) ? host.replace(/:\/\/.*/, '') : null;
        let node = host.replace(/https?:\/\//, '');
        let scheme = nsch ? nsch : "http";

        this.host = scheme + "://" + node;
        return this;
    }

    /**
     * Set the port for the NEM Network Connection
     * to the configured node.
     * 
     * @param   {integer}   post
     */
    setPort(port) {
        this.port = parseInt(port);
        return this;
    }

    getNetwork() { return this.networkId }
    getHost(scheme) { if (scheme === false) return this.host.replace(/https?:\/\//, ''); else return this.host }
    getPort() { return this.port }
}

exports.NEMNetworkConnection = NEMNetworkConnection;
export default NEMNetworkConnection;
