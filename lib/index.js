const inquirer = require('inquirer')
const fs = require('fs')
const template = require('./utilis/template')
const shell = require('shelljs')

const avaliableTemplates = fs.readdirSync(`${__dirname}/templates`)
const currentDir = process.cwd()
const phpDirs = ['app', 'core', 'views', 'pages', 'lib']

const projectQuestions = [
    {
        name: 'choice',
        type: 'list',
        message: 'Quel template voulez-vous utiliser pour démarrer votre projet ?',
        choices: avaliableTemplates
    },
    {
        name: 'name',
        type: 'input',
        message: 'Nom du projet :',
        validate: function (input) {
            if (/^([A-Za-z\-\_\d])+$/.test(input)) return true
            else return 'Uniquement des lettres, nombres, underscores et hashes.'
        }
    },
    {
        name: 'version',
        type: 'input',
        message: 'Version du projet :',
        default: '1.0.0',
        validate: function (input) {
            if (/^(\d+\.)?(\d+\.)?(\*|\d+)$/.test(input)) return true
            else return 'Numéro de version invalide.'
        }
    },
    {
        name: 'description',
        type: 'input',
        message: 'Description du projet :'
    },
    {
        name: 'entryPoint',
        type: 'input',
        message: 'Point d\'entrée :',
        default: 'index.js',
        validate: function (input) {
            if (/^[^<>:;,?"*|\/]+$/.test(input)) return true
            else return 'Nom de fichier invalide.'
        }
    },
    {
        name: 'author',
        type: 'input',
        message: 'Auteur :'
    },
    {
        name: 'license',
        type: 'input',
        message: 'License :',
        default: 'ISC'
    },
    {
        name: 'options',
        type: 'checkbox',
        message: 'Options désirées :',
        choices: [
            {
                name: 'Préprocesseur Sass',
                value: 'sass'
            },
            {
                name: 'jQuery',
                value: 'jquery'
            },
            {
                name: 'typeScript',
                value: 'typescript'
            },
            {
                name: 'Bootstrap CDN - CSS (compilé)',
                value: 'bootstrap-cdn-css',
                checked: true
            },
            {
                name: 'Bootstrap CDN - JS (Ajoutera jQuery automatiquement)',
                value: 'bootstrap-cdn-js'
            },
            {
                name: 'ESLint StandardJS',
                value: "eslint-standard"
            },
            {
                name: 'Structure d\'un projet PHP (personnalisable)',
                value: "php-dirs"
            }
        ]
    },
    {
        name: 'wantedDirs',
        type: 'checkbox',
        choices: phpDirs,
        default: phpDirs.slice(0, 3),
        when: function(answers) {
            return answers.options.includes('php-dirs')
        }
    },
    {
        name: 'git-init',
        type: 'confirm',
        message: 'Initialiser un dépôt git ?',
        default: true
    }
];

function startGenerator () {
    inquirer.prompt(projectQuestions)
        .then(project => {
            console.log("Création du projet...")
            project.options = completeDeps(project.options)
            console.log(" - Résolution du nom...")
            const templatePath = `${__dirname}/templates/${project.choice}`

            console.log(" - Création du dossier...")
            fs.mkdirSync(`${currentDir}/${project.name}`)

            console.log(" - Copie des fichiers")
            createDirectoryContents(templatePath, project.name, project)
            if (project.wantedDirs) {
                project.wantedDirs.forEach(dir => {
                    fs.mkdirSync(`${currentDir}/${project.name}/${dir}`)
                })

            }
            if (project['git-init']) {
                console.log(" - Création du dépôt Git")
                postProcess(project.name, 'git init')
                postProcess(project.name, 'git add .')
            }

            return project
        }).then((project) => {
            inquirer.prompt([
                {
                    name: 'run-npm',
                    type: 'confirm',
                    message: 'Installer les dépendances immédiatement ?',
                    default: true
                }
            ]).then(answer => {
                if (answer['run-npm']) {
                    console.log('Exécution de "npm install"...')
                    return postProcess(project.name, 'npm install')
                }
            }).then(() => {
                inquirer.prompt([
                    {
                        name: 'audit-npm',
                        type: 'confirm',
                        message: 'Scanner le projet à la recherche de vulnérabilités ?',
                        default: true
                    }
                ])
            }).then(answer => {
                if (answer['audit-npm']) {
                    console.log('Exécution de "npm audit fix"...')
                    return postProcess(project.name, 'npm audit fix')
                }
            })
    })
}
function createDirectoryContents (templatePath, newProjectPath, project) {
    const filesToCreate = fs.readdirSync(templatePath);

    filesToCreate.forEach(file => {
        console.log(file)
        const origFilePath = `${templatePath}/${file}`;

        // get stats about the current file
        const stats = fs.statSync(origFilePath);
        if (checkOptions(file, project)) {
            if (stats.isFile()) {
                let contents = fs.readFileSync(origFilePath, 'utf8')
                contents = template.render(contents, {project})

                // Rename
                if (file === '.npmignore') file = '.gitignore';

                const writePath = `${currentDir}/${newProjectPath}/${file}`
                fs.writeFileSync(writePath, contents, 'utf8')
            } else if (stats.isDirectory()) {
                fs.mkdirSync(`${currentDir}/${newProjectPath}/${file}`)
                // recursive call
                createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`, project)
            }
        }
    })
}

function checkOptions(file, project) {
    let options = project.options
    if (file === "scss" && !options.includes('sass')) {return false}
    if (file === "css" && options.includes('sass')) {return false}
    if (file === "ts" && !options.includes('typescript')) {return false}
    if (file === "tsconfig.json" && !options.includes('typescript')) {return false}
    if (file === "js" && options.includes('typescript')) {return false}
    if (file === ".eslintrc" && !options.includes('eslint-standard')) {return false}
    if (file === ".gitignore" && !project['git-init']) {return false}

    return true
}

let postProcessMovedDir = false
async function postProcess (path, command) {
    if (!postProcessMovedDir) {
        shell.cd(path)
        postProcessMovedDir = true
    }
    const result = await shell.exec(command);
    if (result.code !== 0) {
        return false
    }
    return true
}

function completeDeps(options) {
    if (options.includes('bootstrap-cdn-js') && !options.includes('jquery')) options.push('jquery')
    return options
}

module.exports = startGenerator
