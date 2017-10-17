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
"use strict";

var ConsoleInput = require("../core/console-input").ConsoleInput;

class BaseCommand {

    constructor() {
        this.signature = "";
        this.description = "";

        this.options = [];
        this.io = new ConsoleInput();
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
