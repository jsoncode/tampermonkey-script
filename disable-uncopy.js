// ==UserScript==
// @name         破解禁止复制操作,破解查看隐藏内容
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://**/**
// @run-at       document-end
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
        document.oncopy = null;
        document.onselectstart = null;

        // 递归获取所有祖先元素
        function getParents(tag){
            let list = [];
            get(tag)
            function get(e){
                let p = e.parentElement;
                // 删除每一层的事件
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
            if(Number(height)>0){
                item.style.height = 'auto'
                item.style.overflow='auto'
            }
        })
    }

    function removeCodeDisableCopy(){
        let hiddenList =Array.from( document.querySelectorAll('pre,code'));
        hiddenList.forEach(item=>{
           item.style.useSelect='unset';
        })
    }

})();
