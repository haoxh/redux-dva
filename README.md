# redux-dva

[在线的编辑地址](https://codesandbox.io/s/nervous-clarke-16idy)

安装

```sh
npm i -D @haoxh/redux-dva
```

使用

```js
import React, { Component } from 'react';
import {createStore, combineReducers,applyMiddleware} from 'redux'
import {Provider} from './react-redux'
import reduxDva from '@haoxh/redux-dva'
import counter from './counter'

// dva.createReducers([counter]) 已数组的方式注册 model
const CombineReducers = combineReducers(
    reduxDva.createReducers([counter])
  )
// 注册 dva中间件
const middleware = applyMiddleware(reduxDva.middleware)
const store = createStore(CombineReducers,middleware)

/**
使用：
App.js
// ...
store.dispatch({
    type:'counter/set',
    payload:{counter:++counter}
    callback:()=>{}
})
// ...
*/

class App extends Component {
  render() {
    return (
        <Provider store={store} >
            <App />
        </Provider>
    );
  }
}

```

```js
// counter.js
// 拥有 dva model 基本编程规则
export default {
    namespace: 'counter',
    state: {count:0},
    effects: {
      // 可使用 Generator，传入参数与 dva 基本一致
    	*set({payload, callback}, {call, put,select}) {
            // 实现 put 方法，功能与dva 基本一致，可调用本 model 或 其他  namespace model 的 reducers 方法
            // 实现 select 方法，与 dva 基本一致
            // 实现 call 方法，与 dva 基本一致
            // 需要兼容异步情况(只考虑 Promise 返回情况)，利用 Generator next 方法实现
            /** 
              支持语法：
              let count =  yield call(count,payload,1000)
              let {
                count,
                someName
              } = yield call({
                count: call(count, payload, 1000),
                someName: call(someFunc, payload)
              })
              let [count,someName] = yield call([
                call(count,payload,1000)，
                call(someFunc,payload)
              ])
              let [count,someName] = [
                call(count,payload,1000)，
                call(someFunc,payload)
              ]
            */
            const state = yield select((state)=> state)
            console.log(state)
            const data = yield call(count,payload)
            yield put('setProps',data)
            callback && callback()
        }
    },
    reducers: {
        // 与 dva 一致，这里直接 redux 中的 dispatch（中间件的 next 方法）
    	setProps(state,action){
    		return {...state,...action.payload}
    	}
    }
}

function count(data，delay){
    return new Promise((resolve,reject)=>{
        return setTimeout(_=>{
            resolve(data)
        },delay)
    })
}

```
