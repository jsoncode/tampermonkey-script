// ==UserScript==
// @name         博客园一键导出到hexo博客
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @require      https://stuk.github.io/jszip-utils/dist/jszip-utils.js
// @require      https://stuk.github.io/jszip/vendor/FileSaver.js
// @author       You
// @match        https://home.cnblogs.com/u/**
// @icon         https://common.cnblogs.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function () {
    'use strict';
    let zip = new JSZip();
    let bookName = '博客园';
    let list = [];
    let cateMap = {};

    let button = document.createElement('button');
    button.innerText = '一键导出所有笔记';
    button.classList.add('ant-btn');
    button.classList.add('ant-btn-primary');
    button.id = 'downloadAll';
    button.style.position = 'fixed';
    button.style.right = '50px';
    button.style.top = '70px';
    button.style.height = '40px';
    button.style.paddingLeft = '20px';
    button.style.paddingRight = '20px';
    button.style.border = '0';
    button.style.backgroundColor = '#59a0e1';
    button.style.color = '#fff';
    button.style.fontSize = '16px';
    button.style.zIndex = '9999999';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button)
    //
    document.getElementById('downloadAll').addEventListener('click', e => {
        Promise.all([
            getList(1, {
                list: [],
            }),
            getCateList()
        ]).then(resList => {
            list = resList[0].list
            resList[1].forEach(item => {
                cateMap[item.categoryId] = item.title
            })
            loopGet(0)
        })
    }, false);


    function loopGet(index) {
        let listItem = list[index];
        getMd(listItem.id).then(res => {
            if (res.errors) {
                console.log(listItem, res.errors)
                if (index < list.length - 1) {
                    index++;
                    loopGet(index)
                } else {
                    saveZip()
                }
                return
            }
            let item = res.blogPost;
            item.md = item.postBody;
            item.title = item.title.replace(/[/'"\[\]*^$!\s\n@#&+\\?？:：、，【】’“。]+/g, '_').replace(/^_+/, '')
            let preMd = `---
uuid: blogId${item.blogId.toString() + '_articleId' + item.id}
title: ${item.title}
date: ${new Date(item.datePublished).toLocaleString().replace(/上午|下午/, '')}
categories: [${item.categoryIds?.map(item => cateMap[item]).join(',') || ''}]
tags: [${item.tags?.join(',') || ''}]
url: ${item.url}
---

`
            let files = item.md.match(/\.(png|jpg|jpeg|zip)]\((https:\/\/[^)]+)/ig)?.map(item => item.match(/]\((https:\/\/[^)]+)/i)[1]) || [];
            let imgs = item.md.match(/<img[\s\S]+?src=['"]([^'"]+)['"]/ig)?.map(item => item.match(/<img[\s\S]+?src=['"]([^'"]+)['"]/i)[1]) || []
            files = files.concat(imgs)
            let parentDir = item.parent_uuid ? listMap[item.parent_uuid].dir : zip;
            let mdDir = files.length ? parentDir.folder(item.title) : false

            if (files.length) {
                files = files.map(f => {
                    let newF = f.replace(/[?#].*/, '')
                    let mdF = newF.replace(/^https?:\/\/.*?([^\/]+?\.(png|jpg|jpeg|zip)$)/, item.title + '/$1').replace(/^http:/, 'https:')
                    item.md = item.md.replace(f, mdF)
                    return newF
                })
            }
            item.md = item.md.replace(/\s*(style|class)="[^"]*["]/ig, '')

            item.md = preMd + item.md.replace(/​/g, '\n').replace(/ /g, '')

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
            files = files.map(item => fetchBlob(item).then(res => {
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


    async function getMd(id) {
        return new Promise((resolve, reject) => {
            let url = `https://i.cnblogs.com/api/posts/${id}`;
            console.log('getMd', url)
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'content-type': 'application/json, text/plain, */*'
                },
                onload: function (response) {
                    try {
                        resolve(JSON.parse(response.response))
                    } catch (e) {
                        console.log(e)
                        console.log(response)
                    }
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getCateList() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://i.cnblogs.com/api/category/blog/2/edit`,
                onload: function (response) {
                    resolve(JSON.parse(response.response))
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getList(pageIndex, backData) {
        let pageSize = 50
        pageIndex = pageIndex || 1;
        return new Promise((resolve, reject) => {
            let username = location.href.match(/\/u\/([^\/]+)/)[1]
            let url = `https://home.cnblogs.com/ajax/feed/recent?alias=${username}`;
            let data = JSON.stringify({
                "feedListType": "me",
                "appId": "",
                "pageIndex": pageIndex,
                "pageSize": pageSize,
                "groupId": ""
            })
            GM_xmlhttpRequest({
                method: 'POST',
                data: data,
                url: url,
                headers: {"Content-Type": "application/json"},
                onload: function (response) {
                    backData.pageIndex = pageIndex;
                    backData.pageSize = pageSize;

                    let doc = new DOMParser().parseFromString(response.response, 'text/html')
                    let list = Array.from(doc.querySelectorAll('ul .feed_item .feed_body .feed_link')).map(item => {
                        return {
                            id: item.getAttribute('href')?.match(/\/\w+\/(\d+)\.html/i)?.[1],
                            title: item.innerText.trim()
                        }
                    }).filter(item => !!item.id)
                    backData.list = backData.list.concat(list)
                    backData.totalPage = doc.querySelector('.block_arrow .last')?.innerText?.trim() * 1 || 1
                    console.log(backData)
                    if (pageIndex >= backData.totalPage) {
                        resolve(backData)
                    } else {
                        pageIndex++;
                        getList(pageIndex, backData).then(resolve).catch(reject)
                    }
                },
                onerror: function (err) {
                    console.log(err)
                    reject(err)
                }
            });
        })
    }

    async function fetchBlob(url) {
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url,
                responseType: "blob",
                onload: resolve,
                onerror: reject,
            });
        });
        const {response: blob} = response;
        return blob;
    }
})();
