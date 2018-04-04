/**
 * @file Asynchronous, callback-based Array mapping.
 *
 *       Benefits:
 *          1) Not inherently Promise-based; decent performance
 *            1.1) Easy to Promisify with any Promise library
 *          2) No async/await; works as far back as Node v4.8.4 ("let" keyword)
 *
 *       Drawbacks:
 *          1) An extra dependency
 *          2) (Probably) less elegant than Array.prototype.map with Promises
 */
'use strict';


/**
 * The function executed on each element in the specified array.
 * @callback eachFn
 * @param {Array}    accumulator An accumulator array
 * @param {*}        element     The current element in the specified array
 * @param {Function} next        A function to be called when ready to move on
 *                               to the next element in the sequence
 */


/**
 * The function executed when the sequence is completed.
 * @callback doneFn
 * @param {Array} results
 */


/**
 * Executes a callback function on each element in a specified array.
 * Executes a second callback function when the sequence is complete.
 * @param {Array}  arr  The base array to operate on
 * @param {eachFn} each The function to execute on each element of the array
 * @param {doneFn} done The callback function to execute when finished
 * @example
 *    // Mimicking Array.prototype.map
 *    let nums = [ 1, 2, 3, 4, 5 ];
 *
 *    // [ 2, 4, 6, 8, 10 ]
 *    sequence(nums, function(results, num, next) {
 *      results.push(num * 2);
 *      next();
 *    }, console.log);
 * @example
 *    // Promisified version of the above
 *    let nums = [ 1, 2, 3, 4, 5 ];
 *
 *    let p = new Promise(function(resolve, reject) {
 *      sequence(nums, function(results, num, next) {
 *        results.push(num * 2);
 *        next();
 *      }, resolve);
 *    });
 *
 *    // [ 2, 4, 6, 8, 10 ]
 *    p.then(console.log);
 * @example
 *    // Promisified version of the above with rejection handling
 *    let nums = [ 1, 2, 3, 4, 5 ];
 *
 *    let p = new Promise(function(resolve, reject) {
 *      sequence(nums, function(results, num, next) {
 *        let result = num * 2;
 *
 *        if (result >= 10) {
 *           reject(new RangeError('Result value larger than ten'));
 *        }
 *
 *        results.push(result);
 *        next();
 *      }, resolve);
 *    });
 *
 *    p.then(console.log).catch(console.error);
 * @example
 *    // Performing some type of sequential file I/O operation
 *    let files = fs.readdirSync(path.join(__dirname, 'files'));
 *
 *    // [sort file names into whichever order is necessary]
 *
 *    sequence(files, (results, file, next) => {
 *      // [do something with each file in sequence]
 *      next();
 *    }, (results) => {
 *      console.log('Operation completed');
 *    });
 */
module.exports = function sequence(arr, each, done) {
  let accumulator = [],
      length = arr.length,
      index;

  (function next(arr, i) {
    index = i || 0;
    if (index < length) {
      process.nextTick(() => {
        each(accumulator, arr[index], ((arr, i) => {
          return function() {
            next(arr, i);
          };
        })(arr, ++index));
      });
    } else {
      process.nextTick(() => {
        done(accumulator);
      });
    }
  })(arr);
};
