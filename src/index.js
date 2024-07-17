// imports
const core = require('@actions/core');
const github = require('@actions/github');

const fs = require('fs');

// main
async function run() {
    try {
        // 使用 GitHub 的官方 SDK 创建一个 Octokit 实例，用于操作 GitHub API。
        // `getInput` 是 GitHub Actions 的一个函数，用于获取 action 的输入参数。
        var octokit = new github.getOctokit(core.getInput('token'));

        // 获取源分支的引用（例如，'refs/heads/main'）
        var ref = core.getInput('source-ref');

        // 从输入参数中获取仓库的拥有者和仓库名称，输入格式通常是 "owner/repo"
        var repositoryAndOwner = core.getInput('source-repository').split('/');
        var owner = repositoryAndOwner[0]; // 仓库拥有者
        var repo = repositoryAndOwner[1] // 仓库名称

        // 获取配置文件列表，这些文件以逗号分隔
        var configurationFiles = core.getInput('actions-configuration-files');
        configurationFiles = configurationFiles.split(','); // 将字符串分割成数组

        // 遍历配置文件列表
        configurationFiles.forEach(file => {
            // 提取文件名，如果路径中包含斜杠，则只取最后一部分作为文件名
            let fileName = file.includes('/') ? file.substring(file.lastIndexOf('/') + 1, file.length) : file;
            // 构建本地文件路径
            let filePath = './.github/workflows/' + fileName;

            // 使用 octokit 实例调用 GitHub API 获取指定文件的原始内容
            octokit.rest.repos.getContent({ owner: owner, repo: repo, path: file, ref: ref, headers: { 'Accept': 'application/vnd.github.v3.raw' } }).then(response => {
                // 读取本地文件内容
                let current = fs.readFileSync(filePath);

                // 比较本地文件内容和远程文件内容
                if (current != response.data) {
                    // 如果内容不同，则将远程文件内容写入本地文件
                    fs.writeFileSync(filePath, response.data);
                    // 设置 GitHub Actions 的输出参数，表示文件已更新
                    core.setOutput('updated', 'true');
                }
            }).catch(error => {
                // 如果在获取远程文件时出现错误，则设置 GitHub Actions 的失败状态，并记录错误信息
                core.setFailed('Cannot resolve `' + fileName + '` in target branch! ErrMsg => ' + error);
            });
        });
    } catch (error) {
        // 如果在执行过程中出现任何异常，则捕获异常并设置 GitHub Actions 的失败状态
        core.setFailed(error.message);
    }
}

// start the action
run();
