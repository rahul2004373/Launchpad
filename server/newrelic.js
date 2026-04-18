'use strict';

/**
 * New Relic Agent Configuration
 *
 * All settings here can be overridden via environment variables.
 * Env vars take precedence — configure secrets in .env, not here.
 *
 * Reference: https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/
 */
exports.config = {
    /**
     * Application name as it appears in the New Relic UI.
     * Override with NEW_RELIC_APP_NAME env var.
     */
    app_name: [process.env.NEW_RELIC_APP_NAME || 'mini-vercel-api'],

    /**
     * License key. Set via NEW_RELIC_LICENSE_KEY env var.
     * Never hardcode this in source code.
     */
    license_key: process.env.NEW_RELIC_LICENSE_KEY || '',

    /**
     * Log level for the New Relic agent itself (not your app).
     * Options: 'fatal', 'error', 'warn', 'info', 'debug', 'trace'
     */
    logging: {
        level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    },

    /**
     * Distributed tracing — traces requests across services.
     * Required for modern New Relic APM features.
     */
    distributed_tracing: {
        enabled: true,
    },

    /**
     * Application logging — sends your Winston logs to NR Logs automatically
     * when using @newrelic/winston-enricher.
     *
     * local_decorating: adds NR metadata (trace ID, span ID) to each log line
     * forwarding:       agent ships logs to NR Logs on your behalf
     */
    application_logging: {
        enabled:           true,
        forwarding: {
            enabled:      true,
            max_samples_stored: 10000,
        },
        local_decorating: {
            enabled: true,       // Adds NR linking metadata to Winston JSON output
        },
        metrics: {
            enabled: true,       // Exposes log level counts in NR Metrics
        },
    },

    /**
     * Error collection — sends uncaught errors to NR Errors Inbox.
     */
    error_collector: {
        enabled:              true,
        ignore_status_codes:  [404],  // Don't track 404s as errors
    },

    /**
     * Transaction tracing — detailed breakdown of slow requests.
     */
    transaction_tracer: {
        enabled:               true,
        transaction_threshold: 'apdex_f',   // Trace when response time > 4x apdex target
        record_sql:            'obfuscated', // SQL queries visible but values hidden
    },

    /**
     * Slow SQL detection.
     */
    slow_sql: {
        enabled: true,
    },

    /**
     * Browser monitoring snippet injection (disable for pure API servers).
     */
    browser_monitoring: {
        enable_auto_instrument: false,
    },
};
