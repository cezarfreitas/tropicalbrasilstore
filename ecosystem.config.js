module.exports = {
  apps: [{
    name: 'chinelos-store',
    script: 'dist/server/production.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 80,
      DATABASE_URL: 'mysql://tropical:805ce7692e5b4d6ced5f@main.idenegociosdigitais.com.br:3232/tropical'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
