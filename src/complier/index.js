
import { parseHTML } from './parser.js'
export function complieToFunctions(template){
    // console.log(template)
    //实现模版编译的内容
    let ast = parseHTML(template);//解析html
    console.log(ast)
    //模版编译原理
    //1、将模版解析成AST语法树   (1)parser解析(正则)
    //2、遍历AST标记静态树       （2）树遍历标记 markup
    //3、使用AST生成渲染函数（render函数） codegen
    
}

