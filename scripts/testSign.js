import fs from 'fs';
import forge from 'node-forge';

const certPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/pass_cert.pem', 'utf8');
const keyPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/fidelipass_pass.key', 'utf8');
const wwdrPem = fs.readFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/wwdr_g4.pem', 'utf8');

const cert = forge.pki.certificateFromPem(certPem);
const privateKey = forge.pki.privateKeyFromPem(keyPem);
const wwdrCert = forge.pki.certificateFromPem(wwdrPem);

const manifestData = JSON.stringify({ "pass.json": "abcdef123456" });

const p7 = forge.pkcs7.createSignedData();
p7.content = forge.util.createBuffer(manifestData, 'utf8');
p7.addCertificate(cert);
p7.addCertificate(wwdrCert);
p7.addSigner({
  key: privateKey,
  certificate: cert,
  digestAlgorithm: forge.pki.oids.sha1,
  authenticatedAttributes: [
    { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
    { type: forge.pki.oids.messageDigest },
    { type: forge.pki.oids.signingTime, value: new Date() }
  ]
});

p7.sign({ detached: true });

const asn1 = p7.toAsn1();
const derBytes = forge.asn1.toDer(asn1).getBytes();
const derBuffer = Buffer.from(derBytes, 'binary');

fs.writeFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/test_manifest_forge.json', manifestData);
fs.writeFileSync('D:/MisProyectos/TarjetaDeFidelidad/apple-certs/test_signature_forge', derBuffer);
console.log('Successfully signed with node-forge! Length:', derBuffer.length);
