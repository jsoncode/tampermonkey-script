// ==UserScript==
// @name         知网公共爬虫
// @namespace    http://tampermonkey.net/
// @require      https://cdn.bootcdn.net/ajax/libs/exceljs/4.3.0/exceljs.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @version      2.0
// @description  try to take over the world!
// @author       You
// @match        https://kns.cnki.net/kns8/DefaultResult/Index**
// @match        https://kns.cnki.net/kns8/defaultresult/index
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let useCache = true;
    let btn = document.querySelector('.downloadBoxBtn')

    let script = document.createElement('script')
    script.src = 'https://antimatter15.com/ocrad.js/ocrad.js';
    document.body.appendChild(script)

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
    let saving = false;
    let limitCount = 0;
    let nextTimer = null;
    let continueTimer = null;
    let imgTimer = null;
    btn.addEventListener('click', e => {
        createArea()

        if (isOpen) {
            btn.innerHTML = '<span>打开</span><span>面版</span>';
        } else {
            btn.innerHTML = '<span>关闭</span><span>面版</span>';

            reset()
        }
        isOpen = !isOpen
    })

    function reset() {
        let data = getListPageData()
        let area = document.querySelector('.downloadArea')
        let cacheData = getCache('cacheData')
        let pageData = getCache('pageData')
        area.querySelector('.area-total').innerText = data.totalString;
        area.querySelector('.area-page').innerText = data.page + '/' + data.totalPage;
        area.querySelector('.totalCache').innerText = cacheData.length;
        area.querySelector('.pageCache').innerText = pageData.length;
        area.querySelector('.area-progress-1 progress').max = data.pageSize;
        area.querySelector('.area-progress-2 progress').max = limitCount ? limitCount : data.totalCount;
        area.querySelector('.area-progress-1 progress').title = data.pageSize;
        area.querySelector('.area-progress-2 progress').title = limitCount ? limitCount : data.totalCount;
    }

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
            area.style.fontSize = '12px';
            area.style.zIndex = '99999';
            area.style.background = '#fff';
            area.style.borderRadius = '4px';
            area.style.boxShadow = '0 0 20px 5px rgba(0,0,0,0.2)';
            area.className = 'downloadArea';
            area.innerHTML = `
            <style>.area-item{display: flex;align-items: center;padding:5px 10px;justify-content: space-between}
            .area-item progress{width: 100%;height: 20px;}
            .area-item button{user-select: none; height: 28px;border-radius: 4px;padding: 0 6px;background: #0f5de5;color: #fff;font-size: 12px;border:0;}
            .area-item .exportBtn{background: #ff9120;}
            .area-item .area-progress-title{width: 90px;}
            .area-item .area-progress-value{flex: 1}
            .area-item .limit-value{width:160px;height:20px;padding: 3px 10px;border: 1px solid #ddd;}
            .area-item .limit-value::-webkit-outer-spin-button,
            .area-item .limit-value::-webkit-inner-spin-button{-webkit-appearance: none;}
            </style>
            <div class="area-item">
                <div class="area-total"></div>
                <div class="area-page"></div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">控制下载数量: </div>
                <div class="area-progress-value area-progress-1">
                    <input type="number" min="0" class="limit-value" value="${limitCount}"/>
                </div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">总缓存: <span class="totalCache"></span></div>
                <div>本次缓存: <span class="pageCache"></span></div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">本页下载进度: </div>
                <div class="area-progress-value area-progress-1">
                    <progress max="20" min="0" value="0"></progress>
                </div>
            </div>
            <div class="area-item">
                <div class="area-progress-title">总进度: </div>
                <div class="area-progress-value area-progress-2">
                    <progress max="10000" min="0" value="0"></progress>
                </div>
            </div>
            <div class="area-item">
                <button class="downloadBtn">点击开始下载</button>
                <button class="exportBtn">停止下载并导出</button>
            </div>
            <div class="area-item">
                <button class="exportCache">导出缓存</button>
                <button class="continueHistory">继续上次下载</button>
                <button class="clearCache">清空缓存</button>
            </div>
            `
            document.body.appendChild(area)
            document.querySelector('.downloadBtn').addEventListener('click', () => {
                download()
            })
            document.querySelector('.exportBtn').addEventListener('click', () => {
                exportData()
            })
            document.querySelector('.continueHistory').addEventListener('click', () => {
                let dataPageNum = localStorage.getItem('dataPageNum')
                let dataPageUrl = localStorage.getItem('dataPageUrl')

                if (dataPageNum && !isNaN(dataPageNum) && dataPageUrl) {
                    let data = getListPageData()
                    dataPageNum = Number(dataPageNum)
                    if (dataPageUrl === location.href) {
                        if (!isDownloading) {

                            continueD()

                            function continueD() {
                                let data = getListPageData()
                                data.list = data.list.filter(item => !!item['题名'])
                                if (data.list.length === 0) {
                                    return;
                                }
                                let img = document.getElementById('changeVercode')
                                if (img) {
                                    clearTimeout(imgTimer)
                                    listenCodeImg()
                                    return;
                                }
                                if (data.page === dataPageNum) {
                                    download()
                                } else {
                                    if (data.page < dataPageNum) {
                                        let lastEl = document.getElementById('PageNext')?.previousElementSibling;
                                        if (!lastEl) {
                                            return
                                        }
                                        let lastPage = Number(lastEl.dataset.curpage)
                                        if (lastPage === dataPageNum) {
                                            download()
                                        } else if (lastPage > dataPageNum) {
                                            document.getElementById('page' + dataPageNum)?.click()

                                            continueTimer = setInterval(() => {
                                                let nextData = getListPageData()
                                                if (dataPageNum === nextData.page) {
                                                    area.querySelector('.area-progress-1 progress').value = 0;
                                                    clearInterval(continueTimer)
                                                    download()
                                                }
                                            }, 1000)
                                        } else {
                                            lastEl.click();
                                            continueTimer = setInterval(() => {
                                                let nextData = getListPageData()
                                                if (nextData.page !== dataPageNum) {
                                                    clearInterval(continueTimer)
                                                    continueD()
                                                }
                                            }, 1000)
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (confirm('当前搜索条件和上次不一样，是否回到上次搜索继续下载？')) {
                            loction.herf = dataPageUrl
                        }
                    }
                }
            })
            document.querySelector('.exportCache').addEventListener('click', () => {
                exportData(true)
            })
            document.querySelector('.clearCache').addEventListener('click', () => {
                localStorage.removeItem('pageData')
                localStorage.removeItem('cacheData')
                localStorage.removeItem('dataPageNum')
                localStorage.removeItem('dataPageUrl')
                area.querySelector('.area-progress-1 progress').value = 0;
                area.querySelector('.area-progress-2 progress').value = 0;
            })
            document.querySelector('.limit-value').addEventListener('change', (e) => {
                limitCount = e.target.value;
                reset();
            })
            document.querySelector('.limit-value').addEventListener('mousewheel', e => {
                e.stopPropagation()
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
        document.getElementById('Page_next_top')?.click()
    }

    function exportData(isCache) {
        if (saving) {
            return;
        }
        saving = true;
        isDownloading = false;
        let pageData = getCache(isCache ? 'cacheData' : 'pageData')

        //create new excel work book
        let workbook = new ExcelJS.Workbook();
        workbook.creator = 'jsoncode';
        workbook.lastModifiedBy = 'jsoncode';
        workbook.created = new Date();

        //add name to sheet
        let worksheet = workbook.addWorksheet("知网数据", {
            properties: {
                defaultColWidth: 30,
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
        let headerAZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

        // 扩展其他表头
        pageData.forEach(item => {
            let keys = Object.keys(item);
            keys.forEach(key => {
                if (!header.includes(key) && key !== 'titleUrl' && key !== 'authorUrl' && key !== 'uploadUserUrl' && key !== 'author') {
                    header.push(key)
                }
            })
        })
        worksheet.columns = header.map((item, index) => {
            let width = 30;
            if (index === 0) {
                width = 10
            }
            return {
                header: item,
                key: item,
                width
            }
        })
        pageData.forEach((item, rowIndex) => {
            let data = []
            header.forEach(key => {
                let value = item[key];
                value = isNaN(value) ? value : Number(value)
                data.push(value)
            })
            worksheet.addRow(data);

            header.forEach(key => {
                let cellName = headerAZ[header.indexOf(key)] + rowIndex;
                worksheet.getCell(cellName).alignment = {wrapText: true, vertical: 'middle', horizontal: 'center'};
            })
        })

        saving = false;
        isCache ? null : localStorage.removeItem('pageData')

        let area = document.querySelector('.downloadArea')
        let cacheData = getCache('cacheData')
        let data = getCache('pageData')
        area.querySelector('.totalCache').innerText = cacheData.length;
        area.querySelector('.pageCache').innerText = data.length;
        localStorage.removeItem('dataPageNum')
        localStorage.removeItem('dataPageUrl')

        //add data and file name and download
        workbook.xlsx.writeBuffer().then((data) => {
            let blob = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            saveAs(blob, new Date().toLocaleString().replace(/[-:]/g, '-') + '.xlsx');
        });
    }

    async function download(isLoop) {
        let data = getListPageData()
        data.list = data.list.filter(item => !!item['题名'])
        let downloadBtn = document.querySelector('.downloadBtn')
        if (!isLoop && isDownloading || data.list.length === 0) {
            isDownloading = false;
            downloadBtn.innerText = '点击开始下载';
            clearInterval(nextTimer)
            return;
        }
        downloadBtn.innerText = '停止下载';
        isDownloading = true;
        let area = document.querySelector('.downloadArea')
        area.querySelector('.area-total').innerText = data.totalString;
        area.querySelector('.area-page').innerText = data.page + '/' + data.totalPage;
        localStorage.setItem('dataPageNum', data.page)
        localStorage.setItem('dataPageUrl', location.href)

        await loopGet()

        async function loopGet() {
            let cache = getCache('cacheData')
            let pageData = getCache('pageData')

            let list = Array.from(document.querySelectorAll('.result-table-list tbody tr'))
            await getList(0)

            async function getList(i) {
                let item = data.list[i]
                if (item && isDownloading && (!limitCount || limitCount && limitCount > pageData.length)) {
                    list[i].firstElementChild.style.background = '#0f5de5';
                    item = data.list[i] = await get(item)
                    console.log(data.list[i]['题名'])

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
                    area.querySelector('.totalCache').innerText = cache.length;
                    area.querySelector('.pageCache').innerText = pageData.length;

                    area.querySelector('.area-progress-1 progress').value = (i + 1);
                    area.querySelector('.area-progress-2 progress').value = limitCount ? pageData.length : pageData.length;
                    i++;
                    await getList(i)
                } else {
                    return
                }
            }

            if (isDownloading) {
                console.log('20条全部完毕, 开始下一页')
            }

            if (isDownloading && (!limitCount || limitCount && limitCount > pageData.length)) {
                nextPage()
                nextTimer = setInterval(() => {
                    let nextData = getListPageData()
                    if (nextData.page > data.page) {
                        area.querySelector('.area-progress-1 progress').value = 0;
                        clearInterval(nextTimer)
                        download(true)
                    } else {
                        let img = document.getElementById('changeVercode')
                        if (img) {
                            listenCodeImg();
                            clearInterval(nextTimer)
                        }
                    }

                }, 1000)
            } else {
                return;
            }
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
            totalString: 0,
            totalCount: 0,
            page: 0,
            totalPage: 0,
            list: [],
            pageSize: 20,
        }
        try {
            let totalString = document.querySelector('.pagerTitleCell')?.innerText?.trim()
            if (!totalString) {
                return data;
            }
            let pageSize = document.querySelector('#perPageDiv .sort-default span')?.innerText.trim();
            let totalCount = Number(totalString.match(/[\d,]+/)[0].replace(/,/g, ''))

            if (totalCount < pageSize) {
                pageSize = totalCount
            }
            let countPageMark = document.querySelector('.countPageMark')?.innerText?.trim() || ''
            if (countPageMark) {
                countPageMark = countPageMark.split(/\s*\/\s*/)
            }
            let list = Array.from(document.querySelectorAll('.result-table-list tbody tr'))

            list = list.map(item => {
                let td = item.children
                let c1 = td[6].innerText.trim()
                let c2 = td[7].innerText.trim()
                c1 = isNaN(c1) ? null : Number(c1)
                c2 = isNaN(c2) ? null : Number(c2)
                return {
                    '序号': Number(td[0].innerText?.trim()),
                    '题名': td[1].querySelector('a')?.innerText?.trim(),
                    titleUrl: td[1].querySelector('a')?.href,
                    '作者': td[2].querySelector('a')?.innerText?.trim(),
                    authorUrl: td[2].querySelector('a')?.href,
                    '来源': td[3].innerText.trim(),
                    '发表时间': td[4].innerText.trim(),
                    '数据库': td[5].innerText.trim(),
                    '被引': c1,
                    '下载': c2,
                }
            })

            data = {
                totalString,
                totalCount,
                pageSize,
                page: Number(countPageMark[0] || 1),
                totalPage: Number(countPageMark[1] || 1),
                list,
            }
        } catch (e) {
            throw Error(e)
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
                    console.log('from cache', has['题名'])
                    resolve(has)
                    return;
                }
            }
            let i = document.getElementById('detailIframe');
            if (i) {
                i.parentElement.removeChild(i)
            }
            if (item.titleUrl) {
                fetch(item.titleUrl).then(res => res.text()).then(res => {
                    let doc = window.jQuery(res).find('.doc')
                    let obj = {
                        '来源': Array.from(doc.find('.top-tip a')).map(a => a.innerText.trim()).join('；'),
                        '作者': Array.from(doc.find('#authorpart a')).map(a => a.innerText.trim()).join('；'),
                        '单位': Array.from(doc.find('#authorpart + h3 a')).map(a => a.innerText.trim()).join('；'),
                    }
                    Array.from(doc.find('.doc-top>.row'))?.forEach(item => {
                        if (item.querySelector('.rowtit')) {
                            Array.from(item.querySelectorAll('[class*="rowtit"]')).forEach(s => {
                                let key = s.innerText.replace(/：/, '').trim()
                                let value = s.nextElementSibling.innerText.trim().replace(/\s+/g, '')
                                obj[key] = value
                            })
                        }
                    })
                    resolve(obj)
                }).catch(e => {
                    console.log(e)
                })
            }
        })
    }

    function same(item, old) {
        return item['题名'] === old['题名'] && item['发表时间'] === old['发表时间']
    }

    let loadImgResolve = null;

    function loadImg(e) {
        let img = e.target;
        if (!img) {
            return;
        }
        let newImg = document.createElement('img')
        newImg.src = getImgGray(img, 200)
        // newImg.src = await drawImgToCanvas(newImg)
        newImg.addEventListener('load', () => {
            let code = OCRAD(img).replace(/\s/g, '')
            loadImgResolve && loadImgResolve(code)
        })
    }

    async function getCode() {
        loadImgResolve = null
        return new Promise(function (resolve, reject) {
            loadImgResolve = resolve;
            let img = document.getElementById('changeVercode')

            if (img.height) {
                let newImg = document.createElement('img')
                newImg.src = getImgGray(img, 200)
                // newImg.src = await drawImgToCanvas(newImg)
                newImg.addEventListener('load', () => {
                    let code = OCRAD(img).replace(/\s/g, '')
                    resolve(code)
                })
            } else {
                img.removeEventListener('load', loadImg)
                img.addEventListener('load', loadImg)
            }
        })
    }

    function loadImg2() {
        listenCodeImg()
    }

    async function listenCodeImg() {
        clearTimeout(imgTimer)
        let img = document.getElementById('changeVercode')
        let input = document.getElementById('vericode')
        let checkCodeBtn = document.getElementById('checkCodeBtn')
        if (img) {
            let code = await getCode()
            input.value = code;
            checkCodeBtn.click()
            imgTimer = setTimeout(() => {
                clearTimeout(imgTimer)
                img?.click();
                img?.removeEventListener('load', loadImg2)
                img?.addEventListener('load', loadImg2)
                document.querySelector('.continueHistory').click()
            }, 3000)
        } else {
            area.querySelector('.area-progress-1 progress').value = 0;
            clearInterval(nextTimer)
            download(true)
        }
    }

    function getImgGray(img, threshold) {
        var canvas = document.createElement('canvas');
        var c = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        c.drawImage(img, 0, 0, img.width, img.height);
        var imgData = c.getImageData(0, 0, img.width, img.height);
        var index = threshold ? threshold : OTSUAlgorithm(imgData);//阈值
        for (var i = 0; i < imgData.data.length; i += 4) {
            var R = imgData.data[i]; //R(0-255)
            var G = imgData.data[i + 1]; //G(0-255)
            var B = imgData.data[i + 2]; //B(0-255)
            var Alpha = imgData.data[i + 3]; //Alpha(0-255)
            var sum = (R + G + B) / 3;
            if (sum > index) {
                imgData.data[i] = 255;
                imgData.data[i + 1] = 255;
                imgData.data[i + 2] = 255;
                imgData.data[i + 3] = Alpha;
            } else {
                imgData.data[i] = 0;
                imgData.data[i + 1] = 0;
                imgData.data[i + 2] = 0;
                imgData.data[i + 3] = Alpha;
            }
        }
        c.putImageData(imgData, 0, 0);
        return canvas.toDataURL()
    }

    //一维OTSU图像处理算法
    function OTSUAlgorithm(canvasData) {
        var m_pFstdHistogram = new Array();//表示灰度值的分布点概率
        var m_pFGrayAccu = new Array();//其中每一个值等于m_pFstdHistogram中从0到当前下标值的和
        var m_pFGrayAve = new Array();//其中每一值等于m_pFstdHistogram中从0到当前指定下标值*对应的下标之和
        var m_pAverage = 0;//值为m_pFstdHistogram【256】中每一点的分布概率*当前下标之和
        var m_pHistogram = new Array();//灰度直方图
        var i, j;
        var temp = 0, fMax = 0;//定义一个临时变量和一个最大类间方差的值
        var nThresh = 0;//最优阀值
        //初始化各项参数
        for (i = 0; i < 256; i++) {
            m_pFstdHistogram[i] = 0;
            m_pFGrayAccu[i] = 0;
            m_pFGrayAve[i] = 0;
            m_pHistogram[i] = 0;
        }
        //获取图像的像素
        var pixels = canvasData.data;
        //下面统计图像的灰度分布信息
        for (i = 0; i < pixels.length; i += 4) {
            //获取r的像素值，因为灰度图像，r=g=b，所以取第一个即可
            var r = pixels[i];
            m_pHistogram[r]++;
        }
        //下面计算每一个灰度点在图像中出现的概率
        var size = canvasData.width * canvasData.height;
        for (i = 0; i < 256; i++) {
            m_pFstdHistogram[i] = m_pHistogram[i] / size;
        }
        //下面开始计算m_pFGrayAccu和m_pFGrayAve和m_pAverage的值
        for (i = 0; i < 256; i++) {
            for (j = 0; j <= i; j++) {
                //计算m_pFGaryAccu[256]
                m_pFGrayAccu[i] += m_pFstdHistogram[j];
                //计算m_pFGrayAve[256]
                m_pFGrayAve[i] += j * m_pFstdHistogram[j];
            }
            //计算平均值
            m_pAverage += i * m_pFstdHistogram[i];
        }
        //下面开始就算OSTU的值，从0-255个值中分别计算ostu并寻找出最大值作为分割阀值
        for (i = 0; i < 256; i++) {
            temp = (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i])
                * (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i])
                / (m_pFGrayAccu[i] * (1 - m_pFGrayAccu[i]));
            if (temp > fMax) {
                fMax = temp;
                nThresh = i;
            }
        }
        return nThresh
    }

    async function drawImgToCanvas(image, rotate) {
        return new Promise((resolve, reject) => {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext('2d')
            var img = new Image();
            img.setAttribute('crossOrigin', 'Anonymous')
            img.src = image.src;

            img.onload = function () {
                canvas.width = img.height;
                canvas.height = img.width;

                context.translate(canvas.width / 2, canvas.height / 2)
                context.rotate(rotate * Math.PI / 180)
                context.translate(-canvas.width / 2, -canvas.height / 2)
                context.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2)
                context.translate(canvas.width / 2, canvas.height / 2)
                context.rotate(-rotate * Math.PI / 180)
                context.translate(-canvas.width / 2, -canvas.height / 2)
                context.restore()
                var base64 = canvas.toDataURL();
                resolve(base64)
            };
        })
    }
})();
