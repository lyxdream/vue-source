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
 
export function parseHTML(html){
    //根据 html 解析成树结构 <div id="app" style="color:red"><span>helloword {{msg}}</span></div>

    function start(tagName,attrs){
        console.log(tagName,attrs)
    }
    function end(tagName){
        console.log(tagName)
    }
    function chars(text){
        console.log(text)
    }
    while(html){
        let textend = html.indexOf('<');
        if(textend==0){
            const startTagMatch = parseStartTag();
            // console.log(startTagMatch,html)
            if(startTagMatch){
                //开始标签
                 // console.log(startTagMatch,'开始')
                start(startTagMatch.tagName,startTagMatch.attrs)   
            }
            //结束标签
            const endTagMatch = html.match(endTag);
            if(endTagMatch){
                 // console.log(endTagMatch)
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

}