import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'

export default {
    input:'./src/index.js',
    output:{
        format:'umd',//统一模块规范 amd common.js 如果没有规范，会将打包之后的结果挂到window上
        file:'dist/vue.js',//打包出的vue.js文件
        name:'Vue',
        sourcemap:true,//可以看到源码映射 源码调试
    },
    plugins:[
        babel({ // 解析es6 -》 es5
            exclude:"node_modules/**",//排除文件的操作 glob语法 //**表示任何文件夹任意文件 */
        }),
        serve({   // 开启本地服务
            open:true,//自动打开
            openPage:'/public/index.html',
            port:3000,
            contentBase:'',//默认当前目录打开
        })
    ]
}