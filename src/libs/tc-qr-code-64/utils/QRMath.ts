export class QRMath {
    private static readonly EXP_TABLE: number[] = new Array(256);
    private static readonly LOG_TABLE: number[] = new Array(256);
    private static initialized = false;

    private static initialize(): void {
        if (this.initialized) return;

        // Initialize EXP_TABLE
        for (let i = 0; i < 8; i++) {
            this.EXP_TABLE[i] = 1 << i;
        }
        for (let i = 8; i < 256; i++) {
            this.EXP_TABLE[i] =
                this.EXP_TABLE[i - 4] ^
                this.EXP_TABLE[i - 5] ^
                this.EXP_TABLE[i - 6] ^
                this.EXP_TABLE[i - 8];
        }

        // Initialize LOG_TABLE
        for (let i = 0; i < 255; i++) {
            this.LOG_TABLE[this.EXP_TABLE[i]] = i;
        }

        this.initialized = true;
    }

    static glog(n: number): number {
        this.initialize();

        if (n < 1) {
            throw new Error(`glog(${n})`);
        }

        return this.LOG_TABLE[n];
    }

    static gexp(n: number): number {
        this.initialize();

        while (n < 0) {
            n += 255;
        }

        while (n >= 256) {
            n -= 255;
        }

        return this.EXP_TABLE[n];
    }
}
