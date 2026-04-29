Amaç: Gerçek kamera ve Raspberry Pi entegrasyonuna geçmeden önce, IP adresinden açılacak yerel web arayüzünün demo/simülasyon sürümünü oluşturmak. İlk açılışta dashboard gelecek; örnek makineler simülasyon verisiyle çalışacak; kullanıcı makine detaylarını ve makine tanıtım akışını görebilecek.

## Kapsam

1. Ana dashboard ekranı

- İlk açılışta dashboard gösterilecek.
- Tanımlı makineler kart/grafik görünümünde listelenecek.
- Her makine için anlık durum gösterilecek:
  - Çalışıyor
  - Duruş
  - Arıza/duruş
  - Kalıp değişimi
- Kartlarda temel bilgiler olacak:
  - Son çevrim süresi
  - Ortalama çevrim süresi
  - Günlük çalışma oranı
  - Son duruş süresi
  - Üretilen çevrim adedi
- Dashboard belirli aralıklarla otomatik yenileniyor hissi verecek şekilde simülasyon verisini güncelleyecek.
- Mobil görünümde de kullanılabilir olacak; mevcut önizleme genişliği dar olduğu için kartlar tek sütuna düşecek.

2. Makine detay ekranı

- Dashboard’dan bir makine seçilince detay sayfası açılacak.
- Detay sayfasında şunlar gösterilecek:
  - Anlık durum ve son algılama zamanı
  - Çevrim süresi trend grafiği
  - Günlük/haftalık/aylık/yıllık çalışma özeti sekmeleri
  - Duruş kayıtları listesi
  - Otomatik sınıflandırılmış olaylar: normal duruş, arıza/duruş, kalıp değişimi
- Kalıp değişimi mantığı arayüzde simülasyon olarak gösterilecek: yeni kalıp çevrim paterni başladığında öncesindeki uzun duruş “kalıp değişimi” olarak işaretlenmiş görünecek.

3. Makine tanıtım ekranı

- “Makine ekle” akışı eklenecek.
- Demo kamera görüntüsü benzeri bir çalışma alanı olacak.
- Bu alanda:
  - Büyük 1m x 1m reflektör alanı görsel olarak bulunmuş gibi gösterilecek.
  - Ortadaki 30cm delik ve içindeki 5x5 cm reflektör işaretlenecek.
  - Sistem büyük karenin çevresini yeni ROI alanı olarak önerecek.
- “Otomatik + düzeltme” yaklaşımı uygulanacak:
  - ROI otomatik önerilmiş görünecek.
  - Kullanıcı ROI kutusunu sürükleyip yeniden boyutlandırabilecek veya demo için ayar değerlerini değiştirebilecek.
  - Kaydedildiğinde yeni makine dashboard’a eklenecek.

4. Simülasyon veri modeli

- Gerçek kamera bağlantısı olmayacak; örnek makineler ve olaylar frontend içinde simüle edilecek.
- Örnek olarak 2 veya 4 makineyle başlanacak.
- Her makine için simülasyon şunları üretecek:
  - 0.5 saniyelik görüntü alma mantığını temsil eden son örnekleme zamanı
  - Reflektör hareketi algılandı/algılanmadı bilgisi
  - Çevrim süreleri
  - Uzun duruşlar
  - Kalıp değişimi öncesi duruşlar
  - Harici duruş/ariza kayıtları
- Kullanıcıya demo olduğunu açıkça belirten küçük bir ibare olacak; ileride gerçek RPi/kamera entegrasyonuna hazır bir yapı kurulacak.

5. Sayfa yapısı ve navigasyon

- Ana sayfa `/` dashboard olacak.
- Ayrı sayfalar oluşturulacak:
  - `/machines` veya dashboard içinden makine listesi
  - `/machines/$machineId` makine detayları
  - `/setup` makine tanıtım / ROI ayarlama ekranı
- Sol menü veya üst navigasyon eklenecek:
  - Dashboard
  - Makine Tanıtımı
  - Ayarlar / Simülasyon bilgisi
- Dar ekranda menü katlanabilir olacak.

6. Görsel tasarım

- Endüstriyel kontrol paneli hissi veren sade ve okunaklı bir tasarım yapılacak.
- Durum renkleri net olacak:
  - Yeşil: çalışıyor
  - Sarı/turuncu: kalıp değişimi veya bekleme
  - Kırmızı: arıza/duruş
  - Gri: veri yok / pasif
- Grafikler ve kartlar karanlık/açık zeminde okunaklı olacak.
- Kamera/ROI tanıtım ekranında görüntü alanı, ROI kutusu, reflektör işaretleri ve algılama adımları net gösterilecek.

## Teknik notlar

- Mevcut placeholder ana sayfa gerçek dashboard ile değiştirilecek.
- TanStack Start route yapısı korunacak; yeni sayfalar `src/routes` altında ayrı route dosyaları olarak eklenecek.
- Gerçek kamera işleme bu aşamada yapılmayacak; ancak ileride eklenecek modüller için veri yapısı ayrıştırılmış tutulacak.
- Simülasyon verisi şimdilik tarayıcı tarafında üretilecek; kalıcı veritabanı bu ilk arayüz prototipinde zorunlu değil.
- Grafikler için mevcut UI altyapısı kullanılacak; gerekirse projeye uygun hafif bir grafik kütüphanesi eklenebilir.
- RPi üretim sürümünde ileride şu ek işler planlanabilir:
  - IP kameradan 0.5 saniyede bir frame alma
  - ROI içinde reflektör parlaklığı/hareket analizi
  - Yerel veritabanı veya Lovable Cloud/Supabase kayıtları
  - Gerçek çevrim/duruş/kalıp değişimi sınıflandırma servisi
  - RPi’de masaüstü kapalıyken servis olarak çalışma

## Uygulama adımları

1. Placeholder ana sayfayı kaldırıp dashboard layout’unu oluşturmak.
2. Simülasyon veri üreticisini ve makine durum hesaplamalarını eklemek.
3. Dashboard kartları, özet metrikleri ve grafiklerini oluşturmak.
4. Makine detay sayfasını ve zaman aralığı sekmelerini eklemek.
5. Makine tanıtım / ROI düzeltme ekranını oluşturmak.
6. Navigasyon ve responsive düzeni tamamlamak.
7. Sayfa başlıkları ve açıklama metadatalarını her route için ayarlamak.
8. Son kontrol: mobil görünüm, route geçişleri, demo veri güncellenmesi ve placeholder kalmadığını doğrulamak.