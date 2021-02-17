// +?尽可能少取 {{a}} {{b}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g//匹配动态变量
function genProps(attrs){
    let str = '';
    for(let i=0;i<attrs.length;i++){
        let attr = attrs[i];//取到每一个属性
        if(attr.name==='style'){
             let obj = {};
            //   value:"color:red;background:green"转换成
            //   value:{color: "red", background: "green"}
             attr.value.split(";").forEach(item => {
                 let [key,value] = item.split(":");
                 obj[key] = value;
             });
             attr.value = obj;  //将原来的字符串换成来刚格式化的对象
        }
        // console.log(attr)
        str += `${attr.name}:${JSON.stringify(attr.value)}，`
    }
    // console.log(str)
    // 截取多余的一个逗号,并加上{}
    // console.log(`{${str.slice(0,-1)}}`)
    return `{${str.slice(0,-1)}}`

}
function genNode(node){
    if(node.type===1){
        return generate(node)
    }else if(node.type==3){
        let text = node.text;
        //helloword {{mag}}
        if(!defaultTagRE.test(text)){ //如果没有变量
            return `_v(${JSON.stringify(text)})`
        }else{
            let tokens = []; //全局正则，每次正则使用过后 都需要重新指定lastIndex的位置
            let lastIndex = defaultTagRE.lastIndex = 0;
            let match,index; //index当前匹配到的索引
            // console.log(text,'text')
            while(match=defaultTagRE.exec(text)){  //使用正则不断捕获
                index = match.index;
                //通过lastIndex,index
                if(text.slice(lastIndex,index)){
                    //去空格
                    tokens.push(JSON.stringify(text.slice(lastIndex,index)))
                }  
                tokens.push(`_s(${match[1].trim()})`)
                // console.log(tokens)
                lastIndex = index + match[0].length;  
            }
            if(lastIndex<text.length){
                //如果匹配完{{}}之后 lastIndex<text.length说明末尾还有不带{{}}的文本
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            // console.log(tokens)
            return `_v(${tokens.join('+')})`;
            //helloword {{mag}} aa  =>_v('helloword'+_s(msg)+"aa")
        }
    }
}
function genChildren(el){
   const children = el.children;
   if(children){
        return children.map(c=>genNode(c)).join(",")
   }else{
        return false;
   }
}
export function generate(el){
    //放进来的是树根节点
    // console.log(el)
    //[{name:"id",value:"app"},{name: "style", value: "color:red;background:green"}]转换成
    // id:'app',style:{color:"red";background:"green"}
    //  然后再把style里面的属性值转换成字符串
    let children = genChildren(el);//生成孩子字符串
    let code = `
        _c("${el.tag}",${
            el.attrs.length?`${genProps(el.attrs)}`:undefined
        }${
            children?`,${children}`:''
        })`;
  
    // console.log(code)
    return code;
}