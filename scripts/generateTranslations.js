const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const CN_API_URL = 'https://api.atlasacademy.io/export/CN/nice_servant.json';
const NA_API_URL = 'https://api.atlasacademy.io/export/NA/nice_servant.json';
const NAME_MAPPING_PATH = path.join(__dirname, '../nameMapping.json');
const OUTPUT_PATH = path.join(__dirname, '../src/translations.json');

async function fetchData(url) {
  const response = await axios.get(url);
  return response.data;
}

async function generateTranslations() {
  try {
    // 获取中文和英文数据
    const cnData = await fetchData(CN_API_URL);
    const naData = await fetchData(NA_API_URL);

    // 创建 ID 到名称的映射
    const cnMap = new Map(cnData.map(servant => [servant.id, servant.name]));
    const naMap = new Map(naData.map(servant => [servant.id, servant.name]));

    // 创建英文到中文的映射
    const translations = {};
    naMap.forEach((enName, id) => {
      if (cnMap.has(id)) {
        translations[enName] = cnMap.get(id);
      }
    });

    // 读取别名映射
    const nameMapping = JSON.parse(await fs.readFile(NAME_MAPPING_PATH, 'utf-8'));

    // 合并官方翻译和别名
    Object.assign(translations, nameMapping);

    // 写入最终的翻译文件
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(translations, null, 2));

    console.log('Translations generated successfully!');
  } catch (error) {
    console.error('Error generating translations:', error);
  }
}

generateTranslations();
