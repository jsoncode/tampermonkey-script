// ==UserScript==
// @name         第三方链接自动跳转
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://**/**
// @run-at       document-start
// ==/UserScript==

(function() {
    // https://link.zhihu.com/?target=https%3A//greasyfork.org/zh-CN/
    // https://blog.51cto.com/transfer?https://davidwalsh.name/cancel-fetch
     // https://www.jianshu.com/go-wild?ac=2&url=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40craco%2Fcraco
    let url = '';
    if(location.href.startsWith('https://link.zhihu.com/?target=http')){
        url = decodeURIComponent(location.search.match(/target=([^=&?]+)/)?.[1])
    }
    if(location.href.startsWith('https://blog.51cto.com/transfer?')){
        url = decodeURIComponent(location.search.match(/transfer?([^=&?]+)/)?.[1])
    }
    if(location.href.startsWith('https://www.jianshu.com/go-wild?ac=2&url=')){
        url = decodeURIComponent(location.search.match(/url=([^=&?]+)/)?.[1])
    }
    if(url){
        location.href=url
    }
})();
