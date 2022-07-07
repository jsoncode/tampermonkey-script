// ==UserScript==
// @name         知网公共爬虫
// @namespace    http://tampermonkey.net/
// @require      https://cdn.bootcdn.net/ajax/libs/exceljs/4.3.0/exceljs.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @version      0.1
// @description  一个易操作的知网公共采集器
// @author       You
// @match        https://kns.cnki.net/kns8/DefaultResult/Index**
// @match        https://kns.cnki.net/kns8/defaultresult/index**
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let useCache = true;
    let btn = document.querySelector('.downloadBoxBtn')
    if (!btn) {
        btn = document.createElement('div')
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.padding = '4px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.flexDirection = 'column';
        btn.style.fontSize = '12px';
        btn.style.zIndex = '99999';
        btn.style.background = '#0f5de5';
        btn.style.color = '#fff';
        btn.style.borderRadius = '50%';
        btn.style.cursor = 'pointer';
        btn.style.userSelect = 'none';
        btn.className = 'downloadBoxBtn';
        btn.innerHTML = '<span>打开</span><span>面版</span>';
        document.body.appendChild(btn)
    }

    let isOpen = false;
    let isDownloading = false;
    btn.addEventListener('click', e => {
        createArea()

        if (isOpen) {
            btn.innerHTML = '<span>打开</span><span>面版</span>';
        } else {
            btn.innerHTML = '<span>关闭</span><span>面版</span>';

            let data = getListPageData()
            let area = document.querySelector('.downloadArea')
            area.querySelector('.area-total').innerText = data.total;
            area.querySelector('.area-page').innerText = data.page + '/' + data.totalPage;
        }
        isOpen = !isOpen
    })

    function createArea() {
        let area = document.querySelector('.downloadArea')
        if (!area) {
            area = document.createElement('div')
            area.style.position = 'fixed';
            area.style.bottom = '0';
            area.style.left = '50%';
            area.style.transform = 'translateX(-50%)';
            area.style.width = '300px';
            area.style.padding = '10px';
            area.style.height = '200px';
            area.style.fontSize = '14px';
            area.style.zIndex = '99999';
            area.style.background = '#fff';
            area.style.borderRadius = '4px';
            area.style.boxShadow = '0 0 20px 5px rgba(0,0,0,0.2)';
            area.style.overflow = 'auto';
            area.className = 'downloadArea';
            area.innerHTML = `
            <style>.area-item{display: flex;align-items: center;padding:5px 10px;justify-content: space-between}
            .area-item progress{width: 100%;height: 20px;}
            .area-item button{height: 28px;border-radius: 4px;padding: 0 6px;background: #0f5de5;color: #fff;font-size: 12px;border:0;}
            .area-item .exportBtn{background: #ff9120;}
            .area-item .area-progress-title{width: 90px;}
            .area-item .area-progress-value{flex: 1}
            </style>
            <div class="area-item">
                <div class="area-total"></div>
                <div class="area-page"></div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">本页下载进度: </div>
                <div class="area-progress-value area-progress-1">
                    <progress max="20" value="0"></progress>
                </div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">总进度: </div>
                <div class="area-progress-value area-progress-2">
                    <progress max="100" value="0"></progress>
                </div>
            </div>
            <div class="area-item">
                <button class="downloadBtn">点击开始下载</button>
                <button class="exportBtn">停止下载并导出</button>
            </div>
            <div class="area-item">
                <button class="clearCache">清空缓存</button>
            </div>
            `
            document.body.appendChild(area)
            document.querySelector('.downloadBtn').addEventListener('click', download)
            document.querySelector('.exportBtn').addEventListener('click', exportData)
            document.querySelector('.clearCache').addEventListener('click', () => {
                localStorage.removeItem('pageData')
                localStorage.removeItem('cacheData')
                area.querySelector('.area-progress-1 progress').value = 0;
                area.querySelector('.area-progress-2 progress').value = 0;
            })
        } else {
            if (getComputedStyle(area).display === 'block') {
                area.style.display = 'none'
            } else {
                area.style.display = 'block'
            }
        }
    }

    function nextPage() {
        document.getElementById('Page_next_top').click()
    }

    function exportData() {
        isDownloading = false;
        let pageData = getCache('pageData')

        //create new excel work book
        let workbook = new ExcelJS.Workbook();
        workbook.creator = 'jsoncode';
        workbook.lastModifiedBy = 'jsoncode';
        workbook.created = new Date();

        //add name to sheet
        let worksheet = workbook.addWorksheet("知网数据", {
            properties: {
                defaultColWidth: 30,
            },
            alignment: {
                wrapText: true,
                horizontal: 'center'
            }
        })

        // 默认表头
        let header = [
            '序号',
            '题名',
            '作者',
            '单位',
            '关键字',
            '摘要',
            '来源',
            '分类号',
            '发表时间',
            '数据库',
            '被引',
            '下载',
        ];

        // 扩展其他表头
        pageData.forEach(item => {
            let keys = Object.keys(item);
            keys.forEach(key => {
                if (!header.includes(key) && key !== 'titleUrl' && key !== 'authorUrl' && key !== 'uploadUserUrl') {
                    header.push(key)
                }
            })
        })
        //add column name
        worksheet.addRow(header);
        pageData.forEach(item => {
            let data = []
            header.forEach(key => {
                data.push(item[key])
            })
            worksheet.addRow(data);
        })

        //add data and file name and download
        workbook.xlsx.writeBuffer().then((data) => {
            let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, new Date().toLocaleString().replace(/[-:]/g, '-') + '.xlsx');
        });
        localStorage.removeItem('pageData')
    }

    async function download() {
        isDownloading = true;
        let data = getListPageData()
        let area = document.querySelector('.downloadArea')
        area.querySelector('.area-total').innerText = data.total;
        area.querySelector('.area-page').innerText = data.page + '/' + data.totalPage;

        await loopGet()


        async function loopGet() {
            let cache = getCache('cacheData')
            let pageData = getCache('pageData')
            for (let i = 0; i < data.list.length; i++) {
                if (!isDownloading) {
                    break;
                }
                let item = data.list[i]
                item = data.list[i] = await get(item)
                console.log(data.list[i])
                let has = pageData.find(s => same(s, item))
                if (!has) {
                    pageData.push(item)
                    localStorage.setItem('pageData', JSON.stringify(pageData))
                }

                if (useCache) {
                    let hasCache = cache.find(s => same(s, item))
                    if (!hasCache) {
                        cache.push(item)
                        localStorage.setItem('cacheData', JSON.stringify(cache))
                    }
                }

                area.querySelector('.area-progress-1 progress').value = i + 1;
                area.querySelector('.area-progress-2 progress').value = pageData.length / data.totalCount;
            }
            console.log('20条全部完毕, 开始下一页')

            if (!isDownloading) {
                return;
            }
            nextPage()
            let timer = setInterval(() => {
                let nextData = getListPageData()
                if (nextData.page > data.page) {
                    area.querySelector('.area-progress-1 progress').value = 0;
                    clearInterval(timer)
                    download()
                }
            }, 1000)
        }

        async function get(item) {
            let detail = await getDetailData(item)
            return {
                ...item,
                ...detail
            }
        }
    }

    function getListPageData() {
        let data = {
            total: 0,
            totalCount: 0,
            page: 0,
            totalPage: 0,
            list: []
        }
        try {
            let total = document.querySelector('.pagerTitleCell').innerText.trim()
            let totalCount = Number(total.match(/[\d,]+/)[0].replace(/,/g, ''))
            let countPageMark = document.querySelector('.countPageMark').innerText.trim()
            countPageMark = countPageMark.split(/\s*\/\s*/)
            let list = Array.from(document.querySelectorAll('.result-table-list tbody tr'))

            list = list.map(item => {
                let td = item.children
                return {
                    '序号': Number(td[0].innerText?.trim()),
                    '题名': td[1].querySelector('a')?.innerText.trim(),
                    titleUrl: td[1].querySelector('a')?.href,
                    '作者': td[2].innerText.trim(),
                    authorUrl: td[2].querySelector('a')?.href,
                    '上传者': td[3].innerText.trim(),
                    uploadUserUrl: td[3].querySelector('a')?.href,
                    '发表时间': td[4].innerText.trim(),
                    '数据库': td[5].innerText.trim(),
                    '被引': td[6].innerText.trim(),
                    '下载': td[7].innerText.trim(),
                }
            })

            data = {
                total,
                totalCount,
                page: Number(countPageMark[0]),
                totalPage: Number(countPageMark[1]),
                list,
            }
        } catch (e) {
            console.log(e)
        }
        return data;
    }

    function getCache(key, max) {
        let cache = localStorage.getItem(key)
        if (cache) {
            try {
                cache = JSON.parse(cache)
                if (!isNaN(max) && cache.length > max) {
                    cache.splice(0, cache.length - max)
                }
            } catch (e) {
                cache = []
            }
        } else {
            cache = []
        }
        return cache
    }

    function getDetailData(item) {
        return new Promise((resolve, reject) => {
            if (useCache) {
                let cache = getCache('cacheData')
                let has = cache.find(i => same(i, item))
                if (has) {
                    resolve(has)
                    return;
                }
            }
            let i = document.getElementById('detailIframe');
            if (i) {
                i.parentElement.removeChild(i)
            }

            let iframe = document.createElement('iframe');
            iframe.style.display = 'none'
            iframe.id = 'detailIframe';
            document.body.appendChild(iframe)
            iframe.addEventListener('load', e => {
                let doc = iframe.contentDocument.querySelector('.doc')
                let obj = {
                    '来源': doc.querySelector('.top-tip')?.innerText?.trim(),
                    '单位': doc.querySelector('#authorpart + h3')?.innerText?.trim()
                }
                Array.from(doc.querySelectorAll('.doc-top>.row'))?.forEach(item => {
                    if (item.querySelector('.rowtit')) {
                        Array.from(item.querySelectorAll('[class*="rowtit"]')).forEach(s => {
                            let key = s.innerText.replace(/：/, '').trim()
                            let value = s.nextElementSibling.innerText.trim()
                            obj[key] = value
                        })
                    }
                })
                resolve(obj)
            })
            iframe.addEventListener('error', reject)
            iframe.src = item.titleUrl;
        })
    }

    function same(item, old) {
        return item['题名'] === old['题名'] && item['作者'] === old['作者'] && item['上传者'] === old['上传者'] && item['发表时间'] === old['发表时间']
    }
})();
