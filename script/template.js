const fs = require('fs');
const https = require('https');

const TARGET_DIR = 'stable';
const BASE_SRC = `../${TARGET_DIR}/template.ipynb`;

async function fetchModel() {
    return new Promise((resolve, reject)=>{
        // JSON 데이터를 가져올 URL
        const url = 'https://raw.githubusercontent.com/joseph-programmer/webui/master/misc/checkpoints_sdxl.json';

        // HTTP GET 요청 보내기
        https.get(url, (response) => {
            let data = '';

            // 데이터를 수신할 때마다 호출되는 콜백 함수
            response.on('data', (chunk) => {
                data += chunk;
            });

            // 데이터 수신이 완료되면 호출되는 콜백 함수
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    })
}

const default_checkpoints = [
    {
        name: '기본 (Juggernaut XL)',
        type: '범용',
        model: 'https://civitai.com/models/133005/juggernaut-xl',
        ipynb: 'default_webui_colab',
        checkpoint: '',
        checkpoint_file: '',
        bakedVAE: true,
        preset: 'default',
    },
    {
        name: '실사 (Realistic Stock Photo)',
        type: '실사',
        model: 'https://civitai.com/models/139565/realistic-stock-photo',
        ipynb: 'realistic_webui_colab',
        checkpoint: '',
        checkpoint_file: '',
        bakedVAE: true,
        preset: 'realistic',
    },
    {
        name: '애니메이션 (animaPencil XL)',
        type: '2D',
        model: 'https://civitai.com/models/261336/animapencil-xl',
        ipynb: 'anime_webui_colab',
        checkpoint: '',
        checkpoint_file: '',
        bakedVAE: true,
        preset: 'anime',
    },
]

let checkpoints = [];

async function copy_files() {
    let templateCode = fs.readFileSync(BASE_SRC, { encoding: 'utf8' });
    let readme = [];
    readme.push(`| Colab                                                                                                                                                                                            | Model                                                                                  | VAE  | Memo                    | Model                  |`);
    readme.push(`| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---- | ----------------------- | ---------------------- |`);
    const list = checkpoints.filter(x=>!x.auth).map(item=>{
        let id = item.name.toLowerCase().replace(/[- ]/g, '_').replace(/[^a-z0-9]/g, '');
        if (!item.ipynb) {
            item.ipynb = id+'_webui_colab';
        }
        if (!item.checkpoint_file) {
            item.checkpoint_file = id+'.safetensors';
        }
        if (!item.sdmodel) {
            item.sdmodel = 'sdxl';
        }
        return item;
    });
    default_checkpoints.forEach((item) => {
        console.log(`${item.ipynb} 복사`);
        let code = templateCode;
        code = code.replaceAll('#template_checkpoint_default#', item.checkpoint);
        code = code.replaceAll('#template_checkpoint_default_name#', item.checkpoint_file);
        code = code.replaceAll('#template_preset#', item.preset);
        code = code.replaceAll('#ipynb_name#', item.ipynb);
        code = code.replaceAll('#preset_memo#', "#@markdown **<font color=blue>체크포인트 URL을 입력하면 입력한 체크포인트로 자동 변경해서 다운받아요</font>**");            
        fs.writeFileSync(`../${TARGET_DIR}/${item.ipynb}.ipynb`, code);

        readme.push(`| [![Open In Colab](https://raw.githubusercontent.com/neuralninja22/colab/master/icons/colab-badge.svg)](https://colab.research.google.com/github/joseph-programmer/fooocus/blob/master/${TARGET_DIR}/${item.ipynb}.ipynb) | [${item.name}](${item.model})                    | ${item.bakedVAE ? '' : '선택'} |                       | SDXL            |`)
    });
    list.sort((a, b) => {
        // sdmodel 값을 기준으로 정렬
        let align = 0;
        if (a.sdmodel < b.sdmodel) align += 100;
        if (a.sdmodel > b.sdmodel) align += -100;
        
        // sdmodel 값이 같으면 name 값을 기준으로 정렬
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        if (nameA < nameB) align += -10;
        if (nameA > nameB) align += 10;
        
        return align;
    }).forEach((item) => {
        console.log(`${item.ipynb} 복사`);
        let code = templateCode;
        templateDefault = 'default';
        if (item.type=='2D'||item.type=='2.5D'||item.type=='3D') {
            templateDefault = 'anime';
        }
        if (item.sdmodel=='pony') {
            templateDefault = 'pony';
        }
        code = code.replaceAll('#template_checkpoint_default#', item.checkpoint);
        code = code.replaceAll('#template_checkpoint_default_name#', item.checkpoint_file);        
        code = code.replaceAll('#template_preset#', item.preset??'');
        code = code.replaceAll('#ipynb_name#', item.ipynb);
        code = code.replaceAll('#preset_memo#', "");            
        fs.writeFileSync(`../${TARGET_DIR}/${item.ipynb}.ipynb`, code);

        let defaultCode = fs.readFileSync('../misc/'+templateDefault+'.json', { encoding: 'utf8' });
        defaultCode = defaultCode.replaceAll('#Checkpoint_Url#', item.checkpoint);
        defaultCode = defaultCode.replaceAll('#Checkpoint_Filename#', item.checkpoint_file);        
        fs.writeFileSync(`../misc/presets/${item.ipynb}.json`, defaultCode);

        if (item.sdmodel=='pony') {
            readme.push(`| [![Open In Colab](https://raw.githubusercontent.com/neuralninja22/colab/master/icons/colab-badge-install.svg)](https://colab.research.google.com/github/joseph-programmer/fooocus/blob/master/${TARGET_DIR}/${item.ipynb}.ipynb) | [${item.name}](${item.model})                    | ${item.bakedVAE ? '' : '선택'} | ${item.type}                      | Pony           |`)
        } else {
            readme.push(`| [![Open In Colab](https://raw.githubusercontent.com/neuralninja22/colab/master/icons/colab-badge-nightly.svg)](https://colab.research.google.com/github/joseph-programmer/fooocus/blob/master/${TARGET_DIR}/${item.ipynb}.ipynb) | [${item.name}](${item.model})                    | ${item.bakedVAE ? '' : '선택'} | ${item.type}                      | SDXL           |`)
        }
    });

    readmeText = readme.join('\n');
    fs.writeFileSync(`../${TARGET_DIR}/README.md`, readmeText);

    return true;
}


(async function () {
    try {
        const model = await fetchModel();
        checkpoints = JSON.parse(model);
        copy_files();
    } catch (e) {
        console.error(e);
    }
})();
