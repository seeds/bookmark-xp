module.exports = {
  get fromEmail () { return 'error@seeds.no' },
  get isDevEnv () { return app && app.config && app.config.ENV && (app.config.ENV).toLowerCase().trim() === 'dev' }
}
