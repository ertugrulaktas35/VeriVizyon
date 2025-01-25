const express = require('express');
const app = express();
const db = require('./models/db.js');  // Veritabanı bağlantısı
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const staticMiddleware = require('./middlewares/staticFiles');
const assetsRouters = require('./routes/assetsRoutes');
const userRoutes = require('./routes/usersRoutes');
const ticketRoutes = require('./routes/ticketsRoutes');
const interestRateRoutes = require('./routes/interestsRoutes');
const updateModel = require('./models/Update');

// Middleware'ler
app.use(cookieParser());
app.use(cors());
app.use(express.json());  // JSON verisini almak için
app.use(staticMiddleware);

// Kullanıcı doğrulama middleware (giriş kontrolü)
function authMiddleware(req, res, next) {
  const user = req.cookies.user;
  if (user) {
    next();  // Kullanıcı giriş yapmışsa devam et
  } else {
    res.redirect('/login');  // Giriş yapılmamışsa login sayfasına yönlendir
  }
}

// Sayfalar
app.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/p2', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'p2.html'));
});

app.get('/p3', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'p3.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'help.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// Login Sayfası
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login İşlemi
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Kullanıcıyı kullanıcı adı ve şifre ile sorgula (düz metin)
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.execute(query, [username, password], (err, results) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return res.status(500).json({ message: 'Sunucu hatası!' });
    }

    if (results.length > 0) {
      const user = results[0];

      // Kullanıcı bulunduysa, kullanıcının adını ve rolünü çerezde tut
      // HttpOnly çerezlerini sunucuya gönderiyoruz
      res.cookie('user', user.username, { httpOnly: true, maxAge: 60 * 60 * 1000 }); // 1 saatlik geçerlilik
      res.cookie('role', user.role, { httpOnly: true, maxAge: 60 * 60 * 1000 }); // 1 saatlik geçerlilik

      // Kullanıcı adı ve rolünü de **normal çerez** olarak frontend'e gönderiyoruz
      res.cookie('user_normal', user.username, { maxAge: 60 * 60 * 1000 }); // 1 saatlik geçerlilik
      res.cookie('role_normal', user.role, { maxAge: 60 * 60 * 1000 }); // 1 saatlik geçerlilik

      return res.json({ message: 'Giriş başarılı!' });
    } else {
      return res.status(400).json({ message: 'Geçersiz kullanıcı adı veya şifre!' });
    }
  });
});
app.get('/logout', (req, res) => {
  // Çerezi temizle
  res.clearCookie('user');
  
  // Login sayfasına yönlendir
  res.redirect('/login');  // login sayfanızın yolu
});

// Diğer Routes
app.use('/api/assets', assetsRouters);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/interest', interestRateRoutes);

// Periyodik görevler
setTimeout(updateModel.updateAll, 9000);
setInterval(updateModel.autoUpdate, 19000);

// Sunucu başlatma
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
