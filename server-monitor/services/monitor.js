const axios = require('axios');

class Watchdog {
    /**
     * @param {Function} alertCallback - Callback function(serverName, type: 'DOWN'|'RECOVERED', details: string)
     * @param {Object} options - { failureThreshold: 2, requestTimeoutMs: 5000 }
     */
    constructor(alertCallback, options = {}) {
        this.alertCallback = alertCallback || (() => {});
        this.failureThreshold = options.failureThreshold || 2;
        this.requestTimeoutMs = options.requestTimeoutMs || 5000;
        this.targets = new Map();
        this.timer = null;
    }

    /**
     * Daftarkan server target pemantauan
     */
    registerTarget(name, url) {
        this.targets.set(name, {
            name,
            url,
            status: 'INITIALIZING', // INITIALIZING | UP | DOWN
            consecutiveFails: 0,
            lastChecked: null,
            lastSeen: null,
            lastError: null
        });
    }

    /**
     * Evaluasi hasil health-check dan jalankan transisi state machine
     */
    async handleCheckResult(targetName, isSuccess, errorDetail = '') {
        const target = this.targets.get(targetName);
        if (!target) return;

        target.lastChecked = new Date().toISOString();

        if (isSuccess) {
            target.lastSeen = target.lastChecked;
            target.lastError = null;

            if (target.status === 'DOWN') {
                target.status = 'UP';
                target.consecutiveFails = 0;
                await this.triggerAlert(targetName, 'RECOVERED');
            } else {
                target.status = 'UP';
                target.consecutiveFails = 0;
            }
        } else {
            target.consecutiveFails += 1;
            target.lastError = errorDetail;

            if (target.consecutiveFails >= this.failureThreshold && target.status !== 'DOWN') {
                target.status = 'DOWN';
                await this.triggerAlert(targetName, 'DOWN', errorDetail);
            }
        }
    }

    async triggerAlert(serverName, type, details = '') {
        try {
            await this.alertCallback(serverName, type, details);
        } catch (err) {
            console.error(`[Watchdog] Gagal memicu alert callback (${serverName} - ${type}):`, err.message);
        }
    }

    /**
     * Melakukan HTTP ping ke satu target endpoint
     */
    async checkTarget(target) {
        try {
            const response = await axios.get(target.url, {
                timeout: this.requestTimeoutMs,
                headers: { 'Accept': 'application/json' }
            });

            if (response.status === 200) {
                await this.handleCheckResult(target.name, true);
            } else {
                await this.handleCheckResult(target.name, false, `HTTP Status ${response.status}`);
            }
        } catch (err) {
            const errorMsg = err.code || err.message || 'Connection Error';
            await this.handleCheckResult(target.name, false, errorMsg);
        }
    }

    /**
     * Lakukan polling ke seluruh target terdaftar
     */
    async pollAll() {
        const checks = Array.from(this.targets.values()).map(target => this.checkTarget(target));
        await Promise.allSettled(checks);
    }

    /**
     * Mulai polling periodik
     */
    startPolling(intervalMs = 10000) {
        if (this.timer) clearInterval(this.timer);

        // Initial poll segera setelah startup
        this.pollAll();

        this.timer = setInterval(() => {
            this.pollAll();
        }, intervalMs);
    }

    /**
     * Hentikan polling
     */
    stopPolling() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Ambil status ringkas seluruh target
     */
    getStatus() {
        const result = {};
        for (const [name, data] of this.targets.entries()) {
            result[name] = {
                status: data.status,
                consecutiveFails: data.consecutiveFails,
                lastChecked: data.lastChecked,
                lastSeen: data.lastSeen,
                lastError: data.lastError
            };
        }
        return result;
    }
}

module.exports = { Watchdog };
