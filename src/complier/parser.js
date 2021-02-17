//字母a-zA-Z_  - .数字_ 小写字母大写字母 
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;  //标签名
//?:匹配不捕获 <aaa:aaa> 
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名

const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
//<div aaa ="123" bb=123 cc='123
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >
// +?尽可能少取 {{a}} {{b}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g//匹配动态变量
 
// v2.0只能有一个根节点  必须是html元素
//currentParent = divAstElement
//stack = [divAstElement]
export function parseHTML(html){
    let root;//树根
    let currentParent;//当前元素ast
    let stack = [];//用来判断标签是否正常闭合 []解析器可以借助栈形结构
    //利用常见的数据结构来解析标签
    //根据 html 解析成树结构 <div id="app" style="color:red"><span>helloword {{msg}}</span></div>
    function createASTElement(tagName,attrs){
        return{
            tag:tagName,
            attrs:attrs, 
            children:[],
            parent:null,
            type:1,//1元素节点  3 文本节点
        }
    }
    function start(tagName,attrs){  //开始标签  每次解析开始标签都会执行此方法
        let element = createASTElement(tagName,attrs);
        if(!root){
            root = element; //只有第一次是根
            // console.log(root)
        }
        // currentParent = JSON.parse(JSON.stringify(element));//保存当前标签
        currentParent = element;//保存当前标签，当子级是文本标签的时候改变当前标签的children
        stack.push(element)
        // console.log(tagName,attrs)
    }
    function end(tagName){ //结束标签  确立父子关系
        // console.log(tagName)
       let element = stack.pop();//stack中最后一位出栈,并返回
    
       if(tagName ==element.tag){  //判断当前闭合的标签名和栈中最后一位是否一致
            let parent = stack[stack.length-1];//获取当前闭合元素父级
            if(parent){
                element.parent = parent;
                parent.children.push(element)
            } 
       }else{
           console.log('标签闭合有误！')
       }
    }
    function chars(text){ //文本标签
        // console.log(text)
        text = text.replace(/\s/g,'');
        if(text){
            currentParent.children.push({    //push进当前文本标签的父级元素
                type:3,
                text
            })
        }
    }
    while(html){
        let textend = html.indexOf('<');
        if(textend==0){
            const startTagMatch = parseStartTag();
            if(startTagMatch){
                //开始标签
                start(startTagMatch.tagName,startTagMatch.attrs)   
            }
            //结束标签
            const endTagMatch = html.match(endTag);
            if(endTagMatch){
                //  console.log(endTagMatch)
                advance(endTagMatch[0].length);
                end(endTagMatch[1])
            }
           
        }
       //如果不是0说明是文本
        let text;
        if(textend>0){
            text = html.substring(0,textend);//把文本内容进行截取
            // console.log(text)
            chars(text)
        }
        if(text){
            advance(text.length);//删除文本内容
        }
        
    }
    function advance(n){
        html = html.substring(n)
    }
    function parseStartTag(){
        const start = html.match(startTagOpen) //匹配<div>
        // console.log(start)
        if(start){
            const match = {
                tagName:start[1],//匹配标签名
                attrs:[]
            }
            advance(start[0].length);//截取开始标签后面的
            let end,attr;
            while(!(end = html.match(startTagClose))&&(attr = html.match(attribute))){
                advance(attr[0].length)
                //  console.log(attr)
                 //双引号是第三项 单引号是第四项 
                match.attrs.push({name:attr[1],value:attr[3] || attr[4] || attr[5]})
            }
            // console.log(html)
            if(end){
                advance(end[0].length);
                return match;
            }
        }
    }
    return root;
}