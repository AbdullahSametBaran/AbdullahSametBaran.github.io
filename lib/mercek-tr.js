// "Üç mercek" (psychology page): the Turkish text. Five everyday moments, each seen through three schools (BDT,
// psychodynamic, ACT); every school asks three questions with three answers, and the answers build that school's
// structure on the stage. The moments are invented and belong to no client. lib/mercek.js reads window.MERCEK.
window.MERCEK = {
  ui: {
    pickMoment: 'Bir an seç', pickLens: 'Bir mercek seç', start: 'Bu mercekle bak',
    step: (i, n) => `Adım ${i}/${n}`, moment: n => `AN ${String(n).padStart(2, '0')}`,
    again: 'Bu son adımı başka seç', otherLens: 'Aynı anı başka mercekle gör', otherMoment: 'Başka bir an seç',
    book: 'Bunu birlikte konuşalım: randevu talebi →', drag: 'Sürükle, döndür',
    noteTitle: 'Terapide', story: 'Örgü'
  },
  // the five moments: the same five in every school
  moments: [
    { id: 'mesaj', t: 'Okundu, cevap yok', d: 'Önemli bir şey yazdın. Üç saat geçti; mesaj okundu ama cevap gelmedi.' },
    { id: 'toplanti', t: 'Sesin titredi', d: 'Toplantıda söz aldın. Konuşurken sesin titredi; birkaç kişi sana döndü.' },
    { id: 'duzeltme', t: 'Herkesin önünde', d: 'Yöneticin, sunduğun işi ekibin önünde düzeltti.' },
    { id: 'iptal', t: 'Son anda iptal', d: 'Günlerdir beklediğin buluşmayı arkadaşın bir saat kala iptal etti.' },
    { id: 'gece', t: 'Gece 03.12', d: 'Uyuyamıyorsun. Yarınki iş görüşmesi zihninde dönüp duruyor.' }
  ],
  lenses: {
    bdt: { n: 'BDT', full: 'Bilişsel Davranışçı Terapi', d: 'Düşünce, duygu ve davranış arasındaki zinciri görür; düşünceyi kanıtla tartar.',
      parts: { durum: 'DURUM', dus: 'DÜŞÜNCE', duy: 'DUYGU', dav: 'DAVRANIŞ', alt: 'YENİ DÜŞÜNCE' } },
    psd: { n: 'Psikodinamik', full: 'Psikodinamik terapi', d: 'Bugünkü tepkinin altına iner; onu besleyen eski deneyimlere ve korunma yollarına bakar.',
      parts: { yuzey: 'YÜZEY', savunma: 'SAVUNMA', kok: 'KÖK' } },
    act: { n: 'ACT', full: 'Kabul ve Kararlılık Terapisi', d: 'Düşünceyle savaşmaz; onunla ilişkini değiştirir ve seni değerlerine doğru yürütür.',
      parts: { an: 'Şimdiki an', kabul: 'Kabul', ayrisma: 'Ayrışma', benlik: 'Gözlemleyen benlik', deger: 'Değerler', eylem: 'Kararlı eylem', merkez: 'Psikolojik esneklik' } }
  },

  /* ---------- BDT: thought (with its trap, feeling and how strong it is) → behaviour → a weighed thought ---------- */
  bdt: {
    q: ['Aklından ilk geçen düşünce hangisi?', d => `“${d}” Bu düşünceyle ne yapıyorsun?`, 'Düşünceyi tartalım. Hangisi daha dengeli?'],
    // what each kind of weighed thought teaches; "pos" is the comforting thought with nothing under it
    kinds: { den: 'Dengeli düşünce', kan: 'Kanıta dayalı düşünce', pos: 'Fazla olumlu düşünce' },
    end: (m, a) => `Durum aynı kaldı: ${m}. Değişen, onu nasıl yorumladığın. ${a.feel}: %${a.y} → %${a.y2}.`,
    note: { den: 'BDT’de düşünceyi bastırmayız; kanıta bakar, daha gerçekçi bir yorum ararız. Duygu kaybolmaz ama yönetilebilir bir boyuta iner.',
      kan: 'Kanıt aramak, zihnin anlattığı hikâyeyi gerçekle karşılaştırmaktır. Terapide bunu düşünce kayıtlarıyla, adım adım çalışırız.',
      pos: 'BDT olumlu düşünmek değil, gerçekçi düşünmektir. Kanıta dayanmayan rahatlatıcı düşünceler genellikle kalıcı olmaz. Son adımı bir de başka seçmeyi dene.' },
    m: {
      mesaj: [
        [['Beni önemsemiyor.', 'Göğsün sıkışıyor. Telefonu ters çeviriyorsun ama gözün hâlâ onda.', 'Zihin okuma', 'Kırgınlık', 80],
         ['Kesin bir şey oldu ona.', 'Aklın en kötü ihtimallere koşuyor: bir kaza, bir hastane…', 'Felaketleştirme', 'Kaygı', 75],
         ['Yine fazla yazdım, bıktı benden.', 'Mesajını tekrar tekrar okuyup her kelimeyi tartıyorsun.', 'Kişiselleştirme', 'Utanç', 70]],
        [['Art arda mesaj atıyorum.', 'Cevap yine gelmiyor; her mesajla düşünce biraz daha haklı görünüyor.', 'Tekrar yazmak'],
         ['Çevrimiçi mi diye bakıyorum.', 'Çevrimiçi. Bu, düşüncene yeni bir “kanıt” gibi geliyor.', 'Kontrol etmek'],
         ['Telefonu kapatıp küsüyorum.', 'Bir süre rahatlıyorsun ama akşam boyunca aklın orada.', 'Geri çekilmek']],
        [['Meşgul olabilir; akşam yazmazsa ben sorarım.', 'Göğsündeki sıkışma gevşiyor. Bir planın var ve henüz olmamış bir şeyi yaşamıyorsun.', 'den', 35],
         ['Daha önce hep geri döndü; aksine bir kanıtım yok.', 'Geçmişteki örnekleri hatırlamak düşüncenin gücünü azaltıyor.', 'kan', 30],
         ['Boş ver, kesin her şey yolunda.', 'Bir an rahatlıyorsun ama içten içe inanmıyorsun; düşünce birazdan geri geliyor.', 'pos', 60]]
      ],
      toplanti: [
        [['Herkes ne kadar gergin olduğumu fark etti.', 'Yüzün ısınıyor; cümlenin sonunu hızla bağlıyorsun.', 'Zihin okuma', 'Utanç', 80],
         ['Bu toplantıyı mahvettim.', 'Toplantının geri kalanında hiçbir şey duymuyorsun.', 'Ya hep ya hiç', 'Hayal kırıklığı', 75],
         ['Artık beni yetersiz görecekler.', 'Gelecek değerlendirmeler şimdiden kafanda.', 'Falcılık', 'Kaygı', 80]],
        [['Bir daha söz almıyorum.', 'Toplantı bitince rahatlıyorsun ama söylemek istediğin fikir söylenmeden kalıyor.', 'Kaçınmak'],
         ['Herkese tek tek açıklama yapıyorum.', 'Herkes “fark etmedim bile” diyor; sen yine “nezaketen söylüyorlar” diyorsun.', 'Güvence aramak'],
         ['Akşam o anı kafamda tekrar tekrar oynatıyorum.', 'Her tekrarda titreme biraz daha büyüyor.', 'Zihinsel tekrar']],
        [['Sesim titredi ama fikrimi anlattım; soru da geldi.', 'Titreme hâlâ hoş değil ama artık gördüğün tek şey o değil.', 'den', 35],
         ['Çoğu kişi notlarına bakıyordu; kimse bir şey söylemedi.', 'Gözlemlerin, zihnin anlattığı hikâyeden daha sakin.', 'kan', 30],
         ['Hiç titremedi aslında, abartıyorum.', 'Olanı yok saymak işe yaramıyor; bir sonraki toplantıda aynı korku seni bekliyor.', 'pos', 60]]
      ],
      duzeltme: [
        [['Beceriksiz olduğumu düşünüyor.', 'Masaya bakıyorsun; kimseyle göz göze gelmek istemiyorsun.', 'Zihin okuma', 'Utanç', 80],
         ['Herkesin önünde rezil oldum.', 'O birkaç saniye, kafanda bütün günü kaplıyor.', 'Büyütme', 'Utanç', 85],
         ['Bana haksızlık etti.', 'Çenen kasılıyor; cevap vermek için kelimeler diziliyor.', 'Meli-malı düşüncesi', 'Öfke', 75]],
        [['Gün boyu sessiz kalıyorum.', 'Ekip seni mesafeli buluyor; bu da düşünceni doğruluyor gibi.', 'Geri çekilmek'],
         ['Bundan sonra her işi üç kez kontrol ediyorum.', 'Hata yapmıyorsun ama işler yavaşlıyor ve yoruluyorsun.', 'Aşırı kontrol'],
         ['Sert bir e-posta yazıyorum.', 'Gönder’e basınca bir an rahatlıyorsun; sonra pişmanlık geliyor.', 'Karşılık vermek']],
        [['Bir noktayı düzeltti; işin geri kalanını kabul etti.', 'Düzeltme işin bir parçasına dair, senin tamamına değil.', 'den', 35],
         ['Bu ekipte herkesin işi düzeltiliyor; geçen hafta da öyleydi.', 'Olayı kişisel olmaktan çıkaran bir kanıt buldun.', 'kan', 30],
         ['Önemli değil, umurumda bile değil.', 'Önemsiz demek acıyı kapatmıyor; akşam yine aklına geliyor.', 'pos', 60]]
      ],
      iptal: [
        [['Benimle vakit geçirmek istemiyor.', 'Hazırlandığın kıyafet hâlâ üzerinde; ne yapacağını bilemiyorsun.', 'Zihin okuma', 'Kırgınlık', 80],
         ['Hep ben uğraşıyorum, kimse beni seçmiyor.', 'Tek bir iptal, bütün ilişkilerinin özeti gibi gelmeye başlıyor.', 'Aşırı genelleme', 'Yalnızlık', 85],
         ['Bir şeyi yanlış yaptım, bana kırgın.', 'Son konuşmanızı baştan sona tarıyorsun.', 'Kişiselleştirme', 'Kaygı', 70]],
        [['“Sorun değil” yazıp akşamı yalnız geçiriyorum.', 'Sorun yokmuş gibi yaptın; kırgınlık konuşulmadan kaldı.', 'Geri çekilmek'],
         ['Bir daha ben aramam diye karar veriyorum.', 'Karar seni koruyor gibi; ama ilişki de biraz uzaklaşıyor.', 'Mesafe koymak'],
         ['Neden iptal ettiğini uzun uzun soruyorum.', 'Cevaplar seni tatmin etmiyor; her cevap yeni bir soru doğuruyor.', 'Güvence aramak']],
        [['Bir saat kala iptal can sıkıcı; bunu ona söyleyebilirim.', 'Hem kırgınlığını hem de ilişkiyi koruyan bir yol buldun.', 'den', 35],
         ['Geçen ay o da benim için planını değiştirmişti.', 'Tek bir iptal, ilişkinin tamamını anlatmıyor.', 'kan', 30],
         ['Hiç önemli değil, zaten gitmek istemiyordum.', 'Kendine söylediğine sen de inanmıyorsun; kırgınlık yerinde duruyor.', 'pos', 60]]
      ],
      gece: [
        [['Uyuyamazsam yarın her şeyi mahvederim.', 'Saate bakıyorsun: 03.12. Kalan uyku saatini hesaplıyorsun.', 'Felaketleştirme', 'Kaygı', 85],
         ['Bu görüşme hayatımın tek şansı.', 'Kalbin hızlanıyor; yorgana daha sıkı sarılıyorsun.', 'Ya hep ya hiç', 'Gerginlik', 80],
         ['Ben zaten iyi konuşamam.', 'Geçmişte tökezlediğin anlar sırayla gözünün önüne geliyor.', 'Etiketleme', 'Yetersizlik', 75]],
        [['Kalkıp bütün soruları yeniden çalışıyorum.', 'Saat 04.30 oldu; hazırlık bitmiyor, uyku iyice kaçıyor.', 'Aşırı hazırlık'],
         ['Dönüp duruyor, saati kontrol ediyorum.', 'Her saat kontrolü, zihne “tehlike var” mesajı veriyor.', 'Kontrol etmek'],
         ['Telefonda video açıp kafamı dağıtıyorum.', 'Düşünce bir süre susuyor ama ekran ışığı uykuyu iyice uzaklaştırıyor.', 'Kaçınmak']],
        [['Az uyusam da hazırım; yorgunken de konuşabildiğim günler oldu.', 'Bedenin biraz gevşiyor; uyumak zorunda olma baskısı azalıyor.', 'den', 35],
         ['Bu görüşme önemli ama tek fırsat değil; başka başvurularım da var.', 'Görüşme olması gereken boyuta küçülüyor.', 'kan', 30],
         ['Hiç endişelenmiyorum, her şey mükemmel geçecek.', 'Zihin buna ikna olmuyor; düşünceler birkaç dakika sonra geri dönüyor.', 'pos', 60]]
      ]
    }
  },

  /* ---------- psychodynamic: the surface reaction → what it may protect from → where the feeling may come from ---------- */
  psd: {
    q: ['Dışarıdan bakan biri ne görür?', d => `“${d}” Bu tepki seni hangi duygudan koruyor olabilir?`, 'Bu his tanıdık mı? Daha önce nerede olabilir?'],
    end: m => `Bugünkü an (${m}), daha eski bir sahneyi uyandırıyor olabilir. Bunu fark etmek, aynı tepkiyi kendiliğinden tekrarlamak yerine seçim yapabilmenin ilk adımı.`,
    note: 'Burada gördüğün yalnızca bir ihtimal; kimsenin geçmişini tek bir ana sığdıramayız. Psikodinamik terapide bu bağlantılara birlikte ve acele etmeden bakarız; anlam, ilişkinin içinde zamanla ortaya çıkar.',
    m: {
      mesaj: [
        [['Umursamaz görünürüm: “Ne zaman yazarsa.”', 'Rahat görünüyorsun. İçeride ise bir şey bekliyor.', 'Umursamazlık'],
         ['Ardı ardına yazar, yaklaşmaya çalışırım.', 'Sessizlik büyüdükçe sen de yaklaşmaya çalışıyorsun.', 'Yakınlık arayışı'],
         ['Cevap gelince soğuk davranırım.', 'Sonunda cevap geldiğinde mesafeli bir “tamam” yazıyorsun.', 'Soğukluk']],
        [['Önemsizleştirme: “Zaten umurumda değil.”', 'Önemsemezsen, önemsenmemenin acısı da daha az değiyor.', 'Önemsizleştirme'],
         ['Yansıtma: “O bana kızgın.”', 'Kendi kırgınlığını onun öfkesi gibi görmek, onu taşımayı kolaylaştırıyor.', 'Yansıtma'],
         ['Yer değiştirme: Akşam evdekilere sinirlenirim.', 'Öfke asıl muhatabına değil, daha güvenli gördüğün kişilere yöneliyor.', 'Yer değiştirme']],
        [['Meşgul bir ebeveynin ilgisini beklediğin günler.', 'Belki o zaman da sessizlik “önemli değilsin” gibi gelmişti.', 'Beklenen ilgi'],
         ['Birden uzaklaşan bir arkadaş ya da sevgili.', 'Sessizlik, o eski ayrılığın ilk işareti gibi tınlıyor olabilir.', 'Ani kayıp'],
         ['Sevginin “iyi” olmaya bağlı olduğu bir ortam.', 'Cevapsızlık, yeterince iyi olamadığının kanıtı gibi gelebilir.', 'Koşullu sevgi']]
      ],
      toplanti: [
        [['Şakayla geçiştiririm.', 'Herkes gülüyor; titremeyi kimse konuşmuyor, sen de.', 'Şaka'],
         ['Bir sonraki toplantıya aşırı hazırlanırım.', 'Bir daha asla açık vermeyeceğine söz veriyorsun.', 'Mükemmeliyetçilik'],
         ['Küçülür, sesimi kısarım.', 'Sıra sana geldiğinde “benden bu kadar” diyorsun.', 'Geri çekilme']],
        [['Mizah: Utancı gülerek dağıtmak.', 'Mizah olgun bir savunma olabilir; ama bazen hissi hiç yaşamadan geçmeni sağlar.', 'Mizah'],
         ['Entelektüalizasyon: “Sahne kaygısı evrimsel bir tepki.”', 'Hissetmek yerine açıklamak, duyguyu güvenli bir mesafede tutar.', 'Entelektüalizasyon'],
         ['Kendine yöneltme: “Ben zaten böyleyim.”', 'Başkalarının yargısından önce kendi yargın geliyor.', 'Kendine yöneltme']],
        [['Tahtaya kalkıp donakaldığın bir ders.', 'Belki o sınıfın sessizliği bugün yeniden duyuluyor.', 'Utanç anısı'],
         ['Sözünün kesildiği, dinlenmediğin sofralar.', 'Sesini duyurmak belki çok erken yorucu bir iş hâline gelmişti.', 'Dinlenmemek'],
         ['Hata yapınca görülen hayal kırıklığı.', 'Titreyen ses, o eski hayal kırıklığını davet ediyor gibi olabilir.', 'Hata ve sevgi']]
      ],
      duzeltme: [
        [['Gülümser, teşekkür ederim.', 'Herkes rahat; sen hariç.', 'Uyum'],
         ['O andan sonra savunmaya geçerim.', 'Her yorumu bir saldırı gibi karşılamaya başlıyorsun.', 'Savunmaya geçmek'],
         ['İçin için ondan uzaklaşırım.', 'Ertesi gün koridorda onu görmemiş gibi yapıyorsun.', 'Mesafe']],
        [['Tepki oluşturma: Öfkeyi güler yüzle örtmek.', 'Hissettiğinin tam tersini göstermek, çatışmayı uzak tutuyor.', 'Tepki oluşturma'],
         ['Bölme: Dün iyi bir yönetici, bugün tamamen kötü.', 'İnsanları tamamen iyi ya da kötü görmek, karışık duyguları sadeleştiriyor.', 'Bölme'],
         ['Pasif saldırganlık: İşleri sessizce geciktirmek.', 'Söylenemeyen öfke başka bir yoldan konuşuyor.', 'Pasif saldırganlık']],
        [['Hep eleştiren, nadiren takdir eden bir otorite.', 'Yöneticinin sesi, belki daha eski bir sesle karışıyor.', 'Eleştirel otorite'],
         ['Kardeşlerle sürekli kıyaslandığın bir ev.', 'Ekibin önünde düzeltilmek, eski bir kıyaslamayı canlandırıyor olabilir.', 'Kıyaslanmak'],
         ['Hata yapınca cezalandırıldığın bir okul.', 'Düzeltme, bir cezanın habercisi gibi gelebilir.', 'Ceza korkusu']]
      ],
      iptal: [
        [['“Hiç sorun değil” deyip gülümserim.', 'Telefonu kapattıktan sonra yüzündeki gülümseme düşüyor.', 'Anlayışlı görünmek'],
         ['Hemen başka planlar yaparım, boşluk kalmasın.', 'Akşamın dolu ama içindeki boşluk yerinde.', 'Boşluğu doldurmak'],
         ['Bir süre ondan uzak dururum.', 'Aramalarını hemen açmıyorsun; bu sefer bekleyen o olsun.', 'Uzaklaşmak']],
        [['Bastırma: Kırgınlığı hiç düşünmemek.', 'Düşünmemek bir süre işe yarıyor; his ise başka bir gün başka bir yerden çıkıyor.', 'Bastırma'],
         ['Eyleme vurma: Hissetmek yerine yapmak.', 'Hareket etmek, durup hissetmekten daha kolay geliyor.', 'Eyleme vurma'],
         ['Yansıtma: “Zaten o beni hiç sevmedi.”', 'Kendi kırgınlığın, onun sevgisizliği olarak geri dönüyor.', 'Yansıtma']],
        [['Hep beklenip gelinmeyen okul çıkışları.', 'Bekleyip gelmeyen birinin acısı, bugünkü iptalle yan yana duruyor olabilir.', 'Beklemek'],
         ['Kalabalık bir evde görünmez kalmak.', 'İptal, “öncelik değilsin” sözü gibi duyuluyor olabilir.', 'Görünmezlik'],
         ['Taşınmalarla yarım kalan arkadaşlıklar.', 'Her iptal, bir şeyin yine yarım kalacağı korkusunu uyandırabilir.', 'Yarım kalanlar']]
      ],
      gece: [
        [['Her şeyi kontrol altına almaya çalışırım.', 'Notlar, listeler, alarmlar… Hepsi yerinde, uyku hariç.', 'Kontrol'],
         ['Kimseye söylemem: “Ben hallederim.”', 'Kaygıyı tek başına taşımak, gecenin en ağır kısmı.', 'Kendine yetmek'],
         ['Görüşmeyi aklımdan atıp başka şeylere gömülürüm.', 'Sabah olduğunda görüşme yine orada olacak.', 'Kaçış']],
        [['İnkâr: “Hiç gergin değilim.”', 'Söylenmeyen gerginlik, uykusuzluk olarak konuşuyor.', 'İnkâr'],
         ['Rasyonalizasyon: “Zaten bu iş bana göre değil.”', 'Önceden vazgeçmek, olası bir hayal kırıklığından koruyor.', 'Rasyonalizasyon'],
         ['Bedenselleştirme: Mide ağrısı, çarpıntı.', 'Söze dökülmeyen kaygı, beden üzerinden sesleniyor.', 'Bedenselleştirme']],
        [['Sınav sonuçlarının evde büyük olay olduğu yıllar.', 'Görüşme, eski bir sınav gecesinin yerini almış olabilir.', 'Başarı baskısı'],
         ['Yalnız kaldığın, kimsenin gelmediği geceler.', 'Kaygının en çok gece büyümesi tesadüf olmayabilir.', 'Yalnız geceler'],
         ['İlk kez reddedildiğin bir başvuru.', 'Yarın, o eski reddin tekrarı gibi bekleniyor olabilir.', 'İlk ret']]
      ]
    }
  },

  /* ---------- ACT: the mind's sentence → what you do with it → a value and one step toward it ---------- */
  act: {
    q: ['Zihnin şu an ne söylüyor?', d => `Zihnin “${d}” diyor. Bu düşünceyle ne yaparsın?`, 'Bu anda senin için önemli olan ne? Ona doğru küçük bir adım seç.'],
    // what you do with the thought, the same three ways in every moment: which hexaflex points each one lights
    rel: [
      ['Düşünceyle tartışır, haksız olduğunu kanıtlamaya çalışırım.', 'Ne kadar çekiştirirsen düşünce o kadar sıkı tutunuyor. Halat çekmenin kazananı yok.', []],
      [d => `Fark edip adını koyarım: “Zihnim yine ‘${d}’ diyor.”`, 'Düşünce hâlâ orada ama artık onun içinde değil, karşısındasın.', ['ayrisma', 'benlik']],
      ['Hissin orada olmasına izin verir, nefesime ve odadaki seslere dönerim.', 'His geçmedi ama ona yer açtın; şu an yeniden genişliyor.', ['kabul', 'an']]
    ],
    // noticing what the mind says is already a step into the present moment
    thoughtSay: 'Zihin bu cümleyi yüksek sesle ve tekrar tekrar söylüyor. Bunu fark ettin: şimdiki ana bir adım.',
    thoughtLights: ['an'],
    end: (n, struggle, rest) => struggle
      ? `Altı noktadan ${n} tanesi yandı. Düşünceyle tartışmak çok doğal; ama halat çekmek seni olduğun yerde tutar. ${rest} sönük kaldı.`
      : `Altı noktadan ${n} tanesi yandı: düşünce ve his yerinde duruyor, sen yine de önemsediğin yöne adım atıyorsun. ${rest} henüz sönük; altısı birbirini besler.`,
    note: 'ACT düşünceyi değiştirmeye çalışmaz; onunla ilişkini değiştirir. Terapide bu esnekliği küçük, somut adımlarla ve senin değerlerin üzerinden çalışırız.',
    retry: 'İkinci adımı başka seç',
    m: {
      mesaj: [['Beni önemsemiyor.', 'Kesin bir şey oldu ona.', 'Yine fazla yazdım.'],
        [['Yakınlık', '“Merak ettim, müsait olunca yaz” diye tek bir mesaj atarım.'],
         ['Özsaygı', 'Telefonu bırakıp akşam planıma dönerim.'],
         ['Dürüstlük', 'Konuştuğumuzda beklemenin bana ne hissettirdiğini söylerim.']]],
      toplanti: [['Herkes gerginliğimi fark etti.', 'Bu toplantıyı mahvettim.', 'Beni yetersiz görecekler.'],
        [['Katkı', 'Bir sonraki toplantıda da fikrimi söylerim, sesim titrese bile.'],
         ['Öğrenmek', 'Sunum pratiği için küçük bir grup ararım.'],
         ['Şefkat', 'Bu akşam kendimle, zor bir şey yapmış birine konuşur gibi konuşurum.']]],
      duzeltme: [['Beceriksiz olduğumu düşünüyor.', 'Herkesin önünde rezil oldum.', 'Bana haksızlık etti.'],
        [['Ustalık', 'Düzeltmeden öğreneceğim noktayı not alırım.'],
         ['Dürüstlük', 'Yöneticimle düzeltmenin nasıl yapıldığını birebir konuşurum.'],
         ['Özsaygı', 'Gün sonunda kendi emeğimi kendime hatırlatırım.']]],
      iptal: [['Benimle vakit geçirmek istemiyor.', 'Kimse beni seçmiyor.', 'Bir şeyi yanlış yaptım.'],
        [['Yakınlık', 'Ona kırıldığımı ama görüşmek istediğimi söylerim.'],
         ['Kendine özen', 'Hazırlandığım akşamı kendime güzel geçiririm.'],
         ['Bağlılık', 'Yeni bir gün önerip ilişkiye emek veririm.']]],
      gece: [['Uyuyamazsam her şeyi mahvederim.', 'Bu görüşme tek şansım.', 'Ben zaten iyi konuşamam.'],
        [['Cesaret', 'Yorgun da olsam görüşmeye giderim; mükemmel olmak zorunda değilim.'],
         ['Kendine özen', 'Kalkıp ılık bir şey içer, ekranı kapatırım.'],
         ['Gelişmek', 'Görüşmeyi bir sınav değil, bir deneyim olarak not ederim.']]]
    },
    valueSay: v => `Değer: ${v}. Küçük ama yönü belli bir adım.`
  }
};
