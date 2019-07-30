import taskGenerator from './taskGenerator'

function dva() {
    // dvaModels 存储 model
    let dvaModels = {}
    /**
     * 返回 { namespace: function (){//Reducer 方法} }
     * @param {Array} models 
     */
    function createReducers(models) {
        models.forEach(model => {
            // 已 model.namespace 为 key 的形式赋予 dvaModels 中
            dvaModels[model.namespace] = model
        })
        let reducerKeys = Object.keys(dvaModels)
        let reducer = {}
         // 生成 redux 的 combineReducers 使用的 reducer
        reducerKeys.forEach(key => {
            reducer[key] = (state, action, _key = key) => {
                let thatAtcion = dvaModels[_key]
                state = state || thatAtcion.state
                if (action.type === _key) {
                    return action.data
                }
                return state
            }
        })
        return reducer
    }
    /**
     * 触发 model对应 type 的 reducers 方法，并触发 中间件的 next（dispatch） 方法
     *  put('setProps':type,data:payload)
     * @param {*} target 
     * @param {*} next 
     * @param {*} type 
     * @param {*} payload 
     */
    function _put(target, next, type, payload) {
        let args = type.split('/')
        let reducerKey = args[0]
        if (args.length === 2) {
            target = args[0]
            reducerKey = args[1]
        }
        let reducer = dvaModels[target].reducers[reducerKey]
        if (typeof reducer === 'function') {
            let state = dvaModels[target].state
            dvaModels[target].state = reducer(state, {type,payload})
            next({
                type: target,
                data: dvaModels[target].state
            })
        }
    }
    /**
     *  可以触发异步函数，其实已经是实现了不用 call 也可以使用异步
     *  yield call(delay:fnDescriptor,arg1,arg2)
     * @param {*} fnDescriptor 
     * @param  {...any} args 
     */
    function _call(fnDescriptor, ...args) {
        if(typeof fnDescriptor === 'function'){
            return fnDescriptor(...args)
        }else if(fnDescriptor){
            return fnDescriptor
        }
    }
    /**
     *  callback 参数为所有 model 中的 state
     * const state = yield select((state)=> state)
     * @param {*} callback 
     */
    function _select(callback){
        if( typeof callback !== 'function') return
        let reducerKeys = Object.keys(dvaModels)
        let state ={}
        reducerKeys.forEach(item =>{
            state[item] = dvaModels[item].state
        })
       return callback(state)
    }
    /**
     * store.dispatch({
     *  type:'counter/set',
     *  payload:{counter:++counter}
     *  callback:()=>{}
     * })
     * @param {*} param0 
     * @param {*} next 
     */
    function _dispatch({type = '',payload = {},callback}, next) {
        let args = type.split('/')
        let target = dvaModels[args[0]]
        let effect = target.effects[args[1]]
        let Effect = effect && effect({payload,callback},{
            // args[0] = namespace
            // next = store.dispatch
            put: _put.bind(this, args[0], next),
            call: _call,
            select:_select
        })
        // 异步方法（使用Promise）在利用 Generator 函数实现同步（串行）执行
        Effect && taskGenerator(Effect)
    }

    const middleware = () => next => action => {
        _dispatch(action, next)
    }
    return {
        // 将 model 转成 redux reducer 形式
        createReducers,
        // dva 中间件
        middleware
    }
}
export default dva()