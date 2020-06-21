import {initState} from './state.js'
export function initMixin(Vue){
    Vue.prototype._init = function(options){
        // console.log(options)
        //Vue内部的$options 就是用户传递的所有参数
        const vm = this;
        vm.$options = options;//用户传入的参数
        //options.data props watch computed  //状态
        initState(vm);//初始化状态
    }
}