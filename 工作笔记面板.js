// ==UserScript==
// @name         工作笔记面板
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在浏览器中进行工作的记录和处理,生成一个炫酷的高斯模糊面板
// @author       You
// @match        **://**/**
// @require      https://cdn.bootcdn.net/ajax/libs/markdown-it/12.1.0/markdown-it.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function() {
    if (unsafeWindow.top !== unsafeWindow.self) {
        return;
    }
    let list = [
        {
            title: 'test',
            name: '点击进入',
            value: '',
            url: 'https://www.tapd.cn/my_worktable/?from=left_tree_cloud_v2',
        }];

    list = list.map(item => {
        item.id = escape(item.title + item.name + item.value + item.url);
        return item;
    });
    let editIndex = null;
    let iframeWrapperContent = document.getElementById('iframeWrapperContent');
    if (!iframeWrapperContent) {
        document.body.insertAdjacentHTML('beforeend', `
        <style>
            #iframeWrapperContent{position:relative;transition-duration:.2s;width:50px;height:50px;}
            #iframeEl{box-shadow:2px 2px 10px rgba(0,0,0,0.4);position:absolute;left:0;top:0;width:calc(100% - 50px);height:calc(100% - 50px);
                border:0;z-index:0;background:rgba(255,255,255,.2);backdrop-filter:blur(20px);overflow:hidden;border-radius:10px;transition-duration:.2s;
                }
            #iframeBtn{font-size:12px;padding:0 8px;outline:0;width:50px;height:50px;border-radius:100px;border:0;background:#2a68c9;color:#fff;position:absolute;right:0;bottom:0;z-index:1;cursor:pointer;}
            #iframeBtn:hover{background:#204e97;}
        </style>
        <div style='position:fixed;right:20px;bottom:70px;z-index:9999999999;'>
            <div id='iframeWrapperContent'>
                <iframe id='iframeEl' src='${getHtml()}'></iframe>
                <button id='iframeBtn'>工作菜单</button>
            </div>
        </div>
        `);
        let iframeWrapperContent = document.getElementById('iframeWrapperContent');
        let iframeEl = document.getElementById('iframeEl');
        let iframeBtn = document.getElementById('iframeBtn');
        iframeBtn.addEventListener('click', e => {
            if (iframeWrapperContent.getAttribute('data-open') === '1') {
                iframeWrapperContent.setAttribute('data-open', '0');
                iframeWrapperContent.style.width = '50px';
                iframeWrapperContent.style.height = '50px';
                iframeEl.style.opacity = '0';
            } else {
                iframeWrapperContent.setAttribute('data-open', '1');
                iframeWrapperContent.style.width = '1100px';
                iframeWrapperContent.style.height = '600px';
                iframeEl.style.opacity = '1';
            }
        }, false);
        document.addEventListener('click', e => {
            if (e.target.id !== 'iframeBtn' && !e.target.closest('#iframeBtn')) {
                iframeWrapperContent.setAttribute('data-open', '0');
                iframeWrapperContent.style.width = '50px';
                iframeWrapperContent.style.height = '50px';
                iframeEl.style.opacity = '0';
            }
        }, false);
        unsafeWindow.addEventListener('message', e => {
            if (e.origin !== 'null') {
                return;
            }
            let iframeEl = document.getElementById('iframeEl');
            if (e.data.type === 'addCache') {
                let cacheList = JSON.parse(GM_getValue('cacheList') || '[]');
                if (editIndex === null) {
                    cacheList.push(e.data.value);
                } else {
                    cacheList.splice(editIndex, 1, e.data.value);
                }
                GM_setValue('cacheList', JSON.stringify(cacheList));
                iframeEl.src = getHtml();
                editIndex();
            } else if (e.data.type === 'deleteCache') {
                let cacheList = JSON.parse(GM_getValue('cacheList') || '[]');
                cacheList.splice(e.data.value.index, 1);
                GM_setValue('cacheList', JSON.stringify(cacheList));
                iframeEl.src = getHtml();
            } else if (e.data.type === 'editCache') {
                editIndex = e.data.value.index;
            } else if (e.data.type === 'copyValue') {
                let data = e.data;
                let item = list[data.value.index];
                let cpList = [
                    item.title,
                    item.name,
                    item.value,
                ];
                GM_setClipboard(cpList[data.value.sub]);
                setTimeout(() => {
                    iframeEl.src = getHtml();
                }, 1000);
                iframeWrapperContent.setAttribute('data-open', '0');
                iframeWrapperContent.style.width = '50px';
                iframeWrapperContent.style.height = '50px';
                iframeEl.style.opacity = '0';
            }
        }, false);
    }

    function getHtml() {
        let cacheList = JSON.parse(GM_getValue('cacheList') || '[]');
        cacheList = cacheList.map(item => {
            let html = markdownit().render(item.content);
            item.html = html.replace(/ href=/g, ' target="_blank" href=');
            return item;
        });
        let html = `
    <div class='bodyWrapper'>
        <div class='editWrapper'>
            <h3>短期需求/临时记录</h3>
            <div class='form'>
              <textarea id='cacheValue' placeholder='markdown格式'></textarea>
              <button id='saveCache'>保存</button>
            </div>
            <div class='cacheList'>
              ${cacheList.map((item, index) => `
                 <div class='cacheItem' data-data='${encodeURIComponent(item.content)}'>
                     <div class='content'>
                        <pre>${item.html}</pre>
                     </div>
                     <div class='editWrap'>
                      <a class='edit editBtn' data-index='${index}'>编辑</a>
                      <a class='edit deleteBtn' data-index='${index}'>删除</a>
                     </div>
                 </div>`).join('')}
            </div>
        </div>
        <ol class='list'>
            <li>
                <div class='li-wrap'>
                    <div>标题</div>
                    <div>账号</div>
                    <div>密码</div>
                </div>
            </li>
            ${list.map((item, index) => `<li data-index='${index}'>
               <div class='li-wrap'>
                   <div class='sub-item' data-sub='0'>${item.title}</div>
                   <div class='sub-item' data-sub='1' ${item.titleAttr ? `title="${item.titleAttr}"` : ''}><a ${item.url ? `href="${item.url}"` : ''} target='_blank'>${item.name}</a></div>
                   <div class='sub-item' data-sub='2'>${item.value.substr(0, 2)}***</div>
               </div>
            </li>`).join('')}
        </ol>
    </div>
    `;
        let style = `
    <style>
    *{box-sizing:border-box;}
    body{padding:15px;margin:0;font-size:12px;cursor: default;}
    body::-webkit-scrollbar{width:0;height:0;}
    .bodyWrapper{display:flex;}
    .editWrapper{flex:1;padding-right: 10px;display: flex;flex-direction: column;}
    .editWrapper .form{display: flex;align-items: center;}
    .editWrapper .form textarea{width:100%;flex:1;resize: vertical;height:100px;margin-right: 20px;outline: 0;border-radius: 4px;padding:10px;word-break: break-all;}
    .editWrapper .form button{border:0;background: #3e5fc6;color:#fff;height:30px;width:60px;border-radius: 4px;cursor:pointer;}
    .list{margin-left:0;padding:0;}
    .cacheList{width:100%;margin-top: 20px;}
    .cacheList .cacheItem{display: flex;align-items: flex-start}
    .cacheList .cacheItem .content{flex:1;margin-right: 10px;}
    .cacheList .cacheItem .content pre{margin: 0;padding:10px;font-family: '微软雅黑';}
    .cacheList .cacheItem .content table{width:100%;border-collapse: collapse;}
    .cacheList .cacheItem .content table td,
    .cacheList .cacheItem .content table th{border:1px solid #ddd;padding:8px;}
    .cacheList .cacheItem .editWrap{display:flex;width: 60px;justify-content: space-between;}
    .cacheList .cacheItem a{font-family: inserit;}
    .cacheList .cacheItem a.edit{padding-top:5px;padding-bottom:5px;color:#2a68c9;cursor:pointer;text-decoration:none;display:flex;align-items:center;}
    .cacheList .cacheItem a:not(:last-child){margin-right: 10px;}
    .editWrapper + .list{width: 500px;}
    li{margin:0;list-style: none;padding: 0;}
    li:hover{background:rgba(0,0,0,.1);}
    li .li-wrap{display:flex;height:30px;align-items:space-between;}
    li .li-wrap div{padding:0 10px;display:flex;align-items:center;}
    li .li-wrap div:nth-child(1){flex:2}
    li .li-wrap div:nth-child(2){flex:3}
    li .li-wrap div:nth-child(3){flex:2}
    li .li-wrap div:nth-child(4){flex:1}
    li .li-wrap div:hover{background:rgba(0,0,0,.3);}
    li .li-wrap div a{text-decoration:none;display:flex;align-items:center;width:100%;height:30px;}
    li .li-wrap div a[href]{color:#2a68c9;cursor:pointer;}
    </style>
    <script>
     document.addEventListener('DOMContentLoaded',()=>{
         document.addEventListener('click',e=>{
             let el= e.target
             let copyWrap = el.classList.contains('sub-item')?el:el.closest('.sub-item')
             if(copyWrap){
                 let index = el.closest('li').getAttribute('data-index');
                 let sub = el.getAttribute('data-sub');
                 window.top.postMessage({
                   type:'copyValue',
                   value:{
                     index,sub
                   }
                 },'*')
             }
             if (el.id==='saveCache'){
               let cacheValue = document.getElementById('cacheValue').value;
               if(cacheValue){
                 console.log('saveCache', cacheValue)
                 window.top.postMessage({
                   type:'addCache',
                   value:{
                     content: cacheValue
                   }
                 },'*')
                 cacheValue = '';
               }
             }
             if (el.classList?.contains('deleteBtn')){
                 let index = el.getAttribute('data-index')
                 window.top.postMessage({
                   type:'deleteCache',
                   value:{index}
                 },'*')
             }
             if (el.classList?.contains('editBtn')){
                 let cacheValue = document.getElementById('cacheValue');
                 let index = el.getAttribute('data-index')
                 cacheValue.value=decodeURIComponent(el.closest('.cacheItem').getAttribute('data-data'))
                 window.top.postMessage({
                   type:'editCache',
                   value:{
                     index
                   }
                 },'*')
             }
         })
     },false);
    </script>
    `;
        html = `data:text/html,<!DOCTYPE html><html><head>
        <meta charset='utf-8'>
        <meta http-equiv='Content-Security-Policy' content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *;script-src * 'unsafe-inline'">
        </head><body>${html}${escape(style)}</body></html>`;
        html = html.replace(/"/g, '%22')
            .replace(/'/g, '%27')
            .replace(/&/g, '&amp;')
            .replace(/#/g, '%23')
            .replace(/</g, '%3C')
            .replace(/>/g, '%3E')
            .replace(/\s*\n\s*/g, '');
        return html;
    }
})();
