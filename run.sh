
#DEBUG=data:* PORT=8081 nohup nodemon -i barn -i test ./bin/www > nohup_server.out &
#etcdctl set /data/1 "`hostname`:8081"
export PORT=8080
pm2 delete data
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8081
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8082
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8083
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8084
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8085
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8086
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8087
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=8088
pm2 start data.js --watch --ignore-watch="\.log$" -f
pm2 logs data
