import {initMixin} from './init.js'
function Vue(options){
    //内部进行初始化的操作
    this._init(options);//初始化操作
}
initMixin(Vue)  //添加原型的方法
//组件的初始化
export default Vue;