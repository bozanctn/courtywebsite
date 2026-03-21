# Courty Website 🎾

Courty uygulaması için gizlilik politikası ve kullanım şartlarını içeren modern, animasyonlu ve profesyonel website.

## ✨ Özellikler

- **🎨 Modern Gradient Tasarım**: PlayForMore.app tarzında modern gradient ve glassmorphism efektleri
- **⚡ Smooth Animasyonlar**: Scroll reveal, fade-in, slide-in ve float animasyonları
- **📱 Responsive Tasarım**: Mobil, tablet ve masaüstü tam uyumlu
- **🎯 Interactive Elements**: Hover efektleri, ripple butonlar, parallax mouse hareketi
- **🔐 Güvenlik Sayfaları**: Email doğrulama, şifre sıfırlama, hesap silme sayfaları
- **💬 İletişim Formu**: Modern, interaktif kullanıcı geri bildirim formu
- **🎭 Glassmorphism**: Blur efekti ve şeffaflık ile modern kartlar
- **🌈 Gradient Butonlar**: Modern, renkli gradient butonlar
- **📊 SEO Optimized**: Arama motorları için optimize edilmiş

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary Gradients**:
  - Gradient Primary: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
  - Gradient Secondary: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
  - Gradient Accent: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
  - Gradient Success: `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`
  - Gradient Dark: `linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)`

- **Brand Colors**:
  - Brand Blue: #317bc5
  - Brand Purple: #00228d
  - Accent Teal: #39ae5c
  - Highlight Yellow: #e1eb05

### Animasyonlar
- **Fade In**: Yumuşak görünme animasyonu
- **Slide In**: Sağdan/soldan kayma animasyonu
- **Float**: Süzülme animasyonu (hero app preview)
- **Pulse**: Nabız animasyonu (CTA butonlar)
- **Glow**: Işıltı animasyonu (arka plan)
- **Ripple**: Dalga animasyonu (buton tıklama)

## 📁 Dosya Yapısı

```
courtywebsite/
├── index.html                 # Ana sayfa (gizlilik, kullanım şartları, iletişim)
├── contact.html               # İletişim sayfası
├── privacy.html               # Gizlilik politikası sayfası
├── terms.html                 # Kullanım şartları sayfası
├── account-deletion.html      # Hesap silme sayfası
├── email-confirmation.html    # Email doğrulama sayfası
├── password-reset.html        # Şifre sıfırlama sayfası
├── styles.css                 # Ana CSS dosyası (modern gradients & animations)
├── account-deletion.css       # Hesap silme sayfası stilleri
├── email-confirmation.css     # Email doğrulama sayfası stilleri
├── password-reset.css         # Şifre sıfırlama sayfası stilleri
├── script.js                  # JavaScript (animations, interactions, scroll effects)
├── account-deletion.js        # Hesap silme JavaScript
├── email-confirmation.js      # Email doğrulama JavaScript
├── password-reset.js          # Şifre sıfırlama JavaScript
├── config.js                  # Yapılandırma dosyası
├── config.example.js          # Yapılandırma örnek dosyası
├── logo.png                   # Courty logosu
├── 9-Photoroom (2).png        # Görsel asset
├── .gitignore                 # Git ignore dosyası
└── README.md                  # Proje dokümantasyonu
```

## 🚀 Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/[username]/courtywebsite.git
```

2. Proje klasörüne gidin:
```bash
cd courtyardwebsite
```

3. `index.html` dosyasını tarayıcınızda açın.

## 📱 Kullanım

Website şu sayfaları içerir:
- **🏠 Ana Sayfa**: Modern hero section, hoş geldin mesajı ve animasyonlu uygulama önizlemesi
- **🔒 Gizlilik Politikası**: KVKK ve GDPR uyumlu detaylı politika (scroll animations ile)
- **📋 Kullanım Şartları**: Kapsamlı kullanım şartları (interaktif kartlar)
- **📧 İletişim**: Modern iletişim formu ve bilgileri (hover efektleri ile)
- **🗑️ Hesap Silme**: Kullanıcı hesap silme talimatları (gradient card design)
- **✉️ Email Doğrulama**: Email doğrulama durumu sayfası (success/error states)
- **🔑 Şifre Sıfırlama**: Şifre sıfırlama formu (password strength indicator)

### Öne Çıkan Özellikler

#### 🎬 Animasyonlar
- **Scroll Reveal**: Sayfayı kaydırdıkça içerikler görünür
- **Parallax Effect**: Mouse hareketi ile paralaks efekti
- **Float Animation**: Hero'daki telefon mockup süzülür
- **Ripple Effect**: Butonlara tıkladığınızda dalga efekti
- **Glow Effects**: Arka plan parıltı animasyonları

#### 🎨 Tasarım Özellikleri
- **Glassmorphism**: Bulanık cam efekti kartlar
- **Gradient Backgrounds**: Renkli gradient arka planlar
- **Modern Card Design**: 3D gölgeler ve hover efektleri
- **Smooth Transitions**: Butun etkileşimler yumuşak geçişlerle
- **Responsive Grid**: Her ekran boyutunda mükemmel görünüm

## 🔧 Teknik Detaylar

### Frontend Teknolojileri
- **HTML5**: Semantik markup ve accessibility
- **CSS3**: 
  - CSS Variables (CSS Custom Properties)
  - CSS Grid & Flexbox
  - CSS Animations & Transitions
  - Backdrop-filter (Glassmorphism)
  - Gradient backgrounds
  - Media queries (responsive design)
- **Vanilla JavaScript**: 
  - Framework bağımsız
  - Intersection Observer API (scroll animations)
  - Event Listeners (interactive elements)
  - DOM Manipulation
  - Debouncing (performance optimization)
  - Ripple effect generator

### Performans Optimizasyonları
- **Debounced Scroll Handlers**: Daha az işlem, daha hızlı sayfa
- **CSS Transitions**: Hardware-accelerated animations
- **Lazy Animations**: Sadece görünür öğeler animate olur
- **Optimized Gradients**: GPU-accelerated gradients

### Tarayıcı Uyumluluğu
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Breakpoints
- 📱 Mobile: < 480px
- 📱 Tablet: 481px - 768px
- 💻 Desktop: > 768px

## 📞 İletişim

- **E-posta**: info.courty@gmail.com

## 📄 Lisans

Bu proje özel mülkiyettir. Tüm hakları saklıdır.

## 🏷️ Versiyon

- **Versiyon**: 2.0.0 - Modern Gradient Update
- **Son Güncelleme**: 7 Ekim 2025

### Değişiklik Geçmişi

#### v2.0.0 (7 Ekim 2025) - Major Update 🎨
- ✨ PlayForMore.app tarzında modern gradient tasarım
- ⚡ Tüm sayfalara smooth scroll animasyonları eklendi
- 🎭 Glassmorphism efektleri (blur + transparency)
- 🌈 Modern gradient butonlar ve kartlar
- 🎯 Interactive elements (ripple, parallax, hover effects)
- 📱 Geliştirilmiş responsive tasarım
- 🎬 Fade-in, slide-in, float animasyonları
- 💫 Background glow ve pulse efektleri
- 🔧 Performans optimizasyonları (debouncing, lazy animations)
- 📄 Tüm özel sayfalar (hesap silme, email doğrulama, şifre sıfırlama) yenilendi

#### v1.0.0 (1 Aralık 2024)
- 🎉 İlk versiyon
- 📝 Gizlilik politikası ve kullanım şartları
- 📧 İletişim formu
- 📱 Responsive tasarım

---

© 2024-2025 Courty. Tüm hakları saklıdır.
