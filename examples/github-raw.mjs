import { isGithubRawAccessible } from 'incngfw';

const accessible = await isGithubRawAccessible({
  timeout: 1500,
  cacheTtl: 1000,
});

console.log(
  accessible
    ? 'GitHub Raw 可以访问'
    : 'GitHub Raw 当前无法访问',
);
