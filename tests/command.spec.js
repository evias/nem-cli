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
import BaseCommand from "../core/command";
var fs = require("fs"),
    chai = require("chai"),
    expect = chai.expect;

describe('BaseCommand Test Suite', function() {
    let _Command, _Package;

    beforeEach(function() {
        _Package = JSON.parse(fs.readFileSync(__dirname + "/../package.json"));
        _Command = new BaseCommand(_Package);
    });

    it("should throw exception on run()", function() {
        expect(function() { _Command.run() }).to.throw(
            "Please specify a run(env) method in your subclass of BaseCommand."
        );
    });

    it("should throw exception on end()", function() {
        expect(function() { _Command.end() }).to.throw(
            "Please specify a end() method in your subclass of BaseCommand."
        );
    });

    it("should set default values on init({})", function() {
        _Command.init({});

        expect(_Command.network).to.equal("testnet");
        expect(_Command.networkId).to.equal(-104);
    });

    it("should set overwrite values with options passed to init()", function() {
        _Command.init({network: "mainnet"});

        expect(_Command.network).to.equal("mainnet");
        expect(_Command.networkId).to.equal(104);
    });
});