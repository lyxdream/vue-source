
import { parseHTML } from './parser.js'
import {generate} from './generator.js'
export function complieToFunctions(template){
    // console.log(template)
    //实现模版编译的内容
    let ast = parseHTML(template);//解析html
     //核心是字符串拼接
    let code = generate(ast);// 代码生成
    console.log(code)
   
    // template =>render 函数
    //_v 有三个参数，分别是
      // 标签名  一个包含模版相关属性的数据对象 子节点列表
    /*
     <div id='app' style="color:red"><span>helloword {{msg}}</span><b>加租</b></div>
     render(){
        with(this._data){
            return _c('div',{id:'app',style:{color:'red'}},_c('span',undefined,_v('helloword'+_s(msg))))
        }
     }
    */

    //模版编译原理
    //1、将模版解析成AST语法树   (1)parser解析(正则)
    //2、遍历AST标记静态树       （2）树遍历标记 markup
    //3、使用AST生成渲染函数（render函数） codegen
    
    
}




