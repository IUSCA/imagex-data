
#DEBUG=data:* PORT=8081 nohup nodemon -i barn -i test ./bin/www > nohup_server.out &
#etcdctl set /data/1 "`hostname`:8081"
export PORT=9080
pm2 delete data
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9081
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9082
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9083
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9084
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9085
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9086
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9087
pm2 start data.js --watch --ignore-watch="\.log$" -f
export PORT=9088
pm2 start data.js --watch --ignore-watch="\.log$" -f
pm2 logs data
