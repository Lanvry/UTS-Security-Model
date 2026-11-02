const assert = require('assert');
const { normalizeJid, formatAlertMessage } = require('../server-monitor/services/whatsapp');

function testNormalization() {
    assert.strictEqual(normalizeJid('08123456789'), '628123456789@s.whatsapp.net');
    assert.strictEqual(normalizeJid('628123456789'), '628123456789@s.whatsapp.net');
    assert.strictEqual(normalizeJid('+628123456789'), '628123456789@s.whatsapp.net');
    assert.strictEqual(normalizeJid('0812-3456-7890'), '6281234567890@s.whatsapp.net');
    assert.strictEqual(normalizeJid(''), '');

    const alertDown = formatAlertMessage('server-a', 'DOWN', 'ECONNREFUSED');
    assert.ok(alertDown.includes('ALERT'));
    assert.ok(alertDown.includes('SERVER-A'));
    assert.ok(alertDown.includes('DOWN'));
    assert.ok(alertDown.includes('ECONNREFUSED'));

    const alertUp = formatAlertMessage('server-b', 'RECOVERED');
    assert.ok(alertUp.includes('RECOVERED'));
    assert.ok(alertUp.includes('SERVER-B'));
    assert.ok(alertUp.includes('ONLINE'));

    console.log('✓ WhatsApp normalization & format test passed');
}

try {
    testNormalization();
} catch (err) {
    console.error('FAIL:', err.message || err);
    process.exit(1);
}

