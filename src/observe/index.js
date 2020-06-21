import {isObject} from '../utils.js'
import { arrayMethods } from './array'
 class Observer{
   constructor(data){
      console.log(data)
    // 对数组索引进行拦截 性能差而且直接更改索引的方式并不多
    Object.defineProperty(data,'__ob__',{
        enumerable:false,
        configurable:false,
        value:this
    })
    // data._ob_  = this;//可以在数据上获取_ob_这个属性 指代的是Observer的实例
    if(Array.isArray(data)){
        //vue 如何对数组进行处理？数组用的是重写数组的方法 函数劫持
        //改变的数组方法就可以监控到了 改写了数组的原型链
        data.__proto__ = arrayMethods;//通过原型链 向上查找的方式
        //[{a:1}] =>arr[0].a = 100
        this.observeArray(data);//观测数组中的每一项 
    }else{
        this.walk(data) //可以对数据一步步的处理
    }
   }
   //检测数组中引用类型的方法
   observeArray(data){
       for(let i=0;i<data.length;i++){
            observe(data[i])
       }
   }
   walk(data){
        //对象的循坏
        // console.log(Object.keys(data))
        Object.keys(data).forEach(key=>{
            defineReactive(data,key,data[key]);//定义响应式的数据变化
            // console.log(key)
        })
   }

}
//vue2的性能 递归重写get和set 
function defineReactive(data,key,value){
    observe(value);//如果传入的值还是一个对象就做递归循环检测
    Object.defineProperty(data,key,{
        get(){
            return value;
        },
        set(newValue){
             if(newValue=== value) return;
             observe(newValue);//检测当前设置的值是否是一个对象 //有可能用户给的新值是一个对象
            value = newValue
        }
    })
}
export function observe(data){
    //对象就是使用 defineProperty来实现响应式原理
    // console.log(data)
    //如果这个数据不是对象 或者是null 那就不用监控了
    if(!isObject(data)){
        return;
    }
    if(data.__ob__ instanceof Observer){  //防止对象被重复观测
         return;
    }
    //对数据进行defineProperty  
    return new Observer(data) //可以看到当前数据是否被观测过
   
}