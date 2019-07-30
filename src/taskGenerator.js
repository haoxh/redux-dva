
import {isGenerator,isPromise,isObject} from './utils'


// 让 yield 对应为异步方法时（返回 Promise）,执行完才执行下一行
// 这里实现了不需要 call 方法也可以执行异步方法 
function promiseQueue(call,promises){
  let type = Array.isArray(promises) ? 'array': isPromise(promises) ? 'promise': isObject(promises) ? 'object': void 0
  // 不支持 Set Map...
  if(!type) return
  if(type === 'promise') promises = [promises]
  let keys = Object.keys(promises)
  promises = Object.values(promises)
  promises && Promise.all(promises).then(
      onFulfilled.bind(this, call, 'reslove', type, keys),
      onFulfilled.bind(this, call, 'reject')
  ).catch(onFulfilled.bind(this, call, 'reject'))
}

// Promise.all 注册的函数，来触发 next 行为
function onFulfilled( call, fulfill, type, keys, res ) {
  if (!isGenerator(call)) return
  /** 默认：
      let [count,someName] = yield call([
          call(count,payload,1000)，
          call(someFunc,payload)
      ])
  */
  if(type === 'promise') {
      //实现  let count =  yield call(count,payload,1000)
      res = res && res[0]
  }else if(type === 'object'){
      /**
       * 实现
          const { count,someName} = yield call({
              count: call(count, payload, 1000),
              someName: call(someFunc, payload)
          })
      */
      let rel = {}
      keys.forEach((k,i)=> rel[k] = res[i])
      res = rel
  }
  let next = {}
  if (fulfill === 'reslove') {
      next = call.next(res)
  } else {
      // Promise.all reject 时
      next = call.throw(res)
  }
  if (!next.done) {
      taskGenerator(call,next.value)
  }
}

/**
* 对嵌套的 Generator 与 Promise 可以正常支持
* @param {*} call Generator 函数
* @param {*} value 
*/
export default function taskGenerator(call,value) {
  if (isGenerator(call)) {
      let isEffect = null
      let next = {}
      if(value) next.value = value
      while (!isEffect) {
          if (isGenerator(next)) {
              taskGenerator(next.value)
          } else if (next.value && (isPromise(next.value) || typeof next.value === 'object')) {
              // 可能有 Promise 时
              isEffect = null
              promiseQueue(call, next.value)
              break
          }else{
              // 执行 Generator 对应 yield 的表达式或函数
              // 将上一次的 值放入 
              next = call.next(next.value)
          }
          // next.done = true 停止执行 next
          isEffect = next.done
      }
  }
}