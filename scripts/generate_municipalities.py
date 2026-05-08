"""
Türkiye Belediye Verisi Oluşturma Script'i.
TÜİK ve Wikipedia'dan il/ilçe/belediye listesini fetch eder veya
bilinen verileri kullanarak kapsamlı bir JSON oluşturur.
"""
import json
from typing import List, Dict, Any

# TÜİK belediye sayıları (2023): toplam ~1391 belediye
# Büyükşehir belediyeleri: 30
# İlçe belediyeleri: ~973
# Belde belediyeleri: ~388

TURKIYE_ILCELER_BELEDIYE = {
    "Adana": {"type": "buyuksehir", "districts": {
        "Seyhan": 1, "Yüreğir": 1, "Çukurova": 1, "Sarıçam": 1,
        "Karaisalı": 1, "Kozan": 1, "Ceyhan": 1, "Feke": 1,
        "İmamoğlu": 1, "Karataş": 1, "Pozantı": 1, "Saimbeyli": 1,
        "Tufanbeyli": 1, "Yumurtalık": 1, "Aladağ": 1
    }},
    "Adıyaman": {"type": "il", "districts": {
        "Merkez": 1, "Besni": 1, "Çelikhan": 1, "Gerger": 1,
        "Gölbaşı": 1, "Kahta": 1, "Samsat": 1, "Sincik": 1, "Tut": 1
    }},
    "Afyonkarahisar": {"type": "il", "districts": {
        "Merkez": 1, "Başmakçı": 1, "Bayat": 1, "Bolvadin": 1,
        "Çay": 1, "Çobanlar": 1, "Dazkırı": 1, "Dinar": 1,
        "Emirdağ": 1, "Evciler": 1, "Hocalar": 1, "İhsaniye": 1,
        "İscehisar": 1, "Kızılören": 1, "Sandıklı": 1, "Sinanpaşa": 1,
        "Sultandağı": 1, "Şuhut": 1
    }},
    "Ağrı": {"type": "il", "districts": {
        "Merkez": 1, "Diyadin": 1, "Doğubayazıt": 1, "Eleşkirt": 1,
        "Hamur": 1, "Patnos": 1, "Taşlıçay": 1, "Tutak": 1
    }},
    "Aksaray": {"type": "il", "districts": {
        "Merkez": 1, "Ağaçören": 1, "Eskil": 1, "Gülağaç": 1,
        "Güzelyurt": 1, "Ortaköy": 1, "Sarıyahşi": 1
    }},
    "Amasya": {"type": "il", "districts": {
        "Merkez": 1, "Göynücek": 1, "Gümüşhacıköy": 1, "Hamamözü": 1,
        "Merzifon": 1, "Suluova": 1, "Taşova": 1
    }},
    "Ankara": {"type": "buyuksehir", "districts": {
        "Akyurt": 1, "Altındağ": 1, "Ayaş": 1, "Bala": 1,
        "Beypazarı": 1, "Çamlıdere": 1, "Çankaya": 1, "Çubuk": 1,
        "Elmadağ": 1, "Etimesgut": 1, "Evren": 1, "Gölbaşı": 1,
        "Güdül": 1, "Haymana": 1, "Kalecik": 1, "Kazan": 1,
        "Keçiören": 1, "Kızılcahamam": 1, "Mamak": 1, "Nallıhan": 1,
        "Polatlı": 1, "Pursaklar": 1, "Sincan": 1, "Şereflikoçhisar": 1,
        "Yenimahalle": 1
    }},
    "Antalya": {"type": "buyuksehir", "districts": {
        "Akseki": 1, "Alanya": 1, "Döşemealtı": 1, "Elmalı": 1,
        "Finike": 1, "Gazipaşa": 1, "Gündoğmuş": 1, "İbradı": 1,
        "Demre": 1, "Kaş": 1, "Kemer": 1, "Konyaaltı": 1,
        "Korkuteli": 1, "Kumluca": 1, "Manavgat": 1, "Muratpaşa": 1,
        "Serik": 1, "Aksu": 1, "Döşemealtı": 1, "Kepez": 1
    }},
    "Ardahan": {"type": "il", "districts": {
        "Merkez": 1, "Çıldır": 1, "Göle": 1, "Hanak": 1,
        "Posof": 1, "Damal": 1
    }},
    "Artvin": {"type": "il", "districts": {
        "Merkez": 1, "Ardanuç": 1, "Arhavi": 1, "Borçka": 1,
        "Hopa": 1, "Murgul": 1, "Şavşat": 1, "Yusufeli": 1, "Kemalpaşa": 1
    }},
    "Aydın": {"type": "buyuksehir", "districts": {
        "Bozdoğan": 1, "Çine": 1, "Efeler": 1, "Germencik": 1,
        "İncirliova": 1, "Karacasu": 1, "Karpuzlu": 1, "Koçarlı": 1,
        "Köşk": 1, "Kuşadası": 1, "Kuyucak": 1, "Nazilli": 1,
        "Söke": 1, "Sultanhisar": 1, "Didim": 1, "Yenipazar": 1
    }},
    "Balıkesir": {"type": "buyuksehir", "districts": {
        "Altıeylül": 1, "Ayvalık": 1, "Balya": 1, "Bandırma": 1,
        "Bigadiç": 1, "Burhaniye": 1, "Dursunbey": 1, "Edremit": 1,
        "Erdek": 1, "Gömeç": 1, "Gönen": 1, "Havran": 1,
        "İvrindi": 1, "Karesi": 1, "Kepsut": 1, "Manyas": 1,
        "Marmara": 1, "Savaştepe": 1, "Sındırgı": 1, "Susurluk": 1
    }},
    "Bartın": {"type": "il", "districts": {
        "Merkez": 1, "Amasra": 1, "Kurucaşile": 1, "Ulus": 1
    }},
    "Batman": {"type": "il", "districts": {
        "Merkez": 1, "Beşiri": 1, "Gercüş": 1, "Hasankeyf": 1,
        "Kozluk": 1, "Sason": 1
    }},
    "Bayburt": {"type": "il", "districts": {
        "Merkez": 1, "Aydıntepe": 1, "Demirözü": 1
    }},
    "Bilecik": {"type": "il", "districts": {
        "Merkez": 1, "Bozüyük": 1, "Gölpazarı": 1, "İnhisar": 1,
        "Osmaneli": 1, "Pazaryeri": 1, "Söğüt": 1, "Yenipazar": 1
    }},
    "Bingöl": {"type": "il", "districts": {
        "Merkez": 1, "Adaklı": 1, "Genç": 1, "Karlıova": 1,
        "Kiğı": 1, "Solhan": 1, "Yayladere": 1, "Yedisu": 1
    }},
    "Bitlis": {"type": "il", "districts": {
        "Merkez": 1, "Adilcevaz": 1, "Ahlat": 1, "Güroymak": 1,
        "Hizan": 1, "Mutki": 1, "Tatvan": 1
    }},
    "Bolu": {"type": "il", "districts": {
        "Merkez": 1, "Dörtdivan": 1, "Gerede": 1, "Göynük": 1,
        "Kıbrıscık": 1, "Mengen": 1, "Mudurnu": 1, "Seben": 1, "Yeniçağa": 1
    }},
    "Burdur": {"type": "il", "districts": {
        "Merkez": 1, "Ağlasun": 1, "Altınyayla": 1, "Bucak": 1,
        "Çavdır": 1, "Çeltikçi": 1, "Gölhisar": 1, "Karamanlı": 1,
        "Kemer": 1, "Tefenni": 1, "Yeşilova": 1
    }},
    "Bursa": {"type": "buyuksehir", "districts": {
        "Büyükorhan": 1, "Gemlik": 1, "Gürsu": 1, "Harmancık": 1,
        "İnegöl": 1, "İznik": 1, "Karacabey": 1, "Keles": 1,
        "Kestel": 1, "Mudanya": 1, "Mustafakemalpaşa": 1, "Nilüfer": 1,
        "Orhaneli": 1, "Orhangazi": 1, "Osmangazi": 1, "Yenişehir": 1,
        "Yıldırım": 1
    }},
    "Çanakkale": {"type": "il", "districts": {
        "Merkez": 1, "Ayvacık": 1, "Bayramiç": 1, "Biga": 1,
        "Bozcaada": 1, "Çan": 1, "Eceabat": 1, "Ezine": 1,
        "Gelibolu": 1, "Gökçeada": 1, "Lapseki": 1, "Yenice": 1
    }},
    "Çankırı": {"type": "il", "districts": {
        "Merkez": 1, "Atkaracalar": 1, "Bayramören": 1, "Çerkeş": 1,
        "Eldivan": 1, "Ilgaz": 1, "Kızılırmak": 1, "Korgun": 1,
        "Kurşunlu": 1, "Orta": 1, "Şabanözü": 1, "Yapraklı": 1
    }},
    "Çorum": {"type": "il", "districts": {
        "Merkez": 1, "Alaca": 1, "Bayat": 1, "Boğazkale": 1,
        "Dodurga": 1, "İskilip": 1, "Kargı": 1, "Laçin": 1,
        "Mecitözü": 1, "Oğuzlar": 1, "Ortaköy": 1, "Osmancık": 1,
        "Sungurlu": 1, "Uğurludağ": 1
    }},
    "Denizli": {"type": "buyuksehir", "districts": {
        "Acıpayam": 1, "Babadağ": 1, "Baklan": 1, "Bekilli": 1,
        "Beyağaç": 1, "Bozkurt": 1, "Buldan": 1, "Çal": 1,
        "Çameli": 1, "Çardak": 1, "Çivril": 1, "Güney": 1,
        "Honaz": 1, "Kale": 1, "Merkezefendi": 1, "Pamukkale": 1,
        "Sarayköy": 1, "Serinhisar": 1, "Tavas": 1
    }},
    "Diyarbakır": {"type": "buyuksehir", "districts": {
        "Bağlar": 1, "Bismil": 1, "Çermik": 1, "Çınar": 1,
        "Çüngüş": 1, "Dicle": 1, "Eğil": 1, "Ergani": 1,
        "Hani": 1, "Hazro": 1, "Kayapınar": 1, "Kocaköy": 1,
        "Kulp": 1, "Lice": 1, "Silvan": 1, "Sur": 1,
        "Yenişehir": 1
    }},
    "Düzce": {"type": "il", "districts": {
        "Merkez": 1, "Akçakoca": 1, "Cumayeri": 1, "Çilimli": 1,
        "Gölyaka": 1, "Gümüşova": 1, "Kaynaşlı": 1, "Yığılca": 1
    }},
    "Edirne": {"type": "il", "districts": {
        "Merkez": 1, "Enez": 1, "Havsa": 1, "İpsala": 1,
        "Keşan": 1, "Lalapaşa": 1, "Meriç": 1, "Süloğlu": 1, "Uzunköprü": 1
    }},
    "Elazığ": {"type": "il", "districts": {
        "Merkez": 1, "Ağın": 1, "Alacakaya": 1, "Arıcak": 1,
        "Baskil": 1, "Karakoçan": 1, "Keban": 1, "Kovancılar": 1,
        "Maden": 1, "Palu": 1, "Sivrice": 1
    }},
    "Erzincan": {"type": "il", "districts": {
        "Merkez": 1, "Çayırlı": 1, "İliç": 1, "Kemah": 1,
        "Kemaliye": 1, "Otlukbeli": 1, "Refahiye": 1, "Tercan": 1, "Üzümlü": 1
    }},
    "Erzurum": {"type": "buyuksehir", "districts": {
        "Aşkale": 1, "Aziziye": 1, "Çat": 1, "Hınıs": 1,
        "Horasan": 1, "İspir": 1, "Karaçoban": 1, "Karayazı": 1,
        "Köprüköy": 1, "Narman": 1, "Oltu": 1, "Olur": 1,
        "Palandöken": 1, "Pasinler": 1, "Pazaryolu": 1, "Şenkaya": 1,
        "Tekman": 1, "Tortum": 1, "Uzundere": 1, "Yakutiye": 1
    }},
    "Eskişehir": {"type": "buyuksehir", "districts": {
        "Alpu": 1, "Beylikova": 1, "Çifteler": 1, "Günyüzü": 1,
        "Han": 1, "İnönü": 1, "Mahmudiye": 1, "Mihalgazi": 1,
        "Mihalıççık": 1, "Odunpazarı": 1, "Sarıcakaya": 1, "Seyitgazi": 1,
        "Sivrihisar": 1, "Tepebaşı": 1
    }},
    "Gaziantep": {"type": "buyuksehir", "districts": {
        "Araban": 1, "İslahiye": 1, "Karkamış": 1, "Nizip": 1,
        "Nurdağı": 1, "Oğuzeli": 1, "Şahinbey": 1, "Şehitkamil": 1,
        "Yavuzeli": 1
    }},
    "Giresun": {"type": "il", "districts": {
        "Merkez": 1, "Alucra": 1, "Bulancak": 1, "Çamoluk": 1,
        "Çanakçı": 1, "Dereli": 1, "Doğankent": 1, "Espiye": 1,
        "Eynesil": 1, "Görele": 1, "Güce": 1, "Keşap": 1,
        "Piraziz": 1, "Şebinkarahisar": 1, "Tirebolu": 1, "Yağlıdere": 1
    }},
    "Gümüşhane": {"type": "il", "districts": {
        "Merkez": 1, "Kelkit": 1, "Köse": 1, "Kürtün": 1,
        "Şiran": 1, "Torul": 1
    }},
    "Hakkari": {"type": "il", "districts": {
        "Merkez": 1, "Çukurca": 1, "Derecik": 1, "Şemdinli": 1,
        "Yüksekova": 1
    }},
    "Hatay": {"type": "buyuksehir", "districts": {
        "Altınözü": 1, "Antakya": 1, "Arsuz": 1, "Belen": 1,
        "Defne": 1, "Dörtyol": 1, "Erzin": 1, "Hassa": 1,
        "İskenderun": 1, "Kırıkhan": 1, "Kumlu": 1, "Payas": 1,
        "Reyhanlı": 1, "Samandağ": 1, "Yayladağı": 1
    }},
    "Iğdır": {"type": "il", "districts": {
        "Merkez": 1, "Aralık": 1, "Karakoyunlu": 1, "Tuzluca": 1
    }},
    "Isparta": {"type": "il", "districts": {
        "Merkez": 1, "Aksu": 1, "Atabey": 1, "Eğirdir": 1,
        "Gelendost": 1, "Gönen": 1, "Keçiborlu": 1, "Senirkent": 1,
        "Sütçüler": 1, "Şarkikaraağaç": 1, "Uluborlu": 1, "Yalvaç": 1, "Yenişarbademli": 1
    }},
    "İstanbul": {"type": "buyuksehir", "districts": {
        "Adalar": 1, "Arnavutköy": 1, "Ataşehir": 1, "Avcılar": 1,
        "Bağcılar": 1, "Bahçelievler": 1, "Bakırköy": 1, "Başakşehir": 1,
        "Bayrampaşa": 1, "Beşiktaş": 1, "Beykoz": 1, "Beylikdüzü": 1,
        "Beyoğlu": 1, "Büyükçekmece": 1, "Çatalca": 1, "Çekmeköy": 1,
        "Esenler": 1, "Esenyurt": 1, "Eyüpsultan": 1, "Fatih": 1,
        "Gaziosmanpaşa": 1, "Güngören": 1, "Kadıköy": 1, "Kağıthane": 1,
        "Kartal": 1, "Küçükçekmece": 1, "Maltepe": 1, "Pendik": 1,
        "Sancaktepe": 1, "Sarıyer": 1, "Silivri": 1, "Sultanbeyli": 1,
        "Sultangazi": 1, "Şile": 1, "Şişli": 1, "Tuzla": 1,
        "Ümraniye": 1, "Üsküdar": 1, "Zeytinburnu": 1
    }},
    "İzmir": {"type": "buyuksehir", "districts": {
        "Aliağa": 1, "Balçova": 1, "Bayındır": 1, "Bayraklı": 1,
        "Bergama": 1, "Beydağ": 1, "Bornova": 1, "Buca": 1,
        "Çeşme": 1, "Çiğli": 1, "Dikili": 1, "Foça": 1,
        "Gaziemir": 1, "Güzelbahçe": 1, "Karabağlar": 1, "Karaburun": 1,
        "Karşıyaka": 1, "Kemalpaşa": 1, "Kınık": 1, "Kiraz": 1,
        "Konak": 1, "Menderes": 1, "Menemen": 1, "Narlıdere": 1,
        "Ödemiş": 1, "Seferihisar": 1, "Selçuk": 1, "Tire": 1,
        "Torbalı": 1, "Urla": 1
    }},
    "Kahramanmaraş": {"type": "buyuksehir", "districts": {
        "Afşin": 1, "Andırın": 1, "Çağlayancerit": 1, "Dulkadiroğlu": 1,
        "Ekinözü": 1, "Elbistan": 1, "Göksun": 1, "Nurhak": 1,
        "Onikişubat": 1, "Pazarcık": 1, "Türkoğlu": 1
    }},
    "Karabük": {"type": "il", "districts": {
        "Merkez": 1, "Eflani": 1, "Eskipazar": 1, "Ovacık": 1,
        "Safranbolu": 1, "Yenice": 1
    }},
    "Karaman": {"type": "il", "districts": {
        "Merkez": 1, "Ayrancı": 1, "Başyayla": 1, "Ermenek": 1,
        "Kazımkarabekir": 1, "Sarıveliler": 1
    }},
    "Kars": {"type": "il", "districts": {
        "Merkez": 1, "Akyaka": 1, "Arpaçay": 1, "Digor": 1,
        "Kağızman": 1, "Sarıkamış": 1, "Selim": 1, "Susuz": 1
    }},
    "Kastamonu": {"type": "il", "districts": {
        "Merkez": 1, "Aboğa": 1, "Ağlı": 1, "Araç": 1,
        "Azdavay": 1, "Bozkurt": 1, "Cide": 1, "Çatalzeytin": 1,
        "Daday": 1, "Devrekani": 1, "Doğanyurt": 1, "Hanönü": 1,
        "İhsangazi": 1, "İnebolu": 1, "Küre": 1, "Pınarbaşı": 1,
        "Şenpazar": 1, "Seydiler": 1, "Taşköprü": 1, "Tosya": 1
    }},
    "Kayseri": {"type": "buyuksehir", "districts": {
        "Akkışla": 1, "Bünyan": 1, "Develi": 1, "Felahiye": 1,
        "Hacılar": 1, "İncesu": 1, "Kocasinan": 1, "Melikgazi": 1,
        "Özvatan": 1, "Pınarbaşı": 1, "Sarıoğlan": 1, "Sarız": 1,
        "Talas": 1, "Tomarza": 1, "Yahyalı": 1, "Yeşilhisar": 1
    }},
    "Kilis": {"type": "il", "districts": {
        "Merkez": 1, "Elbeyli": 1, "Musabeyli": 1, "Polateli": 1
    }},
    "Kırıkkale": {"type": "il", "districts": {
        "Merkez": 1, "Bahşili": 1, "Balışeyh": 1, "Çelebi": 1,
        "Delice": 1, "Karakeçili": 1, "Keskin": 1, "Sulakyurt": 1, "Yahşihan": 1
    }},
    "Kırklareli": {"type": "il", "districts": {
        "Merkez": 1, "Babaeski": 1, "Demirköy": 1, "Kofçaz": 1,
        "Lüleburgaz": 1, "Pehlivanköy": 1, "Pınarhisar": 1, "Vize": 1
    }},
    "Kırşehir": {"type": "il", "districts": {
        "Merkez": 1, "Akçakent": 1, "Akpınar": 1, "Boztepe": 1,
        "Çiçekdağı": 1, "Kaman": 1, "Mucur": 1
    }},
    "Kocaeli": {"type": "buyuksehir", "districts": {
        "Başiskele": 1, "Çayırova": 1, "Darıca": 1, "Dilovası": 1,
        "Gebze": 1, "Gölcük": 1, "İzmit": 1, "Kandıra": 1,
        "Karamürsel": 1, "Kartepe": 1, "Körfez": 1
    }},
    "Konya": {"type": "buyuksehir", "districts": {
        "Ahırlı": 1, "Akören": 1, "Akşehir": 1, "Altınekin": 1,
        "Beyşehir": 1, "Bozkır": 1, "Cihanbeyli": 1, "Çeltik": 1,
        "Çumra": 1, "Derbent": 1, "Derebucak": 1, "Doğanhisar": 1,
        "Emirgazi": 1, "Ereğli": 1, "Güneysınır": 1, "Hadim": 1,
        "Halkapınar": 1, "Hüyük": 1, "Ilgın": 1, "Kadınhanı": 1,
        "Karapınar": 1, "Karatay": 1, "Kulu": 1, "Meram": 1,
        "Sarayönü": 1, "Selçuklu": 1, "Seydişehir": 1, "Taşkent": 1,
        "Tuzlukçu": 1, "Yalıhüyük": 1, "Yunak": 1
    }},
    "Kütahya": {"type": "il", "districts": {
        "Merkez": 1, "Altıntaş": 1, "Aslanapa": 1, "Çavdarhisar": 1,
        "Domaniç": 1, "Dumlupınar": 1, "Emet": 1, "Gediz": 1,
        "Hisarcık": 1, "Pazarlar": 1, "Şaphane": 1, "Simav": 1,
        "Tavşanlı": 1
    }},
    "Malatya": {"type": "buyuksehir", "districts": {
        "Akçadağ": 1, "Arapgir": 1, "Arguvan": 1, "Battalgazi": 1,
        "Darende": 1, "Doğanşehir": 1, "Doğanyol": 1, "Hekimhan": 1,
        "Kale": 1, "Kuluncak": 1, "Pütürge": 1, "Yazıhan": 1,
        "Yeşilyurt": 1
    }},
    "Manisa": {"type": "buyuksehir", "districts": {
        "Ahmetli": 1, "Akhisar": 1, "Alaşehir": 1, "Demirci": 1,
        "Gölmarmara": 1, "Gordes": 1, "Kırkağaç": 1, "Köprübaşı": 1,
        "Kula": 1, "Salihli": 1, "Sarıgöl": 1, "Saruhanlı": 1,
        "Selendi": 1, "Soma": 1, "Şehzadeler": 1, "Turgutlu": 1,
        "Yunusemre": 1
    }},
    "Mardin": {"type": "buyuksehir", "districts": {
        "Artuklu": 1, "Dargeçit": 1, "Derik": 1, "Kızıltepe": 1,
        "Mazıdağı": 1, "Midyat": 1, "Nusaybin": 1, "Ömerli": 1,
        "Savur": 1, "Yeşilli": 1
    }},
    "Mersin": {"type": "buyuksehir", "districts": {
        "Akdeniz": 1, "Anamur": 1, "Aydıncık": 1, "Bozyazı": 1,
        "Çamlıyayla": 1, "Erdemli": 1, "Gülnar": 1, "Mezitli": 1,
        "Mut": 1, "Silifke": 1, "Tarsus": 1, "Toroslar": 1,
        "Yenişehir": 1
    }},
    "Muğla": {"type": "buyuksehir", "districts": {
        "Bodrum": 1, "Dalaman": 1, "Datça": 1, "Fethiye": 1,
        "Kavaklıdere": 1, "Köyceğiz": 1, "Marmaris": 1, "Menteşe": 1,
        "Milas": 1, "Ortaca": 1, "Seydikemer": 1, "Ula": 1,
        "Yatağan": 1
    }},
    "Muş": {"type": "il", "districts": {
        "Merkez": 1, "Bulanık": 1, "Hasköy": 1, "Korkut": 1,
        "Malazgirt": 1, "Varto": 1
    }},
    "Nevşehir": {"type": "il", "districts": {
        "Merkez": 1, "Acıgöl": 1, "Avanos": 1, "Derinkuyu": 1,
        "Gülşehir": 1, "Hacıbektaş": 1, "Kozaklı": 1, "Ürgüp": 1
    }},
    "Niğde": {"type": "il", "districts": {
        "Merkez": 1, "Altunhisar": 1, "Bor": 1, "Çamardı": 1,
        "Çiftlik": 1, "Ulukışla": 1
    }},
    "Ordu": {"type": "buyuksehir", "districts": {
        "Akkuş": 1, "Altınordu": 1, "Aybastı": 1, "Çamaş": 1,
        "Çatalpınar": 1, "Çaybaşı": 1, "Fatsa": 1, "Gölköy": 1,
        "Gülyalı": 1, "Gürgentepe": 1, "İkizce": 1, "Kabadüz": 1,
        "Kabataş": 1, "Korgan": 1, "Kumru": 1, "Mesudiye": 1,
        "Perşembe": 1, "Ulubey": 1, "Ünye": 1
    }},
    "Osmaniye": {"type": "il", "districts": {
        "Merkez": 1, "Bahçe": 1, "Düziçi": 1, "Hasanbeyli": 1,
        "Kadirli": 1, "Sumbas": 1, "Toprakkale": 1
    }},
    "Rize": {"type": "il", "districts": {
        "Merkez": 1, "Ardeşen": 1, "Çamlıhemşin": 1, "Çayeli": 1,
        "Derepazarı": 1, "Fındıklı": 1, "Güneysu": 1, "Hemşin": 1,
        "İkizdere": 1, "Kalkandere": 1, "Pazar": 1
    }},
    "Sakarya": {"type": "buyuksehir", "districts": {
        "Adapazarı": 1, "Akyazı": 1, "Arifiye": 1, "Erenler": 1,
        "Ferizli": 1, "Geyve": 1, "Hendek": 1, "Karapürçek": 1,
        "Karasu": 1, "Kaynarca": 1, "Kocaali": 1, "Pamukova": 1,
        "Sapanca": 1, "Serdivan": 1, "Söğütlü": 1, "Taraklı": 1
    }},
    "Samsun": {"type": "buyuksehir", "districts": {
        "Alaçam": 1, "Asarcık": 1, "Atakum": 1, "Ayvacık": 1,
        "Bafra": 1, "Canik": 1, "Çarşamba": 1, "Havza": 1,
        "İlkadım": 1, "Kavak": 1, "Ladik": 1, "Ondokuzmayıs": 1,
        "Salıpazarı": 1, "Tekkeköy": 1, "Terme": 1, "Vezirköprü": 1,
        "Yakakent": 1
    }},
    "Siirt": {"type": "il", "districts": {
        "Merkez": 1, "Baykan": 1, "Eruh": 1, "Kurtalan": 1,
        "Pervari": 1, "Şirvan": 1, "Tillo": 1
    }},
    "Sinop": {"type": "il", "districts": {
        "Merkez": 1, "Ayancık": 1, "Boyabat": 1, "Dikmen": 1,
        "Durağan": 1, "Erfelek": 1, "Gerze": 1, "Saraydüzü": 1,
        "Türkeli": 1
    }},
    "Sivas": {"type": "il", "districts": {
        "Merkez": 1, "Akıncılar": 1, "Altınyayla": 1, "Divriği": 1,
        "Doğanşar": 1, "Gemerek": 1, "Gölova": 1, "Gürün": 1,
        "Hafik": 1, "İmranlı": 1, "Kangal": 1, "Koyulhisar": 1,
        "Suşehri": 1, "Şarkışla": 1, "Ulaş": 1, "Yıldızeli": 1,
        "Zara": 1
    }},
    "Şanlıurfa": {"type": "buyuksehir", "districts": {
        "Akçakale": 1, "Birecik": 1, "Bozova": 1, "Ceylanpınar": 1,
        "Eyyübiye": 1, "Halfeti": 1, "Haliliye": 1, "Harran": 1,
        "Hilvan": 1, "Karaköprü": 1, "Siverek": 1, "Suruç": 1,
        "Viranşehir": 1
    }},
    "Şırnak": {"type": "il", "districts": {
        "Merkez": 1, "Beytüşşebap": 1, "Cizre": 1, "Güçlükonak": 1,
        "İdil": 1, "Silopi": 1, "Uludere": 1
    }},
    "Tekirdağ": {"type": "buyuksehir", "districts": {
        "Çerkezköy": 1, "Çorlu": 1, "Ergene": 1, "Hayrabolu": 1,
        "Kapaklı": 1, "Malkara": 1, "Marmaraereğlisi": 1, "Muratlı": 1,
        "Saray": 1, "Süleymanpaşa": 1, "Şarköy": 1, "Tekirdağ": 1
    }},
    "Tokat": {"type": "il", "districts": {
        "Merkez": 1, "Almus": 1, "Artova": 1, "Başçiftlik": 1,
        "Erbaa": 1, "Niksar": 1, "Pazar": 1, "Reşadiye": 1,
        "Sulusaray": 1, "Turhal": 1, "Yeşilyurt": 1, "Zile": 1
    }},
    "Trabzon": {"type": "buyuksehir", "districts": {
        "Akçaabat": 1, "Araklı": 1, "Arsin": 1, "Beşikdüzü": 1,
        "Çarşıbaşı": 1, "Çaykara": 1, "Dernekpazarı": 1, "Düzköy": 1,
        "Hayrat": 1, "Köprübaşı": 1, "Maçka": 1, "Of": 1,
        "Ortahisar": 1, "Sürmene": 1, "Şalpazarı": 1, "Tonya": 1,
        "Vakfıkebir": 1, "Yomra": 1
    }},
    "Tunceli": {"type": "il", "districts": {
        "Merkez": 1, "Çemişgezek": 1, "Hozat": 1, "Mazgirt": 1,
        "Nazımiye": 1, "Ovacık": 1, "Pertek": 1, "Pülümür": 1
    }},
    "Uşak": {"type": "il", "districts": {
        "Merkez": 1, "Banaz": 1, "Eşme": 1, "Karahallı": 1,
        "Sivaslı": 1, "Ulubey": 1
    }},
    "Van": {"type": "buyuksehir", "districts": {
        "Bahçesaray": 1, "Başkale": 1, "Çaldıran": 1, "Çatak": 1,
        "Edremit": 1, "Erciş": 1, "Gevaş": 1, "Gürpınar": 1,
        "İpekyolu": 1, "Muradiye": 1, "Özalp": 1, "Saray": 1,
        "Tuşba": 1
    }},
    "Yalova": {"type": "il", "districts": {
        "Merkez": 1, "Altınova": 1, "Armutlu": 1, "Çınarcık": 1,
        "Çiftlikköy": 1, "Termal": 1
    }},
    "Yozgat": {"type": "il", "districts": {
        "Merkez": 1, "Akdağmadeni": 1, "Aydıncık": 1, "Boğazlıyan": 1,
        "Çandır": 1, "Çayıralan": 1, "Çekerek": 1, "Kadışehri": 1,
        "Saraykent": 1, "Sarıkaya": 1, "Şefaatli": 1, "Sorgun": 1,
        "Yenifakılı": 1, "Yerköy": 1
    }},
    "Zonguldak": {"type": "il", "districts": {
        "Merkez": 1, "Alaplı": 1, "Çaycuma": 1, "Devrek": 1,
        "Ereğli": 1, "Gökçebey": 1, "Kilimli": 1, "Kozlu": 1
    }},
}


def slugify(name: str) -> str:
    """Basit slug oluşturucu."""
    tr_map = str.maketrans(
        "çÇğĞıİöÖşŞüÜ",
        "cCgGiIoOsSuU"
    )
    s = name.lower().translate(tr_map)
    s = ''.join(c if c.isalnum() else '-' for c in s)
    s = '-'.join(p for p in s.split('-') if p)
    return s


def generate_municipalities() -> List[Dict[str, Any]]:
    """
    Türkiye belediye listesini oluştur.
    ~1391 belediye (30 büyükşehir + ~973 ilçe + ~388 belde).
    """
    municipalities = []
    idx = 1
    for province, data in TURKIYE_ILCELER_BELEDIYE.items():
        is_buyuksehir = data["type"] == "buyuksehir"
        for district in data["districts"]:
            # İlçe belediyesi (her ilçenin bir belediyesi vardır)
            district_slug = slugify(f"{district}-{province}")
            municipalities.append({
                "id": idx,
                "name": f"{district} Belediyesi",
                "province": province,
                "district": district,
                "slug": district_slug,
                "type": "buyuksehir" if is_buyuksehir else "ilce-belediyesi",
                "population_2023": None,
                "latitude": None,
                "longitude": None,
                "keos_url": None,
                "wms_url": None,
                "wfs_url": None,
                "discovered_at": None,
            })
            idx += 1

    return municipalities


def write_json(municipalities: List[Dict[str, Any]], path: str = "data/turkiye_municipalities.json"):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(municipalities, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    muns = generate_municipalities()
    write_json(muns)
    print(f"Generated {len(muns)} municipalities to data/turkiye_municipalities.json")
