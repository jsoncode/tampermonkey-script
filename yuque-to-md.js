// ==UserScript==
// @name         语雀文档一键导出markdown格式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @require      https://stuk.github.io/jszip-utils/dist/jszip-utils.js
// @require      https://stuk.github.io/jszip/vendor/FileSaver.js
// @author       You
// @match        https://www.yuque.com/**/web/**
// @icon         https://gw.alipayobjects.com/mdn/prod_resou/afts/img/A*CUIoT4xopNYAAAAAAAAAAABkARQnAQ
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function () {
    'use strict';
    let zip = new JSZip();
    let bookName = appData.book.name;
    let bookId = appData.book.id;
    let list = JSON.parse(JSON.stringify(appData.book.toc));
    let listMap = {};
    list = list.map(item => {
        // 文件名中不能出现点结尾和斜杠
        item.title = item.title.replace(/[/'"\[\]*^$!\s\n@#&+\\?？:：、，【】’“。]+/g, '_').replace(/^_+/, '')
        if (item.child_uuid) {
            if (item.parent_uuid) {
                if (listMap[item.parent_uuid].dir) {
                    item.dir = listMap[item.parent_uuid].dir.folder(item.title)
                } else {
                    let dir = zip.folder(listMap[item.parent_uuid].title)
                    item.dir = dir.folder(item.title)
                }
            } else {
                item.dir = zip.folder(item.title)
            }
        }
        listMap[item.uuid] = item;
        return item;
    })

    list = list.filter(item => !item.child_uuid)

    let button = document.createElement('button');
    button.innerText = '一键导出所有笔记';
    button.classList.add('ant-btn');
    button.classList.add('ant-btn-primary');
    button.id = 'downloadAll';
    button.style.position = 'fixed';
    button.style.right = '50px';
    button.style.top = '70px';
    button.style.zIndex = '9999999';
    document.body.appendChild(button)

    document.getElementById('downloadAll').addEventListener('click', e => {
        loopGet(0, zip);
    }, false);

    function loopGet(index) {
        let item = list[index];
        Promise.all([
            getArticleInfo(item.url),
            getMd(item.url)
        ]).then(resList => {
            let info = resList[0];
            let md = resList[1];
            let preMd = `---
uuid: ${item.uuid}
title: ${item.title}
date: ${new Date(info.data.created_at).toLocaleString().replace(/上午|下午/,'')}
update: ${new Date(info.data.updated_at).toLocaleString().replace(/上午|下午/,'')}
categories: ${listMap[item.parent_uuid]?.title || ''}
tags: ${listMap[item.parent_uuid]?.title || ''}
---

`
            item.md = preMd + md.replace(/​/g, '\n').replace(/ /g, '').replace(/\n{3,}/g, '\n\n');
            let files = item.md.match(/\.(png|jpg|jpeg|zip)]\((https:\/\/[^)]+)/ig)?.map(item => item.match(/]\((https:\/\/[^)]+)/i)[1]);
            let parentDir = item.parent_uuid ? listMap[item.parent_uuid].dir : zip;
            let mdDir = parentDir.folder(item.title)

            if (files && files.length) {
                files = files.map(f => {
                    let newF = f.replace(/[?#].*/, '')
                    let mdF = newF.replace(/^https?:\/\/.*?([^\/]+?\.(png|jpg|jpeg|zip)$)/, item.title + '/$1')
                    item.md = item.md.replace(f, mdF)
                    return newF
                })
            }
            downloadImages(mdDir, files).then(() => {
                parentDir.file(item.title + '.md', item.md)
                console.log('完成', item.title, (index / list.length * 100).toFixed(2) + '%')
                if (index < list.length - 1) {
                    index++;
                    loopGet(index)
                } else {
                    saveZip()
                }
            })
        })
    }

    function saveZip() {
        console.log('正在合并文件，并生成zip，开始下载....')
        zip.generateAsync({type: "blob"}).then(function (content) {
            // 下载到本地
            download(bookName + '.zip', content);
        });
    }

    async function downloadImages(imgDir, files) {
        if (files && files.length) {
            files = files.map(item => fetch(item).then(res => res.blob()).then(res => {
                imgDir.file(item.match(/[^\/]+$/), res)
                return item
            }))
            return Promise.all(files)
        } else {
            return new Promise(resolve => resolve())
        }
    }

    function download(name, data) {
        var urlObject = window.URL || window.webkitURL || window;

        var downloadData = new Blob([data]);

        var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
        save_link.href = urlObject.createObjectURL(downloadData);
        save_link.download = name;
        save_link.click();
    }


    async function getMd(url) {
        let username = location.pathname.match(/^\/([^\/]+)/)[1];
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `/${username}/web/${url}/markdown?attachment=true&latexcode=false&anchor=false&linebreak=false`,
                onload: function (response) {
                    resolve(response.response)
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getArticleInfo(url) {
        return new Promise((resolve, reject) => {
            url = `/api/docs/${url}?book_id=${bookId}&include_contributors=true&include_hits=true&include_like=true&include_pager=true&include_suggests=true&merge_dynamic_data=false`
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {
                    resolve(JSON.parse(response.response))
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }
})();
