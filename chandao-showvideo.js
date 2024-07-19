// ==UserScript==
// @name         禅道插件-bugList自动显示视频附件
// @namespace    http://tampermonkey.net/
// @version      2024-06-26
// @description  try to take over the world!
// @match        https://kpwork.otosaas.com/zentao/bug-view-**.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=otosaas.com
// @grant        none
// ==/UserScript==

(function() {
    const fileList = Array.from(document.querySelectorAll('.files-list li>a'))

    fileList.forEach(i=>{
        if(i.onclick && /\.(mov|mp4)/.test(i.outerHTML)){
            let video = document.createElement('video')
            video.src = i.href;
            video.style.width = '100%'
            video.style.height = '600px'
            video.style.display = 'block'
            video.style.background = '#000'
            video.controls = true;
            video.preload='meta'
            let li = i.closest('li')
            li.appendChild(video)
            i.style.display='none';
            i.nextElementSibling.style.display='none'

            document.querySelector('.files-list').closest('.detail-content').previousElementSibling.style.display = 'none'
        }
    })
})();
