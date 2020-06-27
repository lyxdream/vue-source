let oldArrayMethods = Array.prototype;//获取数组原型上的方法
//创建一个全新的对象 可以找到数组原型上的方法，而且修改对象时不会影响原数组的原型方法
// Object.create()方法会创建一个新对象，使用现有对象来提供新创建的对象的__proto__
export let arrayMethods = Object.create(oldArrayMethods);
let methods = [  //这七个方法都可以改变原数组
    'push',
    'pop',
    'shift',
    'unshift',
    'sort',
    'reverse',
    'splice'
]
methods.forEach(method =>{   //函数劫持 AOP
    console.log(method)
    // 这样就调用arrayMethods自身的方法，但是这样不会发生变化
    //于是就需要调用数组原来的方法，既函数劫持
    arrayMethods[method] = function(...args){
        //当用户调用数组的方法时 先执行我自己改造的逻辑 再执行数组默认的逻辑
        const ob = this.__ob__; 
        console.log(ob)
        let result =  oldArrayMethods[method].apply(this,args);
        let inserted;
        //push unshift splice 都可以新增属性 （新增的属性可能是一个对象类型）
        //内部还对数组中引用类型也做了一次劫持
        switch(method){
            case 'push':
            case 'unshift':
                  inserted = args;
                break;
            case 'splice':    //也是新增属性 可以修改 可以删除   [].splice(arr,1,'div')
                inserted = args.slice(2);
                break;
            default:
                break;
        }
        inserted&&ob.observeArray(inserted);//观测数组中新增的每一项
        console.log('新增')
        return result;

    }
})

