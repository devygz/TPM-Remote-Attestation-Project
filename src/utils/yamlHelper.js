const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function generateComposeYaml(configObject) {
    return yaml.dump(configObject);
}

function saveYamlToFile(yamlString, filePath) {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, yamlString, 'utf8');
}

function makeYamlAndSave(configObject, filePath) {
    const yamlString = generateComposeYaml(configObject);
    saveYamlToFile(yamlString, filePath);
}

function parseYamlFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContent);
}

module.exports = {
    generateComposeYaml,
    saveYamlToFile,
    makeYamlAndSave,
    parseYamlFile,
};
