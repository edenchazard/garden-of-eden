import crypto from 'crypto';

export function encrypt(input: string, password: string) {
  const key = generateKey(password);
  const initializationVector = generateInitializationVector(password, key);

  const data = Buffer.from(input.toString(), 'utf8').toString('binary');

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    key,
    initializationVector.slice(0, 16)
  );

  const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  return Buffer.from(encrypted, 'binary').toString('base64');
}

export function decrypt(input: string, password: string) {
  const key = generateKey(password);
  const initializationVector = generateInitializationVector(password, key);

  const _input = input.replace(/-/g, '+').replace(/_/g, '/');
  const edata = Buffer.from(_input, 'base64').toString('binary');

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    initializationVector.slice(0, 16)
  );
  const decrypted =
    decipher.update(edata, 'hex', 'utf8') + decipher.final('utf8');
  return Buffer.from(decrypted, 'binary').toString('utf8');
}

function generateKey(password: string) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function generateInitializationVector(password: string, key: string) {
  return crypto
    .createHash('md5')
    .update(password + key)
    .digest('hex');
}

/* 
['token test'
].forEach((accessToken) => {
  const encrypted = encrypt(accessToken, accessTokenPassword);
  console.log(encrypted, decrypt(encrypted, accessTokenPassword));
});  */
