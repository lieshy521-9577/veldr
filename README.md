- ## 后端服务器处理
- 直接运行测试
  - 该后端服务器需上传package.json并安装
  - 开放防火墙端口
  - ~~curl http://8.159.128.180:5000/api/articles?page=1&limit=6&status=published无法访问~~
  - ~~curl http://127.0.0.1:5000/api/articles?page=1&limit=6&status=published可以访问~~
  - 搞错服务器ip了
  - 
- service文件运行测试
  - service存储路径
  - /etc/systemd/system
- 后续上传
  - 数据库只读||用户、权限问题
    - sudo chown -R lighthouse:lighthouse /opt/cms/backend/public/data/
  - sudo journalctl -u cms-backend -f实时日志

```
# 创建项目目录结构（如果不存在）
sudo mkdir -p /opt/cms/backend/{public/uploads,temp}

# 设置所有权给 www-data
sudo chown -R www-data:www-data /opt/cms/backend

# 设置目录权限（允许读写）
sudo chmod -R 755 /opt/cms/backend/public/uploads
sudo chmod -R 755 /opt/cms/backend/temp

sudo nano /etc/systemd/system/cms-backend.service
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start cms-backend

# 设置开机自启
sudo systemctl enable cms-backend

# 检查状态
sudo systemctl status cms-backend
# 实时查看日志
sudo journalctl -u cms-backend -f

# 查看最近50条日志
sudo journalctl -u cms-backend -n 50 --no-pager


rm -rf node_modules package-lock.json
```

- ### 前端

```
      // headers: {
      //   'Content-Type': 'application/javascript'
      // },
错误vite配置



    listen 8031;
    server_name 8.159.128.180;
  
    # 根目录
    root /var/www/dist;
    index index.html;
  
    # API请求转发到后端
    location /api/ {
        proxy_pass http://cms_backend;
        proxy_set_header Host 43.133.91.197:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  
    # 上传文件请求转发
    location /uploads/ {
        proxy_pass http://cms_backend;
        proxy_set_header Host 43.133.91.197:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
```

#� �C�M�S�
�
�
