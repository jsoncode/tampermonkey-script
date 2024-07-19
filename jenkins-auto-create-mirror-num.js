// ==UserScript==
// @name         给jenkins自动生成唯一镜像编号
// @namespace    http://tampermonkey.net/
// @version      2024-07-04
// @description  try to take over the world!
// @author       You
// @match        https://jen.cxaone.cn/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cxaone.cn
// @grant        none
// ==/UserScript==

/**
<input id="appName" type="text" list="appNamelist" style="padding:0.5em;border-radius:10px;">
            <datalist id="appNamelist">
                <option>WeChat(微信)</option>
				<option>QQ</option>
				<option>Google Talk</option>
				<option>Twitter</option>
                <option>Facekbook</option>
            </datalist>
            */
(function() {
    let hasClick =false;
    document.addEventListener('click',(e)=>{

        if(!/BuildDockerImage\/build\?delay\=0sec/.test(location.href)){
            return;
        }

        const projectName = '';
        const loading = document.querySelector('.behavior-loading');
        const filter = document.querySelector('.uno_choice_filter')
        const project = document.querySelector('[value="project"]').nextElementSibling
        const branch = document.querySelector('[value="branch"]').nextElementSibling;
        const tag = document.querySelector('[value="docker_image_tag"]').nextElementSibling;
        const command = document.querySelector('[value="BUILD_COMMAND_ACTIVE"]')?.nextElementSibling?.querySelector('textarea');
        const npminstall = document.querySelector('[value="INSTALL_COMMAND_ACTIVE"]')?.nextElementSibling?.querySelector('textarea');
        const MergeMaster = document.querySelector('[value="MergeMaster"]')?.nextElementSibling;

        loading.style.opacity='0'
        project.style.width = project.offsetWidth +'px'

        if(e.target?.previousElementSibling?.value ==='docker_image_tag'){
            setValue()
        }else if(e.target.parentElement?.previousElementSibling?.value ==='BUILD_COMMAND_ACTIVE'){
            e.target.addEventListener('input',(e)=>{
                setValue()
            })
        }
        if(MergeMaster.checked){
            MergeMaster.click()
        }
        if(npminstall.value==='npm install'){
            npminstall.value = 'cnpm i && cnpm i core-js@3'
        }

        if(!hasClick){
            project.addEventListener('change', e=>{
                projectName = e.target.value;
            });
        }
        branch.addEventListener('focus',(e)=>{
            setValue()
        })
        tag.addEventListener('focus',(e)=>{
            setValue()
        })
        command?.addEventListener('focus',(e)=>{
            setValue()
        })
        branch.addEventListener('input',(e)=>{
            if(e.target.value==='uat'){
                if(command.value==='npm run build'){
                    command.value = 'npm run build:uat'
                }
            }else{
                if(command.value==='npm run build:uat'){
                    command.value = 'npm run build'
                }
            }
            setValue()
        })

        if(location.href.includes('/BackendBuildDockerImage')){
            const MergeMaster = document.querySelector('[value="MergeMaster"]')?.nextElementSibling
            const SkipTest = document.querySelector('[value="SkipTest"]')?.nextElementSibling
            MergeMaster.checked&& MergeMaster.click()
            !SkipTest.checked&& SkipTest.click()
        }

        hasClick=true;

    })

    function setValue(){
        const branch = document.querySelector('[value="branch"]').nextElementSibling;
        const tag = document.querySelector('[value="docker_image_tag"]').nextElementSibling;
        const command = document.querySelector('[value="BUILD_COMMAND_ACTIVE"]')?.nextElementSibling?.querySelector('textarea');
        const date = new Date()
        const list = [
            branch.value,
            command?.value?.split(':')?.[1]||'',
            'version_from_jason_build_',
            date.getFullYear(),
            (date.getMonth()+1).toString().padStart(2,'0'),
            date.getDate().toString().padStart(2,'0'),
            date.getHours().toString().padStart(2,'0'),
            date.getMinutes().toString().padStart(2,'0'),
        ]
        tag.value = list.join('_')
    }
})();
