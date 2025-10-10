// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

process.env.CHROME_BIN = require('playwright').chromium.executablePath();

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {},
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    browserConsoleLogOptions: {
      level: 'error',
      terminal: false,
    },
    browserNoActivityTimeout: 60000,
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/hnews'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['dots', 'kjhtml'],
    browsers: ['ChromeHeadlessPlaywright'],
    logLevel: config.LOG_WARN,
    customLaunchers: {
      ChromeHeadlessPlaywright: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      },
    },
    restartOnFileChange: true,
  });
};
