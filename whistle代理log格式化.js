// ==UserScript==
// @name         whistle代理log格式化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://127.0.0.1:8899/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.addEventListener('click',format,false)
    function format(){
        setTimeout(function(){
            let btn = document.querySelector('.w-divider-right .w-detail-response .orient-vertical-box.w-textarea .w-copy-text')
            let area = document.querySelector('.w-detail-response-textview')
            if(btn && area){
                let value = btn.getAttribute('data-clipboard-text')
                try{
                    value = JSON.stringify(JSON.parse(value),null,4)
                    area.value = value;
                    area.style.fontFamily='Consolas'
                }catch(e){
                }
            }
            let urlEl = document.querySelector('.w-detail-inspectors-url .fill span')
            if(urlEl){
                urlEl.setAttribute('contenteditable',true)
                urlEl.style.border=0;
                urlEl.style.outline=0;
            }
            let pre = document.querySelectorAll('.w-properties.w-properties-parsed pre')[0]
            if(pre){
                pre.setAttribute('contenteditable',true)
                pre.style.border=0;
                pre.style.outline=0;
            }
        },100)
    }
    // Your code here...
})();
