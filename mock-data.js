// Centralized Mock Data for SUPON Kielce Customer Platform

window.DEFAULT_EMPLOYEES = [
  {
    id: "NP-0001",
    name: "Jan Kowalski",
    role: "Operator",
    dept: "Produkcja",
    addr: "ul. Główna 12, Kielce",
    sizes: { height: 180, chest: 100, waist: 96, shoes: 42 },
    status: "Aktywny",
    rfid: "TAK",
    ppe: "TAK",
    items: [
      { chip: "...532", nr: "MOT-TRS-001", name: "Spodnie Motion", size: "L / 182–190", status: "Wydane", lastOp: "19.08.2025" },
      { chip: "...218", nr: "HIV-BLS-110", name: "Bluza Hi-Vis", size: "M", status: "Wydane", lastOp: "19.08.2025" },
      { chip: "...774", nr: "FR-JKT-220", name: "Kurtka FR (Trudnopalna)", size: "M", status: "Wydane", lastOp: "18.08.2025" }
    ],
    history: [
      { time: "10:41", desc: "Zarejestrowano wydanie Spodnie Motion" },
      { time: "09:39", desc: "Zarejestrowano wydanie Bluza Hi-Vis" },
      { time: "08:12", desc: "Zarejestrowano wydanie Kurtka FR (Trudnopalna)" },
      { time: "Wczoraj", desc: "Utworzono zamówienie Z-2025-1048" }
    ]
  },
  {
    id: "NP-0002",
    name: "Anna Nowak",
    role: "Magazynier",
    dept: "Magazyn",
    addr: "ul. Zielona 5, Kielce",
    sizes: { height: 168, chest: 90, waist: 78, shoes: 39 },
    status: "Aktywny",
    rfid: "TAK",
    ppe: "NIE",
    items: [
      { chip: "...024", nr: "BUT-002", name: "Buty ochronne S3", size: "39", status: "Wydane", lastOp: "12.08.2025" }
    ],
    history: [
      { time: "12.08.2025", desc: "Zarejestrowano wydanie Buty ochronne S3" }
    ]
  },
  {
    id: "NP-0015",
    name: "Piotr Wiśniewski",
    role: "Kierowca",
    dept: "Logistyka",
    addr: "ul. Spacerowa 8, Chęciny",
    sizes: { height: 185, chest: 108, waist: 92, shoes: 44 },
    status: "Aktywny",
    rfid: "TAK",
    ppe: "TAK",
    items: [
      { chip: "...109", nr: "R-20", name: "Rękawice robocze Grip", size: "10 (L)", status: "Wydane", lastOp: "06.08.2025" }
    ],
    history: [
      { time: "06.08.2025", desc: "Zarejestrowano wydanie Rękawice robocze Grip" }
    ]
  },
  {
    id: "NP-0021",
    name: "Katarzyna Mazur",
    role: "Technik UR",
    dept: "Utrzymanie Ruchu",
    addr: "ul. Fabryczna 1, Kielce",
    sizes: { height: 172, chest: 96, waist: 84, shoes: 40 },
    status: "Aktywny",
    rfid: "TAK",
    ppe: "TAK",
    items: [
      { chip: "...411", nr: "K-10", name: "Kask ochronny BHP", size: "Uniwersalny", status: "Wydane", lastOp: "14.08.2025" }
    ],
    history: [
      { time: "14.08.2025", desc: "Zarejestrowano wydanie Kask ochronny BHP" }
    ]
  },
  {
    id: "NP-0030",
    name: "Marek Piasecki",
    role: "Tokarz",
    dept: "Produkcja",
    addr: "ul. Przemysłowa 4, Kielce",
    sizes: { height: 178, chest: 104, waist: 88, shoes: 42 },
    status: "Aktywny",
    rfid: "NIE",
    ppe: "TAK",
    items: [],
    history: []
  },
  {
    id: "NP-0045",
    name: "Tomasz Lewandowski",
    role: "Spawacz",
    dept: "Produkcja",
    addr: "ul. Nowa 10, Kielce",
    sizes: { height: 182, chest: 110, waist: 98, shoes: 43 },
    status: "Aktywny",
    rfid: "TAK",
    ppe: "TAK",
    items: [],
    history: []
  }
];

window.DEFAULT_ORDERS = [
  {id:"Z-2025-1195", created:"2025-08-23", eta:"25.08.2025", addr:"Kielce — Zakład 2", status:"Częściowo wysłane", items:[
    {produkt:"Rękawice robocze", nr:"REK-ROB-001", rozmiar:"L", ilosc:10, ilosc_dostarczona:5, ilosc_wyslana:5, status:"Częściowo wysłane", osoba:"Piotr Nowak (004216)", foto:"foto/rekawice.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-99401", data_wysylki:"22.08.2025", kurier:"DHL", nr_listu:"DHL111222333", status:"Dostarczona", pozycje:[{produkt:"Rękawice robocze", nr:"REK-ROB-001", ilosc:5}]},
    {id_wysylki:"DEL-99402", data_wysylki:"23.08.2025", kurier:"DPD", nr_listu:"DPD333222111", status:"W drodze", pozycje:[{produkt:"Rękawice robocze", nr:"REK-ROB-001", ilosc:5}]}
  ]},
  {id:"Z-2025-1180", created:"2025-08-20", eta:"20.08.2025", addr:"Gdańsk — Magazyn", status:"Zatwierdzone", items:[
    {produkt:"Kombinezon BHP", nr:"BHP-COM-050", rozmiar:"L", ilosc:2, ilosc_dostarczona:2, ilosc_wyslana:0, status:"Dostarczone", osoba:"Michał Wiśniewski (004232)", foto:"foto/bluza.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98180", data_wysylki:"19.08.2025", kurier:"DHL", nr_listu:"DHL777555444", status:"Dostarczona", pozycje:[{produkt:"Kombinezon BHP", nr:"BHP-COM-050", ilosc:2}]}
  ]},
  {id:"Z-2025-1175", created:"2025-08-19", eta:"19.08.2025", addr:"Lublin — Magazyn", status:"Zatwierdzone", items:[
    {produkt:"Trzewiki skórzane S3", nr:"SHO-LEA-333", rozmiar:"43", ilosc:1, ilosc_dostarczona:1, ilosc_wyslana:0, status:"Dostarczone", osoba:"Paweł Małaszyński (004233)", foto:"foto/buty.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98175", data_wysylki:"18.08.2025", kurier:"DPD", nr_listu:"DPD333444555", status:"Dostarczona", pozycje:[{produkt:"Trzewiki skórzane S3", nr:"SHO-LEA-333", ilosc:1}]}
  ]},
  {id:"Z-2025-1048", created:"2025-08-19", eta:"21.08.2025", addr:"Kielce — Zakład 1", status:"Częściowo wysłane", items:[
    {produkt:"Spodnie Motion", nr:"MOT-TRS-001", rozmiar:"L / 182–190", ilosc:2, ilosc_dostarczona:1, ilosc_wyslana:0, status:"Częściowo wysłane", osoba:"Jan Kowalski (004215)", foto:"foto/spodnie.png"},
    {produkt:"Bluza Hi-Vis", nr:"HIV-BLS-110", rozmiar:"M", ilosc:1, ilosc_dostarczona:0, ilosc_wyslana:1, status:"W drodze", osoba:"Jan Kowalski (004215)", foto:"foto/bluza.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-99218", data_wysylki:"20.08.2025", kurier:"DPD", nr_listu:"PL123456789", status:"Dostarczona", pozycje:[{produkt:"Spodnie Motion", nr:"MOT-TRS-001", ilosc:1}]},
    {id_wysylki:"DEL-99342", data_wysylki:"21.08.2025", kurier:"DPD", nr_listu:"PL987654321", status:"W drodze", pozycje:[{produkt:"Bluza Hi-Vis", nr:"HIV-BLS-110", ilosc:1}]}
  ]},
  {id:"Z-2025-1052", created:"2025-08-18", eta:"18.08.2025", addr:"Kielce — Zakład 2", status:"Dostarczone", items:[
    {produkt:"Buty ochronne", nr:"BUT-002", rozmiar:"42", ilosc:1, ilosc_dostarczona:1, ilosc_wyslana:0, status:"Dostarczone", osoba:"Anna Nowak (004218)", foto:"foto/buty.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98102", data_wysylki:"17.08.2025", kurier:"DPD", nr_listu:"DPD777666555", status:"Dostarczona", pozycje:[{produkt:"Buty ochronne", nr:"BUT-002", ilosc:1}]}
  ]},
  {id:"Z-2025-1060", created:"2025-08-17", eta:"20.08.2025", addr:"Warszawa — Filia", status:"W realizacji", items:[{produkt:"Kask", nr:"K-10", rozmiar:"Uni", ilosc:5, osoba:"Ekipa A", foto:"foto/kask.png"}]},
  {id:"Z-2025-1065", created:"2025-08-16", eta:"19.08.2025", addr:"Gdańsk — Magazyn", status:"Wysłane", items:[
    {produkt:"Rękawice", nr:"R-20", rozmiar:"10", ilosc:20, ilosc_dostarczona:0, ilosc_wyslana:20, status:"W drodze", osoba:"Magazynierzy", foto:"foto/rekawice.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98401", data_wysylki:"18.08.2025", kurier:"DHL", nr_listu:"DHL987654321", status:"W drodze", pozycje:[{produkt:"Rękawice", nr:"R-20", ilosc:20}]}
  ]},
  {id:"Z-2025-1070", created:"2025-08-15", eta:"17.08.2025", addr:"Kraków — Produkcja", status:"Dostarczone", items:[
    {produkt:"Kamizelka", nr:"KAM-01", rozmiar:"XL", ilosc:2, ilosc_dostarczona:2, ilosc_wyslana:0, status:"Dostarczone", osoba:"Marek P.", foto:"foto/kamizelka.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98109", data_wysylki:"15.08.2025", kurier:"DPD", nr_listu:"DPD777111222", status:"Dostarczona", pozycje:[{produkt:"Kamizelka", nr:"KAM-01", ilosc:2}]}
  ]},
  {id:"Z-2025-1075", created:"2025-08-14", eta:"16.08.2025", addr:"Kielce — Zakład 1", status:"W realizacji", items:[{produkt:"Okulary", nr:"OKU-99", rozmiar:"Uni", ilosc:10, osoba:"Różni", foto:"foto/okulary.png"}]},
  {id:"Z-2025-1080", created:"2025-08-13", eta:"15.08.2025", addr:"Wrocław — Biuro", status:"W realizacji", items:[{produkt:"Polar", nr:"POL-05", rozmiar:"M", ilosc:1, osoba:"Anna K.", foto:"foto/bluza.png"}]},
  {id:"Z-2025-1085", created:"2025-08-12", eta:"14.08.2025", addr:"Poznań — Budowa", status:"Wysłane", items:[
    {produkt:"Kombinezon", nr:"KOM-12", rozmiar:"L", ilosc:5, ilosc_dostarczona:0, ilosc_wyslana:5, status:"W drodze", osoba:"Technicy", foto:"foto/bluza.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98409", data_wysylki:"14.08.2025", kurier:"DHL", nr_listu:"DHL777333222", status:"W drodze", pozycje:[{produkt:"Kombinezon", nr:"KOM-12", ilosc:5}]}
  ]},
  {id:"Z-2025-1090", created:"2025-08-11", eta:"13.08.2025", addr:"Łódź — Zakład", status:"Dostarczone", items:[
    {produkt:"Czapka", nr:"CZ-02", rozmiar:"Uni", ilosc:2, ilosc_dostarczona:2, ilosc_wyslana:0, status:"Dostarczone", osoba:"Adam G.", foto:"foto/czapka.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98090", data_wysylki:"12.08.2025", kurier:"DPD", nr_listu:"DPD111222999", status:"Dostarczona", pozycje:[{produkt:"Czapka", nr:"CZ-02", ilosc:2}]}
  ]},
  {id:"Z-2025-1095", created:"2025-08-10", eta:"12.08.2025", addr:"Kielce — Zakład 3", status:"W realizacji", items:[{produkt:"Kurtka", nr:"KUR-88", rozmiar:"S", ilosc:1, osoba:"Ewa M.", foto:"foto/kurtka.png"}]},
  {id:"Z-2025-1100", created:"2025-08-09", eta:"11.08.2025", addr:"Lublin — Punkt", status:"W realizacji", items:[{produkt:"Półbuty", nr:"PB-44", rozmiar:"43", ilosc:1, osoba:"Jan B.", foto:"foto/buty.png"}]},
  {id:"Z-2025-1105", created:"2025-08-08", eta:"10.08.2025", addr:"Kielce — Zakład 1", status:"Wysłane", items:[
    {produkt:"Pas", nr:"P-03", rozmiar:"100", ilosc:1, ilosc_dostarczona:0, ilosc_wyslana:1, status:"W drodze", osoba:"Piotr Z.", foto:"foto/pas.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98105", data_wysylki:"09.08.2025", kurier:"DHL", nr_listu:"DHL333444555", status:"W drodze", pozycje:[{produkt:"Pas", nr:"P-03", ilosc:1}]}
  ]},
  {id:"Z-2025-1110", created:"2025-08-07", eta:"09.08.2025", addr:"Białystok — Filia", status:"Dostarczone", items:[
    {produkt:"Maska", nr:"M-01", rozmiar:"Uni", ilosc:50, ilosc_dostarczona:50, ilosc_wyslana:0, status:"Dostarczone", osoba:"Magazyn", foto:"foto/maska.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98110", data_wysylki:"08.08.2025", kurier:"DPD", nr_listu:"DPD444555666", status:"Dostarczona", pozycje:[{produkt:"Maska", nr:"M-01", ilosc:50}]}
  ]},
  {id:"Z-2025-1115", created:"2025-08-06", eta:"08.08.2025", addr:"Kielce — Zakład 2", status:"W realizacji", items:[{produkt:"Rękawiczki", nr:"RE-09", rozmiar:"9", ilosc:10, osoba:"Różni", foto:"foto/rekawice.png"}]},
  {id:"Z-2025-1120", created:"2025-08-05", eta:"07.08.2025", addr:"Katowice — Biuro", status:"W realizacji", items:[{produkt:"Kurtka FR", nr:"FR-101", rozmiar:"L", ilosc:1, osoba:"Tomek L.", foto:"foto/kurtka.png"}]},
  {id:"Z-2025-1125", created:"2025-08-04", eta:"06.08.2025", addr:"Kraków — Magazyn", status:"Wysłane", items:[
    {produkt:"T-shirt", nr:"T-SH-05", rozmiar:"M", ilosc:3, ilosc_dostarczona:0, ilosc_wyslana:3, status:"W drodze", osoba:"Pracownicy", foto:"foto/bluza.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98425", data_wysylki:"05.08.2025", kurier:"DPD", nr_listu:"DPD888222111", status:"W drodze", pozycje:[{produkt:"T-shirt", nr:"T-SH-05", ilosc:3}]}
  ]},
  {id:"Z-2025-1130", created:"2025-08-03", eta:"05.08.2025", addr:"Szczecin — Port", status:"Dostarczone", items:[
    {produkt:"Sztormiak", nr:"SZ-09", rozmiar:"XL", ilosc:2, ilosc_dostarczona:2, ilosc_wyslana:0, status:"Dostarczone", osoba:"Załoga", foto:"foto/kurtka.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98130", data_wysylki:"04.08.2025", kurier:"DHL", nr_listu:"DHL555666777", status:"Dostarczona", pozycje:[{produkt:"Sztormiak", nr:"SZ-09", ilosc:2}]}
  ]},
  {id:"Z-2025-1135", created:"2025-08-02", eta:"04.08.2025", addr:"Kielce — Zakład 3", status:"W realizacji", items:[{produkt:"Spodnie", nr:"SP-02", rozmiar:"52", ilosc:1, osoba:"Karol K.", foto:"foto/spodnie.png"}]},
  {id:"Z-2025-1140", created:"2025-08-01", eta:"03.08.2025", addr:"Warszawa — Biuro", status:"W realizacji", items:[{produkt:"Bluza", nr:"BL-03", rozmiar:"M", ilosc:1, osoba:"Ola S.", foto:"foto/bluza.png"}]},
  {id:"Z-2025-1145", created:"2025-07-31", eta:"02.08.2025", addr:"Kielce — Zakład 1", status:"Wysłane", items:[
    {produkt:"Buty", nr:"BU-01", rozmiar:"44", ilosc:1, ilosc_dostarczona:0, ilosc_wyslana:1, status:"W drodze", osoba:"Marek O.", foto:"foto/buty.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98311", data_wysylki:"01.08.2025", kurier:"DHL", nr_listu:"DHL777888999", status:"W drodze", pozycje:[{produkt:"Buty", nr:"BU-01", ilosc:1}]}
  ]},
  {id:"Z-2025-1150", created:"2025-07-30", eta:"01.08.2025", addr:"Gdynia — Stocznia", status:"Dostarczone", items:[
    {produkt:"Kask S3", nr:"K-S3", rozmiar:"Uni", ilosc:10, ilosc_dostarczona:10, ilosc_wyslana:0, status:"Dostarczone", osoba:"Stoczniowcy", foto:"foto/kask.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98150", data_wysylki:"31.07.2025", kurier:"DPD", nr_listu:"DPD666777888", status:"Dostarczona", pozycje:[{produkt:"Kask S3", nr:"K-S3", ilosc:10}]}
  ]},
  {id:"Z-2025-1155", created:"2025-07-29", eta:"31.07.2025", addr:"Kielce — Zakład 2", status:"W realizacji", items:[{produkt:"Rękawice FR", nr:"RFR-10", rozmiar:"10", ilosc:5, osoba:"Spawacze", foto:"foto/rekawice.png"}]},
  {id:"Z-2025-1160", created:"2025-07-28", eta:"30.07.2025", addr:"Radom — Punkt", status:"W realizacji", items:[{produkt:"Płaszcz", nr:"PL-01", rozmiar:"L", ilosc:1, osoba:"Krzysztof J.", foto:"foto/kurtka.png"}]},
  {id:"Z-2025-1165", created:"2025-07-27", eta:"29.07.2025", addr:"Lublin — Magazyn", status:"Wysłane", items:[
    {produkt:"Spodnie robocze", nr:"SR-02", rozmiar:"54", ilosc:2, ilosc_dostarczona:0, ilosc_wyslana:2, status:"W drodze", osoba:"Magazynier", foto:"foto/spodnie.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98165", data_wysylki:"28.07.2025", kurier:"DHL", nr_listu:"DHL999888777", status:"W drodze", pozycje:[{produkt:"Spodnie robocze", nr:"SR-02", ilosc:2}]}
  ]},
  {id:"Z-2025-1170", created:"2025-07-26", eta:"28.07.2025", addr:"Kielce — Zakład 1", status:"Dostarczone", items:[
    {produkt:"Okulary BHP", nr:"BHP-01", rozmiar:"Uni", ilosc:15, ilosc_dostarczona:15, ilosc_wyslana:0, status:"Dostarczone", osoba:"Pracownicy", foto:"foto/okulary.png"}
  ],
  dostawy:[
    {id_wysylki:"DEL-98170", data_wysylki:"27.07.2025", kurier:"DPD", nr_listu:"DPD999000111", status:"Dostarczona", pozycje:[{produkt:"Okulary BHP", nr:"BHP-01", ilosc:15}]}
  ]}
];

window.DEFAULT_TICKETS = [
  {id:"SRV-2025-0145", type:"Zamiana towaru", person:"Jan Kowalski", item:"Spodnie Motion", date:"19.08.2025 10:12", status:"W toku", desc:"Błędny rozmiar spodni - wymiana na większe L."},
  {id:"SRV-2025-0139", type:"Reklamacyjne", person:"Agnieszka Nowak", item:"Bluza Hi-Vis", date:"19.08.2025 08:27", status:"W toku", desc:"Problem z zamkiem błyskawicznym - reklamacja fabryczna."},
  {id:"SRV-2025-0132", type:"Zamiana towaru", person:"Piotr Zieliński", item:"Kurtka FR (Trudnopalna)", date:"18.08.2025 15:02", status:"W toku", desc:"Wymiana kurtki na mniejszy rozmiar M."},
  {id:"SRV-2025-0121", type:"Reklamacyjne", person:"Anna Wiśniewska", item:"Fartuch Food Safety", date:"17.08.2025 11:49", status:"Zakończone", desc:"Uszkodzony szew boczny po dostawie - uznana reklamacja."}
];

window.DEFAULT_WZ = [
  {
    id: "WZ-2025-08-044",
    date: "2025-08-23",
    orderId: "Z-2025-1195",
    client: "Kielce — Zakład 2",
    recipient: "Piotr Nowak (004216)",
    status: "W drodze",
    carrier: "DPD",
    trackingNumber: "DPD333222111",
    items: [
      { nr: "REK-ROB-001", name: "Rękawice robocze", size: "L", qty: 5 }
    ]
  },
  {
    id: "WZ-2025-08-043",
    date: "2025-08-21",
    orderId: "Z-2025-1048",
    client: "Kielce — Zakład 1",
    recipient: "Jan Kowalski (004215)",
    status: "W drodze",
    carrier: "DPD",
    trackingNumber: "PL987654321",
    items: [
      { nr: "HIV-BLS-110", name: "Bluza Hi-Vis", size: "M", qty: 1 }
    ]
  },
  {
    id: "WZ-2025-08-042",
    date: "2025-08-20",
    orderId: "Z-2025-1048",
    client: "Kielce — Zakład 1",
    recipient: "Jan Kowalski (004215)",
    status: "Odebrane",
    carrier: "DPD",
    trackingNumber: "PL123456789",
    items: [
      { nr: "MOT-TRS-001", name: "Spodnie Motion", size: "L / 182–190", qty: 1 }
    ]
  },
  {
    id: "WZ-2025-08-041",
    date: "2025-08-22",
    orderId: "Z-2025-1195",
    client: "Kielce — Zakład 2",
    recipient: "Piotr Nowak (004216)",
    status: "Odebrane",
    carrier: "DHL",
    trackingNumber: "DHL111222333",
    items: [
      { nr: "REK-ROB-001", name: "Rękawice robocze", size: "L", qty: 5 }
    ]
  },
  {
    id: "WZ-2025-08-038",
    date: "2025-08-19",
    orderId: "Z-2025-1180",
    client: "Gdańsk — Magazyn",
    recipient: "Michał Wiśniewski (004232)",
    status: "Odebrane",
    carrier: "DHL",
    trackingNumber: "DHL777555444",
    items: [
      { nr: "BHP-COM-050", name: "Kombinezon BHP", size: "L", qty: 2 }
    ]
  },
  {
    id: "WZ-2025-08-035",
    date: "2025-08-18",
    orderId: "Z-2025-1175",
    client: "Lublin — Magazyn",
    recipient: "Paweł Małaszyński (004233)",
    status: "Odebrane",
    carrier: "DPD",
    trackingNumber: "DPD333444555",
    items: [
      { nr: "SHO-LEA-333", name: "Trzewiki skórzane S3", size: "43", qty: 1 }
    ]
  }
];
