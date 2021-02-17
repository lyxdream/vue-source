# vue-source
This is a warehouse for handwritten Vue source code

## 一.开发环境搭建

 Rollup 是一个 JavaScript 模块打包器,可以将小块代码编译成大块复杂的代码， rollup.js更专注于Javascript类库打包 （开发应用时使用Wwebpack，开发库时使用Rollup
### 安装rollup环境
 
```
npm install @babel/preset-env @babel/core rollup rollup-plugin-babel rollup-plugin-serve cross-env -D
```
==rollup.config.js文件编写==

```js
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
export default {
    input: './src/index.js',
    output: {
        format: 'umd', // 模块化类型
        file: 'dist/umd/vue.js', 
        name: 'Vue', // 打包后的全局变量的名字
        sourcemap: true
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        process.env.ENV === 'development'?serve({
            open: true,
            openPage: '/public/index.html',
            port: 3000,
            contentBase: ''
        }):null
    ]
}
```
==配置.babelrc文件==

```js
{
    "presets": [
        "@babel/preset-env"
    ]
}
```
==执行脚本配置==

```js
"scripts": {
    "build:dev": "rollup -c",
    "serve": "cross-env ENV=development rollup -c -w"
}
```
## 二.Vue响应式原理

导出vue构造函数

```js
import {initMixin} from './init';

function Vue(options) {
    this._init(options);
}
initMixin(Vue); // 给原型上新增_init方法
export default Vue;
```

init方法中初始化vue状态

```js
import {initState} from './state';
export function initMixin(Vue){
    Vue.prototype._init = function (options) {
        const vm  = this;
        vm.$options = options
        // 初始化状态
        initState(vm)
    }
}
```

根据不同属性进行初始化操作

```js
export function initState(vm){
    const opts = vm.$options;
    if(opts.props){
        initProps(vm);
    }
    if(opts.methods){
        initMethod(vm);
    }
    if(opts.data){
        // 初始化data
        initData(vm);
    }
    if(opts.computed){
        initComputed(vm);
    }
    if(opts.watch){
        initWatch(vm);
    }
}
function initProps(){}
function initMethod(){}
function initData(){}
function initComputed(){}
function initWatch(){}
```
#### 1.初始化数据


```js
import {observe} from './observer/index.js'
function initData(vm){
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm) : data;
    observe(data);
}
```
#### 2.递归属性劫持


> 对象就是使用 defineProperty来实现响应式原理
- 让对象上的所有属性依次进行观测
- 如果默认值是对象套对象，需要递归处理
- 如果用户赋值一个新对象，需要对这个对象进行观测

```js
class Observer { // 观测值
    constructor(value){
        this.walk(value);
    }
    walk(data){ 
         //让对象上的所有属性依次进行观测
         //不会遍历原型链，获取的是对象的私有属性
        Object.keys(data).forEach(key=>{
            defineReactive(data,key,data[key]); ////定义响应式的数据变化
        })
    }
}
function defineReactive(data,key,value){
    observe(value);
    Object.defineProperty(data,key,{
        get(){
            return value
        },
        set(newValue){
            if(newValue == value) return;
            observe(newValue);
            value = newValue
        }
    })
}
export function observe(data) {
    if(typeof data !== 'object' && data != null){
        return;
    }
    return new Observer(data);
}
```
#### 3.数组方法的劫持

```js
import {arrayMethods} from './array';
class Observer { // 观测值
    constructor(value){
        if(Array.isArray(value)){
            value.__proto__ = arrayMethods; // 重写数组原型方法
            this.observeArray(value);
        }else{
            this.walk(value);
        }
    }
    observeArray(value){
        for(let i = 0 ; i < value.length ;i ++){
            observe(value[i]);
        }
    }
}
```
重写数组原型方法

```js
let oldArrayProtoMethods = Array.prototype;
export let arrayMethods = Object.create(oldArrayProtoMethods);
let methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
];
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        const result = oldArrayProtoMethods[method].apply(this, args);
        const ob = this.__ob__;
        let inserted;
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2)
            default:
                break;
        }
        if (inserted) ob.observeArray(inserted); // 对新增的每一项进行观测
        return result
    }
})
```
增加__ob__属性

```js
class Observer { 
    constructor(value){
        Object.defineProperty(value,'__ob__',{
            enumerable:false,
            configurable:false,
            value:this
        });
        // ...
    }
 }
```
给所有响应式数据增加标识，并且可以在响应式上获取Observer实例上的方法

#### 4.数据代理


```js
function proxy(vm,source,key){
    Object.defineProperty(vm,key,{
        get(){
            return vm[source][key];
        },
        set(newValue){
            vm[source][key] = newValue;
        }
    });
}
function initData(vm){
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm) : data;
    for(let key in data){ // 将_data上的属性全部代理给vm实例
        proxy(vm,'_data',key)
    }
    observe(data);
}
```
## 三.模板编译
#### 模版编译原理
     1.将模版解析成AST语法树   
     2.遍历AST标记静态树(树遍历标记 markup)
     3.使用AST生成渲染函数（render函数） codegen
```js

Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;
    // 初始化状态
    initState(vm);
    // 页面挂载
    if (vm.$options.el) {
    	vm.$mount(vm.$options.el);
    }
}
Vue.prototype.$mount = function (el) {
    const vm = this;
    const options = vm.$options;
    el = document.querySelector(el);

    // 如果没有render方法
    if (!options.render) {
        let template = options.template;
        // 如果没有模板但是有el
        if (!template && el) {
        	template = el.outerHTML;
        }
        const render= compileToFunctions(template);
        options.render = render;
    }
}
```
将template编译成render函数

#### 1.解析标签和内容

```js
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;  
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
function start(tagName,attrs){
    console.log(tagName,attrs)
}
function end(tagName){
    console.log(tagName)
}
function chars(text){
    console.log(text);
}
function parseHTML(html){
    while(html){
        let textEnd = html.indexOf('<');
        if(textEnd == 0){
            const startTagMatch = parseStartTag();
            if(startTagMatch){
                start(startTagMatch.tagName,startTagMatch.attrs);
                continue;
            }
            const endTagMatch = html.match(endTag);
            if(endTagMatch){
                advance(endTagMatch[0].length);
                end(endTagMatch[1]);
                continue;
            }
        }
        let text;
        if(textEnd >= 0){
            text = html.substring(0,textEnd);
        }
        if(text){
            advance(text.length);
            chars(text);
        }
    }
    function advance(n){
        html = html.substring(n);
    }
    function parseStartTag(){
        const start = html.match(startTagOpen);
        if(start){
            const match = {
                tagName:start[1],
                attrs:[]
            }
            advance(start[0].length);
            let attr,end;
            while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))){
                advance(attr[0].length);
                match.attrs.push({name:attr[1],value:attr[3]});
            }
            if(end){
                advance(end[0].length);
                return match
            }
        }
    }
}
export function compileToFunctions(template){
    parseHTML(template);
    return function(){}
}
```

## 具体实现过程：

### 模版编译
   - 将模版转换成渲染函数 => 虚拟dom概念 vnode=>diff算法 更新虚拟dom =>产生真实节点，更新
   - 如果同时传入 template 和render 默认会采用render 抛弃template，如果没传render,就采用template
   - 如果都没传就使用id="app"中的模版

   字符串-》词法解析-》tokens->语法解析

 ### 正则匹配

    ？ 匹配前面的子表达式零次或一次，或指明一个非贪婪限定符
    + 匹配前面的子表达式一次或多次
    * 匹配前面的子表达式零次或多次
 1、用来获取标签名
 ```js
 //字母a-zA-Z_  - .数字_ 小写字母大写字母 
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;  //标签名
//?:匹配不捕获 <aa:aaa> 
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //用来获取标签名 match后的索引为1的
 let r = '<div></div>'.match(new RegExp(`^<${qnameCapture}`));
 console.log(r)
[ '<div', 'div', index: 1, input: '<div></div>', groups: undefined ]  
```
2、 匹配开始标签
```js
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
```
3、匹配闭合标签
```js
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </xxx >
```
4、匹配属性的

```js
//<div aaa ="123" bb=123 cc='123'
// a=b a='b' a="b"
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
```
\s* 任意多个空格
([^\s"'<>\/=]+) 匹配属性名 （非空格，"'<>和=） 如：aa
\s*(=)\s*  匹配  = 
"([^"]*)" 匹配"xxx" 如:"b"
'([^']*)'  匹配'xxx' 如:'b'
([^\s"'=<>`]+) 匹配 xx 如:b

5、匹配结束标签
```js
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >或/>
```
6、匹配动态变量
```js
// +?尽可能少取 {{a}} {{b}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g//匹配动态变量
```
(?:.|\r?\n)  匹配 xxx 或者 回车，换行符
\n 匹配一个换行符
\r 匹配一个回车符
\{ 匹配{



### 解析字符串

**词法解析**  
htmlParse2  
- (htmlparser2是一个快速和宽容的HTML/XML/RSS解析器，解析器可以出来流，并且提供了一个回调接口。)
- 不会构建ast树，需要自己构建

字符串-》词法解析-》tokens->语法解析
状态机，不停的更改状态
```js
export function parseHTML(html){  //<div id="app"></div>
 while(html){ //看要解析的内容是否存在，如果存在就不停的解析
     let textEnd = html.indexOf('<');
      if(textEnd==0){ //会有两种情况，可能是开始标签，也可能是结束标签
            const startTagMatch = parseStartTag(); //解析开始标签
            if(startTagMatch){ 
            }
            const endTagMatch = parseEndTag(); //解析结束标签
            if(endTagMatch){
            }
      }  
  }
}
```
**1、解析开始标签**

```js
  function parseStartTag(html){
      const start = html.match(startTagOpen);
      if(start){
          const match = {
              tagName:start[1],
              attrs:[]
          }
      }
      console.log(start)  //["<div", "div", index: 0, input: "<div id="app"></div>", groups: undefined]
      return false; //不是开始标签
  }
```
**匹配到的字符截取掉，返回一个新字符**
```js
function advance(len) {
      html = html.substring(len);
 }
```
**截取匹配到的开始标签部分**
```js
function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length)  //截取匹配到的部分
            //.....
        }
        console.log(html)  //截取之后的结果  id="app"></div>
        return false; //如果不是开始标签返回false

   }
```
**判断截取开开始标签名之后是否遇到了结束标识>**
- 如果没有遇到结尾标签，并且有属性，则不断解析属性
```js
 let end;
  let attr;
  //如果没有遇到结尾标签,并且有属性，则不断解析属性
  while(!(end = html.match(startTagClose)) && (attr=html.match(attribute))){
        //console.log(attr); //(6) [" id="app"", "id", "=", "app", undefined, undefined, index: 0, input: " id="app"></div>", groups: undefined]
        match.attrs.push({
            name:attr[1],
            value:attr[3] || attr[4] ||attr[5] 
            //attr[3] 属性值为双引号包裹  如"app"
            //attr[4] 属性值为单引号包裹  如'app'
            //attr[5] 属性值没有引号包裹  如app
        })
        advance(attr[0].length)  
  }
   console.log(html)    //   ></div>
```
- 如果遇到结尾标签，则截取结尾标签
```js
if(end){
    // end   [">", "", index: 0, input: "></div>", groups: undefined]
    advance(end[0].length);
}
```
 **匹配完开始标签之后,返回匹配到match对象**
 ```js
 const startTagMatch = parseStartTag(); //解析开始标签
 /*startTagMatch 返回的match对象
 match = {
   tagName:"div",
   attrs:[{
     name:"id",
     value:"app"
   }]
 }
 */
  if(startTagMatch){ 
       start(startTagMatch.tagName,startTagMatch.attrs);
       continue;  
  }
 ```
 **解析开始标签，解析的完整部分**
 ```js
    //解析开始标签
    function parseStartTag() {
        const start = html.match(startTagOpen);
        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            }
            advance(start[0].length)
            //console.log(html)  //截取之后的结果  id="app"></div>
            let end;
            let attr;
            //如果没有遇到结尾标签，则不断解析属性
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]
                })
                advance(attr[0].length)
            }
            if(end){
                advance(end[0].length);
            }
            return match;
        }
        return false; //不是开始标签
    }
 ```
**2、解析文本内容**
解析文本内容,并截取
```js
 let textEnd = html.indexOf('<');
 let text;
  if(textEnd>0){
      text = html.substring(0,textEnd)
  }
  if(text){
      chars(text);//调用生成ast树的方法
      advance(text.length)
  }
```
**3、解析结束标签**

```js
//</div>
 const endTagMatch = html.match(endTag); //解析结束标签
  console.log(endTagMatch) //["</div>", "div", index: 0, input: "</div>", groups: undefined]
  if(endTagMatch){
      end(endTagMatch[1]);
      advance(endTagMatch[0].length);
      continue;
  }
```
### 生成ast抽象语法树

- 生成ast语法树的过程用栈这种数据结构来表示
- 当遇到开始标签的时候入栈一个元素，遇到结束标签的时候出栈一位元素
- 解析后的结果 组装成一个树结构 

```js
 function createASTElement(tagName,attrs){
    return{
        tag:tagName,
        type:1,//1元素节点  3 文本节点
        children:[],
        parent:null,
        attrs
    }
}
```
- 定义一个根节点和一个栈
- 利用正则匹配解析的开始标签对象，创建一个元素节点
  - 判断当前有没有根，如果没有根，则当前新创建的元素节点就作为根
  - 当前新创建的元素节点入栈
  - 栈中最后一位元素就是当前节点的父节点
  - 如果此时栈中最后一位不为空，则把此时新创建的元素节点push到栈中最后一位的节点的孩子节点中
```js
 let root = null;
let stack = [];
function start(tagName, attributes) {
    let parent  = stack[stack.length-1];
    let element = createASTElement(tagName,attributes);
    if(!root){
        root = element;
    }
    element.parent = parent;
    if(parent){
        parent.children.push(element);
    }
    stack.push(element)
    // console.log('start------',tagName,attributes)
}
```
- 如果解析到是文本，则在栈中找到它的父级元素(即栈中的最后一个元素)
  - 如果文本不为空，则将文本节点push到它的父级元素节点的children里
```js
 function chars(text) {
    text = text.replace(/\s/g,"");
    let parent  = stack[stack.length-1];
    if(text){
        parent.children.push({
            type:3,
            text
        }) 
    }
}
```
- 如果遇到结束标签，则确立父子关系，stack中最后一位出栈,并返回
  - 判断当前闭合的标签名和栈中最后一位是否一致
  - 如果不一致就抛错
```js
 //结束标签  
function end(tagName) {
    let last = stack.pop();
    if(last.tag!=tagName){
        throw new Error('标签闭合有误');
    }
    console.log('end----',tagName)
}
```

> 提示：

####  __ob__属性
   - Oberver类 里面的data上面新增__ob__属性，data.__ob__ = this;
   - __ob__ 指代当前的Oberver实例对象
   - 所有劫持过的属性都有__ob__属性
   - 需要让__ob__变为不可遍历的，要不然会爆栈

#### 数据劫持
   1、如果是对象，会将对象不停的递归 进行劫持
   2、如果是数组，会劫持数组的方法，并对数组中不是基本数据类型的部分进行观测
#### 数组
  
   - 用户很少通过索引操作数组,所以内部不会对索引进行拦截，因为消耗严重，内部数组不采用defineProperty
   - 数组没有监控索引的变化，但是索引对应的内容是对象类型，需要被监控  Object.frezze     vm[0].name =100
   怎么观测数组中数据的变化：
   - 数组劫持的逻辑，对数组原来的方法进行改写，切片编程
     - 数组有新增功能的方法，需要递归观测新增的数据是不是对象 （push,unshift,splice）
   - 如果数组中的数据是对象类型，需要递归监控对象的变化
     - observerArray 对data对象数组中的数组和数组中的对象再次递归劫持 

**取值的方式 做一个代理**
 vm._data.name
  这种取值方式看起来会很怪异，如果想vm.name可以直接访问到vm._data.name的值就必须做个代理
 vm.name = vm._data.name;

 ```js
    function proxy(vm,source,key){
        Object.defineProperty(vm,key,{
            get(){
                return vm[source][key]
            },
            set(newValue){
                vm[source][key] = newValue;
            }
        })   
   }
    for(let key in data){  //将_data上的属性全部代理给vm实例
        proxy(vm,'_data',key);
    }
 ```
**定义在data上的数据才可以观测到，未定义的观测不到**












    











