(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  //此处存放所有的工具方法
  function isObject(obj) {
    return _typeof(obj) == 'object' && obj !== null;
  }

  var oldArrayMethods = Array.prototype; //获取数组原型上的方法
  //创建一个全新的对象 可以找到数组原型上的方法，而且修改对象时不会影响原数组的原型方法
  // Object.create()方法会创建一个新对象，使用现有对象来提供新创建的对象的__proto__

  var arrayMethods = Object.create(oldArrayMethods);
  var methods = [//这七个方法都可以改变原数组
  'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
  methods.forEach(function (method) {
    //函数劫持 AOP
    console.log(method); // 这样就调用arrayMethods自身的方法，但是这样不会发生变化
    //于是就需要调用数组原来的方法，既函数劫持

    arrayMethods[method] = function () {
      //当用户调用数组的方法时 先执行我自己改造的逻辑 再执行数组默认的逻辑
      var ob = this.__ob__;
      console.log(ob);

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var result = oldArrayMethods[method].apply(this, args);
      var inserted; //push unshift splice 都可以新增属性 （新增的属性可能是一个对象类型）
      //内部还对数组中引用类型也做了一次劫持

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          //也是新增属性 可以修改 可以删除   [].splice(arr,1,'div')
          inserted = args.slice(2);
          break;
      }

      inserted && ob.observeArray(inserted); //观测数组中新增的每一项

      console.log('新增');
      return result;
    };
  });

  var Observer = /*#__PURE__*/function () {
    function Observer(data) {
      _classCallCheck(this, Observer);

      console.log(data); // 对数组索引进行拦截 性能差而且直接更改索引的方式并不多

      Object.defineProperty(data, '__ob__', {
        enumerable: false,
        configurable: false,
        value: this
      }); // data._ob_  = this;//可以在数据上获取_ob_这个属性 指代的是Observer的实例

      if (Array.isArray(data)) {
        //vue 如何对数组进行处理？数组用的是重写数组的方法 函数劫持
        //改变的数组方法就可以监控到了 改写了数组的原型链
        data.__proto__ = arrayMethods; //通过原型链 向上查找的方式
        //[{a:1}] =>arr[0].a = 100

        this.observeArray(data); //观测数组中的每一项 
      } else {
        this.walk(data); //可以对数据一步步的处理
      }
    } //检测数组中引用类型的方法


    _createClass(Observer, [{
      key: "observeArray",
      value: function observeArray(data) {
        for (var i = 0; i < data.length; i++) {
          observe(data[i]);
        }
      }
    }, {
      key: "walk",
      value: function walk(data) {
        //对象的循坏
        // console.log(Object.keys(data))
        Object.keys(data).forEach(function (key) {
          defineReactive(data, key, data[key]); //定义响应式的数据变化
          // console.log(key)
        });
      }
    }]);

    return Observer;
  }(); //vue2的性能 递归重写get和set 


  function defineReactive(data, key, value) {
    observe(value); //如果传入的值还是一个对象就做递归循环检测

    Object.defineProperty(data, key, {
      get: function get() {
        return value;
      },
      set: function set(newValue) {
        if (newValue === value) return;
        observe(newValue); //检测当前设置的值是否是一个对象 //有可能用户给的新值是一个对象

        value = newValue;
      }
    });
  }

  function observe(data) {
    //对象就是使用 defineProperty来实现响应式原理
    // console.log(data)
    //如果这个数据不是对象 或者是null 那就不用监控了
    if (!isObject(data)) {
      return;
    }

    if (data.__ob__ instanceof Observer) {
      //防止对象被重复观测
      return;
    } //对数据进行defineProperty  


    return new Observer(data); //可以看到当前数据是否被观测过
  }

  function initState(vm) {
    var opts = vm.$options;

    if (opts.props) ;

    if (opts.methods) ;

    if (opts.data) {
      initData(vm);
    } //computed ...watch

  }

  function initData(vm) {
    //数据响应式
    // console.log(vm.$options.data)
    var data = vm.$options.data; //vm._data检测后的数据

    data = vm._data = typeof data === 'function' ? data.call(vm) : data; //  console.log(data)
    //观测数据

    observe(data);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      // console.log(options)
      //Vue内部的$options 就是用户传递的所有参数
      var vm = this;
      vm.$options = options; //用户传入的参数
      //options.data props watch computed  //状态

      initState(vm); //初始化状态
    };
  }

  function Vue(options) {
    //内部进行初始化的操作
    this._init(options); //初始化操作

  }

  initMixin(Vue); //添加原型的方法

  return Vue;

})));
//# sourceMappingURL=vue.js.map
