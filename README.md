# 🎬 Streamer Tipping dApp (Merkeziyetsiz Yayıncı Bağış Sistemi)

Bu proje, içerik üreticilerine doğrudan kripto para (SOL) ile bağış yapılmasını sağlayan, aracıları ortadan kaldıran ve **TikTok tarzı dikey kaydırmalı (vertical scroll)** modern bir arayüze sahip tam kapsamlı bir Web3 uygulamasıdır (dApp). 

Superteam Hackathon'u kapsamında geliştirilmiş olup, arka planda Solana ve Anchor kullanılarak yazılmış akıllı sözleşmeler barındırır.

## ✨ Özellikler

- **Modern Arayüz:** TikTok formatında tam ekran, karanlık temalı ve mobil uyumlu kullanıcı deneyimi.
- **Phantom Cüzdan Entegrasyonu:** Kullanıcılar tek tıkla Solana cüzdanlarını (Phantom) bağlayabilir.
- **Güvenli Bağış İşlemleri:** Akıllı sözleşme üzerinden yayıncıya anında SOL transferi.
- **Zincir Üstü Kayıt (On-Chain Data):** Yapılan her bağışın miktarı, bağışçının adresi ve gönderdiği özel mesaj blokzincire güvenli bir şekilde kaydedilir.
- **Hata Yönetimi (Error Handling):** 0 SOL gönderme veya kendine bağış yapma gibi durumlara karşı akıllı sözleşme düzeyinde koruma.

## 🛠️ Kullanılan Teknolojiler

**Arka Plan (Smart Contract / Backend)**
- [Solana](https://solana.com/) - Blokzincir Ağı
- [Rust](https://www.rust-lang.org/) - Sözleşme Dili
- [Anchor Framework](https://www.anchor-lang.com/) - Solana Geliştirme Çerçevesi

**Ön Yüz (Frontend)**
- [React.js](https://reactjs.org/) & [Vite](https://vitejs.dev/) - Web Arayüzü (TypeScript)
- Solana Web3.js & Wallet Adapter - Cüzdan Bağlantıları

---

## 🚀 Kurulum (Yerel Geliştirme Ortamı)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
Bilgisayarınızda şunların kurulu olduğundan emin olun:
- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/mert-bayram/superteam-projesi.git
cd superteam-projesi
