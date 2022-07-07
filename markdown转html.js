// ==UserScript==
// @name         md2html
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://localhost/work-task/**
// @require      https://cdn.bootcdn.net/ajax/libs/markdown-it/12.1.0/markdown-it.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function() {
    if(/^https:\/\/localhost\/work-task\/[\s\S]*?\.md$/.test(location.href)){
        let txt = document.body.innerHTML.trim();
        txt = txt.replace(/<pre[^>]*>|<\/pre>/g,'')
        let html = markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks:true,
            xhtmlOut:true,
        }).render(txt);
        html = html.replace(/<a/ig,'<a target="_blank"');
        html =`<div class="md-content">${html}</div>`
        html+=`
        <style>
        .md-content{max-width:100%;width:1000px;margin:0 auto;padding-bottom: 3rem;}
        table{border-collapse: collapse;width: 100%;border:0;}
        tr{border:0;}
        th,td{border:1px solid #ccc;padding:8px 10px;}
        a{text-decoration: none;}
        h1,h2,h3,h4,h5,h6{padding-top:1rem;border-top: 1px dotted #ddd;}
        </style>
        `
        document.body.innerHTML = html;
    }
})();
