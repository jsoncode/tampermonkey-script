# tampermonkey-script
tampermonkey javascript scripts


## 剪切板净化.js

将多余的内容进行净化处理.

```text
xxx
————————————————
版权声明：xx
原文链接：xxxx
```


## 破解禁止复制操作-查看隐藏内容.js

处理一些网站不能复制的问题:

```js
document.oncopy = ()=>{return false};
document.onselectstart = ()=>{return false};
```

```css
code{
  user-select: none;
}
```

## 第三方链接自动跳转.js
作为程序员,我不想重复思考和点击无用的东西.


![image](https://user-images.githubusercontent.com/13176273/177726042-298de3f0-1936-47f0-899b-9468a6e84704.png)

## 语雀文档一键导出markdown.js
## 思否一键导出md.js
## 博客园一键导出md.js

将自己写的笔记,导出到本地markdown.


## 知网公共爬虫.js
对公共区域的搜索结果进行自动下载,并导出excel
![image](https://user-images.githubusercontent.com/13176273/177726809-f29a9273-f507-4d9e-aeb3-37a692999e6c.png)



