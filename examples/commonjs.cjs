'use strict';

const { detectGfw, isGithubRawAccessible } = require('incngfw');

async function main() {
  const [gfw, githubRawAccessible] = await Promise.all([
    detectGfw(),
    isGithubRawAccessible(),
  ]);

  console.log('GFW 状态:', gfw.status);
  console.log('GitHub Raw 可访问:', githubRawAccessible);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
