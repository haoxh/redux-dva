export function isGenerator(obj) {
    return 'function' === typeof obj.next && 'function' === typeof obj.throw
}
export function isPromise(obj){
    return obj instanceof Promise || 'function' === typeof obj.then
}
export function isObject(value){
    return ({}).toString.call(value) === '[object Object]'
}