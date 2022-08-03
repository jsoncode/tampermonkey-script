// ==UserScript==
// @name         破解禁止复制操作,破解查看隐藏内容
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://**/**
// @run-at       document-end
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    document.addEventListener('click',(e)=>{
        removeDisableCopy(e.target);
        removeHidden();
        removeCodeDisableCopy();
    })

    function removeDisableCopy(element){
        let parents = getParents(element)
        // 最后,删除dom本身的事件
        removeEventListener(document)
        // 递归获取所有祖先元素
        function getParents(tag){
            let list = [];
            get(tag)
            function get(e){
                let p = e.parentElement;
                // 删除每一层的事件
                if(!p){return}
                removeEventListener(p)
                list.push(p)
                if(p.tagName!=='HTML'){
                    return get(p)
                }
                return p
            }
            return list;
        }
        // 删除事件
        function removeEventListener(element){
            element.oncopy = null;
            element.onselectstart = null;
        }
    }

    function removeHidden(){
        let hiddenList =Array.from( document.querySelectorAll('[style*="hidden"]'));
        hiddenList.forEach(item=>{
            let height = getComputedStyle(item).height.match(/\d+/)?.[0]||0;
            if(Number(height)>1000){
                // 排除虚拟滚动的情况
                let hasVirtual = item.querySelector('[class*="rc-virtual-list"]')
                if(hasVirtual){return}
                item.style.height = 'auto'
                item.style.overflow='auto'
            }
        })
        //https://www.it1352.com/2711430.html
        let body1 = document.querySelector('.arc-body-main')
        if(body1){
            body1.style.height ='auto'
            body1.style.overflow ='auto'
            let mark = document.querySelector('.arc-body-main-more')
            mark.parentElement.removeChild(mark)
        }
    }

    function removeCodeDisableCopy(){
        let hiddenList =Array.from( document.querySelectorAll('pre,code'));
        hiddenList.forEach(item=>{
           item.style.userSelect='unset';
        })
    }

})();
