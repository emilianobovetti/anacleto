export const randInt = () => (Math.random() * 2 ** 31) | 0
export const uniqueString = () => Array(4).fill().map(randInt).join('-')
