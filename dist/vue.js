(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

    //此处存放所有的工具方法
    function isObject(obj) {
      return typeof obj == 'object' && obj !== null;
    }

    let oldArrayMethods = Array.prototype; //获取数组原型上的方法
    //创建一个全新的对象 可以找到数组原型上的方法，而且修改对象时不会影响原数组的原型方法
    // Object.create()方法会创建一个新对象，使用现有对象来提供新创建的对象的__proto__

    let arrayMethods = Object.create(oldArrayMethods);
    let methods = [//这七个方法都可以改变原数组
    'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
    methods.forEach(method => {
      //函数劫持 AOP
      // console.log(method)
      // 这样就调用arrayMethods自身的方法，但是这样不会发生变化
      //于是就需要调用数组原来的方法，既函数劫持
      arrayMethods[method] = function (...args) {
        //当用户调用数组的方法时 先执行我自己改造的逻辑 再执行数组默认的逻辑
        const ob = this.__ob__; // console.log(ob)

        let result = oldArrayMethods[method].apply(this, args);
        let inserted; //push unshift splice 都可以新增属性 （新增的属性可能是一个对象类型）
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
        // console.log('新增')

        return result;
      };
    });

    class Observer {
      constructor(data) {
        //   console.log(data)
        // 对数组索引进行拦截 性能差而且直接更改索引的方式并不多
        // data.__ob__  = this;//可以在数据上获取__ob__这个属性 指代的是Observer的实例
        //__ob__是一个响应式属性，对象数组都有
        Object.defineProperty(data, '__ob__', {
          enumerable: false,
          configurable: false,
          value: this
        });

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


      observeArray(data) {
        for (let i = 0; i < data.length; i++) {
          observe(data[i]);
        }
      }

      walk(data) {
        //对象的循坏
        // console.log(Object.keys(data))
        Object.keys(data).forEach(key => {
          defineReactive(data, key, data[key]); //定义响应式的数据变化
          // console.log(key)
        });
      }

    } //vue2的性能 递归重写get和set 


    function defineReactive(data, key, value) {
      observe(value); //如果传入的值还是一个对象就做递归循环检测

      Object.defineProperty(data, key, {
        get() {
          return value;
        },

        set(newValue) {
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
      const opts = vm.$options;

      if (opts.props) ;

      if (opts.methods) ;

      if (opts.data) {
        initData(vm);
      } //computed ...watch

    }

    function initData(vm) {
      //数据响应式
      // console.log(vm.$options.data)
      let data = vm.$options.data; //vm._data检测后的数据

      data = vm._data = typeof data === 'function' ? data.call(vm) : data; //  console.log(data)
      //观测数据

      observe(data);
    }

    //字母a-zA-Z_  - .数字_ 小写字母大写字母 
    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; //标签名
    //?:匹配不捕获 <aaa:aaa> 

    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名

    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
    //<div aaa ="123" bb=123 cc='123

    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的

    const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
    // v2.0只能有一个根节点  必须是html元素
    //currentParent = div
    //stack = []

    function parseHTML(html) {
      let root; //树根

      let currentParent; //当前元素ast

      let stack = []; //用来判断标签是否正常闭合 []解析器可以借助栈形结构
      //利用常见的数据结构来解析标签
      //根据 html 解析成树结构 <div id="app" style="color:red"><span>helloword {{msg}}</span></div>

      function createASTElement(tagName, attrs) {
        return {
          tag: tagName,
          attrs: attrs,
          children: [],
          parent: null,
          type: 1 //1元素节点  3 文本节点

        };
      }

      function start(tagName, attrs) {
        //开始标签  每次解析开始标签都会执行此方法
        let element = createASTElement(tagName, attrs);

        if (!root) {
          root = element; //只有第一次是根
          // console.log(root)
        } // currentParent = JSON.parse(JSON.stringify(element));//保存当前标签


        currentParent = element; //保存当前标签，当子级是文本标签的时候改变当前标签的children

        stack.push(element);
        console.log(stack); // console.log(tagName,attrs)
      }

      function end(tagName) {
        //结束标签  确立父子关系
        // console.log(tagName)
        let element = stack.pop(); //stack中最后一位出栈,并返回

        if (tagName == element.tag) {
          //判断当前闭合的标签名和栈中最后一位是否一致
          let parent = stack[stack.length - 1]; //获取当前闭合元素父级

          if (parent) {
            element.parent = parent;
            stack[stack.length - 1].children.push(element);
          }
        } else {
          console.log('标签闭合有误！');
        }
      }

      function chars(text) {
        //文本标签
        // console.log(text)
        text = text.replace(/\s/g, '');

        if (text) {
          currentParent.children.push({
            //push进当前文本标签的父级元素
            type: 3,
            text
          });
        }
      }

      while (html) {
        let textend = html.indexOf('<');

        if (textend == 0) {
          const startTagMatch = parseStartTag(); // console.log(startTagMatch,html)

          if (startTagMatch) {
            //开始标签
            // console.log(startTagMatch,'开始')
            start(startTagMatch.tagName, startTagMatch.attrs);
          } //结束标签


          const endTagMatch = html.match(endTag);

          if (endTagMatch) {
            // console.log(endTagMatch)
            advance(endTagMatch[0].length);
            end(endTagMatch[1]);
          }
        } //如果不是0说明是文本


        let text;

        if (textend > 0) {
          text = html.substring(0, textend); //把文本内容进行截取
          // console.log(text)

          chars(text);
        }

        if (text) {
          advance(text.length); //删除文本内容
        }
      }

      function advance(n) {
        html = html.substring(n);
      }

      function parseStartTag() {
        const start = html.match(startTagOpen); //匹配<div>
        // console.log(start)

        if (start) {
          const match = {
            tagName: start[1],
            //匹配标签名
            attrs: []
          };
          advance(start[0].length); //截取开始标签后面的

          let end, attr;

          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length); //  console.log(attr)
            //双引号是第三项 单引号是第四项 

            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5]
            });
          } // console.log(html)


          if (end) {
            advance(end[0].length);
            return match;
          }
        }
      }

      return root;
    }

    function complieToFunctions(template) {
      // console.log(template)
      //实现模版编译的内容
      let ast = parseHTML(template); //解析html

      console.log(ast); //模版编译原理
      //1、将模版解析成AST语法树   (1)parser解析(正则)
      //2、遍历AST标记静态树       （2）树遍历标记 markup
      //3、使用AST生成渲染函数（render函数） codegen
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        // console.log(options)
        //Vue内部的$options 就是用户传递的所有参数
        const vm = this;
        vm.$options = options; //用户传入的参数
        //options.data props watch computed  //状态

        initState(vm); //初始化状态
        //需要通过模版进行渲染

        if (vm.$options.el) {
          //用户传入来el属性
          vm.$mount(vm.$options.el);
        }
      };

      Vue.prototype.$mount = function (el) {
        //可能是字符串 也可以传入一个dom对象
        const vm = this;
        el = document.querySelector(el); //获取el属性
        //如果同时传入 template 和render 默认会采用render 抛弃template,如果都没传就使用id="app"中的模版
        // console.log(el)

        const opts = vm.$options;

        if (!opts.render) {
          let template = opts.template;

          if (!template && el) {
            //应该使用外部模版
            // let div = document.createElement('div');
            // div.appendChild(el);
            // template = div.innerHTML;
            template = el.outerHTML;
          }

          const render = complieToFunctions(template);
          opts.render = render;
        } //走到这里说明不需要编译了，因为用户传入的就是一个render函数


        opts.render;
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
