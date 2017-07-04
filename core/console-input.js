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

(function() {

    var ConsoleInput = function(opts) {
        this.options_ = opts;

        this.ask = function(question, format, callback) {
            var self = this;
            var stdin = process.stdin,
                stdout = process.stdout;

            stdin.resume();
            stdout.write(question + ": ");

            stdin.once('data', function(data) {
                data = data.toString().trim();

                if (format && format.test(data)) {
                    callback(data);
                } else if (format) {
                    stdout.write("It should match: " + format + "\n");
                    self.ask(question, format, callback);
                }
            });
        };
    };

    module.exports.ConsoleInput = ConsoleInput;
}());