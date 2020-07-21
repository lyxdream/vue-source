# vue-source
This is a warehouse for handwritten Vue source code

### 模版编译
#### 模版编译原理
     1.将模版解析成AST语法树   
     2.遍历AST标记静态树(树遍历标记 markup)
     3.使用AST生成渲染函数（render函数） codegen
##### 1、解析标签和内容



