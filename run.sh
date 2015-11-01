
#DEBUG=data:* PORT=8081 nohup nodemon -i barn -i test ./bin/www > nohup_server.out &
#etcdctl set /data/1 "`hostname`:8081"
pm2 delete data
pm2 start data.js --watch --ignore-watch="\.log$"
pm2 logs data
