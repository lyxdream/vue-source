import {observer} from './observer/index'   //node_resolve_plugin
import {isFunction} from './utils'
export function initState(vm){  //状态初始化
    // console.log(vm.$options,'--初始化状态')
    const opts = vm.$options;
    if(opts.props){
        initProps(vm)
    }
    if(opts.methods){
        initMethod(vm);
    }
    if(opts.data){
        initData(vm);
    }
}
function proxy(vm,source,key){
     Object.defineProperty(vm,key,{
         get(){

         },
         set(){

         }
     })   
}
function initProps(){

}
function initMethod(){

}
function initData(vm){
    let data = vm.$options.data;
    //数据响应式
    //vue2会将ata中的所有数据 进行数据劫持  Object.defineProperty
    //如果是函数就调用，不是函数就可能是对象，则直接赋值，call是为了保证this指向不会发生改变，永远指向Vue实例
    //通过_data进行关联vm和data  vm._data检测后的数据  
     data =vm._data = isFunction(data)?data.call(vm):data;
     for(let key in data){  //将_data上的属性全部代理给vm实例
         proxy(vm,'_data',key);
     }
     //观测数据
     observer(data);
     
}