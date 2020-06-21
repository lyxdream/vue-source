import {observe} from './observe/index.js'
export function initState(vm){
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
    //computed ...watch
}
function initProps(){

}
function initMethod(){

}
function initData(vm){
    //数据响应式
    // console.log(vm.$options.data)
 let data = vm.$options.data;
 //vm._data检测后的数据
 data = vm._data = typeof data==='function' ?data.call(vm):data;
//  console.log(data)
 //观测数据
  observe(data);
}