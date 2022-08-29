// ==UserScript==
// @name         自动关闭弹框
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    if(location.host.includes('zhihu.com')){
        setTimeout(()=>{
            let list = Array.from(document.querySelectorAll('.Modal-wrapper'));
            list.forEach(el=>{
                el.parentElement.removeChild(el)
            })
        },300)
    }
})();
