// ==UserScript==
// @name         第三方链接自动跳转
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://**/**
// @run-at       document-end
// ==/UserScript==

(function() {
    setTimeout(()=>{
        let hasUrl = /target|url/.test(location.search)
        let hasText = /即将离开/.test(document.body.innerText)
        let hasTextGo = /继续/.test(document.body.innerText)
        if(hasUrl && hasText && hasTextGo){
            //使用XPATH表达式查抄指定内容的dom元素
            let a = document.evaluate("//a[contains(., '继续')]", document, null, XPathResult.ANY_TYPE).iterateNext();
            a.click()
        }
    },1000)
})();
