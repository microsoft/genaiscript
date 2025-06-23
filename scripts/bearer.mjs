import { randomBytes } from 'crypto';

const buffer = randomBytes(48)
const token = buffer.toString('hex');
console.log(token)
