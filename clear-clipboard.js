// ==UserScript==
// @name         剪切板净化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://*/*
// @grant        none
// ==/UserScript==

(function() {
    clearClipboard()

    function clearClipboard(){
        let btn = Array.from(document.querySelectorAll('[data-title="复制"]'))
        btn.forEach(i=>{
            i.addEventListener('copy', async (event) => {
                let content = await navigator.clipboard.readText()
                content = content.split(/———+/)[0];
                navigator.clipboard.writeText(content)
            });
        })
    }
})();
