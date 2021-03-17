
/**
 * Checks if object has all listed keys
 * @param {object} object Target object
 * @param {string[]} keys All keys, which will be checked
 * 
 * @returns Has all keys?
 */
const hasAllProperties = function (object, keys){
    for (k in keys) {
        // eslint-disable-next-line no-prototype-builtins
        if(!object.hasOwnProperty(keys[k])){
            return false
        }
    }
    return true
}

module.exports = {
    hasAllProperties
}